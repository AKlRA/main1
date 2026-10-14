import { useRef } from 'react';
import { ArrowUp, ArrowUpRight } from '@phosphor-icons/react';
import { gsap, useGSAP } from '../../motion/gsap';
import { MQ } from '../../motion/tokens';
import { CONTACT } from '../../data/contact';
import { useScrollApi } from '../../motion/scrollContext';
import Magnetic from '../ui/Magnetic';
import SplitReveal from '../ui/SplitReveal';

/** Text that rolls up to a duplicate of itself on hover. */
function RollLink({ href, children, external }: { href: string; children: string; external?: boolean }) {
  return (
    <a
      href={href}
      {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      className="group relative inline-block overflow-hidden py-1 font-semibold"
    >
      <span className="block transition-transform duration-500 ease-(--ease-out) group-hover:-translate-y-full">{children}</span>
      <span aria-hidden className="absolute inset-x-0 top-full block py-1 transition-transform duration-500 ease-(--ease-out) group-hover:-translate-y-full">
        {children}
      </span>
    </a>
  );
}

/** The lime panel opens out to full width as it arrives; the background words drift. */
export default function Footer() {
  const root = useRef<HTMLElement>(null);
  const { scrollTo } = useScrollApi();

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MQ.desktop, () => {
        gsap.fromTo(
          root.current,
          { clipPath: 'inset(0% 6% 0% 6% round 3rem)' },
          { clipPath: 'inset(0% 0% 0% 0% round 2rem)', ease: 'none', scrollTrigger: { trigger: root.current, start: 'top bottom', end: 'top 35%', scrub: true } },
        );
        gsap.fromTo('.footer-bg', { xPercent: 8 }, { xPercent: -10, ease: 'none', scrollTrigger: { trigger: root.current, start: 'top bottom', end: 'bottom bottom', scrub: true } });
      });
      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <footer
      ref={root}
      id="contact"
      data-chrome="dark"
      data-surface="lime"
      className="relative mt-(--bezel) overflow-hidden rounded-[1.25rem] bg-lime px-0 pb-10 pt-24 text-ink md:rounded-[2rem] md:pb-12 md:pt-36"
    >
      <span aria-hidden className="footer-bg pointer-events-none absolute left-0 top-[18%] select-none whitespace-nowrap font-display text-[26vw] font-bold leading-none tracking-[-0.06em] text-ink/[0.06]">
        Let&apos;s build
      </span>

      <div className="container-x relative">
        <div className="flex flex-col gap-12 md:flex-row md:items-end md:justify-between">
          <SplitReveal as="h2" by="chars" className="text-display text-[clamp(4rem,13vw,13rem)] leading-[0.85]">
            Got a project?
          </SplitReveal>

          <Magnetic strength={0.3} className="inline-block shrink-0 self-start md:self-auto">
            <a
              href={`mailto:${CONTACT.email}`}
              data-cursor="link"
              className="pressable group grid size-40 place-items-center rounded-full bg-ink text-lime md:size-56"
            >
              <span className="flex flex-col items-center gap-2 text-base font-semibold md:text-lg">
                Email us
                <ArrowUpRight size={30} weight="bold" className="transition-transform duration-500 ease-(--ease-out) group-hover:rotate-45" />
              </span>
            </a>
          </Magnetic>
        </div>

        <div className="mt-20 grid gap-10 border-t border-ink/20 pt-10 md:mt-28 md:grid-cols-12">
          <div className="md:col-span-4">
            <p className="font-display text-3xl font-bold tracking-[-0.04em]">AXORAA©</p>
            <p className="mt-1 text-ink/65">{CONTACT.city}</p>
          </div>
          <div className="flex flex-col gap-1 md:col-span-4">
            <RollLink href={`mailto:${CONTACT.email}`}>{CONTACT.email}</RollLink>
            <RollLink href={CONTACT.phoneHref}>{CONTACT.phoneDisplay}</RollLink>
          </div>
          <div className="flex gap-8 md:col-span-4 md:justify-end">
            <RollLink href={CONTACT.linkedin} external>LinkedIn</RollLink>
            <RollLink href={CONTACT.github} external>GitHub</RollLink>
          </div>
        </div>

        <div className="mt-12 flex items-center justify-between text-sm text-ink/60">
          <span>© 2026 Axoraa</span>
          <button
            type="button"
            onClick={() => scrollTo(0)}
            className="pressable inline-flex items-center gap-2 rounded-full px-4 py-2 font-semibold text-ink ring-1 ring-ink/20 transition-colors duration-200 hover:bg-ink hover:text-lime"
          >
            Back to top <ArrowUp size={14} weight="bold" />
          </button>
        </div>
      </div>
    </footer>
  );
}
