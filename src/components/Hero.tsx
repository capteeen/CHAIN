import { useStore } from '../store';
import { useUi } from '../ui';
import { num, sol } from '../lib/format';
import { Counter } from './Bits';
import { Mechanism } from './Mechanism';

function Proof() {
  const s = useStore((st) => st.stats);
  const items: [string, number, (v: number) => string][] = [
    ['links forged', s.links, num],
    ['longest line', s.longest, num],
    ['paid to first links', s.feesToRoot, (v) => sol(v, 1)],
  ];
  return (
    <dl className="flex flex-wrap gap-x-8 gap-y-3">
      {items.map(([k, v, f]) => (
        <div key={k}>
          <dt className="text-xs uppercase tracking-wider text-muted">{k}</dt>
          <dd className="text-xl font-extrabold tabular-nums tracking-tight">
            <Counter value={v} format={f} />
          </dd>
        </div>
      ))}
    </dl>
  );
}

export function Hero() {
  const setLaunch = useUi((s) => s.setLaunch);
  const i = (k: number) => ({ ['--i' as string]: k });
  return (
    <section className="relative overflow-hidden">
      <div className="wrap grid gap-12 pb-20 pt-14 sm:pt-20 lg:grid-cols-[1fr_minmax(420px,0.9fr)] lg:items-center lg:pb-28 lg:pt-24">
        <div>
          <p className="letter eyebrow mb-6" style={i(0)}>
            One coin. One line.
          </p>
          <h1 className="whitespace-nowrap text-[clamp(64px,14vw,180px)] font-black uppercase leading-[0.82] tracking-crush lg:text-[clamp(96px,9.6vw,160px)]" aria-label="CHAIN">
            {'CHAIN'.split('').map((ch, k) => (
              <span key={k} className="letter" style={i(k)} aria-hidden>
                {ch}
              </span>
            ))}
          </h1>
          <p className="letter mt-6 text-2xl font-bold tracking-tight sm:text-3xl" style={i(5)}>
            A coin that launches the next one
          </p>
          <p className="letter mt-4 max-w-xl text-muted" style={i(6)}>
            Launch one coin. When it collects enough fees, it launches the next. That coin launches the one after. One unbroken line,
            and the first link earns from all of it.
          </p>
          <div className="letter mt-8 flex flex-col gap-3 sm:flex-row" style={i(7)}>
            <button className="btn-primary h-12 px-7" onClick={() => setLaunch(true)}>
              Launch coin
            </button>
            <a href="#/how" className="btn-ghost h-12 px-7">
              How it works
            </a>
          </div>
          <p className="letter mt-8 text-sm" style={i(8)}>
            <span className="font-semibold tracking-wider">CA</span>
            <span className="ml-3 text-muted">coming soon</span>
          </p>
          <div className="letter mt-10 border-t border-rule pt-6" style={i(9)}>
            <Proof />
          </div>
        </div>

        <div className="letter" style={i(4)}>
          <div className="card lift p-5 sm:p-7">
            <div className="mb-2 flex items-center justify-between">
              <p className="eyebrow">The loop</p>
              <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted">
                <span className="live-dot h-1.5 w-1.5 rounded-full bg-steel" /> playing
              </span>
            </div>
            <Mechanism />
            <ul className="mt-4 grid grid-cols-3 gap-2 border-t border-rule pt-4 text-xs">
              <li>
                <span className="block font-bold text-gold">30%</span>
                <span className="text-muted">to holders of #1</span>
              </li>
              <li>
                <span className="block font-bold">70%</span>
                <span className="text-muted">into the link’s vault</span>
              </li>
              <li>
                <span className="block font-bold">1</span>
                <span className="text-muted">successor per link</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
