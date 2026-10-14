import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { projects } from '../../data';
import { DESKTOP, MOBILE, type Artboard, type Box } from '../../data/santalum';
import { gsap, useGSAP } from '../../motion/gsap';
import { useIsMobile, useReducedMotion } from '../../hooks/useMediaQuery';
import finalDesktop from '../../assets/santalum-desktop.png?w=2832&quality=78&format=webp';
import finalMobile from '../../assets/santalum-mobile.png?w=748&quality=80&format=webp';

const WORDS = ['Detail,', 'motion,', 'performance.'];

/** Mosaic geometry, as fractions of the section: tile size at rest and the gutter between tiles. */
const GRID = {
  desktop: { n: 5, f0: 0.2, gap: 0.012 },
  mobile: { n: 3, f0: 0.3, gap: 0.02 },
};

/** Interleave categories so neighbouring tiles show different kinds of work. */
function mixedProjects() {
  const byCat = new Map<string, typeof projects>();
  projects.forEach((p) => byCat.set(p.category, [...(byCat.get(p.category) ?? []), p]));
  const lists = [...byCat.values()];
  const out: typeof projects = [];
  for (let i = 0; out.length < projects.length; i++) lists.forEach((l) => l[i] && out.push(l[i]));
  return out;
}

const box = (b: Box): CSSProperties => ({ left: b.x, top: b.y, width: b.w, height: b.h, borderRadius: b.r });

/** The template's first screen as layers: grid, outlines, filled content, finished screenshot. */
function ArtboardLayers({ board, src }: { board: Artboard; src: string }) {
  const crop = (b: Box): CSSProperties => ({
    ...box(b),
    backgroundImage: `url(${src})`,
    backgroundSize: `${board.w}px ${board.h}px`,
    backgroundPosition: `${-b.x}px ${-b.y}px`,
  });
  return (
    <>
      <div
        className="wf-grid absolute inset-0"
        style={{
          backgroundImage:
            'repeating-linear-gradient(to right, rgba(204,255,0,0.16) 0 1px, transparent 1px calc(100% / 12)), repeating-linear-gradient(to bottom, rgba(255,255,255,0.05) 0 1px, transparent 1px 32px)',
        }}
      />
      {board.boxes.map((b, i) =>
        b.k === 'text' ? (
          <div key={i} className="wf-box absolute flex items-center" style={box(b)}>
            <span className="block h-[56%] w-full rounded-[3px] bg-white/14" />
          </div>
        ) : (
          <div
            key={i}
            className={`wf-box absolute ${
              b.k === 'ghost' ? 'border border-dashed border-white/15' : b.k === 'media' ? 'border border-lime/55' : 'border border-white/35'
            } ${b.k === 'icon' ? 'rounded-full' : ''}`}
            style={box(b)}
          >
            {b.k === 'media' && (
              <svg aria-hidden className="absolute inset-0 size-full" preserveAspectRatio="none" viewBox="0 0 100 100">
                <path d="M0 0L100 100M100 0L0 100" stroke="rgba(204,255,0,0.35)" strokeWidth="0.6" vectorEffect="non-scaling-stroke" />
              </svg>
            )}
          </div>
        ),
      )}
      {board.boxes
        .filter((b) => b.k !== 'ghost')
        .map((b, i) => (
          <div key={i} className="wf-fill absolute bg-no-repeat" style={crop(b)} />
        ))}
      <div
        className="wf-final absolute inset-0 bg-no-repeat"
        style={{ backgroundImage: `url(${src})`, backgroundSize: '100% 100%' }}
      />
    </>
  );
}

/**
 * Pinned: a wall of shipped projects; the centre tile is a bare wireframe. Scrolling dollies into it
 * (outer tiles fly past with depth), and as it fills the screen the wireframe assembles into the
 * finished Santalum Maison site: outlines (detail), content (motion), final render (performance).
 */
