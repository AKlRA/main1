import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import type { HeroScene } from './HeroScene';

export interface HeroCanvasHandle {
  setScroll: (p: number) => void;
}

function webglAvailable() {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    return false;
  }
}

/**
 * Lazy-loads three.js and the hero shader after first paint, renders only while
 * the hero is on screen and the tab is visible, and falls back to nothing when
 * WebGL is unavailable (the hero still reads without it).
 */
const HeroCanvas = forwardRef<HeroCanvasHandle, { className?: string }>(function HeroCanvas({ className }, ref) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const scene = useRef<HeroScene | null>(null);
  const pendingScroll = useRef(0);
  const [ready, setReady] = useState(false);

  useImperativeHandle(ref, () => ({
    setScroll(p) {
      pendingScroll.current = p;
      scene.current?.setScroll(p);
    },
  }));

  useEffect(() => {
    const el = canvas.current;
    if (!el || !webglAvailable()) return;
    let disposed = false;
    let cleanup = () => {};

    const boot = async () => {
      const { HeroScene } = await import('./HeroScene');
      if (disposed) return;
      const coarse = window.matchMedia('(pointer: coarse)').matches;
      const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const instance = new HeroScene(el, {
        lowPower: coarse || window.innerWidth < 768 || (navigator.hardwareConcurrency ?? 8) <= 4,
        still,
      });
      scene.current = instance;
      instance.setScroll(pendingScroll.current);

      let onScreen = true;
      const sync = () => (onScreen && document.visibilityState === 'visible' ? instance.play() : instance.pause());
      const io = new IntersectionObserver(([entry]) => { onScreen = entry.isIntersecting; sync(); });
      io.observe(el);
      const ro = new ResizeObserver(() => instance.resize());
      ro.observe(el);

      const onPointer = (e: PointerEvent) =>
        instance.setPointer((e.clientX / window.innerWidth) * 2 - 1, -((e.clientY / window.innerHeight) * 2 - 1));
      const onTouch = (e: TouchEvent) => {
        const t = e.touches[0];
        if (t) instance.setPointer((t.clientX / window.innerWidth) * 2 - 1, -((t.clientY / window.innerHeight) * 2 - 1));
      };
      const onLost = (e: Event) => { e.preventDefault(); instance.pause(); };
      if (!still) {
        window.addEventListener('pointermove', onPointer, { passive: true });
        window.addEventListener('touchmove', onTouch, { passive: true });
      }
      document.addEventListener('visibilitychange', sync);
      el.addEventListener('webglcontextlost', onLost);
      sync();
      setReady(true);

      cleanup = () => {
        io.disconnect();
        ro.disconnect();
        window.removeEventListener('pointermove', onPointer);
        window.removeEventListener('touchmove', onTouch);
        document.removeEventListener('visibilitychange', sync);
        el.removeEventListener('webglcontextlost', onLost);
        instance.dispose();
        scene.current = null;
      };
    };

    // Phones get the page interactive first; the scene arrives once the main thread is quiet.
    const slow = window.matchMedia('(pointer: coarse)').matches || window.innerWidth < 768;
    const idle = window.requestIdleCallback ?? ((cb: () => void) => window.setTimeout(cb, 1));
    const cancelIdle = window.cancelIdleCallback ?? window.clearTimeout;
    let handle = 0;
    const delay = window.setTimeout(() => { handle = idle(() => void boot(), { timeout: slow ? 4000 : 800 }); }, slow ? 2200 : 0);
    return () => {
      disposed = true;
      window.clearTimeout(delay);
      cancelIdle(handle);
      cleanup();
    };
  }, []);

  return (
    <canvas
      ref={canvas}
      aria-hidden
      className={`${className ?? ''} transition-opacity duration-[1400ms] ease-(--ease-out) ${ready ? 'opacity-100' : 'opacity-0'}`}
    />
  );
});

export default HeroCanvas;
