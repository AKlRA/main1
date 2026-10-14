import { createContext, useContext } from 'react';

export interface ScrollApi {
  /** Scroll to a selector, element or y position. Instant under reduced motion. */
  scrollTo: (target: string | HTMLElement | number, opts?: { immediate?: boolean; offset?: number }) => void;
  /** Pause / resume page scrolling (modals, preloader). */
  lock: () => void;
  unlock: () => void;
}

export const ScrollContext = createContext<ScrollApi | null>(null);

export function useScrollApi(): ScrollApi {
  const ctx = useContext(ScrollContext);
  if (!ctx) throw new Error('useScrollApi must be used inside <SmoothScroll>');
  return ctx;
}
