import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { ArrowUpRight, HandGrabbing } from '@phosphor-icons/react';
import { projects } from '../../data';
import { DESKTOP, MOBILE, measureBoxes, type Artboard, type Box } from '../../data/santalum';
import { gsap, useGSAP } from '../../motion/gsap';
import { useIsMobile, useReducedMotion } from '../../hooks/useMediaQuery';
import { bridgeEmbed, type EmbedBridge } from './embedBridge';
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

/** Rounded-rectangle subpath (radius clamped so a narrow, mid-wipe piece stays a clean pill). */
function roundRect(x: number, y: number, w: number, h: number, r: number) {
  const k = Math.max(0, Math.min(r, w / 2, h / 2));
  if (k < 0.5) return `M${x} ${y}h${w}v${h}h${-w}Z`;
  return (
    `M${x + k} ${y}h${w - 2 * k}a${k} ${k} 0 0 1 ${k} ${k}v${h - 2 * k}a${k} ${k} 0 0 1 ${-k} ${k}` +
    `h${-(w - 2 * k)}a${k} ${k} 0 0 1 ${-k} ${-k}v${-(h - 2 * k)}a${k} ${k} 0 0 1 ${k} ${-k}Z`
  );
}

interface Rect { x: number; y: number; w: number; h: number }

/** Shapes and the card keep their own outline (no ring of background around them). */
function pieceShape(b: Box) {
  if (b.k === 'media') return { pad: 12, r: (b.r ?? 18) + 12 };
  return { pad: 0, r: b.r ?? 6 };
}
const TEXT_PAD = { x: 12, y: 9 };
const TEXT_RADIUS = 14;

/**
 * Text pieces merge into die-cut shapes: neighbours on one line join into a row, and rows stacked on
 * top of each other join into one outline. Every corner of that outline, inner ones included, is
 * rounded, so stepped stacks read as one soft sticker instead of boxes with square notches.
 */
function textShapes(rects: Rect[]) {
  // 1. Same-line neighbours become one row.
  const rows: Rect[] = [];
  [...rects].sort((a, b) => a.y - b.y || a.x - b.x).forEach((r) => {
    const row = rows.find((o) => Math.abs(o.y + o.h / 2 - (r.y + r.h / 2)) < 6 && r.x <= o.x + o.w + 28 && r.x + r.w >= o.x - 28);
    if (!row) { rows.push({ ...r }); return; }
    const x2 = Math.max(row.x + row.w, r.x + r.w), y2 = Math.max(row.y + row.h, r.y + r.h);
    row.x = Math.min(row.x, r.x); row.y = Math.min(row.y, r.y); row.w = x2 - row.x; row.h = y2 - row.y;
  });
  // 2. Rows that touch vertically and overlap horizontally become one stack.
  const stacks: Rect[][] = [];
  rows.sort((a, b) => a.y - b.y).forEach((r) => {
    const st = stacks.find((s) => {
      const last = s[s.length - 1];
      // Small gaps (tight display leading) still join: the outline bridges them at their midline.
      return r.y <= last.y + last.h + 16 && r.x < last.x + last.w && r.x + r.w > last.x;
    });
    if (st) st.push(r); else stacks.push([r]);
  });
  return stacks.map((s) => roundedPolygon(stackOutline(s), TEXT_RADIUS)).join('');
}

/** Clockwise outline of a top-to-bottom stack of rows, stepping at the middle of each overlap. */
function stackOutline(rows: Rect[]) {
  const cut = rows.slice(0, -1).map((r, i) => (r.y + r.h + rows[i + 1].y) / 2);
  const pts: [number, number][] = [[rows[0].x, rows[0].y], [rows[0].x + rows[0].w, rows[0].y]];
  rows.forEach((r, i) => {
    const bottom = i < cut.length ? cut[i] : r.y + r.h;
    pts.push([r.x + r.w, bottom]);
    if (i < cut.length) pts.push([rows[i + 1].x + rows[i + 1].w, bottom]);
  });
  for (let i = rows.length - 1; i >= 0; i--) {
    const r = rows[i];
    const bottom = i < cut.length ? cut[i] : r.y + r.h;
    const top = i > 0 ? cut[i - 1] : r.y;
    pts.push([r.x, bottom]);
    if (i > 0) pts.push([r.x, top], [rows[i - 1].x, top]);
  }
  // Drop repeated and collinear points (rows with equal edges).
  const out: [number, number][] = [];
  pts.forEach((p) => {
    const a = out[out.length - 1];
    if (a && Math.abs(a[0] - p[0]) < 0.5 && Math.abs(a[1] - p[1]) < 0.5) return;
    out.push(p);
  });
  return out.filter((p, i) => {
    const a = out[(i - 1 + out.length) % out.length], b = out[(i + 1) % out.length];
    return !((Math.abs(a[0] - p[0]) < 0.5 && Math.abs(b[0] - p[0]) < 0.5) || (Math.abs(a[1] - p[1]) < 0.5 && Math.abs(b[1] - p[1]) < 0.5));
  });
}

