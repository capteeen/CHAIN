import { useMemo, useRef } from 'react';
import { useStore } from '../store';
import { sol } from '../lib/format';
import { Arrow, ChainImage, Counter, SectionHead } from './Bits';
import { ChainStrip } from './ChainStrip';

const CARDS: [string, string][] = [
  ['No branching', 'Each link launches exactly one successor. One line, no copies of copies.'],
  ['The first link earns', '30% of every link’s creator fees are sent to #1’s holders. Link #200 still pays link #1.'],
  ['Always connected', 'Every link carries the original’s image, the chain name, and its link number (CHAIN #47).'],
];

function useFeatured(): string | undefined {
  const chains = useStore((s) => s.chains);
  const pick = useRef<string | undefined>(undefined);
  return useMemo(() => {
    const cur = pick.current && chains[pick.current];
    if (cur && cur.status === 'forging') return cur.id;
    const best = Object.values(chains)
      .filter((c) => c.status === 'forging' && c.length >= 3)
      .sort((a, b) => b.forgesPerHour - a.forgesPerHour)[0];
    pick.current = best?.id;
    return best?.id;
  }, [chains]);
}

export function LiveSim() {
  const id = useFeatured();
  const chain = useStore((s) => (id ? s.chains[id] : undefined));
  const tip = useStore((s) => (id ? s.links[id]?.[s.links[id].length - 1] : undefined));
  return (
    <section id="about" className="border-t border-rule py-20 sm:py-28">
      <div className="wrap">
        <SectionHead eyebrow="Live simulation" lines={['One launch.', 'Then the line grows.']} />
      </div>
      {chain && tip && (
        <div className="border-y border-rule bg-surface py-6">
          <div className="wrap mb-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
            <span className="flex items-center gap-3 font-semibold">
              <ChainImage src={chain.image} size={28} />
              {chain.name}
            </span>
            <span className="text-muted">
              Length <b className="text-ink"><Counter value={chain.length} format={(v) => Math.round(v).toString()} /></b>
            </span>
            <span className="text-muted">
              Fees to <span className="font-semibold text-gold">#1</span>{' '}
              <b className="text-ink"><Counter value={chain.feesToRoot} format={(v) => sol(v)} /></b>
            </span>
            <span className="text-muted">
              Next link <b className="text-ink">{Math.min(99, Math.floor((tip.vault / tip.threshold) * 100))}%</b>
            </span>
          </div>
          <ChainStrip chainId={chain.id} follow="always" />
          <p className="wrap mt-4 flex flex-wrap items-center gap-2 text-sm text-muted">
            fees <Arrow /> next link <Arrow /> a cut flows back to <span className="font-semibold text-gold">#1</span>
          </p>
        </div>
      )}
      <div className="wrap">
        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {CARDS.map(([t, b]) => (
            <div key={t} className="card p-6 sm:p-8">
              <h3 className="text-xl font-bold tracking-tight">{t}</h3>
              <p className="mt-2 text-muted">{b}</p>
            </div>
          ))}
        </div>
        {chain && (
          <a href={`#/chain/${chain.id}`} className="btn-ghost mt-12">
            View this chain <Arrow />
          </a>
        )}
      </div>
    </section>
  );
}
