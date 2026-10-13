import { Fragment, useRef } from 'react';
import { Asterisk } from '@phosphor-icons/react';
import { gsap, ScrollTrigger, useGSAP } from '../../motion/gsap';

const PHRASE = 'Available for projects';

/**
 * Runs left by default, follows the reader's scroll direction, speeds up and leans
 * with scroll velocity, then settles. The ticker only runs while the band is on screen.
 */
export default function Marquee() {
  const root = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        const wrap = gsap.utils.wrap(-50, 0);
        const skew = gsap.quickTo(track.current!, 'skewX', { duration: 0.5, ease: 'ax.out' });
        let pos = 0;
        let dir = 1;
        let boost = 0;
        const tick = (_t: number, dt: number) => {
          boost *= Math.exp(-dt / 350);
          pos = wrap(pos - dir * (0.0016 + boost) * dt);
          gsap.set(track.current, { xPercent: pos });
        };
        const st = ScrollTrigger.create({
          trigger: root.current,
          start: 'top bottom',
          end: 'bottom top',
          onToggle: (self) => (self.isActive ? gsap.ticker.add(tick) : gsap.ticker.remove(tick)),
          onUpdate: (self) => {
            const v = self.getVelocity();
            dir = self.direction;
            boost = Math.min(0.02, Math.abs(v) / 120000);
            skew(gsap.utils.clamp(-7, 7, v / -400));
          },
        });
        return () => { st.kill(); gsap.ticker.remove(tick); };
      });
      return () => mm.revert();
    },
    { scope: root },
  );

  const run = (copy: number) => (
    <div aria-hidden={copy > 0} className="flex shrink-0 items-center">
      {Array.from({ length: 6 }).map((_, i) => (
        <Fragment key={i}>
          <span className="px-[0.45em]">{PHRASE}</span>
          <Asterisk weight="bold" className="size-[0.7em] shrink-0" />
        </Fragment>
      ))}
    </div>
  );

  return (
    <div ref={root} data-chrome="light" className="overflow-hidden bg-lime py-5 text-ink md:py-7">
      <div ref={track} className="flex w-max font-display text-[clamp(2rem,5vw,4.5rem)] font-bold leading-none tracking-[-0.04em] will-change-transform">
        {run(0)}
        {run(1)}
      </div>
    </div>
  );
}
