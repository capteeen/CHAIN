export type ChainStatus = 'forging' | 'broken';

export interface Chain {
  id: string;
  name: string;
  ticker: string;
  image: string;
  description?: string;
  telegram?: string;
  rootCa: string;
  length: number;
  status: ChainStatus;
  totalFees: number;
  feesToRoot: number;
  forgesPerHour: number;
  startedAt: number;
}

export interface Link {
  ca: string;
  chainId: string;
  n: number;
  launchedByCa?: string;
  launchedCa?: string;
  vault: number;
  threshold: number;
  feesEarned: number;
  feesToRoot: number;
  trades24h: number;
  holders: number;
  bornAt: number;
  alive: boolean;
}

export type EventKind = 'forge' | 'trade' | 'fee_to_root' | 'break';

export interface ChainEvent {
  id: number;
  kind: EventKind;
  chainId: string;
  n: number;
  amount?: number;
  at: number;
}

export interface Stats {
  chains: number;
  links: number;
  longest: number;
  feesToRoot: number;
}

/** Full state a feed (simulator or API) pushes into the store. */
export interface Snapshot {
  chains: Record<string, Chain>;
  links: Record<string, Link[]>;
  stats: Stats;
  /** Current pump.fun launch cost in SOL. */
  launchCost: number;
  /** Fixed reserve each vault keeps on top of the launch cost. */
  reserve: number;
}

export interface LaunchInput {
  name: string;
  ticker: string;
  image?: string;
  description?: string;
  telegram?: string;
  devBuy: number;
  creator?: string;
}

/**
 * Anything that can drive the store: the Phase 1 simulator or the Phase 2 API.
 * `subscribe` must call onSnapshot once immediately, then on every change with
 * the new events that caused it.
 */
export interface Feed {
  subscribe(onUpdate: (snap: Snapshot, events: ChainEvent[]) => void): () => void;
  launch(input: LaunchInput): Promise<string>;
}
