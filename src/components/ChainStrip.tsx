import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { ChainEvent, Link } from '../types';
import { useStore } from '../store';

const CELL = 56; // px per link; rings overlap neighbours so they read as interlocked
const PAD_X = 16; // px-4
const ICON_Y = 12 + 24; // pt-3 + icon centre
const VAULT_Y = 12 + 52 + 18 + 6; // pt-3 + icon block + number + bar

const xOf = (i: number) => PAD_X + i * CELL + CELL / 2;

const RAYS = [0, 60, 120, 180, 240, 300].map((deg) => {
  const r = (deg * Math.PI) / 180;
  return { dx: Math.cos(r) * 14, dy: Math.sin(r) * 14 };
});

interface Flight {
  id: string;
  kind: 'root' | 'vault' | 'coin';
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  dur: number;
  delay: number;
}

function LinkIcon({ n, dead, animate, hot, hit }: { n: number; dead: boolean; animate: boolean; hot: number; hit?: number }) {
  const root = n === 1;
  const stroke = dead ? 'rgb(var(--broken))' : root ? 'rgb(var(--gold))' : 'rgb(var(--steel))';
  const ring = n % 2 === 1;
  return (
    <svg
      key={hit}
      width={88}
      height={48}
      viewBox="0 0 88 48"
      className={`pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 overflow-visible ${hit ? 'clink' : ''}`}
      aria-hidden
    >
      {hot > 0 && (ring ? <ellipse cx={44} cy={24} rx={32} ry={17} fill="none" className="heat" stroke="rgb(var(--ink))" strokeWidth={7} style={{ opacity: hot * 0.6 }} /> : <rect x={12} y={19} width={64} height={10} rx={5} className="heat" fill="rgb(var(--ink))" style={{ opacity: hot * 0.6 }} />)}
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
  hit,
  paid,
  onSelect,
}: {
  link: Link;
  tip: boolean;
  animate: boolean;
  selected: boolean;
  trade?: ChainEvent;
  hit?: number;
  paid?: number;
  onSelect?: (n: number) => void;
}) {
  const p = tip ? Math.min(1, link.vault / link.threshold) : 1;
  const root = link.n === 1;
  const hot = tip && link.alive ? p * p : 0;
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
      {root && paid && <span key={paid} className="paid-ring" aria-hidden />}
      <LinkIcon n={link.n} dead={!link.alive} animate={animate} hot={hot} hit={hit} />
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
          className={`block h-full rounded-full transition-[width] duration-500 ${root ? 'bg-gold' : tip ? 'bg-steel' : 'bg-steel/40'} ${tip && p > 0.8 ? 'bar-hot' : ''}`}
          style={{ width: `${p * 100}%` }}
        />
      </span>
      {selected && <span className="relative mt-1.5 h-1 w-1 rounded-full bg-ink" />}
    </button>
  );
}

/** The dashed slot where the next link will forge. */
function Ghost({ n, broken }: { n: number; broken: boolean }) {
  const ring = n % 2 === 1;
  return (
    <span className="relative flex shrink-0 flex-col items-center pt-[52px]" style={{ width: CELL * 1.5 }} aria-hidden>
      <svg width={88} height={48} viewBox="0 0 88 48" className={`absolute left-1/2 top-0 -translate-x-1/2 overflow-visible ${broken ? '' : 'ghost-breathe'}`}>
        {ring ? (
          <ellipse cx={44} cy={24} rx={32} ry={17} fill="none" stroke={broken ? 'rgb(var(--broken))' : 'rgb(var(--rule))'} strokeWidth={2} strokeDasharray="5 5" />
        ) : (
          <rect x={12} y={19} width={64} height={10} rx={5} fill="none" stroke={broken ? 'rgb(var(--broken))' : 'rgb(var(--rule))'} strokeWidth={2} strokeDasharray="5 5" />
        )}
      </svg>
      <span className={`num whitespace-nowrap ${broken ? '!text-broken' : ''}`}>{broken ? 'broken' : <span className="forging">forging<span>.</span><span>.</span><span>.</span></span>}</span>
    </span>
  );
}

