import { useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { processSteps } from '../../data';
import { gsap, useGSAP } from '../../motion/gsap';
import { EASE } from '../../motion/tokens';
import { useInView } from '../../hooks/useInView';
import { useMediaQuery, useReducedMotion } from '../../hooks/useMediaQuery';
import SplitReveal from '../ui/SplitReveal';
import { Sandbox } from './ProcessSandboxes';

const N = processSteps.length;
/** The pinned sequence needs a landscape-width screen; below this the steps stack. */
const PINNED = '(min-width: 1024px) and (prefers-reduced-motion: no-preference)';

/** Motion-only leaf: swaps the demo for the active step. */
function SandboxStage({ index, visible }: { index: number; visible: boolean }) {
  return (
    <div className="relative aspect-[5/4] w-full">
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={index}
          className="absolute inset-0"
          initial={{ opacity: 0, transform: 'translateY(16px) scale(0.98)', filter: 'blur(4px)' }}
          animate={{ opacity: 1, transform: 'translateY(0px) scale(1)', filter: 'blur(0px)' }}
          exit={{ opacity: 0, transform: 'translateY(-10px) scale(0.98)', filter: 'blur(4px)', transition: { duration: 0.2, ease: EASE.out } }}
          transition={{ duration: 0.45, ease: EASE.out }}
        >
          <Sandbox index={index} active={visible} />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

/** One step with its demo; used below 1024px and whenever motion is reduced. */
function StackedStep({ index }: { index: number }) {
  const ref = useRef<HTMLLIElement>(null);
  const inView = useInView(ref, '-20% 0px');
  const step = processSteps[index];
  return (
    <li ref={ref} className="flex flex-col gap-6 border-t border-white/12 pt-8 md:grid md:grid-cols-12 md:items-center md:gap-10">
      <div className="flex flex-col gap-6 md:col-span-6">
        <span className="tabular font-display text-6xl font-bold leading-none tracking-[-0.05em] text-lime">{step.id}</span>
        <SplitReveal as="h3" className="text-display text-[clamp(2.4rem,4vw,3.5rem)]">{step.title}</SplitReveal>
        <p className="max-w-[44ch] text-lg leading-relaxed text-white/65">{step.desc}</p>
      </div>
      <div className="aspect-[5/4] md:col-span-5 md:col-start-8">
        <Sandbox index={index} active={inView} />
      </div>
    </li>
  );
}

/**
 * Wide screens: the section pins and each scroll "page" hands one step to the next while
 * the rail fills and the demo on the left swaps. Narrower screens and reduced motion: stacked steps.
 */
export default function Process() {
  const root = useRef<HTMLElement>(null);
  const [active, setActive] = useState(0);
  const narrow = useMediaQuery('(max-width: 1023px)');
  const reduce = useReducedMotion();
  const inView = useInView(root);
  const stacked = narrow || reduce;

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(PINNED, () => {
        const panels = gsap.utils.toArray<HTMLElement>('.step-panel');
        gsap.set(panels.slice(1), { autoAlpha: 0, yPercent: 35 });
        const tl = gsap.timeline({
          defaults: { ease: 'ax.inOut' },
          scrollTrigger: {
            trigger: root.current,
            start: 'top top',
            end: `+=${(N - 1) * 85}%`,
            pin: true,
            scrub: 0.6,
            onUpdate: (self) => {
              const i = Math.round(self.progress * (N - 1));
              setActive((prev) => (prev === i ? prev : i));
            },
          },
        });
        tl.fromTo('.rail-fill', { scaleY: 0 }, { scaleY: 1, ease: 'none', duration: N - 1 }, 0);
        panels.forEach((panel, i) => {
          if (i === 0) return;
          tl.to(panels[i - 1], { autoAlpha: 0, yPercent: -35, duration: 0.45 }, i - 0.75)
            .to(panel, { autoAlpha: 1, yPercent: 0, duration: 0.45 }, i - 0.6);
        });
      });
      return () => mm.revert();
    },
    { scope: root, dependencies: [stacked] },
  );

  return (
    <section
      ref={root}
      id="process"
      data-chrome="light"
      className="relative overflow-hidden bg-ink py-24 md:py-36 lg:flex lg:h-[100svh] lg:items-center lg:py-0"
    >
      <div className="container-x">
        {stacked ? (
          <>
            <SplitReveal as="h2" by="chars" className="text-display text-[clamp(3.5rem,12vw,7rem)]">How we build.</SplitReveal>
            <ol className="mt-14 flex flex-col gap-16">
              {processSteps.map((step, i) => <StackedStep key={step.id} index={i} />)}
            </ol>
          </>
        ) : (
          <div className="grid grid-cols-12 items-center gap-x-10 pt-16">
            <div className="col-span-5">
              <SplitReveal as="h2" by="chars" className="text-display mb-10 text-[clamp(3.5rem,6.4vw,6.5rem)]">How we build.</SplitReveal>
              <SandboxStage index={active} visible={inView} />
            </div>

            <div className="relative col-span-6 col-start-7 flex gap-10">
              <div aria-hidden className="relative w-px self-stretch bg-white/12">
                <div className="rail-fill absolute inset-0 origin-top bg-lime" />
                {processSteps.map((s, i) => (
                  <span
                    key={s.id}
                    className={`absolute -left-[5px] size-[11px] rounded-full ring-4 ring-ink transition-colors duration-300 ${i <= active ? 'bg-lime' : 'bg-white/25'}`}
                    style={{ top: `calc(${(i / (N - 1)) * 100}% - 5px)` }}
                  />
                ))}
              </div>
              <ol className="grid flex-1 py-6">
                {processSteps.map((step, i) => (
                  <li key={step.id} className="step-panel flex flex-col gap-6 [grid-area:1/1]" aria-current={i === active ? 'step' : undefined}>
                    <span className="tabular font-display text-[clamp(5rem,9vw,9rem)] font-bold leading-[0.8] tracking-[-0.06em] text-lime">{step.id}</span>
                    <h3 className="text-display text-[clamp(2.4rem,3.6vw,3.75rem)]">{step.title}</h3>
                    <p className="max-w-[42ch] text-lg leading-relaxed text-white/65 lg:text-xl">{step.desc}</p>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
