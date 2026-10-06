import { useEffect, useState } from 'react';

export function useNight(): [boolean, () => void] {
  const [night, setNight] = useState(() => document.documentElement.classList.contains('night'));
  useEffect(() => {
    document.documentElement.classList.toggle('night', night);
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', night ? '#141414' : '#F4F4F2');
    try {
      localStorage.setItem('chain-theme', night ? 'night' : 'day');
    } catch {
      /* storage blocked */
    }
  }, [night]);
  return [night, () => setNight((n) => !n)];
}
