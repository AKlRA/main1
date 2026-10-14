/**
 * Glue for a same-origin embedded page (the template in public/work/santalum):
 * - the embed stays on its first screen (its own document never scrolls);
 * - wheel input continues the host page's scroll, through Lenis when it is running, unless the
 *   pointer is over one of the embed's own scroll areas that can still move that way;
 * - links that would leave the first screen open the full live site in a new tab instead.
 * Touch needs no bridging: a non-scrollable frame chains vertical swipes to the host natively.
 */
export function bridgeEmbed(frame: HTMLIFrameElement, liveUrl: string): () => void {
  const win = frame.contentWindow;
  const doc = frame.contentDocument;
  if (!win || !doc) return () => {};

  const lock = doc.createElement('style');
  lock.textContent = 'html, body { overflow: hidden !important; overscroll-behavior: none; }';
  doc.head.appendChild(lock);

  // Elements come from the frame's realm, so `instanceof Element` would fail; check by shape.
  const asEl = (t: EventTarget | null) => (t && 'closest' in (t as object) ? (t as Element) : null);

  const canScroll = (el: Element, dx: number, dy: number) => {
    const cs = win.getComputedStyle(el);
    if (Math.abs(dy) >= Math.abs(dx)) {
      if (!/(auto|scroll)/.test(cs.overflowY) || el.scrollHeight <= el.clientHeight + 1) return false;
      return dy > 0 ? el.scrollTop + el.clientHeight < el.scrollHeight - 1 : el.scrollTop > 0;
    }
    if (!/(auto|scroll)/.test(cs.overflowX) || el.scrollWidth <= el.clientWidth + 1) return false;
    return dx > 0 ? el.scrollLeft + el.clientWidth < el.scrollWidth - 1 : el.scrollLeft > 0;
  };

  const onWheel = (e: WheelEvent) => {
    for (let el = asEl(e.target); el && el !== doc.body && el !== doc.documentElement; el = el.parentElement) {
      if (canScroll(el, e.deltaX, e.deltaY)) return;
    }
    e.preventDefault();
    if (document.documentElement.classList.contains('lenis')) {
      window.dispatchEvent(
        new WheelEvent('wheel', { deltaX: e.deltaX, deltaY: e.deltaY, deltaMode: e.deltaMode, bubbles: true, cancelable: true }),
      );
    } else {
      window.scrollBy(0, e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY);
    }
  };

  const onClick = (e: MouseEvent) => {
    if (e.defaultPrevented) return;
    const a = asEl(e.target)?.closest<HTMLAnchorElement>('a[href]');
    if (!a || a.hasAttribute('data-open')) return; // story links open the template's own reader
    const href = a.getAttribute('href') ?? '';
    e.preventDefault();
    if (href === '#' || href === '#top') return;
    window.open(href.startsWith('#') ? liveUrl + href : a.href, '_blank', 'noopener,noreferrer');
  };

  doc.addEventListener('wheel', onWheel, { passive: false });
  doc.addEventListener('click', onClick);
  return () => {
    doc.removeEventListener('wheel', onWheel);
    doc.removeEventListener('click', onClick);
    lock.remove();
  };
}
