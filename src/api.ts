// Phase 2 — real backend. Everything here is a stub; the app runs on the simulator
// until VITE_FEED=api is set and these are implemented.
import type { ChainEvent, Feed, LaunchInput, Snapshot } from './types';

const API = (import.meta.env.VITE_API_URL as string | undefined) ?? '/api';

export class ApiFeed implements Feed {
  subscribe(onUpdate: (snap: Snapshot, events: ChainEvent[]) => void) {
    let closed = false;
    // TODO(phase2): GET `${API}/snapshot` for the initial state.
    fetch(`${API}/snapshot`)
      .then((r) => r.json() as Promise<Snapshot>)
      .then((s) => !closed && onUpdate(s, []))
      .catch(() => console.warn('[chain] api snapshot unavailable'));
    // TODO(phase2): server pushes `{ snapshot, events }` frames over SSE (or a WebSocket).
    const es = new EventSource(`${API}/stream`);
    es.onmessage = (m) => {
      const { snapshot, events } = JSON.parse(m.data) as { snapshot: Snapshot; events: ChainEvent[] };
      onUpdate(snapshot, events);
    };
    return () => {
      closed = true;
      es.close();
    };
  }

  async launch(input: LaunchInput): Promise<string> {
    // TODO(phase2): server creates the chain's vault keypair and returns an unsigned tx
    // paying launch cost + reserve + dev buy into it; the wallet signs and sends it, then
    // the server launches link #1 with the vault as creator. Returns the new chain id.
    const res = await fetch(`${API}/chains`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(input),
    });
    if (!res.ok) throw new Error(await res.text());
    return ((await res.json()) as { id: string }).id;
  }
}

/* ------------------------------------------------------------------------------------
 * Server-side pieces (to live in a worker, listed here so the contract is in one place)
 * ----------------------------------------------------------------------------------*/

/**
 * TODO(phase2): launch a pump.fun coin via PumpPortal's `create` action
 * (https://pumpportal.fun/creation) signed by the forging link's vault keypair, so that
 * vault is the new coin's creator and receives its creator fees.
 */
export async function launchOnPumpFun(_args: {
  vaultSecretKey: Uint8Array;
  name: string;
  symbol: string;
  imageUrl: string;
  description: string;
  telegram?: string;
  devBuySol?: number;
}): Promise<{ mint: string; signature: string }> {
  throw new Error('TODO(phase2): PumpPortal create');
}

/** TODO(phase2): one server keypair per link, encrypted at rest (KMS), never sent to the client. */
export async function createLinkKeypair(_chainId: string, _n: number): Promise<{ publicKey: string }> {
  throw new Error('TODO(phase2): per-link keypair');
}

/** TODO(phase2): claim the link's accrued pump.fun creator fees into its vault. */
export async function claimCreatorFees(_linkCa: string): Promise<number> {
  throw new Error('TODO(phase2): creator fee claim');
}

/**
 * TODO(phase2): send 30% of each claim to the root-holders distributor for the chain,
 * which credits link #1 holders pro-rata (claimable), keeping 70% in the link's vault.
 */
export async function forwardToRootDistributor(_chainId: string, _lamports: number): Promise<string> {
  throw new Error('TODO(phase2): 30% → root distributor');
}

/** TODO(phase2): holder snapshot of link #1 via Helius DAS `getTokenAccounts` (paginated). */
export async function snapshotRootHolders(_rootMint: string): Promise<{ owner: string; amount: bigint }[]> {
  throw new Error('TODO(phase2): DAS holder snapshot');
}

/** TODO(phase2): image service — chain image + "#n" badge, uploaded to IPFS for metadata. */
export async function stampImage(_chainImageUrl: string, _n: number): Promise<string> {
  throw new Error('TODO(phase2): image stamping');
}

/** TODO(phase2): threshold = live pump.fun launch cost (rent + fees) + chain reserve. */
export async function currentThreshold(): Promise<{ launchCost: number; reserve: number }> {
  throw new Error('TODO(phase2): live launch cost');
}

/** TODO(phase2): per-chain OG image rendered server-side at /og/:id.png. */
export function ogImageUrl(chainId: string): string {
  return `${API}/og/${chainId}.png`;
}
