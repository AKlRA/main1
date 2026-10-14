import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { ArrowUpRight, HandGrabbing } from '@phosphor-icons/react';
import { projects } from '../../data';
import { DESKTOP, MOBILE, type Artboard, type Box } from '../../data/santalum';
import { gsap, useGSAP } from '../../motion/gsap';
import { useIsMobile, useReducedMotion } from '../../hooks/useMediaQuery';
import { bridgeEmbed } from './embedBridge';
import stillDesktop from '../../assets/santalum-live-desktop.png?w=2800&quality=78&format=webp';
import stillMobile from '../../assets/santalum-live-mobile.png?w=720&quality=80&format=webp';

const WORDS = ['Detail,', 'motion,', 'performance.'];
/** Self-hosted copy (same origin, so the bridge can script it) and the public deployment. */
const EMBED_SRC = '/work/santalum/index.html';
const LIVE_URL = 'https://furnituretemplate-wheat.vercel.app/template%204/';

/** Mosaic geometry, as fractions of the section: tile size at rest and the gutter between tiles. */
const GRID = {
  desktop: { n: 5, f0: 0.2, gap: 0.012 },
  mobile: { n: 3, f0: 0.3, gap: 0.02 },
};

/** Timeline marks (0..1 of the pinned scroll). */
const T = { zoomEnd: 0.62, outlines: [0.06, 0.26], pieces: [0.3, 0.58], full: [0.58, 0.74], live: 0.76 };

/** Interleave categories so neighbouring tiles show different kinds of work. */
function mixedProjects() {
  const byCat = new Map<string, typeof projects>();
  projects.forEach((p) => byCat.set(p.category, [...(byCat.get(p.category) ?? []), p]));
  const lists = [...byCat.values()];
  const out: typeof projects = [];
  for (let i = 0; out.length < projects.length; i++) lists.forEach((l) => l[i] && out.push(l[i]));
  return out;
}

const boxStyle = (b: Box): CSSProperties => ({ left: b.x, top: b.y, width: b.w, height: b.h, borderRadius: b.r });

/**
 * Clip path that shows the live page through its own layout boxes, each wiped left to right in
 * reading order (`pieces` 0..1), then opens from the centre to the whole page (`full` 0..1).
 */
function maskPath(board: Artboard, order: Box[], pieces: number, full: number) {
  const rect = (x: number, y: number, w: number, h: number) => `M${x} ${y}h${w}v${h}h${-w}Z`;
  const step = 0.35;
  const span = (order.length - 1) * step + 1;
  let d = '';
  order.forEach((b, i) => {
    const p = Math.min(1, Math.max(0, pieces * span - i * step));
    if (p <= 0) return;
    const pad = b.k === 'media' ? 18 : 4;
    d += rect(b.x - pad, b.y - pad, (b.w + pad * 2) * p, b.h + pad * 2);
  });
  if (full > 0) {
    const ix = ((1 - full) * board.w) / 2, iy = ((1 - full) * board.h) / 2;
    d += rect(ix, iy, board.w - ix * 2, board.h - iy * 2);
  }
  return d ? `path('${d}')` : 'inset(50%)';
}

function Outline({ b }: { b: Box }) {
  if (b.k === 'text') {
    // Tall text boxes are several display lines: one bar per line.
    const lines = b.h > 160 ? Math.round(b.h / 126) : 1;
    return (
      <div className="wf-box absolute flex flex-col justify-around" style={boxStyle(b)}>
        {Array.from({ length: lines }, (_, i) => (
          <span key={i} className="block h-[52%] max-h-24 w-full rounded-[3px] bg-white/14" style={{ height: `${52 / lines}%` }} />
        ))}
      </div>
    );
  }
  return (
    <div className={`wf-box absolute border ${b.k === 'media' ? 'border-lime/60' : 'border-white/35'}`} style={boxStyle(b)}>
      {b.k === 'media' && (
        <svg aria-hidden className="absolute inset-0 size-full" preserveAspectRatio="none" viewBox="0 0 100 100">
          <path d="M0 0L100 100M100 0L0 100" stroke="rgba(204,255,0,0.35)" strokeWidth="0.6" vectorEffect="non-scaling-stroke" />
        </svg>
      )}
    </div>
  );
}

