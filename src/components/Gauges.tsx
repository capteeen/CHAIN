import { useEffect, useRef, useState } from 'react';
import { useStore, vaultRate } from '../store';
import { minutes, sol } from '../lib/format';
import { useTween } from '../lib/useTween';
import type { Chain, Link } from '../types';

/** Big ring gauge: how full the tip's vault is, and how far from the forge threshold. */
export function VaultGauge({ chain, tip }: { chain: Chain; tip: Link }) {
  const events = useStore((s) => s.events);
  const p = useTween(Math.min(1, tip.vault / tip.threshold), 600);
  const r = 54;
  const c = 2 * Math.PI * r;
  const rate = vaultRate(events, chain.id, tip.n);
  const remaining = Math.max(0, tip.threshold - tip.vault);
  const eta = chain.status === 'broken' ? Infinity : rate > 0 ? remaining / rate : chain.forgesPerHour > 0 ? (60 / chain.forgesPerHour) * (remaining / tip.threshold) : Infinity;
  const broken = chain.status === 'broken';
  return (
    <div className="flex items-center gap-5">
      <svg viewBox="0 0 128 128" className="h-28 w-28 shrink-0 -rotate-90">
        <circle cx="64" cy="64" r={r} className="fill-none stroke-rule" strokeWidth="10" />
        <circle
          cx="64"
          cy="64"
          r={r}
          className={`fill-none ${broken ? 'stroke-broken' : 'stroke-steel'} ${p > 0.85 && !broken ? 'bar-hot' : ''}`}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - p)}
        />
        <text x="64" y="64" transform="rotate(90 64 64)" textAnchor="middle" dominantBaseline="central" className="fill-ink text-[22px] font-extrabold tabular-nums">
          {Math.floor(p * 100)}%
        </text>
      </svg>
      <div className="text-sm">
        <p className="eyebrow">Vault of #{tip.n}</p>
        <p className="mt-1 text-lg font-bold tabular-nums">
          {sol(tip.vault, 4)} <span className="font-normal text-muted">/ {sol(tip.threshold, 4)}</span>
        </p>
        <p className="mt-1 text-muted">
          {broken ? (
            <span className="font-semibold text-broken">Chain broken — no forge</span>
          ) : (
            <>
              Forges <b className="text-ink">#{tip.n + 1}</b> in ~{minutes(eta)}
            </>
          )}
        </p>
      </div>
    </div>
  );
}

/** 30 / 70 meter that flashes on every trade of this chain, with running totals. */
export function FeeSplit({ chain }: { chain: Chain }) {
  const events = useStore((s) => s.events);
  const last = events.find((e) => e.kind === 'trade' && e.chainId === chain.id);
  const [pulse, setPulse] = useState(0);
  const seen = useRef<number | undefined>(undefined);
  useEffect(() => {
    if (last && last.id !== seen.current) {
      seen.current = last.id;
      setPulse((x) => x + 1);
    }
  }, [last]);
  const toVault = chain.totalFees - chain.feesToRoot;
  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between text-sm">
        <span className="eyebrow">Fee split</span>
        {last && (
          <span key={pulse} className="float-up-inline text-xs font-semibold tabular-nums">
            +{sol(last.amount ?? 0, 4)} · #{last.n}
          </span>
        )}
      </div>
      <div className="flex h-10 overflow-hidden rounded-xl border border-rule">
        <div key={`a${pulse}`} className="split-a relative flex w-[30%] min-w-[6.5rem] items-center justify-center whitespace-nowrap bg-gold/15 text-sm font-bold text-ink">
          30% → <span className="ml-1 text-gold">#1</span>
          <span className="split-wave bg-gold/40" />
        </div>
        <div key={`b${pulse}`} className="split-b relative flex flex-1 items-center justify-center whitespace-nowrap bg-steel/10 text-sm font-bold text-ink">
          70% → vault
          <span className="split-wave bg-steel/30" />
        </div>
      </div>
      <div className="mt-2 flex flex-col gap-1 text-xs text-muted tabular-nums">
        <span>
          {sol(chain.feesToRoot)} paid to <span className="text-gold">#1</span> holders
        </span>
        <span>{sol(toVault)} forged into links</span>
      </div>
    </div>
  );
}
