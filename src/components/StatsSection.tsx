import { useStore } from '../store';
import { num, sol } from '../lib/format';
import { Arrow, Counter, SectionHead } from './Bits';
import { Reveal } from './Reveal';

export function StatsSection() {
  const s = useStore((st) => st.stats);
  const items: [string, number, (v: number) => string][] = [
    ['Chains started', s.chains, num],
    ['Links forged', s.links, num],
    ['Longest chain', s.longest, num],
    ['Fees sent to first links', s.feesToRoot, (v) => sol(v, 2)],
  ];
  return (
    <section id="stats" className="border-t border-rule py-20 sm:py-28">
      <div className="wrap">
        <SectionHead eyebrow="Stats" lines={['Forging', 'live']} />
        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-rule bg-rule lg:grid-cols-4">
          {items.map(([label, v, f], i) => (
            <Reveal key={label} delay={i * 80} className="bg-surface p-5 sm:p-8">
              <p className="text-[clamp(28px,5vw,56px)] font-extrabold leading-none tracking-crush tabular-nums">
                <Counter value={v} format={f} />
              </p>
              <p className="mt-3 text-sm text-muted">{label}</p>
            </Reveal>
          ))}
        </div>
        <a href="#/explore" className="btn-ghost mt-12">
          Explore chains <Arrow />
        </a>
      </div>
    </section>
  );
}
