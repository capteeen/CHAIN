import { useEffect, useRef, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { useStore } from '../store';
import { useUi } from '../ui';
import { go } from '../lib/router';
import { sol } from '../lib/format';
import { WalletButton } from './WalletButton';
import { FeeRule } from './FeeRule';

const MAX_IMG = 2 * 1024 * 1024;

export function LaunchModal() {
  const open = useUi((s) => s.launchOpen);
  const setLaunch = useUi((s) => s.setLaunch);
  const say = useUi((s) => s.say);
  const launchCost = useStore((s) => s.launchCost);
  const reserve = useStore((s) => s.reserve);
  const launch = useStore((s) => s.launch);
  const { publicKey } = useWallet();
  const { setVisible } = useWalletModal();

  const [name, setName] = useState('');
  const [ticker, setTicker] = useState('');
  const [image, setImage] = useState<string>();
  const [description, setDescription] = useState('');
  const [telegram, setTelegram] = useState('');
  const [devBuy, setDevBuy] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string>();
  const first = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = 'hidden';
    setTimeout(() => first.current?.focus(), 50);
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && !busy && setLaunch(false);
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [open, busy, setLaunch]);

  if (!open) return null;

  const dev = Math.max(0, parseFloat(devBuy) || 0);
  const total = launchCost + reserve + dev;
  const valid = name.trim().length > 0 && ticker.trim().length > 0;

  const onImage = (f?: File) => {
    if (!f) return;
    if (f.size > MAX_IMG) return setErr('Image must be under 2 MB.');
    const r = new FileReader();
    r.onload = () => setImage(String(r.result));
    r.readAsDataURL(f);
    setErr(undefined);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!publicKey) return setVisible(true);
    if (!valid) return setErr('Name and ticker are required.');
    setBusy(true);
    setErr(undefined);
    try {
      // Mocked: the simulator creates the chain. Phase 2: api.launch → wallet signs the vault deposit.
      const id = await launch({
        name: name.trim(),
        ticker: ticker.trim().toUpperCase(),
        image,
        description: description.trim() || undefined,
        telegram: telegram.trim() || undefined,
        devBuy: dev,
        creator: publicKey.toBase58(),
      });
      setLaunch(false);
      setName('');
      setTicker('');
      setImage(undefined);
      setDescription('');
      setTelegram('');
      setDevBuy('');
      say('Link #1 launched');
      go(`/chain/${id}`);
    } catch (x) {
      setErr(x instanceof Error ? x.message : 'Launch failed.');
    } finally {
      setBusy(false);
    }
  };

  const rows: [string, string][] = [
    ['Launch cost (now)', sol(launchCost, 4)],
    ['Chain reserve', sol(reserve, 4)],
    ['Dev buy', sol(dev, 4)],
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-stretch justify-center bg-black/50 sm:items-center sm:p-6" onMouseDown={(e) => e.target === e.currentTarget && !busy && setLaunch(false)}>
      <form
        onSubmit={submit}
        role="dialog"
        aria-modal="true"
        aria-labelledby="launch-title"
        className="flex h-full w-full flex-col overflow-y-auto bg-surface sm:h-auto sm:max-h-[92vh] sm:max-w-lg sm:rounded-3xl sm:border sm:border-rule"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-rule bg-surface px-5 py-4 sm:px-7">
          <h2 id="launch-title" className="text-2xl font-extrabold tracking-crush">
            Start a chain
          </h2>
          <button type="button" className="btn-ghost !h-9 !w-9 !px-0" onClick={() => setLaunch(false)} aria-label="Close" disabled={busy}>
            ✕
          </button>
        </div>

        <div className="flex-1 space-y-4 px-5 py-5 sm:px-7">
          <div className="grid grid-cols-[1fr_120px] gap-3">
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-muted">Name</span>
              <input ref={first} className="field" value={name} onChange={(e) => setName(e.target.value)} maxLength={32} placeholder="Long Cat" />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-muted">Ticker</span>
              <input
                className="field uppercase"
                value={ticker}
                onChange={(e) => setTicker(e.target.value.replace(/[^a-z0-9]/gi, ''))}
                maxLength={10}
                placeholder="LCAT"
              />
            </label>
          </div>

          <label className="flex cursor-pointer items-center gap-4 rounded-xl border border-dashed border-rule p-3 hover:border-steel">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-base text-xl text-muted">
              {image ? <img src={image} alt="" className="h-full w-full object-cover" /> : '+'}
            </span>
            <span>
              <span className="block text-sm font-medium">Image</span>
              <span className="text-xs text-muted">Every link carries it, stamped with its number.</span>
            </span>
            <input type="file" accept="image/png,image/jpeg,image/gif,image/webp" className="sr-only" onChange={(e) => onImage(e.target.files?.[0])} />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-muted">Description</span>
            <textarea className="field h-20 resize-none py-2" value={description} onChange={(e) => setDescription(e.target.value)} maxLength={280} />
          </label>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-muted">Telegram (optional)</span>
              <input className="field" value={telegram} onChange={(e) => setTelegram(e.target.value)} placeholder="t.me/…" />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-muted">Dev buy (SOL) (optional)</span>
              <input className="field" inputMode="decimal" value={devBuy} onChange={(e) => setDevBuy(e.target.value.replace(/[^0-9.]/g, ''))} placeholder="0" />
            </label>
          </div>
          <p className="-mt-2 text-xs text-muted">Dev buy tokens are sent to your wallet.</p>

          <div className="rounded-2xl bg-base p-4">
            {rows.map(([k, v]) => (
              <div key={k} className="flex justify-between py-1 text-sm">
                <span className="text-muted">{k}</span>
                <span className="tabular-nums">{v}</span>
              </div>
            ))}
            <div className="mt-2 flex justify-between border-t border-rule pt-3 font-bold">
              <span>You pay</span>
              <span className="tabular-nums">{sol(total, 4)}</span>
            </div>
          </div>

          <p className="text-xs leading-relaxed text-muted">
            Paid to your chain’s vault wallet, which launches link <span className="font-semibold text-gold">#1</span> as creator. From then on
            each link’s creator fees stay in the chain and forge the next link automatically. 30% of every link’s fees are sent to holders of
            link <span className="font-semibold text-gold">#1</span>.
          </p>

          <details className="text-xs">
            <summary className="cursor-pointer font-medium text-muted">Fee rule</summary>
            <div className="mt-3">
              <FeeRule compact />
            </div>
          </details>

          {err && <p className="text-sm text-broken">{err}</p>}
        </div>

        <div className="sticky bottom-0 grid grid-cols-2 gap-3 border-t border-rule bg-surface px-5 py-4 sm:px-7">
          <WalletButton className="btn-ghost w-full" />
          <button type="submit" className="btn-primary w-full" disabled={busy || (!!publicKey && !valid)}>
            {busy ? 'Launching…' : 'Launch'}
          </button>
        </div>
      </form>
    </div>
  );
}
