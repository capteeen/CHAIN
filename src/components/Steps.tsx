import { useUi } from '../ui';
import { SectionHead } from './Bits';
import { FeeRule } from './FeeRule';

const STEPS: [string, string][] = [
  ['Launch a coin', 'You launch link #1 on CHAIN.'],
  ['It forges the next', 'When its vault can pay for a launch, it launches link #2.'],
  ['Each link repeats', '#2 launches #3, #3 launches #4. Never the original.'],
  ['The line never breaks', '1 → 2 → 3 → … → ∞, and every link pays #1.'],
];

export function Steps() {
  const setLaunch = useUi((s) => s.setLaunch);
  return (
    <section id="how" className="border-t border-rule py-20 sm:py-28">
      <div className="wrap">
        <SectionHead eyebrow="Built to go long" lines={['Link', 'after link']} />
        <ol className="grid gap-px overflow-hidden rounded-2xl border border-rule bg-rule sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map(([title, body], i) => (
            <li key={title} className="bg-surface p-6 sm:p-8">
              <span className="num">{String(i + 1).padStart(2, '0')}</span>
              <h3 className="mt-6 text-xl font-bold tracking-tight">{title}</h3>
              <p className="mt-2 text-muted">{body}</p>
            </li>
          ))}
        </ol>
        <div className="mt-16 grid gap-8 lg:grid-cols-[280px_1fr]">
          <div>
            <p className="eyebrow mb-3">Fee rule</p>
            <p className="text-2xl font-bold tracking-tight">Every link pays the first.</p>
          </div>
          <FeeRule />
        </div>
        <button className="btn-primary mt-12" onClick={() => setLaunch(true)}>
          Launch coin
        </button>
      </div>
    </section>
  );
}
