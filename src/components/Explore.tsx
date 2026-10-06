import { useMemo, useState } from 'react';
import { useStore } from '../store';
import { useUi } from '../ui';
import { sol } from '../lib/format';
import type { Chain, Link } from '../types';
import { Arrow, ChainImage, SectionHead, Tabs, VaultBar } from './Bits';

type Tab = 'new' | 'soon' | 'longest';

export function ChainRow({ chain, tip }: { chain: Chain; tip?: Link }) {
  const broken = chain.status === 'broken';
  return (
    <a
      href={`#/chain/${chain.id}`}
      className="grid grid-cols-[auto_1fr_auto] items-center gap-x-4 gap-y-3 border-b border-rule px-4 py-4 transition hover:bg-base sm:grid-cols-[auto_1.4fr_0.6fr_1.2fr_0.9fr_auto] sm:px-6"
    >
      <ChainImage src={chain.image} size={44} />
      <span className="min-w-0">
        <span className="block truncate font-semibold">{chain.name}</span>
        <span className="text-xs text-muted">${chain.ticker}</span>
      </span>
      <span className="text-right text-sm sm:text-left">
        <b className="text-lg tabular-nums">{chain.length}</b>
        <span className="text-muted"> links</span>
      </span>
      <span className="col-span-2 sm:col-span-1">
        {broken ? (
          <span className="text-xs font-semibold uppercase tracking-wider text-broken">Broken</span>
        ) : (
          <>
            <VaultBar value={tip?.vault ?? 0} max={tip?.threshold ?? 1} hot />
            <span className="mt-1 block text-xs text-muted">
              #{chain.length + 1} at {Math.min(99, Math.floor(((tip?.vault ?? 0) / (tip?.threshold ?? 1)) * 100))}%
            </span>
          </>
        )}
      </span>
      <span className="hidden text-sm tabular-nums sm:block">
        {sol(chain.feesToRoot)} <span className="text-xs text-muted">to <span className="text-gold">#1</span></span>
      </span>
      <span className="text-right text-sm font-semibold">
        View chain <Arrow />
      </span>
    </a>
  );
}

export function Explore() {
  const chains = useStore((s) => s.chains);
  const links = useStore((s) => s.links);
  const setLaunch = useUi((s) => s.setLaunch);
  const [tab, setTab] = useState<Tab>('new');
  const rows = useMemo(() => {
    const all = Object.values(chains);
    const tipOf = (c: Chain) => links[c.id]?.[links[c.id].length - 1];
    const p = (c: Chain) => {
      const t = tipOf(c);
      return t ? t.vault / t.threshold : 0;
    };
    if (tab === 'new') return all.sort((a, b) => b.startedAt - a.startedAt);
    if (tab === 'soon') return all.filter((c) => c.status === 'forging').sort((a, b) => p(b) - p(a));
    return all.sort((a, b) => b.length - a.length);
  }, [chains, links, tab]);
  return (
    <section id="explore" className="border-t border-rule py-20 sm:py-28">
      <div className="wrap">
        <SectionHead eyebrow="Explore" lines={['Every', 'chain']} />
        <Tabs<Tab> value={tab} onChange={setTab} options={[['new', 'New'], ['soon', 'About to forge'], ['longest', 'Longest']]} />
        <div className="card overflow-hidden">
          {rows.slice(0, 12).map((c) => (
            <ChainRow key={c.id} chain={c} tip={links[c.id]?.[links[c.id].length - 1]} />
          ))}
        </div>
        <button className="btn-primary mt-12" onClick={() => setLaunch(true)}>
          Launch coin
        </button>
      </div>
    </section>
  );
}
