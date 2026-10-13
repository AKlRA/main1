import { useRef } from 'react';
import { gsap, SplitText, useGSAP } from '../../motion/gsap';
import { MQ } from '../../motion/tokens';

const STATEMENT =
  'We refuse to build ordinary digital experiences. Our obsession with detail, motion physics, and uncompromising performance transforms ambitious brands into industry icons.';

/** Words light up in reading order as the section is scrubbed; the outline word drifts behind. */
export default function Philosophy() {
  const root = useRef<HTMLElement>(null);
  const text = useRef<HTMLParagraphElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      const build = (pin: boolean) => {
        const split = SplitText.create(text.current!, { type: 'words', aria: 'none' });
        const tl = gsap.timeline({
          defaults: { ease: 'none' },
          scrollTrigger: pin
            ? { trigger: root.current, start: 'top top', end: '+=120%', pin: true, scrub: 0.6 }
            : { trigger: text.current, start: 'top 80%', end: 'bottom 45%', scrub: 0.6 },
        });
        tl.fromTo(split.words, { opacity: 0.24 }, { opacity: 1, stagger: 0.1, duration: 0.4 }, 0)
          .fromTo('.philo-outline', { xPercent: 6 }, { xPercent: -14, duration: tl.duration() || 1 }, 0);
        return () => split.revert();
      };
      mm.add(MQ.desktop, () => build(true));
      mm.add(MQ.mobile, () => build(false));
      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <section
      ref={root}
      id="philosophy"
      data-chrome="light"
      aria-label="Philosophy"
      className="relative flex min-h-[100svh] flex-col justify-center overflow-hidden bg-ink py-28"
    >
      <span
        aria-hidden
        className="philo-outline pointer-events-none absolute left-0 top-[8%] select-none whitespace-nowrap font-display text-[24vw] font-bold leading-none tracking-[-0.06em] text-transparent [-webkit-text-stroke:1px_rgba(255,255,255,0.13)] md:top-[4%]"
      >
        Philosophy
      </span>
      <div className="container-x relative">
        <p
          ref={text}
          className="max-w-[22ch] font-display text-[clamp(2.1rem,5vw,5.25rem)] font-semibold leading-[1.02] tracking-[-0.035em] md:ml-[8vw]"
        >
          {STATEMENT}
        </p>
      </div>
    </section>
  );
}
