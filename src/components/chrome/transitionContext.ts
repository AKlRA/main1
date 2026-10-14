import { createContext, useContext } from 'react';

export type Go = (href: string) => void;

export const TransitionContext = createContext<Go | null>(null);

export function useGo(): Go {
  const ctx = useContext(TransitionContext);
  if (!ctx) throw new Error('useGo must be used inside <PageTransitionProvider>');
  return ctx;
}
