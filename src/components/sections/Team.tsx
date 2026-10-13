import { useRef } from 'react';
import { GithubLogo, LinkedinLogo } from '@phosphor-icons/react';
import { team } from '../../data';
import { gsap, useGSAP } from '../../motion/gsap';
import { MQ } from '../../motion/tokens';
import SplitReveal from '../ui/SplitReveal';

/**
 * Names as a list. On mouse devices a portrait follows the pointer and swaps as you
 * move between rows; on touch each row carries its own portrait.
 */
export default function Team() {
  const root = useRef<HTMLElement>(null);
  const follower = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      mm.add('(prefers-reduced-motion: no-preference)', () => {
        gsap.from('.team-row', {
          y: 40,
          opacity: 0,
          duration: 0.9,
          ease: 'ax.out',
          stagger: 0.08,
          scrollTrigger: { trigger: '.team-list', start: 'top 85%', once: true },
        });
      });

      mm.add(`${MQ.finePointer} and (min-width: 768px)`, () => {
        const el = follower.current!;
        const reduce = window.matchMedia(MQ.reduce).matches;
        const x = gsap.quickTo(el, 'x', { duration: reduce ? 0 : 0.6, ease: 'ax.out' });
        const y = gsap.quickTo(el, 'y', { duration: reduce ? 0 : 0.6, ease: 'ax.out' });
        const rot = gsap.quickTo(el, 'rotation', { duration: 0.8, ease: 'ax.out' });
        let lastX = 0;
        const imgs = gsap.utils.toArray<HTMLElement>('.team-portrait');
        const list = root.current!.querySelector<HTMLElement>('.team-list')!;

        const move = (e: PointerEvent) => {
          x(e.clientX + 32);
          y(e.clientY - 180);
          if (!reduce) rot(gsap.utils.clamp(-8, 8, (e.clientX - lastX) * 0.6));
          lastX = e.clientX;
        };
        const show = (i: number) => {
          imgs.forEach((img, j) => gsap.to(img, { autoAlpha: j === i ? 1 : 0, scale: j === i ? 1 : 1.08, duration: 0.45, ease: 'ax.out', overwrite: true }));
          gsap.to(el, { autoAlpha: 1, scale: 1, duration: 0.4, ease: 'ax.out', overwrite: 'auto' });
        };
        const hide = () => gsap.to(el, { autoAlpha: 0, scale: 0.92, duration: 0.3, ease: 'ax.out', overwrite: 'auto' });
        const rows = gsap.utils.toArray<HTMLElement>('.team-row');
        const enters = rows.map((row, i) => {
          const fn = () => show(i);
          row.addEventListener('pointerenter', fn);
          return fn;
        });
        gsap.set(el, { autoAlpha: 0, scale: 0.92 });
        window.addEventListener('pointermove', move, { passive: true });
        list.addEventListener('pointerleave', hide);
        return () => {
          window.removeEventListener('pointermove', move);
          list.removeEventListener('pointerleave', hide);
          rows.forEach((row, i) => row.removeEventListener('pointerenter', enters[i]));
        };
      });
      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <section ref={root} id="team" data-chrome="light" className="relative min-h-[100svh] bg-ink pb-24 pt-36 md:pb-40 md:pt-48">
      <div className="container-x">
        <SplitReveal as="h1" on="intro" by="chars" className="text-display text-[clamp(3.75rem,13vw,12rem)] leading-[0.85]">
          The Collective
        </SplitReveal>
        <SplitReveal as="p" on="intro" delay={0.35} className="mt-8 max-w-[44ch] text-lg leading-relaxed text-white/65 md:text-2xl">
          Engineers by day. Elite freelancers by night. We combine enterprise-grade experience with creative agility.
        </SplitReveal>

        <ul className="team-list mt-16 border-b border-white/12 md:mt-24">
          {team.map((m, i) => (
            <li key={m.id} className="team-row group border-t border-white/12">
              <div className="flex flex-col gap-5 py-8 md:flex-row md:items-center md:justify-between md:py-10">
                <div className="flex items-center gap-5 md:gap-10">
                  <span className="tabular w-8 text-sm text-white/45 transition-colors duration-300 group-hover:text-lime">{String(i + 1).padStart(2, '0')}</span>
                  <img src={m.image} alt="" loading="lazy" className="size-16 shrink-0 rounded-2xl object-cover md:hidden" />
                  <h2 className="text-display text-[clamp(2.75rem,8vw,7.5rem)] text-white/85 transition-[color,transform] duration-500 ease-(--ease-out) md:group-hover:translate-x-6 md:group-hover:text-white">
                    {m.name}
                  </h2>
                </div>
                <div className="flex items-center justify-between gap-8 md:justify-end">
                  <p className="text-base text-white/60 transition-colors duration-300 group-hover:text-white md:text-lg">{m.role}</p>
                  <div className="flex gap-3">
                    <a href={m.github} target="_blank" rel="noopener noreferrer" aria-label={`${m.name} on GitHub`} className="pressable grid size-12 place-items-center rounded-full ring-1 ring-white/20 transition-colors duration-200 hover:bg-white hover:text-ink hover:ring-white">
                      <GithubLogo size={20} />
                    </a>
                    <a href={m.linkedin} target="_blank" rel="noopener noreferrer" aria-label={`${m.name} on LinkedIn`} className="pressable grid size-12 place-items-center rounded-full ring-1 ring-white/20 transition-colors duration-200 hover:bg-lime hover:text-ink hover:ring-lime">
                      <LinkedinLogo size={20} />
                    </a>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div
        ref={follower}
        aria-hidden
        className="pointer-events-none invisible fixed left-0 top-0 hidden h-[22rem] w-[17rem] overflow-hidden rounded-[1.25rem] bg-white/5 md:block"
        style={{ zIndex: 'var(--z-float)' }}
      >
        {team.map((m) => (
          <img key={m.id} src={m.image} alt="" className="team-portrait invisible absolute inset-0 size-full object-cover" />
        ))}
      </div>
    </section>
  );
}
