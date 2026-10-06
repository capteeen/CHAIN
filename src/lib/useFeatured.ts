import { useMemo, useRef } from 'react';
import { useStore } from '../store';

/** The fastest-forging live chain; sticks to its pick until that chain breaks. */
export function useFeatured(): string | undefined {
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
