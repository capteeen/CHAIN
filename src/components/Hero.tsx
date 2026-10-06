import { useEffect, useMemo, useState } from 'react';
import { useStore } from '../store';
import { useUi } from '../ui';
import { ago } from '../lib/format';
import { ChainImage } from './Bits';

function LatestForges() {
  const links = useStore((s) => s.links);
  const chains = useStore((s) => s.chains);
  const [, tick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => tick((x) => x + 1), 1000);
    return () => clearInterval(t);
  }, []);
  // Newest links across every chain (covers history from before this visit too).
  const forges = useMemo(
    () =>
      Object.values(links)
        .map((ls) => ls[ls.length - 1])
        .filter(Boolean)
        .sort((a, b) => b.bornAt - a.bornAt)
        .slice(0, 4)
        .map((l) => ({ id: l.ca, chainId: l.chainId, n: l.n, at: l.bornAt })),
    [links],
  );
  return (
    <div className="card w-full p-5 sm:p-6">
      <p className="eyebrow mb-4">Latest forges</p>
      {forges.length === 0 && <p className="text-sm text-muted">Waiting for the next link…</p>}
      <ul className="space-y-3">
        {forges.map((e) => {
          const c = chains[e.chainId];
          if (!c) return null;
          return (
            <li key={e.id} className="forge-in">
              <a href={`#/chain/${c.id}`} className="flex items-center gap-3">
                <ChainImage src={c.image} n={e.n} size={36} root={e.n === 1} />
                <span className="min-w-0 flex-1 truncate font-semibold">
                  {c.name} <span className={e.n === 1 ? 'text-gold' : 'text-muted'}>#{e.n}</span>
                </span>
                <span className="text-xs text-muted">{ago(e.at)}</span>
              </a>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function Hero() {
  const setLaunch = useUi((s) => s.setLaunch);
  return (
    <section className="wrap grid gap-10 pb-20 pt-14 sm:pt-20 lg:grid-cols-[1fr_340px] lg:items-end lg:pb-28">
      <div>
        <p className="eyebrow mb-6">One coin. One line.</p>
        <h1 className="text-[clamp(64px,14vw,180px)] font-black uppercase leading-[0.82] tracking-crush">CHAIN</h1>
        <p className="mt-6 text-2xl font-bold tracking-tight sm:text-3xl">A coin that launches the next one</p>
        <p className="mt-4 max-w-xl text-muted">
          Launch one coin. When it collects enough fees, it launches the next. That coin launches the one after. One unbroken line,
          and the first link earns from all of it.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <button className="btn-primary h-12 px-7" onClick={() => setLaunch(true)}>
            Launch coin
          </button>
          <a href="#/how" className="btn-ghost h-12 px-7">
            How it works
          </a>
        </div>
        <p className="mt-8 text-sm">
          <span className="font-semibold tracking-wider">CA</span>
          <span className="ml-3 text-muted">coming soon</span>
        </p>
      </div>
      <LatestForges />
    </section>
  );
}
