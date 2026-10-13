import { useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { ChatCircleText } from '@phosphor-icons/react';
import { gsap, ScrollTrigger, useGSAP } from '../../motion/gsap';
import { openQuote } from '../../data/contact';
import Magnetic from '../ui/Magnetic';

/** The one floating contact control. Steps aside once the footer (which has its own CTA) is on screen. */
export default function FloatingQuote() {
  const ref = useRef<HTMLDivElement>(null);
  const { pathname } = useLocation();

  useGSAP(
    () => {
      const el = ref.current!;
      const lift = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 24;
      gsap.set(el, { autoAlpha: 0, y: lift });
      const show = (on: boolean) =>
        gsap.to(el, { autoAlpha: on ? 1 : 0, y: on ? 0 : lift, duration: 0.35, ease: 'ax.out', overwrite: true });
      // Either trigger's callback can fire during creation, so both are read through a holder.
      const st: { appear?: ScrollTrigger; footer?: ScrollTrigger } = {};
      const update = () => show(!!st.appear?.isActive && !st.footer?.isActive);
      st.appear = ScrollTrigger.create({ start: 160, end: 'max', onToggle: () => update() });
      st.footer = ScrollTrigger.create({
        trigger: '#contact',
        start: 'top bottom',
        end: 'bottom top',
        onToggle: () => update(),
      });
      return () => { st.appear?.kill(); st.footer?.kill(); };
    },
    { dependencies: [pathname] },
  );

  return (
    <div
      ref={ref}
      className="invisible fixed bottom-[calc(var(--bezel)+1rem)] right-[calc(var(--bezel)+1rem)] md:bottom-[calc(var(--bezel)+1.5rem)] md:right-[calc(var(--bezel)+1.5rem)]"
      style={{ zIndex: 'var(--z-float)', paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <Magnetic strength={0.35}>
        <button
          type="button"
          onClick={openQuote}
          aria-label="Get a quote"
          className="pressable grid size-14 place-items-center rounded-full bg-lime text-ink shadow-[0_10px_30px_-10px_rgba(204,255,0,0.55)] md:size-16"
        >
          <ChatCircleText size={26} weight="duotone" />
        </button>
      </Magnetic>
    </div>
  );
}
