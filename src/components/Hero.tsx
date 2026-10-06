import { useEffect, useMemo, useState } from 'react';
import { useStore } from '../store';
import { useUi } from '../ui';
import { ago } from '../lib/format';
import { ChainImage } from './Bits';
import { ChainScene } from '../three/ChainScene';
import { useFeatured } from '../lib/useFeatured';

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
    <div className="card lift w-full p-5 sm:p-6">
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
  const featured = useFeatured();
  return (
    <section className="relative overflow-hidden">
      {/* 3D chain running behind the hero, following the fastest-forging chain */}
      {featured && (
        <div className="absolute inset-0" aria-hidden>
          <ChainScene chainId={featured} mode="hero" className="h-full w-full" />
          <div className="absolute inset-0 bg-gradient-to-b from-[rgb(var(--base))] via-[rgb(var(--base)/0.6)] to-transparent" />
          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[rgb(var(--base))] to-transparent" />
        </div>
      )}
      <div className="wrap relative grid gap-10 pb-28 pt-14 sm:pt-20 lg:grid-cols-[1fr_340px] lg:items-end lg:pb-56">
        <div>
          <p className="eyebrow reveal in mb-6">One coin. One line.</p>
          <h1 className="text-[clamp(64px,14vw,180px)] font-black uppercase leading-[0.82] tracking-crush" aria-label="CHAIN">
            {'CHAIN'.split('').map((ch, i) => (
              <span key={i} className="letter" style={{ ['--i' as string]: i }} aria-hidden>
                {ch}
              </span>
            ))}
          </h1>
          <p className="letter mt-6 text-2xl font-bold tracking-tight sm:text-3xl" style={{ ['--i' as string]: 5 }}>
            A coin that launches the next one
          </p>
          <p className="letter mt-4 max-w-xl text-muted" style={{ ['--i' as string]: 6 }}>
            Launch one coin. When it collects enough fees, it launches the next. That coin launches the one after. One unbroken line,
            and the first link earns from all of it.
          </p>
          <div className="letter mt-8 flex flex-col gap-3 sm:flex-row" style={{ ['--i' as string]: 7 }}>
            <button className="btn-primary h-12 px-7" onClick={() => setLaunch(true)}>
              Launch coin
            </button>
            <a href="#/how" className="btn-ghost h-12 px-7">
              How it works
            </a>
          </div>
          <p className="letter mt-8 text-sm" style={{ ['--i' as string]: 8 }}>
            <span className="font-semibold tracking-wider">CA</span>
            <span className="ml-3 text-muted">coming soon</span>
          </p>
        </div>
        <div className="letter mt-40 lg:mt-0" style={{ ['--i' as string]: 6 }}>
          <LatestForges />
        </div>
      </div>
    </section>
  );
}
