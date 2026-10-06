import { useStore } from '../store';
import { sol } from '../lib/format';
import { useFeatured } from '../lib/useFeatured';
import { Arrow, ChainImage, Counter, SectionHead, VaultBar } from './Bits';
import { ChainStrip } from './ChainStrip';
import { ChainScene } from '../three/ChainScene';
import { ActivityFeed } from './Activity';
import { Reveal } from './Reveal';

const CARDS: [string, string][] = [
  ['No branching', 'Each link launches exactly one successor. One line, no copies of copies.'],
  ['The first link earns', '30% of every link’s creator fees are sent to #1’s holders. Link #200 still pays link #1.'],
  ['Always connected', 'Every link carries the original’s image, the chain name, and its link number (CHAIN #47).'],
];

const STAGES: [string, string][] = [
  ['Trade', 'A coin drops onto the link that traded.'],
  ['Split', '30% flies back along the line to #1. 70% sinks into the tip’s vault.'],
  ['Heat', 'The tip glows as its vault nears launch cost + reserve.'],
  ['Forge', 'A new link sparks into place and the line is one longer.'],
];

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
        <Reveal>
          <div className="border-y border-rule bg-surface">
            <div className="wrap flex flex-wrap items-center gap-x-6 gap-y-2 py-4 text-sm">
              <span className="flex items-center gap-3 font-semibold">
                <ChainImage src={chain.image} size={28} />
                {chain.name}
              </span>
              <span className="text-muted">
                Length{' '}
                <b className="text-ink">
                  <Counter value={chain.length} format={(v) => Math.round(v).toString()} />
                </b>
              </span>
              <span className="text-muted">
                Fees to <span className="font-semibold text-gold">#1</span>{' '}
                <b className="text-ink">
                  <Counter value={chain.feesToRoot} format={(v) => sol(v)} />
                </b>
              </span>
              <span className="flex items-center gap-2 text-muted">
                Next link <b className="text-ink">{Math.min(99, Math.floor((tip.vault / tip.threshold) * 100))}%</b>
                <VaultBar value={tip.vault} max={tip.threshold} className="w-20" hot />
              </span>
            </div>
            <ChainScene chainId={chain.id} mode="live" className="h-[320px] sm:h-[400px] lg:h-[460px]" />
            <div className="border-t border-rule">
              <ChainStrip chainId={chain.id} follow="always" />
            </div>
            <p className="wrap flex flex-wrap items-center gap-2 py-4 text-sm text-muted">
              fees <Arrow /> next link <Arrow /> a cut flows back to <span className="font-semibold text-gold">#1</span>
            </p>
          </div>
        </Reveal>
      )}
      <div className="wrap">
        <div className="mt-10 grid gap-4 lg:grid-cols-[1fr_380px]">
          <ol className="grid gap-px overflow-hidden rounded-2xl border border-rule bg-rule sm:grid-cols-2">
            {STAGES.map(([t, b], i) => (
              <Reveal as="li" key={t} delay={i * 80} className="bg-surface p-5 sm:p-6">
                <span className="num">{String(i + 1).padStart(2, '0')}</span>
                <h3 className="mt-3 text-lg font-bold tracking-tight">{t}</h3>
                <p className="mt-1 text-sm text-muted">{b}</p>
              </Reveal>
            ))}
          </ol>
          <Reveal delay={160} className="card p-5 sm:p-6">
            <p className="eyebrow mb-2">Activity</p>
            <ActivityFeed limit={7} />
          </Reveal>
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {CARDS.map(([t, b], i) => (
            <Reveal key={t} delay={i * 90} className="card lift p-6 sm:p-8">
              <h3 className="text-xl font-bold tracking-tight">{t}</h3>
              <p className="mt-2 text-muted">{b}</p>
            </Reveal>
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
