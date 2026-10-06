import { useStore } from '../store';
import { sol } from '../lib/format';

export function FeeRule({ compact }: { compact?: boolean }) {
  const launchCost = useStore((s) => s.launchCost);
  const reserve = useStore((s) => s.reserve);
  const rows: [string, string][] = [
    ['30%', 'of each link’s creator fees go to holders of link #1, pro-rata and claimable.'],
    ['70%', 'stays in that link’s vault.'],
    ['≥', `When a vault holds launch cost + reserve (now ${sol(launchCost + reserve, 3)}), it launches the next link.`],
    ['1', 'Each link forges at most one successor, stamped with the chain image and its number.'],
    ['✕', 'If a link dies before forging, the chain ends and is marked Broken.'],
  ];
  return (
    <ul className={compact ? 'space-y-1.5 text-xs' : 'divide-y divide-rule border-y border-rule'}>
      {rows.map(([k, v], i) => (
        <li key={i} className={compact ? 'flex gap-2' : 'flex items-baseline gap-5 py-4'}>
          <span className={`shrink-0 font-bold ${compact ? 'w-8 text-ink' : 'w-12 text-xl'} ${i === 4 ? 'text-broken' : ''}`}>{k}</span>
          <span className={compact ? 'text-muted' : ''}>{v}</span>
        </li>
      ))}
    </ul>
  );
}
