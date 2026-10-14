import { useRef, type ReactNode } from 'react';
import { gsap, useGSAP } from '../../motion/gsap';
import { MQ } from '../../motion/tokens';

interface MagneticProps {
  children: ReactNode;
  /** Fraction of the pointer offset the element follows. */
  strength?: number;
  className?: string;
}

/** Pulls its child toward the pointer on mouse devices; inert on touch and reduced motion. */
export default function Magnetic({ children, strength = 0.3, className = 'inline-block' }: MagneticProps) {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(`${MQ.finePointer} and (prefers-reduced-motion: no-preference)`, () => {
        const el = ref.current!;
        const x = gsap.quickTo(el, 'x', { duration: 0.6, ease: 'elastic.out(1, 0.45)' });
        const y = gsap.quickTo(el, 'y', { duration: 0.6, ease: 'elastic.out(1, 0.45)' });
        // Measure on enter, not per move, so the element's own offset doesn't feed back.
        let cx = 0, cy = 0;
        const enter = () => {
          const b = el.getBoundingClientRect();
          cx = b.left + b.width / 2 - (gsap.getProperty(el, 'x') as number);
          cy = b.top + b.height / 2 - (gsap.getProperty(el, 'y') as number);
        };
        const move = (e: PointerEvent) => {
          x((e.clientX - cx) * strength);
          y((e.clientY - cy) * strength);
        };
        const leave = () => { x(0); y(0); };
        el.addEventListener('pointerenter', enter);
        el.addEventListener('pointermove', move);
        el.addEventListener('pointerleave', leave);
        return () => {
          el.removeEventListener('pointerenter', enter);
          el.removeEventListener('pointermove', move);
          el.removeEventListener('pointerleave', leave);
          gsap.set(el, { x: 0, y: 0 });
        };
      });
      return () => mm.revert();
    },
    { scope: ref, dependencies: [strength] },
  );

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
