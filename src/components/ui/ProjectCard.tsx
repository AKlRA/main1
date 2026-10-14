import { useEffect, useRef } from 'react';
import { ArrowUpRight } from '@phosphor-icons/react';
import { gsap, useGSAP } from '../../motion/gsap';
import { MQ } from '../../motion/tokens';
import type { Project } from '../../types';
import { displayUrl } from '../../lib/displayUrl';

/** feature: the large cell that spans two rows; tile: a standard cell; wide: a full-width row. */
export type CardVariant = 'feature' | 'tile' | 'wide';

const FRAME: Record<CardVariant, string> = {
  feature: 'aspect-[16/11] md:aspect-auto md:min-h-[24rem] md:flex-1',
  tile: 'aspect-[16/11] md:aspect-[16/10]',
  wide: 'aspect-[16/11] md:aspect-[21/9]',
};

interface ProjectCardProps {
  project: Project;
  variant?: CardVariant;
  onOpen: (project: Project) => void;
}

/** Pixels per second the screenshot travels while hovered. */
const PREVIEW_SPEED = 90;

/**
 * Screenshot in a frame. On mouse devices the frame tilts toward the pointer and the
 * full-page screenshot scrolls itself while hovered; everywhere it wipes in once on entry.
 */
export default function ProjectCard({ project, variant = 'tile', onOpen }: ProjectCardProps) {
  const root = useRef<HTMLElement>(null);
  const tilt = useRef<HTMLDivElement>(null);
  const frame = useRef<HTMLButtonElement>(null);
  const img = useRef<HTMLImageElement>(null);

  // One-time wipe-in when the card reaches the viewport.
  useEffect(() => {
    const el = root.current!;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        el.dataset.in = '';
        io.disconnect();
      },
      { rootMargin: '0px 0px -12% 0px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(`${MQ.finePointer} and (prefers-reduced-motion: no-preference)`, () => {
        const wrap = tilt.current!, box = frame.current!, image = img.current!;
        gsap.set(wrap, { transformPerspective: 1100 });
        const rx = gsap.quickTo(wrap, 'rotationX', { duration: 0.7, ease: 'ax.out' });
        const ry = gsap.quickTo(wrap, 'rotationY', { duration: 0.7, ease: 'ax.out' });
        let raf = 0, last = 0, offset = 0, dir = 1;

        const step = (now: number) => {
          const dt = last ? (now - last) / 1000 : 0;
          last = now;
          const max = image.offsetHeight - box.offsetHeight;
          if (max > 0) {
            offset += dir * PREVIEW_SPEED * dt;
            if (offset >= max) { offset = max; dir = -1; }
            else if (offset <= 0) { offset = 0; dir = 1; }
            image.style.transform = `translate3d(0, ${-offset}px, 0)`;
          }
          raf = requestAnimationFrame(step);
        };
        const enter = () => { last = 0; raf = requestAnimationFrame(step); };
        const move = (e: PointerEvent) => {
          const b = wrap.getBoundingClientRect();
          rx(((e.clientY - b.top) / b.height - 0.5) * -7);
          ry(((e.clientX - b.left) / b.width - 0.5) * 9);
        };
        const leave = () => { cancelAnimationFrame(raf); rx(0); ry(0); };

        box.addEventListener('pointerenter', enter);
        box.addEventListener('pointermove', move);
        box.addEventListener('pointerleave', leave);
        return () => {
          cancelAnimationFrame(raf);
          box.removeEventListener('pointerenter', enter);
          box.removeEventListener('pointermove', move);
          box.removeEventListener('pointerleave', leave);
          image.style.transform = '';
        };
      });
      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <article ref={root} className="group/card flex h-full flex-col">
      <div ref={tilt} className="flex flex-1 flex-col will-change-transform">
        <button
          ref={frame}
          type="button"
          onClick={() => onOpen(project)}
          data-cursor="view"
          aria-label={`${project.title}: view details`}
          className={`relative block w-full overflow-hidden rounded-[1.25rem] bg-ink ring-1 ring-ink/10 [clip-path:inset(100%_0_0_0_round_1.25rem)] transition-[clip-path] duration-[1.1s] ease-(--ease-in-out) group-data-[in]/card:[clip-path:inset(0_0_0_0_round_1.25rem)] motion-reduce:[clip-path:none] ${
            FRAME[variant]
          }`}
        >
          {/* Scale lives on the wrapper so the hover scroll (on the img) never inherits its transition. */}
          <div className="absolute inset-0 origin-top scale-[1.06] transition-transform duration-[1.4s] ease-(--ease-out) group-data-[in]/card:scale-100">
            <img
              ref={img}
              src={project.image}
              srcSet={project.srcSet}
              sizes="(min-width: 768px) 50vw, 84vw"
              alt={`${project.title} website, full-page screenshot`}
              loading="lazy"
              decoding="async"
              // Taller than the frame: hangs from the top and scrolls on hover. Shorter: covers it.
              className="min-h-full w-full object-cover object-top"
            />
          </div>
        </button>
      </div>
      <div className="mt-4 flex items-start justify-between gap-6">
        <div className="min-w-0">
          <h3 className="text-display text-[clamp(1.75rem,2.6vw,2.6rem)] leading-none">{project.title}</h3>
          <p className="mt-2 truncate text-sm text-ink/55">{displayUrl(project.link)}</p>
        </div>
        <a
          href={project.link}
          target="_blank"
          rel="noopener noreferrer"
          className="pressable mt-1 inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-2 text-sm font-semibold ring-1 ring-ink/15 transition-colors duration-200 hover:bg-ink hover:text-paper"
        >
          Visit <ArrowUpRight size={14} weight="bold" />
          <span className="sr-only">{project.title} live site (opens in a new tab)</span>
        </a>
      </div>
    </article>
  );
}
