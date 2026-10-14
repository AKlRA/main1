import { useCallback, useRef, type ReactNode } from 'react';
import { flushSync } from 'react-dom';
import { useLocation, useNavigate } from 'react-router-dom';
import { gsap, ScrollTrigger } from '../../motion/gsap';
import { DUR } from '../../motion/tokens';
import { useScrollApi } from '../../motion/scrollContext';
import { useReducedMotion } from '../../hooks/useMediaQuery';

import { TransitionContext, type Go } from './transitionContext';

const NAV_OFFSET = -24;
const nextFrame = () => new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r())));

/**
 * Route changes play a lime curtain: it rises over the old page, the route swaps
 * underneath, and it lifts off the new one. Same-page hash links just scroll.
 */
export function PageTransitionProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { scrollTo } = useScrollApi();
  const reduce = useReducedMotion();
  const curtain = useRef<HTMLDivElement>(null);
  const busy = useRef(false);

  const go = useCallback<Go>(
    (href) => {
      const [path = '/', hash] = href.split('#');
      const targetPath = path || '/';
      // Pins on the new page add spacing when measured, so refresh before choosing the scroll target.
      const scrollAfter = () => {
        ScrollTrigger.refresh();
        if (hash) scrollTo(`#${hash}`, { offset: NAV_OFFSET, immediate: true });
        else scrollTo(0, { immediate: true });
      };

      if (targetPath === pathname) {
        if (hash) scrollTo(`#${hash}`, { offset: NAV_OFFSET });
        else scrollTo(0);
        return;
      }
      if (busy.current) return;

      if (reduce || !curtain.current) {
        flushSync(() => navigate(href));
        nextFrame().then(scrollAfter);
        return;
      }

      busy.current = true;
      const el = curtain.current;
      gsap
        .timeline({ onComplete: () => { busy.current = false; } })
        .set(el, { display: 'block', transformOrigin: '50% 100%', scaleY: 0 })
        .to(el, { scaleY: 1, duration: DUR.curtain, ease: 'ax.inOut' })
        .add(() => {
          flushSync(() => navigate(href));
        })
        .add(() => {
          nextFrame().then(scrollAfter);
        })
        // Second pass while still covered: late measurements (pins, split text, images) settle first.
        .add(scrollAfter, '+=0.3')
        .set(el, { transformOrigin: '50% 0%' }, '+=0.05')
        .to(el, { scaleY: 0, duration: DUR.curtain, ease: 'ax.inOut' })
        .set(el, { display: 'none' });
    },
    [navigate, pathname, reduce, scrollTo],
  );

  return (
    <TransitionContext.Provider value={go}>
      {children}
      <div
        ref={curtain}
        aria-hidden
        className="fixed inset-0 hidden bg-lime will-change-transform"
        style={{ zIndex: 'var(--z-curtain)' }}
      />
    </TransitionContext.Provider>
  );
}