/** Path through a polygon with every vertex rounded (radius clamped to half of each adjacent edge). */
function roundedPolygon(pts: [number, number][], radius: number) {
  const n = pts.length;
  if (n < 3) return '';
  const f = (v: number) => Math.round(v * 10) / 10;
  let d = '';
  for (let i = 0; i < n; i++) {
    const p = pts[(i - 1 + n) % n], v = pts[i], q = pts[(i + 1) % n];
    const lp = Math.hypot(p[0] - v[0], p[1] - v[1]), lq = Math.hypot(q[0] - v[0], q[1] - v[1]);
    const r = Math.min(radius, lp / 2, lq / 2);
    const a = [v[0] + ((p[0] - v[0]) / lp) * r, v[1] + ((p[1] - v[1]) / lp) * r];
    const b = [v[0] + ((q[0] - v[0]) / lq) * r, v[1] + ((q[1] - v[1]) / lq) * r];
    d += `${i === 0 ? 'M' : 'L'}${f(a[0])} ${f(a[1])}Q${f(v[0])} ${f(v[1])} ${f(b[0])} ${f(b[1])}`;
  }
  return d + 'Z';
}

/**
 * Clip path that shows the live page through its own layout, each piece wiped left to right in
 * reading order (`pieces` 0..1), then opens from the centre to the whole page (`full` 0..1).
 */
