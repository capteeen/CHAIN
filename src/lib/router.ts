import { useEffect, useState } from 'react';

export type Route =
  | { page: 'home'; section?: 'about' | 'how' | 'stats' | 'explore' | 'leaderboard' }
  | { page: 'chain'; id: string };

const SECTIONS = ['about', 'how', 'stats', 'explore', 'leaderboard'] as const;

export function parse(hash: string): Route {
  const path = hash.replace(/^#/, '') || '/';
  const m = path.match(/^\/chain\/([^/]+)/);
  if (m) return { page: 'chain', id: decodeURIComponent(m[1]) };
  const s = path.replace(/^\//, '') as (typeof SECTIONS)[number];
  return SECTIONS.includes(s) ? { page: 'home', section: s } : { page: 'home' };
}

export function useRoute(): Route {
  const [route, setRoute] = useState(() => parse(window.location.hash));
  useEffect(() => {
    const on = () => setRoute(parse(window.location.hash));
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  return route;
}

export function go(path: string) {
  if (window.location.hash === `#${path}`) window.dispatchEvent(new HashChangeEvent('hashchange'));
  else window.location.hash = path;
}
