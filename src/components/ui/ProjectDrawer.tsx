import { useEffect, useRef, type PointerEvent as ReactPointerEvent } from 'react';
import { AnimatePresence, motion, useDragControls, type PanInfo } from 'framer-motion';
import { ArrowUpRight, Check, X } from '@phosphor-icons/react';
import type { Project } from '../../types';
import { EASE } from '../../motion/tokens';
import { useScrollApi } from '../../motion/scrollContext';
import { useIsMobile, useReducedMotion } from '../../hooks/useMediaQuery';
import { displayUrl } from '../../lib/displayUrl';

function pitch(category: string) {
  switch (category) {
    case 'Company Portfolio':
      return 'A bespoke digital portfolio designed for next-generation agencies. Built with full fluid responsiveness, Awwwards-winning aesthetics, and butter-smooth animation physics. Engineered to present brand capabilities at first glance.';
    case 'Cafe Website':
      return 'An atmospheric, custom digital storefront tailored for luxury cafes and restaurants. Features real-time reservations, dynamic menu browsing, and immersive visual storytelling. Form and function engineered in harmony.';
    case 'Internal Software':
      return 'An enterprise-grade internal dashboard built to automate operational bottlenecks and scale efficiency. Incorporates secure state management, live data charting, role-based workflows, and database synchronization.';
    case 'Personal Portfolio':
      return 'An ultra-premium personal showcase focusing on individual expertise and design narrative. Implements unique cursor states, micro-interactions, and flawless typography to elevate personal branding.';
    default:
      return 'A state-of-the-art web application engineered with precision. Implements modern frontend principles, high-performance optimization, and beautiful interface physics to drive seamless customer interaction.';
  }
}

const BENCHMARKS = ['SEO Score 95+', 'Fluid Motion', 'Fast Load Time', 'Zero-Downtime'];

interface Props {
  project: Project | null;
  onClose: () => void;
}

