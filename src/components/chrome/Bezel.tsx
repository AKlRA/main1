import { useLocation } from 'react-router-dom';
import { ScrollTrigger, useGSAP } from '../../motion/gsap';

const CORNER = 'M50 0C22.4 0 0 22.4 0 50V0H50Z';
const corners = [
  'top-(--bezel) left-(--bezel)',
  'top-(--bezel) right-(--bezel) rotate-90',
  'bottom-(--bezel) right-(--bezel) rotate-180',
  'bottom-(--bezel) left-(--bezel) -rotate-90',
];

/**
 * The screen frame. Its tone follows the section under the nav line: every section
 * declares `data-chrome="dark" | "light"` and one ScrollTrigger per section flips
 * <html data-chrome>, which the frame, corners and nav read through CSS variables.
 */
export default function Bezel() {
  const { pathname } = useLocation();

  useGSAP(
    () => {
      const root = document.documentElement;
      const sections = document.querySelectorAll<HTMLElement>('[data-chrome]');
      const triggers = Array.from(sections).map((section) =>
        ScrollTrigger.create({
          trigger: section,
          start: 'top 48px',
          end: 'bottom 48px',
          onToggle: (self) => {
            if (self.isActive) root.dataset.chrome = section.dataset.chrome;
          },
        }),
      );
      root.dataset.chrome = sections[0]?.dataset.chrome ?? 'dark';
      return () => triggers.forEach((t) => t.kill());
    },
    { dependencies: [pathname] },
  );

  const edge = 'fixed bg-(--chrome) transition-colors duration-500 ease-(--ease-out)';
  return (
    <div aria-hidden className="pointer-events-none" style={{ zIndex: 'var(--z-chrome)', position: 'relative' }}>
      <div className={`${edge} inset-x-0 top-0 h-(--bezel)`} style={{ zIndex: 'var(--z-chrome)' }} />
      <div className={`${edge} inset-x-0 bottom-0 h-(--bezel)`} style={{ zIndex: 'var(--z-chrome)' }} />
      <div className={`${edge} inset-y-0 left-0 w-(--bezel)`} style={{ zIndex: 'var(--z-chrome)' }} />
      <div className={`${edge} inset-y-0 right-0 w-(--bezel)`} style={{ zIndex: 'var(--z-chrome)' }} />
      {corners.map((pos) => (
        <svg
          key={pos}
          viewBox="0 0 50 50"
          className={`fixed size-8 text-(--chrome) transition-colors duration-500 ease-(--ease-out) md:size-12 ${pos}`}
          style={{ zIndex: 'var(--z-chrome)' }}
        >
          <path d={CORNER} fill="currentColor" />
        </svg>
      ))}
    </div>
  );
}
