import { useRef } from 'react';
import { gsap, useGSAP } from '../../motion/gsap';

interface PreloaderProps {
  onReveal: () => void;
  onDone: () => void;
}

/** Wordmark outline paths (A X O R A A ©). `counter` paths fill with ink; the ©'s open `arc` stays a stroke. */
const LETTERS: { d: string; counter?: boolean; arc?: boolean }[] = [
  { d: 'M 15 85 L 36 15 L 44 15 L 65 85 L 53 85 L 47 65 L 33 65 L 27 85 Z' },
  { d: 'M 36 54 L 44 54 L 40 40 Z', counter: true },
  { d: 'M 80 15 L 92 15 L 125 85 L 113 85 Z' },
  { d: 'M 125 15 L 113 15 L 80 85 L 92 85 Z' },
  { d: 'M 165 15 A 25 35 0 1 0 165 85 A 25 35 0 1 0 165 15 Z' },
  { d: 'M 165 25 A 15 25 0 1 0 165 75 A 15 25 0 1 0 165 25 Z', counter: true },
  { d: 'M 205 15 L 217 15 L 217 85 L 205 85 Z' },
  { d: 'M 217 15 L 232 15 C 242 15, 245 22, 245 32 C 245 42, 242 50, 232 50 L 217 50 Z' },
  { d: 'M 217 25 L 227 25 C 232 25, 233 28, 233 32 C 233 36, 232 40, 227 40 L 217 40 Z', counter: true },
  { d: 'M 222 50 L 234 50 L 245 85 L 233 85 Z' },
  { d: 'M 260 85 L 281 15 L 289 15 L 310 85 L 298 85 L 292 65 L 278 65 L 272 85 Z' },
  { d: 'M 281 54 L 289 54 L 285 40 Z', counter: true },
  { d: 'M 325 85 L 346 15 L 354 15 L 375 85 L 363 85 L 357 65 L 343 65 L 337 85 Z' },
  { d: 'M 346 54 L 354 54 L 350 40 Z', counter: true },
  { d: 'M 410 30 A 20 20 0 1 0 410 70 A 20 20 0 1 0 410 30 Z' },
  { d: 'M 418 42 A 10 10 0 1 0 418 58', arc: true },
];

/** Never hold the page longer than this, whatever the network is doing. */
const MAX_WAIT = 2600;

/**
 * Intro: the wordmark draws itself, fills lime, a counter runs while fonts settle,
 * then the panel wipes upward to hand off to the hero. Blocks only on fonts.
 */
export default function Preloader({ onReveal, onDone }: PreloaderProps) {
  const root = useRef<HTMLDivElement>(null);
  const count = useRef<HTMLSpanElement>(null);

  useGSAP(
    () => {
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const strokes = gsap.utils.toArray<SVGPathElement>('.pl-stroke');
      const fills = gsap.utils.toArray<SVGPathElement>('.pl-fill');
      const counter = { v: 0 };
      const fontsReady = Promise.race([
        document.fonts.ready,
        new Promise((r) => setTimeout(r, MAX_WAIT)),
      ]);

      if (reduce) {
        gsap.set(strokes, { drawSVG: '100%' });
        gsap.set(fills, { opacity: 1 });
        gsap.set('.pl-arc', { stroke: '#0a0a0a', strokeWidth: 3.2 });
        fontsReady.then(() => {
          onReveal();
          gsap.to(root.current, { autoAlpha: 0, duration: 0.3, onComplete: onDone });
        });
        return;
      }

      const intro = gsap.timeline();
      intro
        .from(strokes, { drawSVG: '0%', duration: 1.1, ease: 'ax.inOut', stagger: 0.035 })
        .to(counter, {
          v: 100,
          duration: 1.4,
          ease: 'ax.inOut',
          onUpdate: () => { if (count.current) count.current.textContent = String(Math.round(counter.v)).padStart(3, '0'); },
        }, 0)
        .to(fills, { opacity: 1, duration: 0.45, ease: 'ax.out', stagger: 0.02 }, '-=0.35')
        .to('.pl-arc', { stroke: '#0a0a0a', strokeWidth: 3.2, duration: 0.3 }, '-=0.2');

      // Exit waits for both the drawing and the fonts.
      Promise.all([intro.then(), fontsReady]).then(() => {
        gsap
          .timeline({ onComplete: onDone })
          .to('.pl-mark', { yPercent: -18, opacity: 0, duration: 0.6, ease: 'ax.inOut' })
          .to('.pl-meta', { opacity: 0, duration: 0.3 }, '<')
          .add(onReveal, '-=0.2')
          .to(root.current, { clipPath: 'inset(0% 0% 100% 0%)', duration: 0.9, ease: 'ax.inOut' }, '-=0.25');
      });
    },
    { scope: root },
  );

  return (
    <div
      ref={root}
      role="status"
      aria-label="Loading Axoraa"
      className="fixed inset-0 flex flex-col items-center justify-center bg-ink"
      style={{ zIndex: 'var(--z-preloader)', clipPath: 'inset(0% 0% 0% 0%)' }}
    >
      <svg viewBox="0 0 440 100" className="pl-mark w-[min(78vw,30rem)]" aria-hidden>
        <g fill="none" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          {LETTERS.filter((l) => !l.arc).map((l, i) => (
            <path key={`f${i}`} className="pl-fill" d={l.d} fill={l.counter ? '#0a0a0a' : '#ccff00'} opacity={0} />
          ))}
          {LETTERS.map((l, i) => (
            <path key={`s${i}`} className={l.arc ? 'pl-stroke pl-arc' : 'pl-stroke'} d={l.d} stroke="#ccff00" />
          ))}
        </g>
      </svg>
      <div className="pl-meta absolute inset-x-0 bottom-[calc(var(--bezel)+2rem)] container-x flex items-end justify-between text-sm text-white/55">
        <span>Websites, apps and automations</span>
        <span ref={count} className="tabular font-display text-5xl font-semibold leading-none tracking-tight text-white md:text-7xl">000</span>
      </div>
    </div>
  );
}
