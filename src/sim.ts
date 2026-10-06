// Phase 1 — mock simulator. Implements the same Feed interface the Phase 2 API will.
import type { Chain, ChainEvent, Feed, LaunchInput, Link, Snapshot, Stats } from './types';
import { chainArt } from './lib/art';

export const ROOT_SHARE = 0.3;
export const VAULT_SHARE = 1 - ROOT_SHARE;

const B58 = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
const rand = (a: number, b: number) => a + Math.random() * (b - a);
const randInt = (a: number, b: number) => Math.floor(rand(a, b + 1));
const pick = <T,>(xs: T[]): T => xs[Math.floor(Math.random() * xs.length)];
const MIN = 60_000;

/** pump.fun mints are vanity addresses ending in "pump". */
export function mockCa(): string {
  let s = '';
  for (let i = 0; i < 40; i++) s += B58[Math.floor(Math.random() * B58.length)];
  return s + 'pump';
}

const NAMES: [string, string][] = [
  ['Long Cat', 'LCAT'], ['Iron Frog', 'IFROG'], ['Conga', 'CONGA'], ['Paperclip', 'CLIP'],
  ['Shackle', 'SHKL'], ['Bike Lock', 'LOCK'], ['Domino', 'DOMI'], ['Tow Truck', 'TOW'],
  ['Relay', 'RELAY'], ['Anchor Dog', 'ANKR'], ['Kettle', 'KTL'], ['Lineage', 'LINE'],
  ['Daisy', 'DAISY'], ['Rust', 'RUST'], ['Zipper', 'ZIP'], ['Caterpillar', 'CTRP'],
  ['Pearl', 'PEARL'], ['Snake', 'SSS'], ['Train', 'CHOO'], ['Necklace', 'NECK'],
];

function weighted<T>(items: T[], w: (t: T) => number): T | undefined {
  const total = items.reduce((s, t) => s + w(t), 0);
  if (total <= 0) return undefined;
  let r = Math.random() * total;
  for (const t of items) {
    r -= w(t);
    if (r <= 0) return t;
  }
  return items[items.length - 1];
}

export class Simulator implements Feed {
  private chains: Record<string, Chain> = {};
  private links: Record<string, Link[]> = {};
  private heat: Record<string, number> = {};
  private launchCost = 0.0201;
  private reserve = 0.03;
  private eventId = 1;
  private nextChainId = 1;
  private listeners = new Set<(s: Snapshot, e: ChainEvent[]) => void>();
  private timers: number[] = [];
  private usedNames = new Set<string>();

  constructor() {
    this.seed();
  }

  // ---------- Feed ----------

  subscribe(cb: (s: Snapshot, e: ChainEvent[]) => void) {
    this.listeners.add(cb);
    cb(this.snapshot(), []);
    if (this.listeners.size === 1) this.start();
    return () => {
      this.listeners.delete(cb);
      if (this.listeners.size === 0) this.stop();
    };
  }

  async launch(input: LaunchInput): Promise<string> {
    // TODO(phase2): replaced by api.ts launch — mocked here with a short delay.
    await new Promise((r) => setTimeout(r, 1200));
    const id = this.createChain(input.name, input.ticker, Date.now(), input.image, 1);
    const c = this.chains[id];
    this.chains[id] = { ...c, description: input.description, telegram: input.telegram };
    this.heat[id] = 10; // fresh chains get attention
    this.publish([this.ev('forge', id, 1)]);
    return id;
  }

  // ---------- internals ----------

  private ev(kind: ChainEvent['kind'], chainId: string, n: number, amount?: number): ChainEvent {
    return { id: this.eventId++, kind, chainId, n, amount, at: Date.now() };
  }

  private threshold() {
    return this.launchCost + this.reserve;
  }

  private nextName(): [string, string] {
    const free = NAMES.filter(([n]) => !this.usedNames.has(n));
    const [name, ticker] = free.length ? pick(free) : pick(NAMES);
    this.usedNames.add(name);
    const dup = !free.length;
    return dup ? [`${name} II`, `${ticker}2`] : [name, ticker];
  }

