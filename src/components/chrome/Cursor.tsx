import { useEffect, useRef } from 'react';
import { gsap } from '../../motion/gsap';
import { useFinePointer, useReducedMotion } from '../../hooks/useMediaQuery';

type State = 'default' | 'link' | 'view' | 'drag' | 'hidden';

const RING_SCALE: Record<State, number> = { default: 1, link: 1.7, view: 2.4, drag: 2.4, hidden: 0.6 };

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
      ringX(e.clientX); ringY(e.clientY);
      dotX(e.clientX); dotY(e.clientY);
    };
    const onOver = (e: PointerEvent) => {
      const { state, label: text } = resolve(e.target);
      setState(state, text);
    };
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
      html.classList.remove('has-cursor');
      gsap.killTweensOf([ringEl, dotEl, r]);
    };
  }, []);

  return (
    <div
      ref={root}
      aria-hidden
      data-state="default"
      className="group pointer-events-none invisible fixed inset-0 opacity-0"
      style={{ zIndex: 'var(--z-cursor)' }}
    >
      <div
        ref={ring}
        className="absolute left-0 top-0 -ml-5 -mt-5 flex size-10 items-center justify-center rounded-full border border-white mix-blend-difference transition-[background-color,border-color] duration-200 ease-(--ease-out) group-data-[state=drag]:border-lime group-data-[state=drag]:bg-lime group-data-[state=drag]:mix-blend-normal group-data-[state=view]:border-lime group-data-[state=view]:bg-lime group-data-[state=view]:mix-blend-normal"
      >
        <span
          ref={label}
          className="text-[5px] font-semibold uppercase tracking-[0.08em] text-ink opacity-0 transition-opacity duration-200 group-data-[state=drag]:opacity-100 group-data-[state=view]:opacity-100"
        />
      </div>
      <div ref={dot} className="absolute left-0 top-0 -ml-[3px] -mt-[3px] size-1.5 rounded-full bg-white mix-blend-difference" />
    </div>
  );
}

export default function Cursor() {
  const fine = useFinePointer();
  const reduce = useReducedMotion();
  return fine && !reduce ? <CursorInner /> : null;
}
