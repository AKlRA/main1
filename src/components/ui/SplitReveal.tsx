import { useEffect, useRef, useState, type ElementType, type ReactNode } from 'react';
import { gsap, SplitText, useGSAP } from '../../motion/gsap';
import { STAGGER } from '../../motion/tokens';
import { useIntroRevealed } from '../../motion/intro';

interface SplitRevealProps {
  as?: ElementType;
  children: ReactNode;
  className?: string;
  /** "lines" for paragraphs and long headings, "chars" for short display lines. */
  by?: 'lines' | 'words' | 'chars';
  /** "scroll" plays when 85% into view; "intro" plays once the preloader hands off. */
  on?: 'scroll' | 'intro';
  delay?: number;
}

/**
 * Masked text reveal. Pieces rise from behind their line's baseline.
 * Reduced motion gets a short opacity fade instead of movement.
 */
export default function SplitReveal({ as: Tag = 'div', children, className, by = 'lines', on = 'scroll', delay = 0 }: SplitRevealProps) {
  const ref = useRef<HTMLElement>(null);
  const revealed = useIntroRevealed();
  // Splitting text forces layout, so scroll reveals wait until they are within two screens.
  const [near, setNear] = useState(on === 'intro');
  useEffect(() => {
    if (near || !ref.current) return;
    const io = new IntersectionObserver(([e]) => e.isIntersecting && setNear(true), { rootMargin: '200% 0px' });
    io.observe(ref.current);
    return () => io.disconnect();
  }, [near]);
  const ready = on === 'scroll' ? near : revealed;

  useGSAP(
    () => {
      const el = ref.current;
      if (!el || !ready) return;
      gsap.set(el, { opacity: 1 });

      const trigger = on === 'scroll' ? { trigger: el, start: 'top 85%', once: true } : undefined;
      const mm = gsap.matchMedia();
      mm.add('(prefers-reduced-motion: reduce)', () => {
        gsap.from(el, { opacity: 0, duration: 0.4, delay, ease: 'none', scrollTrigger: trigger });
      });
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        const split = SplitText.create(el, {
          type: by === 'chars' ? 'lines,words,chars' : by === 'words' ? 'lines,words' : 'lines',
          mask: 'lines',
          // Headings keep an aria-label with pieces hidden; other text is read as split (words stay whole).
          aria: /^H[1-6]$/.test(el.tagName) || by === 'chars' ? 'auto' : 'none',
          linesClass: 'split-line',
          autoSplit: true,
          onSplit(self) {
            const targets = by === 'chars' ? self.chars : by === 'words' ? self.words : self.lines;
            return gsap.from(targets, {
              yPercent: 115,
              rotate: by === 'lines' ? 0 : 4,
              duration: by === 'lines' ? 1.1 : 1,
              ease: 'ax.out',
              stagger: by === 'chars' ? STAGGER.chars : by === 'words' ? STAGGER.words : STAGGER.items,
              delay,
              scrollTrigger: trigger,
            });
          },
        });
        return () => split.revert();
      });
      return () => mm.revert();
    },
    { scope: ref, dependencies: [ready] },
  );

  return (
    // Opacity, not visibility: hidden text must stay in the accessibility tree before it animates.
    <Tag ref={ref} className={className} style={{ opacity: 0 }}>
      {children}
    </Tag>
  );
}
