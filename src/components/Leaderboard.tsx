import { useMemo, useState } from 'react';
import { useStore } from '../store';
import { useUi } from '../ui';
import { sol } from '../lib/format';
import type { Chain } from '../types';
import { ChainImage, SectionHead, Tabs } from './Bits';

type Tab = 'longest' | 'fees' | 'fastest';

const METRIC: Record<Tab, { sort: (c: Chain) => number; show: (c: Chain) => string; unit: string }> = {
  longest: { sort: (c) => c.length, show: (c) => String(c.length), unit: 'links' },
  fees: { sort: (c) => c.feesToRoot, show: (c) => sol(c.feesToRoot), unit: 'to #1' },
  fastest: { sort: (c) => c.forgesPerHour, show: (c) => c.forgesPerHour.toFixed(1), unit: 'links / hour' },
};

export function Leaderboard() {
  const chains = useStore((s) => s.chains);
  const setLaunch = useUi((s) => s.setLaunch);
  const [tab, setTab] = useState<Tab>('longest');
  const m = METRIC[tab];
  const rows = useMemo(() => Object.values(chains).sort((a, b) => m.sort(b) - m.sort(a)).slice(0, 10), [chains, m]);
  return (
    <section id="leaderboard" className="border-t border-rule py-20 sm:py-28">
      <div className="wrap">
        <SectionHead eyebrow="Leaderboard" lines={['Longest', 'lines']} />
        <Tabs<Tab> value={tab} onChange={setTab} options={[['longest', 'Longest chain'], ['fees', 'Most fees to #1'], ['fastest', 'Fastest forging']]} />
        <ol className="card overflow-hidden">
          {rows.map((c, i) => {
            const broken = c.status === 'broken';
            return (
              <li key={c.id} className="border-b border-rule last:border-0">
                <a href={`#/chain/${c.id}`} className="flex items-center gap-4 px-4 py-4 transition hover:bg-base sm:px-6">
                  <span className="num w-6">{String(i + 1).padStart(2, '0')}</span>
                  <ChainImage src={c.image} size={40} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold">{c.name}</span>
                    {broken ? (
                      <span className="text-xs font-semibold uppercase tracking-wider text-broken">Broken · final length {c.length}</span>
                    ) : (
                      <span className="text-xs text-muted">Forging</span>
                    )}
                  </span>
                  <span className={`text-right ${broken && tab === 'longest' ? 'text-broken' : ''}`}>
                    <b className="block text-lg tabular-nums leading-tight sm:text-2xl">{m.show(c)}</b>
                    <span className="text-xs text-muted">{m.unit}</span>
                  </span>
                </a>
              </li>
            );
          })}
        </ol>
        <button className="btn-primary mt-12" onClick={() => setLaunch(true)}>
          Start yours
        </button>
      </div>
    </section>
  );
}