  /** Builds a chain of `length` links whose history ends now. */
  private createChain(name: string, ticker: string, startedAt: number, image?: string, length = 1): string {
    const id = String(this.nextChainId++);
    const now = Date.now();
    const links: Link[] = [];
    const span = Math.max(now - startedAt, 1);
    let prevCa: string | undefined;
    for (let n = 1; n <= length; n++) {
      const ca = mockCa();
      const isTip = n === length;
      const bornAt = length === 1 ? startedAt : startedAt + (span * (n - 1)) / length;
      const age = (now - bornAt) / MIN;
      const feesEarned = isTip ? rand(0.002, 0.06) : Math.min(rand(0.06, 0.4) + age * rand(0.001, 0.004), 4);
      const threshold = this.threshold();
      const vault = isTip ? Math.min(feesEarned * VAULT_SHARE, threshold * rand(0.05, 0.95)) : feesEarned * VAULT_SHARE - this.launchCost;
      links.push({
        ca,
        chainId: id,
        n,
        launchedByCa: prevCa,
        vault: Math.max(0, vault),
        threshold,
        feesEarned,
        feesToRoot: feesEarned * ROOT_SHARE,
        trades24h: randInt(isTip ? 4 : 20, isTip ? 60 : 900),
        holders: randInt(isTip ? 3 : 40, isTip ? 40 : 1400),
        bornAt,
        alive: true,
      });
      if (n > 1) links[n - 2].launchedCa = ca;
      prevCa = ca;
    }
    this.links[id] = links;
    const totalFees = links.reduce((s, l) => s + l.feesEarned, 0);
    this.chains[id] = {
      id,
      name,
      ticker,
      image: image || chainArt(name + id, ticker),
      rootCa: links[0].ca,
      length,
      status: 'forging',
      totalFees,
      feesToRoot: totalFees * ROOT_SHARE,
      forgesPerHour: 0,
      startedAt,
    };
    this.chains[id].forgesPerHour = this.rate(this.chains[id]);
    this.heat[id] = rand(1, 5);
    return id;
  }

  private rate(c: Chain) {
    const hours = Math.max((Date.now() - c.startedAt) / 3_600_000, 0.25);
    return (c.length - 1) / hours;
  }

  private seed() {
    const now = Date.now();
    const lengths = [60, 47, 33, 28, 21, 15, 12, 9, 6, 4, 2, 1];
    lengths.forEach((len) => {
      const [name, ticker] = this.nextName();
      const startedAt = now - len * rand(3, 11) * MIN - rand(1, 10) * MIN;
      this.createChain(name, ticker, startedAt, undefined, len);
    });
    // Two seeded chains have already broken.
    for (const id of ['4', '9']) this.breakChain(id, false);
    // The fastest-forging live chain runs hot so the live section has something to watch.
    const hot = Object.values(this.chains)
      .filter((c) => c.status === 'forging' && c.length >= 3)
      .sort((a, b) => b.forgesPerHour - a.forgesPerHour)[0];
    if (hot) this.heat[hot.id] = 14;
  }

  private start() {
    const loop = () => {
      this.tick();
      this.timers[0] = window.setTimeout(loop, rand(2000, 6000));
    };
    this.timers[0] = window.setTimeout(loop, 1200);
    const breaker = () => {
      const candidates = Object.values(this.chains).filter((c) => c.status === 'forging' && c.length >= 3 && this.heat[c.id] < 10);
      const c = candidates.length ? pick(candidates) : undefined;
      if (c) this.publish(this.breakChain(c.id, true));
      this.timers[1] = window.setTimeout(breaker, rand(4, 6) * MIN);
    };
    this.timers[1] = window.setTimeout(breaker, rand(4, 6) * MIN);
    const spawner = () => {
      const [name, ticker] = this.nextName();
      const id = this.createChain(name, ticker, Date.now(), undefined, 1);
      this.publish([this.ev('forge', id, 1)]);
      this.timers[2] = window.setTimeout(spawner, rand(1.5, 3) * MIN);
    };
    this.timers[2] = window.setTimeout(spawner, rand(1.5, 3) * MIN);
  }

