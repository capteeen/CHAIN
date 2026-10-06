import { useEffect, useState } from 'react';
import { useStore, vaultRate } from '../store';
import { ago, minutes, num, shortCa, sol } from '../lib/format';
import { renderOg } from '../lib/og';
import type { Chain, Link } from '../types';
import { Arrow, ChainImage, Copy, VaultBar } from './Bits';
import { ChainStrip } from './ChainStrip';

function Row({ k, children }: { k: string; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-rule py-3 last:border-0">
      <span className="text-sm text-muted">{k}</span>
      <span className="text-right text-sm font-medium">{children}</span>
    </div>
  );
}

function LinkPanel({ chain, link, links, onSelect }: { chain: Chain; link: Link; links: Link[]; onSelect: (n: number) => void }) {
  const next = links[link.n];
  const root = link.n === 1;
  return (
    <div className="card p-5 sm:p-6">
      <div className="mb-4 flex items-center gap-4">
        <ChainImage src={chain.image} n={link.n} size={56} root={root} />
        <div>
          <p className={`text-3xl font-extrabold tracking-crush ${root ? 'text-gold' : ''}`}>
            {chain.ticker} #{link.n}
          </p>
          <p className="text-xs text-muted">
            {link.alive ? 'Alive' : <span className="font-semibold text-broken">Dead</span>} · born {ago(link.bornAt)}
          </p>
        </div>
      </div>
      <Row k="CA">
        <Copy text={link.ca}>{shortCa(link.ca)}</Copy>
      </Row>
      <Row k="Launched by">
        {link.n === 1 ? (
          <span className="text-muted">Chain vault</span>
        ) : (
          <span className="flex items-center justify-end gap-2">
            <button className={`font-semibold hover:underline ${link.n - 1 === 1 ? 'text-gold' : ''}`} onClick={() => onSelect(link.n - 1)}>
              #{link.n - 1}
            </button>
            <Copy text={link.launchedByCa!}>{shortCa(link.launchedByCa)}</Copy>
          </span>
        )}
      </Row>
      <Row k="Launched">
        {next ? (
          <span className="flex items-center justify-end gap-2">
            <button className="font-semibold hover:underline" onClick={() => onSelect(next.n)}>
              #{next.n}
            </button>
            <Copy text={next.ca}>{shortCa(next.ca)}</Copy>
          </span>
        ) : link.alive ? (
          <span className="block w-40">
            <span className="text-muted">forging… {Math.min(99, Math.floor((link.vault / link.threshold) * 100))}%</span>
            <VaultBar className="mt-1.5" value={link.vault} max={link.threshold} hot />
          </span>
        ) : (
          <span className="font-semibold text-broken">Broken here</span>
        )}
      </Row>
      <Row k="Fees earned">{sol(link.feesEarned)}</Row>
      <Row k="Fees sent to">
        <span className="tabular-nums">
          {sol(link.feesToRoot)} <span className="text-xs text-muted">to <span className="text-gold">#1</span></span>
        </span>
      </Row>
      <Row k="Trades 24h">{num(link.trades24h)}</Row>
      <Row k="Holders">{num(link.holders)}</Row>
      <a href={`https://pump.fun/coin/${link.ca}`} target="_blank" rel="noreferrer" className="btn-primary mt-5 w-full">
        Trade on pump.fun <Arrow />
      </a>
    </div>
  );
}

function OgCard({ chain }: { chain: Chain }) {
  const [src, setSrc] = useState<string>();
  // Re-render on length changes only; fees drift constantly.
  useEffect(() => {
    let live = true;
    renderOg(chain).then((u) => {
      if (!live) return;
      setSrc(u);
      document.querySelector('meta[property="og:image"]')?.setAttribute('content', u);
    });
    return () => {
      live = false;
    };
  }, [chain.id, chain.length, chain.status]);
  if (!src) return null;
  return (
    <div className="card p-5 sm:p-6">
      <p className="eyebrow mb-4">Share card</p>
      <img src={src} alt={`${chain.name} share card`} className="w-full rounded-xl border border-rule" />
      <a href={src} download={`chain-${chain.ticker}-${chain.length}.png`} className="btn-ghost mt-4 w-full">
        Download image
      </a>
    </div>
  );
}

