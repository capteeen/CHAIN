import { useEffect } from 'react';
import { useRoute } from './lib/router';
import { useUi } from './ui';
import { Nav } from './components/Nav';
import { Ticker } from './components/Activity';
import { Hero } from './components/Hero';
import { Steps } from './components/Steps';
import { LiveSim } from './components/LiveSim';
import { StatsSection } from './components/StatsSection';
import { Explore } from './components/Explore';
import { Leaderboard } from './components/Leaderboard';
import { Closing, Footer } from './components/Closing';
import { ChainDetail } from './components/ChainDetail';
import { LaunchModal } from './components/LaunchModal';

function Home({ section }: { section?: string }) {
  useEffect(() => {
    if (!section) return window.scrollTo({ top: 0 });
    // Wait a frame so the sections exist when arriving from a chain page.
    requestAnimationFrame(() => document.getElementById(section)?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  }, [section]);
  return (
    <main>
      <Hero />
      <Steps />
      <LiveSim />
      <StatsSection />
      <Explore />
      <Leaderboard />
      <Closing />
    </main>
  );
}

function Toast() {
  const t = useUi((s) => s.toast);
  if (!t) return null;
  return (
    <div className="toast-in fixed bottom-6 left-1/2 z-[60] rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-[rgb(var(--base))]" role="status">
      {t}
    </div>
  );
}

export default function App() {
  const route = useRoute();
  return (
    <>
      <Nav />
      <Ticker />
      {route.page === 'chain' ? <ChainDetail id={route.id} /> : <Home section={route.section} />}
      <Footer />
      <LaunchModal />
      <Toast />
    </>
  );
}
