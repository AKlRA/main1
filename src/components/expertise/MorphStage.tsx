import { useEffect, useRef, useState } from 'react';
import { ArrowsClockwise } from '@phosphor-icons/react';
import type { MorphScene } from './MorphScene';
import { webglAvailable } from '../../lib/webgl';

const NAMES = ['Sphere', 'Torus knot', 'Double helix', 'Lattice'];

/**
 * The Frontend card's interactive piece. three.js and the scene load only when the card is
 * about to scroll into view, and render only while it is visible.
 */
export default function MorphStage() {
  const stage = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const scene = useRef<MorphScene | null>(null);
  const [shape, setShape] = useState(0);
  const [ready, setReady] = useState(false);
  const [supported] = useState(() => webglAvailable());

  useEffect(() => {
    const el = canvas.current;
    const box = stage.current;
    if (!el || !box || !supported) return;
    let disposed = false;
    let cleanup = () => {};

    const boot = async () => {
      const { MorphScene } = await import('./MorphScene');
      if (disposed) return;
      const instance = new MorphScene(el, {
        lowPower: window.matchMedia('(pointer: coarse)').matches || window.innerWidth < 768,
        still: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
        onShape: setShape,
      });
      scene.current = instance;
      let onScreen = false;
      const sync = () => (onScreen && document.visibilityState === 'visible' ? instance.play() : instance.pause());
      const io = new IntersectionObserver(([e]) => { onScreen = e.isIntersecting; sync(); });
      io.observe(el);
      const ro = new ResizeObserver(() => instance.resize());
      ro.observe(el);
      document.addEventListener('visibilitychange', sync);
      setReady(true);
      cleanup = () => {
        io.disconnect();
        ro.disconnect();
        document.removeEventListener('visibilitychange', sync);
        instance.dispose();
        scene.current = null;
      };
    };

    // Load as the card approaches, not with the page.
    const near = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      near.disconnect();
      void boot();
    }, { rootMargin: '400px 0px' });
    near.observe(box);

    return () => {
      disposed = true;
      near.disconnect();
      cleanup();
    };
  }, [supported]);

  return (
    <div
      ref={stage}
      data-cursor="drag"
      data-cursor-label="Spin"
      className="relative mt-8 min-h-[22rem] flex-1 overflow-hidden rounded-[1.1rem] bg-ink/70 ring-1 ring-white/8 md:min-h-[26rem]"
    >
      <div aria-hidden className="absolute inset-0 bg-[radial-gradient(60%_55%_at_50%_50%,rgba(204,255,0,0.07),transparent_70%)]" />
      {supported ? (
        <canvas
          ref={canvas}
          aria-label={`Interactive particle form: ${NAMES[shape]}. Drag to spin, tap to change form.`}
          role="img"
          className={`absolute inset-0 size-full touch-pan-y transition-opacity duration-1000 ease-(--ease-out) ${ready ? 'opacity-100' : 'opacity-0'}`}
        />
      ) : (
        <p className="absolute inset-0 grid place-items-center p-8 text-center text-sm text-white/55">
          This demo needs WebGL, which this browser has turned off.
        </p>
      )}

      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-4 md:p-5">
        <div>
          <p aria-live="polite" className="font-display text-lg font-semibold tracking-[-0.02em] text-white">{NAMES[shape]}</p>
          <p className="text-xs text-white/50">Drag to spin. Tap to morph.</p>
        </div>
        {supported && (
          <button
            type="button"
            onClick={() => scene.current?.next()}
            className="pressable pointer-events-auto inline-flex min-h-10 shrink-0 items-center gap-2 whitespace-nowrap rounded-full bg-white/[0.07] px-4 text-sm font-medium text-white/85 ring-1 ring-white/12 backdrop-blur-sm transition-colors duration-200 hover:bg-lime hover:text-ink hover:ring-lime"
          >
            <ArrowsClockwise size={15} weight="bold" /> Next form
          </button>
        )}
      </div>
    </div>
  );
}
