import type React from 'react';
import { useStore } from '../store';
import { sol } from '../lib/format';
import { useFeatured } from '../lib/useFeatured';
import { Arrow, ChainImage, Counter, SectionHead } from './Bits';
import { ChainStrip } from './ChainStrip';
import { ActivityFeed } from './Activity';
import { Reveal } from './Reveal';
import { FeeSplit, VaultGauge } from './Gauges';

const CARDS: [string, string, React.ReactNode][] = [
  [
    'No branching',
    'Each link launches exactly one successor. One line, no copies of copies.',
    <svg viewBox="0 0 48 24" className="h-6 w-12" aria-hidden>
      <circle cx="6" cy="12" r="4" className="fill-none stroke-gold" strokeWidth="2.5" />
      <path d="M10 12h8M26 12h8" className="stroke-steel" strokeWidth="2.5" />
      <circle cx="22" cy="12" r="4" className="fill-none stroke-steel" strokeWidth="2.5" />
      <circle cx="38" cy="12" r="4" className="fill-none stroke-steel" strokeWidth="2.5" />
    </svg>,
  ],
  [
    'The first link earns',
    '30% of every link’s creator fees are sent to #1’s holders. Link #200 still pays link #1.',
    <svg viewBox="0 0 48 24" className="h-6 w-12" aria-hidden>
      <circle cx="6" cy="12" r="4" className="fill-none stroke-gold" strokeWidth="2.5" />
      <path d="M44 6 Q 26 -4 11 9" className="fill-none stroke-ink" strokeWidth="1.5" strokeDasharray="2 2" />
      <path d="M12 9 l-3 1 1 3" className="fill-none stroke-ink" strokeWidth="1.5" />
      <circle cx="42" cy="12" r="4" className="fill-none stroke-steel" strokeWidth="2.5" />
    </svg>,
  ],
  [
    'Always connected',
    'Every link carries the original’s image, the chain name, and its link number (CHAIN #47).',
    <svg viewBox="0 0 48 24" className="h-6 w-12" aria-hidden>
      <rect x="2" y="4" width="16" height="16" rx="4" className="fill-steel" />
      <rect x="26" y="4" width="16" height="16" rx="4" className="fill-steel" />
      <text x="34" y="16" textAnchor="middle" className="fill-base text-[8px] font-bold">
        #47
      </text>
    </svg>,
  ],
];

export function LiveSim() {
  const id = useFeatured();
  const chain = useStore((s) => (id ? s.chains[id] : undefined));
  const tip = useStore((s) => (id ? s.links[id]?.[s.links[id].length - 1] : undefined));
  return (
    <section id="about" className="border-t border-rule py-20 sm:py-28">
      <div className="wrap">
        <SectionHead eyebrow="Live simulation" lines={['One launch.', 'Then the line grows.']} />
        {chain && tip && (
          <Reveal>
            <div className="card overflow-hidden">
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 border-b border-rule px-5 py-4 text-sm sm:px-6">
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
                <a href={`#/chain/${chain.id}`} className="ml-auto text-sm font-semibold hover:underline">
                  View chain <Arrow />
                </a>
              </div>
              <div className="py-4">
                <ChainStrip chainId={chain.id} follow="always" />
              </div>
              <p className="flex flex-wrap items-center gap-2 border-t border-rule px-5 py-3 text-sm text-muted sm:px-6">
                fees <Arrow /> next link <Arrow /> a cut flows back to <span className="font-semibold text-gold">#1</span>
              </p>
              <div className="grid gap-6 border-t border-rule p-5 sm:p-6 md:grid-cols-2 lg:grid-cols-3 lg:items-start lg:gap-8">
                <VaultGauge chain={chain} tip={tip} />
                <FeeSplit chain={chain} />
                <div>
                  <p className="eyebrow mb-1">Activity</p>
                  <ActivityFeed chainId={chain.id} limit={4} />
                </div>
              </div>
            </div>
          </Reveal>
        )}
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {CARDS.map(([t, b, icon], i) => (
            <Reveal key={t} delay={i * 90} className="card lift p-6 sm:p-8">
              <div className="mb-5">{icon}</div>
              <h3 className="text-xl font-bold tracking-tight">{t}</h3>
              <p className="mt-2 text-muted">{b}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
