import { useEffect, useState } from 'react';
import { useStore } from '../store';
import { ago, sol } from '../lib/format';
import type { ChainEvent } from '../types';
import { ChainImage } from './Bits';

const ICON: Record<ChainEvent['kind'], string> = { forge: '⟐', trade: '⇄', fee_to_root: '↩', break: '✕' };

function describe(e: ChainEvent, name: string) {
  switch (e.kind) {
    case 'forge':
      return e.n === 1 ? `${name} started a chain` : `${name} #${e.n - 1} forged #${e.n}`;
    case 'trade':
      return `${name} #${e.n} traded · +${sol(e.amount ?? 0, 3)}`;
    case 'fee_to_root':
      return `${sol(e.amount ?? 0, 4)} sent to ${name} #1`;
    case 'break':
      return `${name} broke at #${e.n}`;
  }
}

function useClock(ms = 1000) {
  const [, t] = useState(0);
  useEffect(() => {
    const i = setInterval(() => t((x) => x + 1), ms);
    return () => clearInterval(i);
  }, [ms]);
}

/** Thin strip under the nav: the newest events slide in from the left. */
export function Ticker() {
  const events = useStore((s) => s.events);
  const chains = useStore((s) => s.chains);
  const items = events.filter((e) => e.kind !== 'fee_to_root').slice(0, 8);
  return (
    <div className="border-b border-rule bg-surface/60 text-xs">
      <div className="wrap no-bar flex h-8 items-center gap-6 overflow-x-auto whitespace-nowrap">
        <span className="flex shrink-0 items-center gap-2 font-semibold uppercase tracking-wider text-muted">
          <span className="live-dot h-1.5 w-1.5 rounded-full bg-steel" /> Live
        </span>
        {items.map((e) => {
          const c = chains[e.chainId];
          if (!c) return null;
          return (
            <a key={e.id} href={`#/chain/${c.id}`} className={`tick-in flex shrink-0 items-center gap-1.5 text-muted hover:text-ink ${e.kind === 'break' ? '!text-broken' : ''} ${e.kind === 'forge' ? 'font-semibold !text-ink' : ''}`}>
              <span aria-hidden className={e.n === 1 && e.kind === 'fee_to_root' ? 'text-gold' : ''}>{ICON[e.kind]}</span>
              {describe(e, c.name)}
            </a>
          );
        })}
      </div>
    </div>
  );
}

/** Event list for one chain (or all), newest first. */
export function ActivityFeed({ chainId, limit = 8 }: { chainId?: string; limit?: number }) {
  const events = useStore((s) => s.events);
  const chains = useStore((s) => s.chains);
  useClock();
  const items = events.filter((e) => (!chainId || e.chainId === chainId) && e.kind !== 'fee_to_root').slice(0, limit);
  return (
    <ul className="divide-y divide-rule">
      {items.length === 0 && <li className="py-3 text-sm text-muted">Waiting for the first trade…</li>}
      {items.map((e) => {
        const c = chains[e.chainId];
        if (!c) return null;
        const root = e.kind === 'trade' ? (e.amount ?? 0) * 0.3 : 0;
        return (
          <li key={e.id} className="flash flex items-center gap-3 py-2.5 text-sm">
            {!chainId && <ChainImage src={c.image} size={24} />}
            <span
              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs ${
                e.kind === 'forge' ? 'bg-ink text-[rgb(var(--base))]' : e.kind === 'break' ? 'bg-broken text-white' : 'bg-base text-muted'
              }`}
              aria-hidden
            >
              {ICON[e.kind]}
            </span>
            <span className="min-w-0 flex-1 truncate">
              {describe(e, chainId ? c.ticker : c.name)}
              {root > 0 && (
                <span className="text-muted">
                  {' '}· {sol(root, 4)} to <span className="text-gold">#1</span>
                </span>
              )}
            </span>
            <span className="shrink-0 text-xs text-muted">{ago(e.at)}</span>
          </li>
        );
      })}
    </ul>
  );
}