function maskPath(board: Artboard, height: number, order: Box[], pieces: number, full: number) {
  const step = 0.35;
  const span = (order.length - 1) * step + 1;
  let d = '';
  const text: Rect[] = [];
  order.forEach((b, i) => {
    const p = Math.min(1, Math.max(0, pieces * span - i * step));
    if (p <= 0) return;
    if (b.k === 'text') {
      text.push({ x: b.x - TEXT_PAD.x, y: b.y - TEXT_PAD.y, w: (b.w + TEXT_PAD.x * 2) * p, h: b.h + TEXT_PAD.y * 2 });
      return;
    }
    const { pad, r } = pieceShape(b);
    d += roundRect(b.x - pad, b.y - pad, (b.w + pad * 2) * p, b.h + pad * 2, r);
  });
  d += textShapes(text.filter((r) => r.w > 1));
  if (full > 0) {
    const ix = ((1 - full) * board.w) / 2, iy = ((1 - full) * height) / 2;
    d += roundRect(ix, iy, board.w - ix * 2, height - iy * 2, 28 * (1 - full));
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
  const bridge = useRef<EmbedBridge | null>(null);
  /** Artboard height in artboard px: the section's height at the width-fit scale. */
  const artH = useRef(DESKTOP.h);
  const mobile = useIsMobile();
  const reduce = useReducedMotion();
  const [active, setActive] = useState(-1);
  const [isLiveNow, setLive] = useState(false);
  const [near, setNear] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const g = mobile ? GRID.mobile : GRID.desktop;
  const saved = mobile ? MOBILE : DESKTOP;
  // Outlines measured from the running embed (exact at any section size); saved ones until it loads.
  const [measured, setMeasured] = useState<Box[] | null>(null);
  const board = useMemo<Artboard>(() => (measured ? { ...saved, boxes: measured } : saved), [saved, measured]);
  const still = mobile ? stillMobile : stillDesktop;
  const isLive = reduce || isLiveNow;
  const order = useMemo(() => [...board.boxes].sort((a, b) => a.y - b.y || a.x - b.x), [board]);
  // The scroll timeline is built once; it reads the current outlines through these refs, so a
  // re-measure never rebuilds it (a rebuild would drop the live state mid-interaction).
  const live = useRef({ board, order, paint: () => {} });
  useEffect(() => {
    live.current.board = board;
    live.current.order = order;
    live.current.paint();
  }, [board, order]);

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

  // The embed scrolls through its first two screens; beyond that, scrolling continues this page.
  useEffect(() => {
    const f = frame.current;
    if (!loaded || !f) return;
    const b = bridgeEmbed(f, LIVE_URL, 2);
    bridge.current = b;
    // Measure once the template's intro has fanned the deck out, and again whenever the frame resizes.
    const win = f.contentWindow!;
    let timer = 0;
    const measure = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        const doc = f.contentDocument;
        if (doc && win.scrollY < 1) setMeasured(measureBoxes(doc));
      }, 1200);
    };
    measure();
    win.addEventListener('resize', measure);
    return () => {
      window.clearTimeout(timer);
      win.removeEventListener('resize', measure);
      b.dispose();
      bridge.current = null;
    };
  }, [loaded]);

  // Leaving the live state (scrolling back up into the zoom) puts the embed back on its first screen.
  useEffect(() => {
    if (!isLive) bridge.current?.reset();
  }, [isLive]);

  // Fit the artboard to the stage width; its height follows the stage, so the embed lays out at the
  // section's real proportions and nothing is cropped at the sides. Measured on resize, never per frame.
  useEffect(() => {
    const el = stage.current, a = art.current;
    if (!el || !a) return;
    const fit = () => {
      const W = el.offsetWidth, H = el.offsetHeight;
      const s = W / board.w;
      artH.current = H / s;
      a.style.height = `${artH.current}px`;
      a.style.transform = `scale(${s})`;
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
        const proxy = { f: g.f0, outlines: 0, pieces: 0, full: 0, fade: 0 };
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
        // Outlines and mask are painted from the current boxes on every update (and after a re-measure).
        const paint = () => {
          const { board: bd, order: od } = live.current;
          mask.style.clipPath = proxy.full >= 1 ? 'none' : maskPath(bd, artH.current, od, proxy.pieces, proxy.full);
          // At rest the tile already reads as a blueprint (0.5); "Detail" staggers the outlines to full.
          // Each outline then fades out as its own piece of the live page is revealed.
          const els = section.querySelectorAll<HTMLElement>('.wf-box');
          const step = 0.6, spanN = Math.max(1, (els.length - 1) * step + 1);
          const pStep = 0.35, pSpan = (od.length - 1) * pStep + 1;
          els.forEach((el, i) => {
            const p = Math.min(1, Math.max(0, proxy.outlines * spanN - i * step));
            const j = od.indexOf(bd.boxes[i]);
            const shown = j < 0 ? 0 : Math.min(1, Math.max(0, proxy.pieces * pSpan - j * pStep));
            el.style.opacity = String((0.5 + 0.5 * p) * (1 - shown) * (1 - proxy.fade));
          });
          const grid = section.querySelector<HTMLElement>('.wf-grid');
          if (grid) grid.style.opacity = String(1 - proxy.fade);
        };
        live.current.paint = paint;
        applyZoom();
        paint();

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
          .to(proxy, { outlines: 1, duration: span(T.outlines).duration, onUpdate: paint }, T.outlines[0])
          .to(proxy, { pieces: 1, duration: span(T.pieces).duration, onUpdate: paint }, T.pieces[0])
          .to(proxy, { full: 1, duration: span(T.full).duration, ease: 'power2.in', onUpdate: paint }, T.full[0])
          .to(proxy, { fade: 1, duration: 0.08, onUpdate: paint }, T.full[1] - 0.08)
          .to({}, { duration: 1 - T.full[1] });
        return () => {
          // Clear only what GSAP set: 'all' would also wipe the inline size/position React rendered.
          gsap.set([st, ring], { clearProps: 'transform,borderRadius,borderWidth,opacity' });
          mask.style.clipPath = '';
          live.current.paint = () => {};
          setLive(false);
          setActive(-1);
        };
      });
      return () => mm.revert();
    },
    { scope: root, dependencies: [mobile, tiles] },
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
            <img src={still} alt="" className="absolute inset-0 size-full object-cover object-top" />
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
                style={{ width: board.w }}
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
            <span className="mr-2 whitespace-nowrap">
              Live site.<span className="max-md:hidden"> Drag the cards, scroll inside.</span>
            </span>
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
