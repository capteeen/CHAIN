# CHAIN — one coin, one unbroken line

Launch one coin. When its vault collects enough fees, it launches the next coin. That coin launches the one after. Every link pays 30% of its creator fees to holders of link #1.

Vite + React + TypeScript + Tailwind + Zustand, hash-routed single-page app, built to **one HTML file**.

```bash
npm install
npm run dev       # http://localhost:5173
npm run build     # dist/index.html (JS + CSS inlined) + dist/logo.png
npm run preview
```

## Routes

| Hash | View |
| --- | --- |
| `#/` | Home: Hero → Steps → Live simulation → Stats → Explore → Leaderboard → Closing CTA |
| `#/about` `#/how` `#/stats` `#/explore` `#/leaderboard` | Home, scrolled to that section |
| `#/chain/:id` | Chain detail: header, full chain scroller, link panel, share card |

## Layout

```
src/
  types.ts           Chain, Link, ChainEvent, Stats, Snapshot, Feed
  sim.ts             Phase 1 mock simulator (implements Feed)
  api.ts             Phase 2 ApiFeed + server-side stubs (all TODO(phase2))
  store.ts           Zustand store, fed by whichever Feed is active
  ui.ts              modal + toast state
  lib/               router, theme (night mode), tween counters, formatting, OG renderer, placeholder art
  components/        one file per section + Mechanism, ChainStrip, Gauges, Activity (ticker, feed), LaunchModal
public/logo.png      OG / Twitter image
brand/               Twitter profile icon (dark + light) and banner
```

## Visualising the mechanic

No WebGL. Three CSS/SVG pieces carry it:

- `Mechanism.tsx` — the looping explainer in the hero: a link trades → the fee splits 30% back to #1 and 70% into the vault → the vault fills → the link forges the next one. Self-paced, pauses off-screen, respects `prefers-reduced-motion`.
- `ChainStrip.tsx` — the live horizontal line for a real chain. New links slide in with the 400ms forge animation **only** on `forge` events from the store.
- `Gauges.tsx` — `VaultGauge` (ring gauge with the forge ETA) and `FeeSplit` (30/70 meter that pulses on each trade).

## How data flows

The UI only reads the store. The store subscribes to one `Feed`:

```ts
interface Feed {
  subscribe(onUpdate: (snap: Snapshot, events: ChainEvent[]) => void): () => void;
  launch(input: LaunchInput): Promise<string>; // returns new chain id
}
```

Each update carries a full `Snapshot` (`chains`, `links`, `stats`, `launchCost`, `reserve`) and the events that caused it. `forge` events are recorded in `store.forged`. `ChainStrip` plays the 400ms slide-in, ring-close and spark animation only for links that appear in it, so the animation runs only on real events. Reloading or navigating never replays it.

### Phase 1: simulator (`src/sim.ts`)

- Seeds 12 chains (lengths 1–60, two already broken).
- Every 2–6s, 1–4 random links trade. Each fee splits 30% to #1 and 70% to that link's vault, emitting `trade` and `fee_to_root` events.
- When the tip's vault reaches `launchCost + reserve`, it forges link n+1 (`forge` event).
- Breaks one live chain every ~5 min (`break` event; tip marked dead; status `broken`).
- Starts a new chain every ~2 min.
- The launch modal's `launch()` creates a real (mock) chain and routes to it.

## Swapping in Phase 2

1. Implement the backend described by the stubs in `src/api.ts`:
   - `GET /api/snapshot` returns a `Snapshot`; `GET /api/stream` is SSE sending `{ snapshot, events }` frames.
   - `POST /api/chains` creates the chain vault keypair and returns an unsigned deposit tx for the wallet to sign. The page currently mocks this step.
   - Worker jobs (TODO stubs):
     - `launchOnPumpFun`: PumpPortal `create`, signed by the forging link's vault keypair as creator.
     - `createLinkKeypair`: one server keypair per link, KMS-encrypted.
     - `claimCreatorFees`: per-link creator-fee claim.
     - `forwardToRootDistributor`: 30% to the root-holders distributor, pro-rata and claimable.
     - `snapshotRootHolders`: link #1 holders via Helius DAS.
     - `stampImage`: chain image plus a `#n` badge, uploaded to IPFS.
     - `currentThreshold`: live pump.fun launch cost + reserve.
     - `ogImageUrl`: server-rendered per-chain OG image at `/og/:id.png`.
2. Build with `VITE_FEED=api VITE_API_URL=https://your-api VITE_RPC_URL=https://your-rpc npm run build`.

`store.ts` picks `ApiFeed` when `VITE_FEED=api`, otherwise `Simulator`. No component changes are needed.

### Wiring the real launch in the modal

`LaunchModal.submit` calls `store.launch(input)`. In Phase 2:
- `ApiFeed.launch` should return the unsigned tx.
- The modal then calls `useWallet().sendTransaction(tx, connection)`.
- After that it polls or awaits the stream for the new chain's id.

## Per-chain OG images

Hash routes are invisible to crawlers, so a static host can serve only `/logo.png`. The chain page renders the per-chain card in the browser (image, name, `LENGTH n`, fees to #1). The card is downloadable and is also set as `og:image` client-side. For real link previews, serve `/chain/:id` from the Phase 2 server with `<meta property="og:image" content={ogImageUrl(id)}>` and redirect to `/#/chain/:id`.

## Rules kept by the UI

- Gold (`#C9A227`) is only ever used for link #1.
- Night mode toggles `html.night` (CSS variables) and is remembered in `localStorage`.
- Mobile: the hero stacks, the chain scroller is touch-scrollable, and the launch modal is full-screen.

Coins launch on pump.fun (Solana). A meme, not an investment.