export function ChainDetail({ id }: { id: string }) {
  const chain = useStore((s) => s.chains[id]);
  const links = useStore((s) => s.links[id]);
  const events = useStore((s) => s.events);
  const ready = useStore((s) => s.ready);
  const [sel, setSel] = useState<number>();

  useEffect(() => {
    window.scrollTo(0, 0);
    setSel(undefined);
  }, [id]);
  useEffect(() => {
    if (chain) document.title = `${chain.name} — LENGTH ${chain.length} · CHAIN`;
    return () => {
      document.title = 'CHAIN — one coin, one unbroken line';
    };
  }, [chain?.name, chain?.length]);

  if (!ready) return <div className="wrap py-32 text-muted">Loading…</div>;
  if (!chain || !links)
    return (
      <div className="wrap py-32">
        <p className="eyebrow mb-4">Not found</p>
        <h1 className="h2">No such chain</h1>
        <a href="#/explore" className="btn-ghost mt-8">
          Every chain <Arrow />
        </a>
      </div>
    );

  const tip = links[links.length - 1];
  const selected = links[(sel ?? tip.n) - 1] ?? tip;
  const rate = vaultRate(events, chain.id, tip.n);
  const remaining = Math.max(0, tip.threshold - tip.vault);
  const eta =
    chain.status === 'broken'
      ? undefined
      : rate > 0
        ? remaining / rate
        : chain.forgesPerHour > 0
          ? (60 / chain.forgesPerHour) * (remaining / tip.threshold)
          : Infinity;

  const stats: [string, React.ReactNode][] = [
    ['Length', chain.length],
    ['Total fees', sol(chain.totalFees)],
    ['Fees to #1', sol(chain.feesToRoot)],
    [
      chain.status === 'broken' ? 'Status' : 'Next link in',
      chain.status === 'broken' ? <span className="text-broken">Broken</span> : `~${minutes(eta ?? Infinity)}`,
    ],
  ];

  return (
    <div className="pb-24">
      <div className="wrap pt-10 sm:pt-14">
        <a href="#/explore" className="text-sm text-muted hover:text-ink">
          ← Every chain
        </a>
        <div className="mt-6 flex flex-wrap items-end gap-5">
          <ChainImage src={chain.image} size={72} />
          <div className="min-w-0">
            <p className="eyebrow mb-2">
              ${chain.ticker} · started {ago(chain.startedAt)}
            </p>
            <h1 className="text-[clamp(40px,8vw,96px)] font-black uppercase leading-[0.85] tracking-crush">{chain.name}</h1>
          </div>
        </div>
        <div className="mt-8 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-rule bg-rule md:grid-cols-4">
          {stats.map(([k, v]) => (
            <div key={k} className="bg-surface p-4 sm:p-6">
              <p className="text-2xl font-extrabold tracking-tight tabular-nums sm:text-3xl">{v}</p>
              <p className="mt-1 text-xs text-muted">
                {k === 'Fees to #1' ? (
                  <>
                    Fees to <span className="text-gold">#1</span>
                  </>
                ) : (
                  k
                )}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-10 border-y border-rule bg-surface py-6">
        <ChainStrip chainId={chain.id} selected={selected.n} onSelect={setSel} />
        <p className="wrap mt-3 text-xs text-muted">Tap a link for details. Swipe to scroll the line.</p>
      </div>

      <div className="wrap mt-10 grid gap-6 lg:grid-cols-[1fr_420px]">
        <LinkPanel chain={chain} link={selected} links={links} onSelect={setSel} />
        <OgCard chain={chain} />
      </div>
    </div>
  );
}