/** Project details: a side panel on desktop, a draggable bottom sheet on phones. */
export default function ProjectDrawer({ project, onClose }: Props) {
  const mobile = useIsMobile();
  const reduce = useReducedMotion();
  const { lock, unlock } = useScrollApi();
  const closeBtn = useRef<HTMLButtonElement>(null);
  const drag = useDragControls();
  // Only the handle and header start a drag, so scrolling the content never moves the sheet.
  const startDrag = (e: ReactPointerEvent) => mobile && !reduce && drag.start(e);

  useEffect(() => {
    if (!project) return;
    const opener = document.activeElement as HTMLElement | null;
    lock();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    const t = window.setTimeout(() => closeBtn.current?.focus(), 80);
    return () => {
      unlock();
      window.removeEventListener('keydown', onKey);
      window.clearTimeout(t);
      opener?.focus?.();
    };
  }, [project, onClose, lock, unlock]);

  // Shorthand x/y (not a transform string) because the sheet's drag gesture drives `y`.
  const hidden = mobile ? { y: '100%' } : { x: '100%' };
  const shown = mobile ? { y: '0%' } : { x: '0%' };

  const onDragEnd = (_: unknown, info: PanInfo) => {
    // A flick is enough; a slow drag needs to travel a quarter of the sheet.
    if (info.velocity.y > 500 || info.offset.y > window.innerHeight * 0.25) onClose();
  };

  return (
    <AnimatePresence>
      {project && (
        <div className="fixed inset-0" style={{ zIndex: 'var(--z-modal)' }}>
          <motion.div
            className="absolute inset-0 bg-ink/70 backdrop-blur-[3px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: EASE.out }}
            onClick={onClose}
          />
          <motion.aside
            role="dialog"
            aria-modal="true"
            aria-label={`${project.title} details`}
            initial={reduce ? { opacity: 0 } : hidden}
            animate={reduce ? { opacity: 1 } : shown}
            exit={reduce ? { opacity: 0 } : { ...hidden, transition: { duration: 0.32, ease: EASE.out } }}
            transition={{ duration: reduce ? 0.2 : 0.5, ease: EASE.drawer }}
            drag={mobile && !reduce ? 'y' : false}
            dragControls={drag}
            dragListener={false}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0.05, bottom: 0.6 }}
            onDragEnd={onDragEnd}
            className="absolute flex flex-col overflow-hidden bg-ink text-white ring-1 ring-white/10 max-md:inset-x-0 max-md:bottom-0 max-md:h-[88svh] max-md:rounded-t-[1.75rem] md:inset-y-(--bezel) md:right-(--bezel) md:w-[min(36rem,calc(100vw-2*var(--bezel)))] md:rounded-[1.75rem]"
          >
            <div onPointerDown={startDrag} className="flex shrink-0 justify-center pb-1 pt-3 md:hidden" style={{ touchAction: 'none' }} aria-hidden>
              <span className="h-1 w-10 rounded-full bg-white/25" />
            </div>
            <header onPointerDown={startDrag} style={{ touchAction: mobile ? 'none' : undefined }} className="flex shrink-0 items-start justify-between gap-6 px-6 pb-4 pt-5 md:px-9 md:pt-9">
              <div className="min-w-0">
                <p className="text-sm text-lime">{project.category}</p>
                <h2 className="text-display mt-2 text-4xl md:text-5xl">{project.title}</h2>
              </div>
              <button
                ref={closeBtn}
                type="button"
                onClick={onClose}
                aria-label="Close details"
                className="pressable grid size-11 shrink-0 place-items-center rounded-full bg-white/[0.07] text-white/75 transition-colors duration-200 hover:bg-white/15 hover:text-white"
              >
                <X size={18} weight="bold" />
              </button>
            </header>

            <div data-lenis-prevent className="flex-1 overflow-y-auto overscroll-contain px-6 pb-8 md:px-9">
              <div data-lenis-prevent className="aspect-[16/11] overflow-y-auto rounded-2xl bg-white/5 ring-1 ring-white/10">
                <img src={project.image} alt={`${project.title} website, full-page screenshot`} className="w-full" />
              </div>
              <p className="mt-2 text-xs text-white/45">Scroll inside the frame to see the full page.</p>

              <p className="mt-7 text-base leading-relaxed text-white/75 md:text-lg">{pitch(project.category)}</p>

              <h3 className="mt-8 text-sm font-medium text-white/55">Built with</h3>
              <ul className="mt-3 flex flex-wrap gap-2">
                {project.tags.map((tag) => (
                  <li key={tag} className="rounded-full bg-white/[0.06] px-3.5 py-1.5 text-sm text-white/85 ring-1 ring-white/10">{tag}</li>
                ))}
              </ul>

              <h3 className="mt-8 text-sm font-medium text-white/55">Quality benchmarks</h3>
              <ul className="mt-3 grid grid-cols-2 gap-3">
                {BENCHMARKS.map((b) => (
                  <li key={b} className="flex items-center gap-2 text-sm text-white/85">
                    <Check size={16} weight="bold" className="shrink-0 text-lime" /> {b}
                  </li>
                ))}
              </ul>
            </div>

            <footer className="shrink-0 border-t border-white/10 px-6 py-5 md:px-9" style={{ paddingBottom: 'calc(1.25rem + env(safe-area-inset-bottom, 0px))' }}>
              <a
                href={project.link}
                target="_blank"
                rel="noopener noreferrer"
                className="pressable flex min-h-12 w-full items-center justify-between rounded-full bg-lime py-2 pl-6 pr-2 font-semibold text-ink"
              >
                <span className="truncate">Visit {displayUrl(project.link)}</span>
                <span className="grid size-9 shrink-0 place-items-center rounded-full bg-ink text-lime">
                  <ArrowUpRight size={16} weight="bold" />
                </span>
              </a>
            </footer>
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
}
