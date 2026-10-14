import { useRef } from 'react';
import { ArrowUpRight } from '@phosphor-icons/react';
import { gsap, useGSAP } from '../../motion/gsap';
import { openQuote } from '../../data/contact';
import HeroCanvas, { type HeroCanvasHandle } from '../hero/HeroCanvas';
import SplitReveal from '../ui/SplitReveal';
import Magnetic from '../ui/Magnetic';
import TransitionLink from '../chrome/TransitionLink';

export default function Hero() {
  const root = useRef<HTMLElement>(null);
  const canvas = useRef<HeroCanvasHandle>(null);

  // Scrolling away: copy drifts up and dims while the form swells and rises.
  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        gsap.to('.hero-copy', {
          yPercent: -18,
          opacity: 0.15,
          ease: 'none',
          scrollTrigger: {
            trigger: root.current,
            start: 'top top',
            end: 'bottom top',
            scrub: true,
            onUpdate: (self) => canvas.current?.setScroll(self.progress),
          },
        });
      });
      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <section
      ref={root}
      data-chrome="dark"
      className="relative flex min-h-[100svh] flex-col overflow-hidden rounded-[1.25rem] bg-ink md:rounded-[2rem]"
    >
      <HeroCanvas ref={canvas} className="pointer-events-none absolute inset-0 size-full" />
      {/* Supporting copy is painted immediately (it is the LCP element) and revealed by the intro curtain;
          only the headline animates in. */}
      {/* Keeps copy legible where the form passes behind it on narrow screens. */}
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_70%_at_0%_100%,rgba(10,10,10,0.85),transparent_60%)] md:bg-[radial-gradient(70%_80%_at_0%_100%,rgba(10,10,10,0.7),transparent_70%)]" />

      <div className="hero-copy container-x relative flex flex-1 flex-col justify-between pb-10 pt-28 md:pb-14 md:pt-36">
        <dl className="flex flex-wrap gap-x-10 gap-y-3 text-sm">
          <div>
            <dt className="text-white/50">Based in</dt>
            <dd className="font-medium">Bengaluru, IN</dd>
          </div>
          <div>
            <dt className="text-white/50">Status</dt>
            <dd className="flex items-center gap-2 font-medium text-lime">
              <span aria-hidden className="size-1.5 rounded-full bg-lime" />
              Taking projects
            </dd>
          </div>
          <div>
            <dt className="text-white/50">Est.</dt>
            <dd className="tabular font-medium">2026</dd>
          </div>
        </dl>

        <div className="mt-16">
          <SplitReveal
            as="h1"
            on="intro"
            by="chars"
            delay={0.05}
            className="text-display max-w-[14ch] text-[clamp(3.1rem,8.6vw,9.75rem)] md:max-w-[17ch]"
          >
            Websites &amp; apps that bring <span className="text-lime">business,</span> not just beauty.
          </SplitReveal>

          <div className="mt-10 grid gap-8 md:mt-14 md:grid-cols-12 md:items-end">
            <p className="max-w-[36ch] text-lg leading-relaxed text-white/70 md:col-span-6 md:text-xl">
              We are a collective of senior developers building high-performance websites and apps that generate real revenue, not just pretty pixels.
            </p>
            <div className="flex flex-wrap items-center gap-x-8 gap-y-4 md:col-span-6 md:justify-end">
              <Magnetic strength={0.25}>
                <button
                  type="button"
                  onClick={openQuote}
                  className="pressable group inline-flex items-center gap-4 rounded-full bg-lime py-2 pl-6 pr-2 text-base font-semibold text-ink"
                >
                  Get a quote
                  <span className="grid size-10 place-items-center rounded-full bg-ink text-lime transition-transform duration-300 ease-(--ease-out) group-hover:-translate-y-px group-hover:translate-x-0.5">
                    <ArrowUpRight size={18} weight="bold" />
                  </span>
                </button>
              </Magnetic>
              <TransitionLink to="/#work" className="link-line py-2 text-base font-medium text-white/80 hover:text-white">
                See the work
              </TransitionLink>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
