import { create } from 'zustand';
import type { Chain, ChainEvent, Feed, LaunchInput, Link, Stats } from './types';
import { Simulator } from './sim';
import { ApiFeed } from './api';

const MAX_EVENTS = 400;

interface State {
  ready: boolean;
  chains: Record<string, Chain>;
  links: Record<string, Link[]>;
  stats: Stats;
  launchCost: number;
  reserve: number;
  events: ChainEvent[];
  /** "chainId:n" → time the link was forged in this session (drives the forge animation). */
  forged: Record<string, number>;
  launch: (input: LaunchInput) => Promise<string>;
}

// Swap the data source here (or with VITE_FEED=api) — the UI only reads the store.
const feed: Feed = import.meta.env.VITE_FEED === 'api' ? new ApiFeed() : new Simulator();

export const useStore = create<State>(() => ({
  ready: false,
  chains: {},
  links: {},
  stats: { chains: 0, links: 0, longest: 0, feesToRoot: 0 },
  launchCost: 0,
  reserve: 0,
  events: [],
  forged: {},
  launch: (input) => feed.launch(input),
}));

feed.subscribe((snap, events) => {
  useStore.setState((s) => {
    let forged = s.forged;
    for (const e of events) if (e.kind === 'forge') forged = { ...forged, [`${e.chainId}:${e.n}`]: e.at };
    return {
      ready: true,
      chains: snap.chains,
      links: snap.links,
      stats: snap.stats,
      launchCost: snap.launchCost,
      reserve: snap.reserve,
      events: events.length ? [...events.reverse(), ...s.events].slice(0, MAX_EVENTS) : s.events,
      forged,
    };
  });
});

/** SOL per minute flowing into a link's vault, from recent trade events. */
export function vaultRate(events: ChainEvent[], chainId: string, n: number, windowMin = 10): number {
  const since = Date.now() - windowMin * 60_000;
  let sum = 0;
  let first = Date.now();
  for (const e of events) {
    if (e.at < since) break;
    if (e.kind === 'trade' && e.chainId === chainId && e.n === n) {
      sum += (e.amount ?? 0) * 0.7;
      first = Math.min(first, e.at);
    }
  }
  if (!sum) return 0;
  const mins = Math.max((Date.now() - first) / 60_000, 1);
  return sum / mins;
}