/**
 * Horizontal chain. Link #1 is pinned left; new links slide in with the forge animation,
 * beads slide back along the line to #1 on every fee, coins land on traded links —
 * all driven only by real store events.
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
  const lastSeen = useRef<number | undefined>(undefined);
  const [flights, setFlights] = useState<Flight[]>([]);
  const [hits, setHits] = useState<Record<number, number>>({});
  const [paid, setPaid] = useState<number | undefined>(undefined);

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

  // Turn new events into flights. Events present at mount are history: never replayed.
  useEffect(() => {
    if (lastSeen.current === undefined) {
      lastSeen.current = events[0]?.id ?? 0;
      return;
    }
    const fresh: ChainEvent[] = [];
    for (const e of events) {
      if (e.id <= lastSeen.current) break;
      if (e.chainId === chainId) fresh.push(e);
    }
    lastSeen.current = Math.max(lastSeen.current, events[0]?.id ?? 0);
    if (!fresh.length || !links) return;
    const tipI = links.length - 1;
    const add: Flight[] = [];
    const timers: number[] = [];
    for (const e of fresh.reverse()) {
      const i = e.n - 1;
      if (e.kind === 'trade') {
        // coin lands on the traded link, then 70% drops into the tip's vault
        add.push({ id: `c${e.id}`, kind: 'coin', x0: xOf(i), y0: ICON_Y - 34, x1: xOf(i), y1: ICON_Y - 6, dur: 380, delay: 0 });
        timers.push(window.setTimeout(() => setHits((h) => ({ ...h, [e.n]: e.id })), 360));
        for (let k = 0; k < 2; k++)
          add.push({ id: `v${e.id}${k}`, kind: 'vault', x0: xOf(i), y0: ICON_Y, x1: xOf(tipI) + (k ? 4 : -4), y1: VAULT_Y, dur: 520 + Math.abs(tipI - i) * 25, delay: 420 + k * 90 });
      } else if (e.kind === 'fee_to_root' && e.n !== 1) {
        // 30% slides back along the line to #1
        const dist = i * CELL;
        const dur = Math.min(2200, 500 + dist * 1.6);
        for (let k = 0; k < 3; k++) add.push({ id: `r${e.id}${k}`, kind: 'root', x0: xOf(i), y0: ICON_Y, x1: xOf(0), y1: ICON_Y, dur, delay: 460 + k * 110 });
        timers.push(window.setTimeout(() => setPaid(e.id), 460 + dur));
      }
    }
    if (add.length) {
      setFlights((f) => [...f, ...add]);
      const life = Math.max(...add.map((f) => f.delay + f.dur)) + 100;
      timers.push(window.setTimeout(() => setFlights((f) => f.filter((x) => !add.includes(x))), life));
    }
    return () => timers.forEach(clearTimeout);
  }, [events, chainId, links]);

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
  const tip = links[links.length - 1];
  return (
    <div ref={ref} className="no-bar overflow-x-auto overscroll-x-contain" style={{ touchAction: 'pan-x pan-y' }}>
      <div className="relative flex w-max items-start px-4 pb-2 pt-3">
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
              hit={hits[l.n]}
              paid={l.n === 1 ? paid : undefined}
              onSelect={onSelect}
            />
          );
        })}
        <Ghost n={tip.n + 1} broken={!tip.alive} />
        {/* beads in flight (content coordinates, so they scroll with the line) */}
        <span className="pointer-events-none absolute inset-0" aria-hidden>
          {flights.map((f) => (
            <span
              key={f.id}
              className={`bead bead-${f.kind}`}
              style={{
                ['--x0' as string]: `${f.x0}px`,
                ['--y0' as string]: `${f.y0}px`,
                ['--x1' as string]: `${f.x1}px`,
                ['--y1' as string]: `${f.y1}px`,
                animationDuration: `${f.dur}ms`,
                animationDelay: `${f.delay}ms`,
              }}
            />
          ))}
        </span>
      </div>
    </div>
  );
}
