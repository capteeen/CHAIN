import { useUi } from '../ui';
import { Reveal } from './Reveal';

export function Closing() {
  const setLaunch = useUi((s) => s.setLaunch);
  return (
    <section className="border-t border-rule py-24 sm:py-36">
      <Reveal className="wrap">
        <p className="eyebrow mb-4">One coin. One line.</p>
        <h2 className="h2">
          Launch once.
          <br />
          <span className="text-muted">Let it link.</span>
        </h2>
        <button className="btn-primary mt-10 h-12 px-7" onClick={() => setLaunch(true)}>
          Launch coin
        </button>
      </Reveal>
    </section>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-rule py-10 text-sm text-muted">
      <div className="wrap flex flex-col gap-4 md:flex-row md:items-center">
        <span className="font-semibold text-ink">CHAIN © 2026</span>
        <span className="md:flex-1">Coins launch on pump.fun (Solana). A meme, not an investment. Crypto is risky — only use what you can afford to lose.</span>
        <span className="flex gap-5">
          <a href="#/explore" className="hover:text-ink">Explore</a>
          <a href="#/leaderboard" className="hover:text-ink">Leaderboard</a>
        </span>
      </div>
    </footer>
  );
}
