import { useEffect, useRef } from 'react';
import { gsap, ScrollTrigger } from '../../motion/gsap';
import { useFinePointer, useReducedMotion } from '../../hooks/useMediaQuery';

type State = 'default' | 'link' | 'view' | 'drag' | 'hidden';

// View/drag bubbles stay close to the resting ring so they label the target without covering it.
const RING_SCALE: Record<State, number> = { default: 1, link: 1.4, view: 1.25, drag: 1.25, hidden: 0.6 };

function resolve(target: EventTarget | null): { state: State; label: string } {
  if (!(target instanceof Element)) return { state: 'default', label: '' };
  const tagged = target.closest<HTMLElement>('[data-cursor]');
  if (tagged) {
    const state = (tagged.dataset.cursor as State) || 'link';
    return { state, label: tagged.dataset.cursorLabel ?? (state === 'drag' ? 'Drag' : state === 'view' ? 'View' : '') };
  }
  if (target.closest('input, textarea, select')) return { state: 'hidden', label: '' };
  if (target.closest('a, button, [role="button"], [role="slider"], label')) return { state: 'link', label: '' };
  return { state: 'default', label: '' };
}

type Tone = 'light' | 'dark' | 'media';

/**
 * Which cursor colour reads against what's under the pointer: ink on light surfaces (paper, white,
 * lime), white on dark ones, and an inverting blend over images/video where the colour varies.
 * Runs when the pointer enters an element and when the page scrolls under a still pointer.
 */
function toneAt(target: EventTarget | null): Tone {
  if (!(target instanceof Element)) return 'light';
  if (target.closest('img, video, canvas')) return 'media';
  for (let el: Element | null = target; el; el = el.parentElement) {
    const m = getComputedStyle(el).backgroundColor.match(/[\d.]+/g);
    if (!m) continue;
    const [r, g, b, a = 1] = m.map(Number);
    if (a < 0.5) continue;
    const lum = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
    return lum > 0.5 ? 'dark' : 'light';
  }
  return 'light';
}

/**
 * Dot + ring cursor for mouse users. Contextual states come from `data-cursor`
 * ("link" | "view" | "drag" | "hidden") and `data-cursor-label` on any ancestor.
 * Never mounts for touch, pens without hover, or reduced motion.
 */
function CursorInner() {
  const root = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLDivElement>(null);
  const label = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const html = document.documentElement;
    const r = root.current!, ringEl = ring.current!, dotEl = dot.current!, labelEl = label.current!;
    const ringX = gsap.quickTo(ringEl, 'x', { duration: 0.45, ease: 'ax.out' });
    const ringY = gsap.quickTo(ringEl, 'y', { duration: 0.45, ease: 'ax.out' });
    const dotX = gsap.quickTo(dotEl, 'x', { duration: 0.08, ease: 'none' });
    const dotY = gsap.quickTo(dotEl, 'y', { duration: 0.08, ease: 'none' });
    let current: State = 'default';
    let visible = false;
    let lastX = -1, lastY = -1;

    const setState = (next: State, text: string) => {
      if (next === current && labelEl.textContent === text) return;
      current = next;
      r.dataset.state = next;
      labelEl.textContent = text;
      gsap.to(ringEl, { scale: RING_SCALE[next], duration: 0.35, ease: 'ax.out', overwrite: 'auto' });
      gsap.to(dotEl, { scale: next === 'default' ? 1 : 0, duration: 0.2, ease: 'ax.out', overwrite: 'auto' });
    };

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return;
      if (!visible) {
        visible = true;
        html.classList.add('has-cursor');
        gsap.set([ringEl, dotEl], { x: e.clientX, y: e.clientY });
        gsap.to(r, { autoAlpha: 1, duration: 0.2 });
      }
      lastX = e.clientX; lastY = e.clientY;
      ringX(e.clientX); ringY(e.clientY);
      dotX(e.clientX); dotY(e.clientY);
    };
    const inspect = (target: EventTarget | null) => {
      const { state, label: text } = resolve(target);
      setState(state, text);
      r.dataset.tone = toneAt(target);
    };
    const onOver = (e: PointerEvent) => {
      // Pointer events stop at an embedded page; hand over to its native cursor until we get them back.
      if (e.target instanceof HTMLIFrameElement) { onLeave(); return; }
      inspect(e.target);
    };
    // Scrolling moves new content under a still pointer without firing pointerover, so re-check
    // what is under it (at most once per frame) whenever the page scrolls.
    let pending = 0;
    const scrollWatch = ScrollTrigger.create({
      start: 0,
      end: 'max',
      onUpdate: () => {
        if (pending || !visible || lastX < 0) return;
        pending = requestAnimationFrame(() => {
          pending = 0;
          inspect(document.elementFromPoint(lastX, lastY));
        });
      },
    });
    const onLeave = () => {
      visible = false;
      gsap.to(r, { autoAlpha: 0, duration: 0.2 });
    };
    const onDown = () => gsap.to(ringEl, { scale: RING_SCALE[current] * 0.85, duration: 0.12, ease: 'ax.out' });
    const onUp = () => gsap.to(ringEl, { scale: RING_SCALE[current], duration: 0.3, ease: 'ax.out' });
    // Keyboard users get the native cursor and focus rings back.
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Tab') { html.classList.remove('has-cursor'); onLeave(); }
    };

    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerover', onOver, { passive: true });
    window.addEventListener('pointerdown', onDown, { passive: true });
    window.addEventListener('pointerup', onUp, { passive: true });
    window.addEventListener('keydown', onKey);
    document.documentElement.addEventListener('pointerleave', onLeave);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerover', onOver);
      window.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('keydown', onKey);
      document.documentElement.removeEventListener('pointerleave', onLeave);
      scrollWatch.kill();
      cancelAnimationFrame(pending);
      html.classList.remove('has-cursor');
      gsap.killTweensOf([ringEl, dotEl, r]);
    };
  }, []);

  return (
    // `data-tone` picks the colour (see toneAt). The media blend sits on the fixed root because a blend on
    // the children would only mix with this layer's own stacking context.
    <div
      ref={root}
      aria-hidden
      data-state="default"
      data-tone="light"
      className="group pointer-events-none invisible fixed inset-0 opacity-0 data-[tone=media]:mix-blend-difference data-[state=drag]:mix-blend-normal data-[state=view]:mix-blend-normal"
      style={{ zIndex: 'var(--z-cursor)' }}
    >
      <div
        ref={ring}
        className="absolute left-0 top-0 -ml-5 -mt-5 flex size-10 items-center justify-center rounded-full border border-white group-data-[tone=dark]:border-ink transition-[background-color,border-color] duration-200 ease-(--ease-out) group-data-[state=drag]:border-lime/70 group-data-[state=drag]:bg-lime/55 group-data-[state=drag]:backdrop-blur-[2px] group-data-[state=view]:border-lime/70 group-data-[state=view]:bg-lime/55 group-data-[state=view]:backdrop-blur-[2px]"
      >
        <span
          ref={label}
          className="text-[7.5px] font-bold uppercase tracking-[0.04em] text-ink opacity-0 transition-opacity duration-200 group-data-[state=drag]:opacity-100 group-data-[state=view]:opacity-100"
        />
      </div>
      <div ref={dot} className="absolute left-0 top-0 -ml-[3px] -mt-[3px] size-1.5 rounded-full bg-white transition-colors duration-200 group-data-[tone=dark]:bg-ink" />
    </div>
  );
}

export default function Cursor() {
  const fine = useFinePointer();
  const reduce = useReducedMotion();
  return fine && !reduce ? <CursorInner /> : null;
}
