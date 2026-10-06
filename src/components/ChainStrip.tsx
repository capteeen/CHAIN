import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import type { ChainEvent, Link } from '../types';
import { useStore } from '../store';

const CELL = 56; // px per link; rings overlap neighbours so they read as interlocked

const RAYS = [0, 60, 120, 180, 240, 300].map((deg) => {
  const r = (deg * Math.PI) / 180;
  return { dx: Math.cos(r) * 14, dy: Math.sin(r) * 14 };
});

function LinkIcon({ n, dead, animate }: { n: number; dead: boolean; animate: boolean }) {
  const root = n === 1;
  const stroke = dead ? 'rgb(var(--broken))' : root ? 'rgb(var(--gold))' : 'rgb(var(--steel))';
  const ring = n % 2 === 1;
  return (
    <svg width={88} height={48} viewBox="0 0 88 48" className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 overflow-visible" aria-hidden>
      {ring ? (
        <ellipse
          className="ring"
          style={{ ['--len' as string]: 100 }}
          pathLength={100}
          cx={44}
          cy={24}
          rx={32}
          ry={17}
          fill="none"
          stroke={stroke}
          strokeWidth={7}
          strokeDasharray={dead ? '14 8' : undefined}
        />
      ) : (
        <rect
          className="ring"
          style={{ ['--len' as string]: 100 }}
          pathLength={100}
          x={12}
          y={19}
          width={64}
          height={10}
          rx={5}
          fill={stroke}
          stroke={stroke}
          strokeWidth={2}
          strokeDasharray={dead ? '14 8' : undefined}
          opacity={dead ? 0.7 : 1}
        />
      )}
      {animate && (
        <g>
          <circle className="spark" cx={12} cy={24} r={6} fill="rgb(var(--ink))" opacity={0.5} />
          {RAYS.map((r, i) => (
            <circle
              key={i}
              className="ray"
              style={{ ['--dx' as string]: `${r.dx}px`, ['--dy' as string]: `${r.dy}px` }}
              cx={12}
              cy={24}
              r={1.6}
              fill="rgb(var(--ink))"
            />
          ))}
        </g>
      )}
    </svg>
  );
}

function LinkCell({
  link,
  tip,
  animate,
  selected,
  trade,
  onSelect,
}: {
  link: Link;
  tip: boolean;
  animate: boolean;
  selected: boolean;
  trade?: ChainEvent;
  onSelect?: (n: number) => void;
}) {
  const p = tip ? Math.min(1, link.vault / link.threshold) : 1;
  const root = link.n === 1;
  return (
    <button
      type="button"
      onClick={() => onSelect?.(link.n)}
      className={`relative flex shrink-0 flex-col items-center pt-[52px] ${animate ? 'forge-in' : ''} ${onSelect ? 'cursor-pointer' : 'cursor-default'} ${
        root ? 'sticky left-4 z-10' : ''
      }`}
      style={{ width: CELL }}
      aria-label={`Link ${link.n}`}
      tabIndex={onSelect ? 0 : -1}
    >
      {root && <span className="absolute inset-y-0 -left-8 -right-3 bg-gradient-to-r from-[rgb(var(--surface))] from-75% to-transparent" aria-hidden />}
      <LinkIcon n={link.n} dead={!link.alive} animate={animate} />
      {trade && (
        <span key={trade.id} className="pointer-events-none absolute -top-1 left-1/2 -translate-x-1/2 float-up whitespace-nowrap text-[10px] font-semibold text-muted">
          +{(trade.amount ?? 0).toFixed(3)}
        </span>
      )}
      <span className={`relative num ${root ? '!text-gold font-bold' : ''} ${selected ? '!text-ink font-bold' : ''} ${!link.alive ? '!text-broken' : ''}`}>
        #{link.n}
      </span>
      <span className="relative mt-1 h-1 w-9 overflow-hidden rounded-full bg-rule">
        <span
          className={`block h-full rounded-full transition-[width] duration-500 ${root ? 'bg-gold' : tip ? 'bg-steel' : 'bg-steel/40'}`}
          style={{ width: `${p * 100}%` }}
        />
      </span>
      {selected && <span className="relative mt-1.5 h-1 w-1 rounded-full bg-ink" />}
    </button>
  );
}

/**
 * Horizontal chain. Link #1 is pinned left; new links slide in from the right with the
 * forge animation — but only when the store reports a real forge event.
 */
export function ChainStrip({
  chainId,
  selected,
  onSelect,
  follow = 'near-end',
}: {
  chainId: string;
  selected?: number;
  onSelect?: (n: number) => void;
  follow?: 'always' | 'near-end';
}) {
  const links = useStore((s) => s.links[chainId]);
  const forged = useStore((s) => s.forged);
  const events = useStore((s) => s.events);
  const ref = useRef<HTMLDivElement>(null);
  const len = links?.length ?? 0;
  const prevLen = useRef(len);

  // Most recent trade per link (last ~4s) for the "+fee" float.
  const trades = useMemo(() => {
    const m = new Map<number, ChainEvent>();
    const since = Date.now() - 4000;
    for (const e of events) {
      if (e.at < since) break;
      if (e.kind === 'trade' && e.chainId === chainId && !m.has(e.n)) m.set(e.n, e);
    }
    return m;
  }, [events, chainId]);

  useLayoutEffect(() => {
    const el = ref.current;
    if (el) el.scrollLeft = el.scrollWidth; // start at the tip
  }, [chainId]);

  useEffect(() => {
    const el = ref.current;
    if (!el || len <= prevLen.current) {
      prevLen.current = len;
      return;
    }
    prevLen.current = len;
    const nearEnd = el.scrollWidth - el.clientWidth - el.scrollLeft < CELL * 3;
    if (follow === 'always' || nearEnd) el.scrollTo({ left: el.scrollWidth, behavior: 'smooth' });
  }, [len, follow]);

  if (!links) return null;
  const now = Date.now();
  return (
    <div ref={ref} className="no-bar overflow-x-auto overscroll-x-contain" style={{ touchAction: 'pan-x pan-y' }}>
      <div className="flex w-max items-start px-4 pb-2 pt-3">
        {links.map((l, i) => {
          const t = forged[`${chainId}:${l.n}`];
          return (
            <LinkCell
              key={l.ca}
              link={l}
              tip={i === links.length - 1}
              animate={!!t && now - t < 1500}
              selected={selected === l.n}
              trade={trades.get(l.n)}
              onSelect={onSelect}
            />
          );
        })}
        {links[links.length - 1]?.alive && (
          <span className="flex h-12 shrink-0 items-center pl-6 text-xs italic text-muted" style={{ width: CELL * 1.6 }}>
            forging…
          </span>
        )}
      </div>
    </div>
  );
}