  private stop() {
    this.timers.forEach((t) => clearTimeout(t));
    this.timers = [];
  }

  private breakChain(id: string, emit: boolean): ChainEvent[] {
    const c = this.chains[id];
    const arr = this.links[id].slice();
    const tip = arr[arr.length - 1];
    arr[arr.length - 1] = { ...tip, alive: false };
    this.links[id] = arr;
    this.chains[id] = { ...c, status: 'broken', forgesPerHour: this.rate(c) };
    this.heat[id] = 0.3; // older links keep trading a little and still pay #1
    return emit ? [this.ev('break', id, tip.n)] : [];
  }

  private tick() {
    const events: ChainEvent[] = [];
    this.launchCost = Math.min(0.026, Math.max(0.016, this.launchCost + rand(-0.0004, 0.0004)));
    const trades = randInt(1, 4);
    for (let i = 0; i < trades; i++) events.push(...this.trade());
    if (events.length) this.publish(events);
  }

  private trade(): ChainEvent[] {
    const chain = weighted(Object.values(this.chains), (c) => this.heat[c.id] ?? 1);
    if (!chain) return [];
    const arr = this.links[chain.id];
    const tip = arr[arr.length - 1];
    const live = arr.filter((l) => l.alive);
    const link = chain.status === 'forging' && Math.random() < 0.65 ? tip : weighted(live, (l) => 1 + l.n / arr.length);
    if (!link || !link.alive) return [];

    const fee = rand(0.003, 0.02) * (link === tip ? 1 : 0.6);
    const toRoot = fee * ROOT_SHARE;
    const toVault = fee * VAULT_SHARE;
    const events = [this.ev('trade', chain.id, link.n, fee), this.ev('fee_to_root', chain.id, link.n, toRoot)];

    const next = arr.slice();
    let updated: Link = {
      ...link,
      vault: link.vault + toVault,
      feesEarned: link.feesEarned + fee,
      feesToRoot: link.feesToRoot + toRoot,
      trades24h: link.trades24h + 1,
      holders: link.holders + (Math.random() < 0.4 ? 1 : 0),
    };
    let c: Chain = { ...chain, totalFees: chain.totalFees + fee, feesToRoot: chain.feesToRoot + toRoot };

    // Forge: only the tip of a live chain, once its vault covers launch cost + reserve.
    if (link === tip && chain.status === 'forging' && updated.vault >= updated.threshold) {
      // TODO(phase2): api.forgeNext(chain.id, link.ca) — PumpPortal create with this link's vault keypair as creator.
      const ca = mockCa();
      updated = { ...updated, vault: updated.vault - this.launchCost, launchedCa: ca };
      next.push({
        ca,
        chainId: chain.id,
        n: link.n + 1,
        launchedByCa: link.ca,
        vault: 0,
        threshold: this.threshold(),
        feesEarned: 0,
        feesToRoot: 0,
        trades24h: 0,
        holders: 1,
        bornAt: Date.now(),
        alive: true,
      });
      c = { ...c, length: c.length + 1 };
      c.forgesPerHour = this.rate(c);
      events.push(this.ev('forge', chain.id, link.n + 1));
    }
    next[link.n - 1] = updated;
    this.links = { ...this.links, [chain.id]: next };
    this.chains = { ...this.chains, [chain.id]: c };
    return events;
  }

  private stats(): Stats {
    const cs = Object.values(this.chains);
    return {
      chains: cs.length,
      links: cs.reduce((s, c) => s + c.length, 0),
      longest: cs.reduce((m, c) => Math.max(m, c.length), 0),
      feesToRoot: cs.reduce((s, c) => s + c.feesToRoot, 0),
    };
  }

  private snapshot(): Snapshot {
    return {
      chains: this.chains,
      links: this.links,
      stats: this.stats(),
      launchCost: this.launchCost,
      reserve: this.reserve,
    };
  }

  private publish(events: ChainEvent[]) {
    // Fresh top-level objects so store selectors re-run; untouched chains keep identity.
    this.chains = { ...this.chains };
    this.links = { ...this.links };
    const snap = this.snapshot();
    this.listeners.forEach((l) => l(snap, events));
  }
}