export default function Assemble() {
  const root = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const art = useRef<HTMLDivElement>(null);
  const outline = useRef<HTMLDivElement>(null);
  const mobile = useIsMobile();
  const reduce = useReducedMotion();
  const [active, setActive] = useState(reduce ? 2 : -1);
  const g = mobile ? GRID.mobile : GRID.desktop;
  const board = mobile ? MOBILE : DESKTOP;
  const src = mobile ? finalMobile : finalDesktop;

  const tiles = useMemo(() => {
    const pool = mixedProjects();
    const c = (g.n - 1) / 2;
    const out: { key: string; image: string; srcSet: string; ox: number; oy: number; ring: number }[] = [];
    let k = 0;
    for (let row = 0; row < g.n; row++)
      for (let col = 0; col < g.n; col++) {
        if (row === c && col === c) continue;
        const p = pool[k++ % pool.length];
        out.push({
          key: `${row}-${col}`,
          image: p.image,
          srcSet: p.srcSet,
          ox: (col - c) * (g.f0 + g.gap),
          oy: (row - c) * (g.f0 + g.gap),
          ring: Math.max(Math.abs(col - c), Math.abs(row - c)),
        });
      }
    return out;
  }, [g]);

  // Fit the artboard to the stage (cover, anchored top-centre). Measured on resize, never per frame.
  useEffect(() => {
    const el = stage.current, a = art.current;
    if (!el || !a) return;
    const fit = () => {
      const W = el.offsetWidth, H = el.offsetHeight;
      const s = Math.max(W / board.w, H / board.h);
      a.style.transform = `translate(${(W - board.w * s) / 2}px, 0px) scale(${s})`;
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, [board]);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        const section = root.current!, st = stage.current!, ring = outline.current!;
        const tileEls = gsap.utils.toArray<HTMLElement>('.as-tile');
        const sMax = 1 / g.f0;
        const proxy = { f: g.f0 };
        let word = -1;

        const apply = () => {
          const W = section.offsetWidth, H = section.offsetHeight;
          const f = proxy.f, s = f / g.f0, t = (s - 1) / (sMax - 1);
          const radius = (1 - t) * (mobile ? 14 : 18);
          gsap.set(st, { scale: f, borderRadius: radius / f });
          // The lime frame marks the tile being built; scaled with it, its border is counter-scaled to stay 1.5px.
          gsap.set(ring, { scale: s, borderWidth: 1.5 / s, borderRadius: radius / s, opacity: 1 - Math.min(1, t * 2.5) });
          tileEls.forEach((el, i) => {
            const tile = tiles[i];
            const k = 1 + 0.14 * tile.ring * (s - 1);
            gsap.set(el, { x: tile.ox * W * (s * k - 1), y: tile.oy * H * (s * k - 1), scale: s, opacity: 0.6 * (1 - Math.min(1, t * 1.3)) });
          });
        };

        // At rest the centre tile already reads as a blueprint; "Detail" brings the outlines to full strength.
        gsap.set('.wf-box', { opacity: 0.5 });
        gsap.set('.wf-fill', { clipPath: 'inset(0% 100% 0% 0%)' });
        gsap.set('.wf-final', { opacity: 0 });
        apply();

        const tl = gsap.timeline({
          defaults: { ease: 'none' },
          scrollTrigger: {
            trigger: section,
            start: 'top top',
            end: mobile ? '+=230%' : '+=300%',
            pin: true,
            scrub: 0.8,
            anticipatePin: 1,
            invalidateOnRefresh: true,
            onRefresh: apply,
          },
          onUpdate() {
            const p = tl.progress();
            const next = p < 0.06 ? -1 : p < 0.3 ? 0 : p < 0.58 ? 1 : 2;
            if (next !== word) { word = next; setActive(next); }
          },
        });
        tl.to(proxy, { f: 1, duration: 0.62, ease: 'power1.inOut', onUpdate: apply }, 0)
          .to('.wf-box', { opacity: 1, duration: 0.05, stagger: { amount: 0.2, from: 'start' } }, 0.06)
          .to('.wf-fill', { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.07, stagger: { amount: 0.22 } }, 0.32)
          .to('.wf-final', { opacity: 1, duration: 0.16 }, 0.62)
          .to(['.wf-box', '.wf-grid'], { opacity: 0, duration: 0.1 }, 0.68)
          .to({}, { duration: 0.14 });
        // Clear only what GSAP set: 'all' would also wipe the inline size/position React rendered.
        return () => { gsap.set([st, ring], { clearProps: 'transform,borderRadius,borderWidth,opacity' }); };
      });
      return () => mm.revert();
    },
    { scope: root, dependencies: [mobile, tiles] },
  );

  return (
    <section
      ref={root}
      data-chrome="light"
      aria-label="From wireframe to finished site: Santalum Maison"
      className="relative h-[100svh] overflow-hidden bg-ink"
    >
      {!reduce && (
        <div aria-hidden className="absolute inset-0">
          {tiles.map((t) => (
            <div
              key={t.key}
              className="as-tile absolute overflow-hidden rounded-[10px] bg-white/5 will-change-transform"
              style={{
                width: `${g.f0 * 100}%`,
                height: `${g.f0 * 100}%`,
                left: `${(0.5 + t.ox - g.f0 / 2) * 100}%`,
                top: `${(0.5 + t.oy - g.f0 / 2) * 100}%`,
              }}
            >
              <img src={t.image} srcSet={t.srcSet} sizes={`${Math.round(g.f0 * 100)}vw`} alt="" loading="lazy" decoding="async" className="size-full object-cover object-top" />
            </div>
          ))}
        </div>
      )}

      <div
        ref={stage}
        className="absolute inset-0 overflow-hidden bg-ink"
        style={reduce ? undefined : { transform: `scale(${g.f0})`, borderRadius: 90 }}
      >
        <div ref={art} className="absolute left-0 top-0 origin-top-left" style={{ width: board.w, height: board.h }}>
          <ArtboardLayers board={board} src={src} />
        </div>
      </div>

      {!reduce && (
        <div
          ref={outline}
          aria-hidden
          className="pointer-events-none absolute border-lime/80"
          style={{
            width: `${g.f0 * 100}%`,
            height: `${g.f0 * 100}%`,
            left: `${(0.5 - g.f0 / 2) * 100}%`,
            top: `${(0.5 - g.f0 / 2) * 100}%`,
            borderStyle: 'solid',
            borderWidth: 1.5,
            borderRadius: mobile ? 14 : 18,
          }}
        />
      )}

      {/* Phones: the caption sits under the nav so it never meets the floating quote button. */}
      <p
        aria-hidden
        className="pointer-events-none absolute inset-x-0 flex justify-center max-md:top-[calc(var(--bezel)+4.75rem)] md:bottom-[calc(var(--bezel)+1.25rem)]"
      >
        <span className="flex gap-[0.35em] rounded-full bg-ink/75 px-5 py-2.5 font-display text-[clamp(1.1rem,2vw,1.6rem)] font-semibold tracking-[-0.03em] backdrop-blur-md">
          {WORDS.map((w, i) => (
            <span key={w} className={`transition-colors duration-300 ${i === active ? 'text-lime' : i < active ? 'text-white' : 'text-white/35'}`}>
              {w}
            </span>
          ))}
        </span>
      </p>
    </section>
  );
}
