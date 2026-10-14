import { useCallback, useMemo, useState, type KeyboardEvent } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { projects } from '../../data';
import type { Project } from '../../types';
import { EASE } from '../../motion/tokens';
import ProjectCard, { type CardVariant } from '../ui/ProjectCard';
import ProjectDrawer from '../ui/ProjectDrawer';
import SplitReveal from '../ui/SplitReveal';

const categories = Array.from(new Set(projects.map((p) => p.category)));
const tabId = (cat: string) => `tab-${cat.toLowerCase().replace(/\s+/g, '-')}`;

interface Cell {
  project: Project;
  variant: CardVariant;
  column: string;
  row: string;
}

/**
 * Bento layout on explicit grid lines (desktop). Groups of three become one feature cell spanning two
 * rows beside two stacked tiles, alternating sides; the feature must be a tall, full-page screenshot.
 * Groups without one fall back to half-width pairs, and a single leftover takes a full-width row.
 */
function layout(items: Project[]): Cell[] {
  const cells: Cell[] = [];
  let i = 0, row = 1, flip = false;
  while (i < items.length) {
    const group = items.slice(i, i + 3);
    const feature = group.length === 3 ? group.find((p) => !p.landscape) : undefined;
    if (feature) {
      const [a, b] = group.filter((p) => p !== feature);
      const [fCol, tCol] = flip ? ['6 / 13', '1 / 6'] : ['1 / 8', '8 / 13'];
      cells.push(
        { project: feature, variant: 'feature', column: fCol, row: `${row} / span 2` },
        { project: a, variant: 'tile', column: tCol, row: `${row}` },
        { project: b, variant: 'tile', column: tCol, row: `${row + 1}` },
      );
      i += 3; row += 2; flip = !flip;
    } else if (items.length - i >= 2) {
      cells.push(
        { project: items[i], variant: 'tile', column: '1 / 7', row: `${row}` },
        { project: items[i + 1], variant: 'tile', column: '7 / 13', row: `${row}` },
      );
      i += 2; row += 1;
    } else {
      cells.push({ project: items[i], variant: 'wide', column: '1 / 13', row: `${row}` });
      i += 1; row += 1;
    }
  }
  return cells;
}

export default function Work() {
  const [active, setActive] = useState(categories[0]);
  const [open, setOpen] = useState<Project | null>(null);
  const cells = useMemo(() => layout(projects.filter((p) => p.category === active)), [active]);
  const close = useCallback(() => setOpen(null), []);

  // Arrow keys move between tabs (WAI-ARIA tabs pattern).
  const onTabKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    e.preventDefault();
    const i = categories.indexOf(active);
    const next = categories[(i + (e.key === 'ArrowRight' ? 1 : -1) + categories.length) % categories.length];
    setActive(next);
    document.getElementById(tabId(next))?.focus();
  };

  return (
    <section
      id="work"
      data-chrome="dark"
      data-surface="light"
      className="relative rounded-[1.25rem] bg-paper pb-16 pt-36 text-ink md:rounded-[2rem] md:pb-36 md:pt-56"
    >
      <div className="container-x">
        <header className="flex items-end justify-between gap-6">
          <SplitReveal as="h2" by="chars" className="text-display text-[clamp(4.5rem,15vw,14rem)] leading-[0.8]">
            Work
          </SplitReveal>
          <p className="tabular pb-3 text-lg font-medium text-ink/55 md:text-2xl">{projects.length} projects</p>
        </header>

        <div
          role="tablist"
          aria-label="Project categories"
          onKeyDown={onTabKey}
          className="-mx-5 mt-12 flex snap-x scroll-px-5 gap-2 overflow-x-auto px-5 pb-2 [scrollbar-width:none] md:mx-0 md:mt-16 md:flex-wrap md:px-0"
        >
          {categories.map((cat) => {
            const on = cat === active;
            const count = projects.filter((p) => p.category === cat).length;
            return (
              <button
                key={cat}
                id={tabId(cat)}
                role="tab"
                type="button"
                aria-selected={on}
                aria-controls="work-panel"
                tabIndex={on ? 0 : -1}
                onClick={() => setActive(cat)}
                className={`pressable relative shrink-0 snap-start rounded-full px-5 py-3 text-sm font-semibold transition-colors duration-200 ${
                  on ? 'text-lime' : 'text-ink/65 ring-1 ring-ink/12 hover:text-ink hover:ring-ink/30'
                }`}
              >
                {on && (
                  <motion.span
                    layoutId="work-tab"
                    className="absolute inset-0 rounded-full bg-ink"
                    transition={{ type: 'spring', duration: 0.45, bounce: 0.15 }}
                  />
                )}
                <span className="relative">
                  {cat} <span className={`tabular ml-1 ${on ? 'text-white/55' : 'text-ink/40'}`}>{count}</span>
                </span>
              </button>
            );
          })}
        </div>

        <div id="work-panel" role="tabpanel" aria-labelledby={tabId(active)} className="mt-12 md:mt-20">
          <AnimatePresence mode="wait" initial={false}>
            <motion.ul
              key={active}
              initial={{ opacity: 0, transform: 'translateY(24px)' }}
              animate={{ opacity: 1, transform: 'translateY(0px)' }}
              exit={{ opacity: 0, transform: 'translateY(-12px)', transition: { duration: 0.2, ease: EASE.out } }}
              transition={{ duration: 0.5, ease: EASE.out }}
              className="-mx-5 flex snap-x snap-mandatory scroll-px-5 gap-4 overflow-x-auto px-5 pb-4 [scrollbar-width:none] md:mx-0 md:grid md:grid-cols-12 md:gap-x-5 md:gap-y-10 md:overflow-visible md:px-0 md:pb-0"
            >
              {cells.map(({ project, variant, column, row }) => (
                // Grid placement is ignored by the mobile flex row, so the inline lines only bite on desktop.
                <li key={project.id} className="w-[84vw] shrink-0 snap-start md:w-auto" style={{ gridColumn: column, gridRow: row }}>
                  <ProjectCard project={project} variant={variant} onOpen={setOpen} />
                </li>
              ))}
            </motion.ul>
          </AnimatePresence>
          <p className="mt-4 text-sm text-ink/45 md:hidden">Swipe for more</p>
        </div>
      </div>

      <ProjectDrawer project={open} onClose={close} />
    </section>
  );
}
