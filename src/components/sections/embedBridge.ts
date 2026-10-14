export interface EmbedBridge {
  /** Return the embed to its first screen (used when the visitor scrolls back out of it). */
  reset: () => void;
  dispose: () => void;
}

/**
 * Glue for a same-origin embedded page (the template in public/work/santalum):
 * - the embed scrolls itself, but only through its first `screens` screens (smoothed, wheel and
 *   touch alike); beyond that, or above its top, input continues the host page's scroll (through
 *   Lenis when it is running), so the host's scroll story never gets stuck inside the frame;
 * - the embed's own scroll areas (story reader, rails) still take input while they can move;
 * - in-page links scroll the embed when their target is within reach, otherwise they (and any
 *   outbound link) open the full live site in a new tab.
 */
export function bridgeEmbed(frame: HTMLIFrameElement, liveUrl: string, screens = 2): EmbedBridge {
  const win = frame.contentWindow;
  const doc = frame.contentDocument;
  if (!win || !doc) return { reset: () => {}, dispose: () => {} };

  // The document is never scrolled by the browser itself; we drive it below.
  const lock = doc.createElement('style');
  lock.textContent = 'html, body { overflow: hidden !important; overscroll-behavior: none; scroll-behavior: auto !important; }';
  doc.head.appendChild(lock);

  const max = () => Math.max(0, Math.min(doc.documentElement.scrollHeight, win.innerHeight * screens) - win.innerHeight);

  // Smoothed scroll of the embed: input moves a target, a short rAF loop eases toward it.
  let target = win.scrollY;
  let raf = 0;
  const tick = () => {
    const y = win.scrollY;
    const next = y + (target - y) * 0.16;
    win.scrollTo(0, Math.abs(target - next) < 0.5 ? target : next);
    raf = Math.abs(target - win.scrollY) < 0.5 ? 0 : requestAnimationFrame(tick);
  };
  const scrollEmbed = (dy: number) => {
    target = Math.min(max(), Math.max(0, target + dy));
    if (!raf) raf = requestAnimationFrame(tick);
  };
  /** Can the embed itself still move in this direction? */
  const embedTakes = (dy: number) => (dy > 0 ? target < max() - 0.5 : target > 0.5);

  // Elements come from the frame's realm, so `instanceof Element` would fail; check by shape.
  const asEl = (t: EventTarget | null) => (t && 'closest' in (t as object) ? (t as Element) : null);
  const innerScroller = (t: EventTarget | null, dx: number, dy: number) => {
    for (let el = asEl(t); el && el !== doc.body && el !== doc.documentElement; el = el.parentElement) {
      const cs = win.getComputedStyle(el);
      if (Math.abs(dy) >= Math.abs(dx)) {
        if (!/(auto|scroll)/.test(cs.overflowY) || el.scrollHeight <= el.clientHeight + 1) continue;
        if (dy > 0 ? el.scrollTop + el.clientHeight < el.scrollHeight - 1 : el.scrollTop > 0) return true;
      } else {
        if (!/(auto|scroll)/.test(cs.overflowX) || el.scrollWidth <= el.clientWidth + 1) continue;
        if (dx > 0 ? el.scrollLeft + el.clientWidth < el.scrollWidth - 1 : el.scrollLeft > 0) return true;
      }
    }
    return false;
  };

  const toHost = (dx: number, dy: number, mode: number) => {
    if (document.documentElement.classList.contains('lenis')) {
      window.dispatchEvent(new WheelEvent('wheel', { deltaX: dx, deltaY: dy, deltaMode: mode, bubbles: true, cancelable: true }));
    } else {
      window.scrollBy(0, mode === 1 ? dy * 16 : dy);
    }
  };

  const onWheel = (e: WheelEvent) => {
    if (innerScroller(e.target, e.deltaX, e.deltaY)) return;
    e.preventDefault();
    const dy = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY;
    if (Math.abs(dy) > Math.abs(e.deltaX) && embedTakes(dy)) scrollEmbed(dy);
    else toHost(e.deltaX, e.deltaY, e.deltaMode);
  };

  // Touch: vertical swipes scroll the embed while it can move; otherwise the browser chains the
  // gesture to the host page natively (the frame's document is not scrollable).
  let lastY = 0, lastX = 0, axis: 'x' | 'y' | null = null;
  const onTouchStart = (e: TouchEvent) => {
    lastY = e.touches[0].clientY;
    lastX = e.touches[0].clientX;
    axis = null;
  };
  const onTouchMove = (e: TouchEvent) => {
    const t = e.touches[0];
    const dy = lastY - t.clientY, dx = lastX - t.clientX;
    axis ??= Math.abs(dy) > Math.abs(dx) ? 'y' : 'x';
    lastY = t.clientY;
    lastX = t.clientX;
    if (axis !== 'y' || innerScroller(e.target, dx, dy) || !embedTakes(dy)) return;
    e.preventDefault();
    target = Math.min(max(), Math.max(0, target + dy));
    win.scrollTo(0, target);
  };

  const onClick = (e: MouseEvent) => {
    if (e.defaultPrevented) return;
    const a = asEl(e.target)?.closest<HTMLAnchorElement>('a[href]');
    if (!a || a.hasAttribute('data-open')) return; // story links open the template's own reader
    const href = a.getAttribute('href') ?? '';
    e.preventDefault();
    if (href === '#') return;
    if (href === '#top') { scrollEmbed(-target); return; }
    if (href.startsWith('#')) {
      const el = doc.getElementById(href.slice(1));
      const y = el ? el.getBoundingClientRect().top + win.scrollY : Infinity;
      if (y <= max() + 1) { scrollEmbed(y - target); return; }
    }
    window.open(href.startsWith('#') ? liveUrl + href : a.href, '_blank', 'noopener,noreferrer');
  };

  doc.addEventListener('wheel', onWheel, { passive: false });
  doc.addEventListener('touchstart', onTouchStart, { passive: true });
  doc.addEventListener('touchmove', onTouchMove, { passive: false });
  doc.addEventListener('click', onClick);
  return {
    reset() {
      cancelAnimationFrame(raf);
      raf = 0;
      target = 0;
      win.scrollTo(0, 0);
    },
    dispose() {
      cancelAnimationFrame(raf);
      doc.removeEventListener('wheel', onWheel);
      doc.removeEventListener('touchstart', onTouchStart);
      doc.removeEventListener('touchmove', onTouchMove);
      doc.removeEventListener('click', onClick);
      lock.remove();
    },
  };
}
