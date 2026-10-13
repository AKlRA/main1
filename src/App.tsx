import { Suspense, lazy, useCallback, useEffect, useState } from 'react';
import { Route, Routes, useLocation, useNavigationType } from 'react-router-dom';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/react';
import { ScrollTrigger } from './motion/gsap';
import { useScrollApi } from './motion/scrollContext';
import Preloader from './components/chrome/Preloader';
import Bezel from './components/chrome/Bezel';
import Cursor from './components/chrome/Cursor';
import FloatingQuote from './components/chrome/FloatingQuote';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import QuoteModal from './components/ui/QuoteModal';
import Home from './pages/Home';

const loadTeam = () => import('./pages/TeamPage');
const loadPricing = () => import('./pages/PricingPage');
const TeamPage = lazy(loadTeam);
const PricingPage = lazy(loadPricing);
import { IntroContext } from './motion/intro';

const SEEN_KEY = 'axoraa-intro-seen';

function readSeen() {
  try {
    return sessionStorage.getItem(SEEN_KEY) === '1';
  } catch {
    return false;
  }
}

export default function App() {
  const [showPreloader, setShowPreloader] = useState(() => !readSeen());
  // `revealed` flips as the preloader starts lifting, so the hero can choreograph its entrance under it.
  const [revealed, setRevealed] = useState(() => readSeen());
  const { pathname, hash } = useLocation();
  const { scrollTo, lock, unlock } = useScrollApi();
  const navType = useNavigationType();

  useEffect(() => {
    if (!showPreloader) return;
    lock();
    return unlock;
  }, [showPreloader, lock, unlock]);

  const handleReveal = useCallback(() => setRevealed(true), []);
  const handleDone = useCallback(() => {
    try {
      sessionStorage.setItem(SEEN_KEY, '1');
    } catch {
      /* private mode: the intro simply plays again next visit */
    }
    setShowPreloader(false);
  }, []);

  // Deep links (/#work) land on their section once the page has laid out.
  useEffect(() => {
    if (!revealed || !hash) return;
    const jump = () => { ScrollTrigger.refresh(); scrollTo(hash, { offset: -24, immediate: true }); };
    // Twice: once early, once after pins, split text and images have settled.
    const timers = [window.setTimeout(jump, 120), window.setTimeout(jump, 700)];
    return () => timers.forEach(window.clearTimeout);
    // Only on first reveal; in-app hash navigation goes through the page transition.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [revealed]);

  // Back / forward skip the curtain; start the restored page at the top.
  useEffect(() => {
    if (navType === 'POP') scrollTo(0, { immediate: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  // Fetch the secondary routes while idle so the page curtain never waits on the network.
  useEffect(() => {
    if (!revealed) return;
    const idle = window.requestIdleCallback ?? ((cb: () => void) => window.setTimeout(cb, 1500));
    const id = idle(() => { void loadTeam(); void loadPricing(); });
    return () => (window.cancelIdleCallback ?? window.clearTimeout)(id);
  }, [revealed]);

  // Late layout changes (images, fonts, filtered grids) must re-measure every ScrollTrigger.
  useEffect(() => {
    let frame = 0;
    const ro = new ResizeObserver(() => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => ScrollTrigger.refresh());
    });
    ro.observe(document.body);
    return () => { ro.disconnect(); cancelAnimationFrame(frame); };
  }, []);

  return (
    <IntroContext.Provider value={revealed}>
      <a
        href="#main"
        className="fixed left-6 top-6 -translate-y-24 rounded-full bg-lime px-5 py-3 font-semibold text-ink transition-transform duration-200 focus:translate-y-0"
        style={{ zIndex: 'var(--z-cursor)' }}
      >
        Skip to content
      </a>

      {showPreloader && <Preloader onReveal={handleReveal} onDone={handleDone} />}

      <Bezel />
      <Navbar />

      <div className="bg-ink px-(--bezel) pb-(--bezel)">
        <main id="main" key={pathname} className="relative">
          <Suspense fallback={<div className="min-h-[100svh]" />}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/team" element={<TeamPage />} />
              <Route path="/pricing" element={<PricingPage />} />
            </Routes>
          </Suspense>
        </main>
        <Footer />
      </div>

      <FloatingQuote />
      <QuoteModal />
      <Cursor />
      <div className="grain" aria-hidden />

      <Analytics />
      <SpeedInsights />
    </IntroContext.Provider>
  );
}