/**
 * Pinned: a wall of shipped projects; the centre tile is a blueprint of the Santalum Maison template.
 * Scrolling dollies into it (outer tiles fly past with depth) while the blueprint gains outlines
 * (detail), the running page shows through its layout boxes (motion), then opens to the whole page
 * (performance). At the end the embed is live: drag the card deck, open stories, and keep scrolling.
 */
export default function Assemble() {
  const root = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const art = useRef<HTMLDivElement>(null);
  const outline = useRef<HTMLDivElement>(null);
  const reveal = useRef<HTMLDivElement>(null);
  const frame = useRef<HTMLIFrameElement>(null);
  const mobile = useIsMobile();
  const reduce = useReducedMotion();
  const [active, setActive] = useState(-1);
  const [live, setLive] = useState(false);
  const [near, setNear] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const g = mobile ? GRID.mobile : GRID.desktop;
  const board = mobile ? MOBILE : DESKTOP;
  const still = mobile ? stillMobile : stillDesktop;
  const isLive = reduce || live;
  const order = useMemo(() => [...board.boxes].sort((a, b) => a.y - b.y || a.x - b.x), [board]);

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

  // Load the embed when the section comes on screen, or once the page has settled, whichever is first.
  // (It sits right under the hero, so a plain look-ahead margin would load it with the first paint.)
  useEffect(() => {
    const el = root.current;
    if (!el || near) return;
    const io = new IntersectionObserver(([e]) => e.isIntersecting && setNear(true));
    io.observe(el);
    const idle = window.requestIdleCallback ?? ((cb: () => void) => window.setTimeout(cb, 1));
    const cancelIdle = window.cancelIdleCallback ?? window.clearTimeout;
    let handle = 0;
    const settle = () => { handle = idle(() => setNear(true), { timeout: 3000 }); };
    const delay = window.setTimeout(settle, 3500);
    return () => { io.disconnect(); window.clearTimeout(delay); cancelIdle(handle); };
  }, [near]);

  useEffect(() => {
    const f = frame.current;
    if (!loaded || !f) return;
    return bridgeEmbed(f, LIVE_URL);
  }, [loaded]);

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
        const section = root.current!, st = stage.current!, ring = outline.current!, mask = reveal.current!;
        const tileEls = gsap.utils.toArray<HTMLElement>('.as-tile');
        const sMax = 1 / g.f0;
        const proxy = { f: g.f0, pieces: 0, full: 0 };
        let word = -1, wasLive = false;

        const applyZoom = () => {
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
        const applyMask = () => {
          mask.style.clipPath = proxy.full >= 1 ? 'none' : maskPath(board, order, proxy.pieces, proxy.full);
        };

        // At rest the centre tile already reads as a blueprint; "Detail" brings the outlines to full strength.
        gsap.set('.wf-box', { opacity: 0.5 });
        applyZoom();
        applyMask();

        const tl = gsap.timeline({
          defaults: { ease: 'none' },
          scrollTrigger: {
            trigger: section,
            start: 'top top',
            end: mobile ? '+=300%' : '+=380%',
            pin: true,
            scrub: 0.8,
            anticipatePin: 1,
            invalidateOnRefresh: true,
            onRefresh: applyZoom,
          },
          onUpdate() {
            const p = tl.progress();
            const next = p < T.outlines[0] ? -1 : p < T.pieces[0] ? 0 : p < T.full[0] ? 1 : 2;
            if (next !== word) { word = next; setActive(next); }
            const nowLive = p >= T.live;
            if (nowLive !== wasLive) { wasLive = nowLive; setLive(nowLive); }
          },
        });
        const span = (r: number[]) => ({ at: r[0], duration: r[1] - r[0] });
        tl.to(proxy, { f: 1, duration: T.zoomEnd, ease: 'power1.inOut', onUpdate: applyZoom }, 0)
          .to('.wf-box', { opacity: 1, duration: 0.05, stagger: { amount: span(T.outlines).duration - 0.05 } }, T.outlines[0])
          .to(proxy, { pieces: 1, duration: span(T.pieces).duration, onUpdate: applyMask }, T.pieces[0])
          .to(proxy, { full: 1, duration: span(T.full).duration, ease: 'power2.in', onUpdate: applyMask }, T.full[0])
          .to(['.wf-box', '.wf-grid'], { opacity: 0, duration: 0.08 }, T.full[1] - 0.08)
          .to({}, { duration: 1 - T.full[1] });
        return () => {
          // Clear only what GSAP set: 'all' would also wipe the inline size/position React rendered.
          gsap.set([st, ring], { clearProps: 'transform,borderRadius,borderWidth,opacity' });
          mask.style.clipPath = '';
          setLive(false);
          setActive(-1);
        };
      });
      return () => mm.revert();
    },
    { scope: root, dependencies: [mobile, tiles, board, order] },
  );

  return (
    <section
      ref={root}
      data-chrome="light"
      aria-label="From wireframe to finished site: Santalum Maison, running live"
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
          {!reduce && (
            <>
              <div
                className="wf-grid absolute inset-0"
                style={{
                  backgroundImage:
                    'repeating-linear-gradient(to right, rgba(204,255,0,0.16) 0 1px, transparent 1px calc(100% / 12)), repeating-linear-gradient(to bottom, rgba(255,255,255,0.05) 0 1px, transparent 1px 32px)',
                }}
              />
              {board.boxes.map((b, i) => <Outline key={i} b={b} />)}
            </>
          )}

          {/* The running page (a still stands in until it loads), shown through the reveal mask. */}
          <div ref={reveal} className="absolute inset-0" style={reduce ? undefined : { clipPath: 'inset(50%)' }}>
            <img src={still} alt="" className="absolute inset-0 size-full" />
            {near && (
              <iframe
                ref={frame}
                src={EMBED_SRC}
                title="Santalum Maison, a live template built by Axoraa"
                onLoad={() => setLoaded(true)}
                tabIndex={isLive ? 0 : -1}
                className={`absolute inset-0 size-full border-0 transition-opacity duration-500 ${loaded ? 'opacity-100' : 'opacity-0'} ${
                  isLive ? '' : 'pointer-events-none'
                }`}
                style={{ width: board.w, height: board.h }}
              />
            )}
          </div>
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

      {/* Caption: the three words track the build; once live it becomes a hint plus a link out.
          Phones keep it bottom-left, clear of the floating quote button. */}
      <div className="pointer-events-none absolute inset-x-0 bottom-[calc(var(--bezel)+1rem)] flex justify-start px-[calc(var(--bezel)+0.75rem)] max-md:pr-24 md:justify-center">
        {isLive ? (
          <div className="pointer-events-auto flex items-center gap-1 rounded-full bg-ink/85 p-1.5 pl-4 text-sm text-white shadow-[0_10px_30px_-12px_rgba(0,0,0,0.6)] backdrop-blur-md">
            <HandGrabbing size={16} weight="duotone" className="mr-1.5 shrink-0 text-lime" />
            <span className="mr-2 whitespace-nowrap">Live site. Drag the cards.</span>
            <a
              href={LIVE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="pressable inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-lime px-3 py-1.5 font-semibold text-ink"
            >
              Open <ArrowUpRight size={13} weight="bold" />
            </a>
          </div>
        ) : (
          <p aria-hidden className="flex gap-[0.35em] rounded-full bg-ink/75 px-5 py-2.5 font-display text-[clamp(1.05rem,2vw,1.6rem)] font-semibold tracking-[-0.03em] backdrop-blur-md">
            {WORDS.map((w, i) => (
              <span key={w} className={`transition-colors duration-300 ${i === active ? 'text-lime' : i < active ? 'text-white' : 'text-white/35'}`}>
                {w}
              </span>
            ))}
          </p>
        )}
      </div>
    </section>
  );
}
