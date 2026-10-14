import type { AnchorHTMLAttributes, MouseEvent } from 'react';
import { useGo } from './transitionContext';

interface Props extends AnchorHTMLAttributes<HTMLAnchorElement> {
  to: string;
}

/** A real <a href> (crawlable, middle-click works) whose plain clicks run the page transition. */
export default function TransitionLink({ to, onClick, children, ...rest }: Props) {
  const go = useGo();
  const handle = (e: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(e);
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    go(to);
  };
  return (
    <a href={to} onClick={handle} {...rest}>
      {children}
    </a>
  );
}
