import { useState } from 'react';
import { useNight } from '../lib/theme';
import { useUi } from '../ui';
import { WalletButton } from './WalletButton';

const LINKS: [string, string][] = [
  ['About', '#/about'],
  ['How it works', '#/how'],
  ['Stats', '#/stats'],
  ['Explore', '#/explore'],
  ['Leaderboard', '#/leaderboard'],
];

export function Nav() {
  const [night, toggle] = useNight();
  const setLaunch = useUi((s) => s.setLaunch);
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-40 border-b border-rule bg-[rgb(var(--base)/0.85)] backdrop-blur">
      <div className="wrap flex h-16 items-center gap-4">
        <a href="#/" className="text-xl font-black tracking-crush" onClick={() => setOpen(false)}>
          CHAIN
        </a>
        <nav className="mx-auto hidden items-center gap-6 lg:flex">
          {LINKS.map(([label, href]) => (
            <a key={href} href={href} className="text-sm text-muted transition hover:text-ink">
              {label}
            </a>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2 lg:ml-0">
          <button className="btn-ghost !h-9 !px-3" onClick={toggle} aria-pressed={night} title="Night mode">
            <span aria-hidden>{night ? '☀' : '☾'}</span>
            <span className="hidden xl:inline">Night mode</span>
          </button>
          <span className="hidden md:inline-flex">
            <WalletButton className="btn-ghost !h-9" />
          </span>
          <button className="btn-primary !h-9" onClick={() => setLaunch(true)}>
            Launch coin
          </button>
          <button className="btn-ghost !h-9 !px-3 lg:hidden" onClick={() => setOpen((o) => !o)} aria-label="Menu" aria-expanded={open}>
            {open ? '✕' : '☰'}
          </button>
        </div>
      </div>
      {open && (
        <div className="wrap flex flex-col gap-1 pb-4 lg:hidden">
          {LINKS.map(([label, href]) => (
            <a key={href} href={href} onClick={() => setOpen(false)} className="border-b border-rule py-3 text-lg font-semibold">
              {label}
            </a>
          ))}
          <div className="pt-3 md:hidden">
            <WalletButton className="btn-ghost w-full" />
          </div>
        </div>
      )}
    </header>
  );
}
