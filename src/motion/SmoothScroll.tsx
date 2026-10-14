import { useEffect, useMemo, useState, type ReactNode } from 'react';
import Lenis from 'lenis';
import { gsap, ScrollTrigger } from './gsap';
import { useReducedMotion } from '../hooks/useMediaQuery';
import { ScrollContext, type ScrollApi } from './scrollContext';

export function SmoothScroll({ children }: { children: ReactNode }) {
  const reduce = useReducedMotion();
  const [lenis, setLenis] = useState<Lenis | null>(null);

  useEffect(() => {
    if (reduce) return;
    // Touch keeps native scrolling (syncTouch off): momentum on phones should feel like the OS.
    const instance = new Lenis({ lerp: 0.1, wheelMultiplier: 0.9, autoRaf: false });
    const raf = (time: number) => instance.raf(time * 1000);
    instance.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);
    setLenis(instance);
    return () => {
      gsap.ticker.remove(raf);
      instance.destroy();
      setLenis(null);
    };
  }, [reduce]);

  const api = useMemo<ScrollApi>(() => {
    let locks = 0;
    return {
      scrollTo(target, opts = {}) {
        const offset = opts.offset ?? 0;
        if (lenis) {
          // The page may have just changed height (new route, filtered grid): re-measure first
          // or Lenis clamps the jump to the previous page's scroll limit.
          lenis.resize();
          lenis.scrollTo(target, { offset, immediate: opts.immediate, duration: 1.2, force: true });
          return;
        }
        const el = typeof target === 'string' ? document.querySelector<HTMLElement>(target) : target;
        const y = typeof el === 'number' ? el : el ? el.getBoundingClientRect().top + window.scrollY + offset : 0;
        window.scrollTo({ top: y, behavior: opts.immediate || reduce ? 'auto' : 'smooth' });
      },
      lock() {
        locks++;
        lenis?.stop();
        document.documentElement.classList.add('scroll-locked');
      },
      unlock() {
        locks = Math.max(0, locks - 1);
        if (locks > 0) return;
        lenis?.start();
        document.documentElement.classList.remove('scroll-locked');
      },
    };
  }, [lenis, reduce]);

  return <ScrollContext.Provider value={api}>{children}</ScrollContext.Provider>;
}
