// Layout boxes from the first screen of the Santalum Maison template (public/work/santalum),
// measured from the live build at the artboard size the embed renders at, so the wireframe
// lines up exactly with the running page.

export type BoxKind = 'text' | 'media' | 'shape';
export interface Box { k: BoxKind; x: number; y: number; w: number; h: number; r?: number }
export interface Artboard { w: number; h: number; boxes: Box[] }

export const DESKTOP: Artboard = {
  w: 1400,
  h: 820,
  boxes: [
    { k: 'shape', x: 48, y: 17, w: 38, h: 38, r: 6 },
    { k: 'text', x: 98, y: 25, w: 132, h: 20 },
    { k: 'shape', x: 489, y: 14, w: 423, h: 43, r: 22 },
    { k: 'text', x: 493, y: 19, w: 76, h: 34, r: 17 },
    { k: 'text', x: 573, y: 19, w: 98, h: 34, r: 17 },
    { k: 'text', x: 674, y: 19, w: 79, h: 34, r: 17 },
    { k: 'text', x: 756, y: 19, w: 61, h: 34, r: 17 },
    { k: 'text', x: 820, y: 19, w: 87, h: 34, r: 17 },
    { k: 'shape', x: 1269, y: 17, w: 38, h: 38, r: 19 },
    { k: 'shape', x: 1314, y: 17, w: 38, h: 38, r: 19 },
    { k: 'text', x: 48, y: 182, w: 400, h: 253 },
    { k: 'text', x: 48, y: 441, w: 366, h: 126 },
    { k: 'shape', x: 48, y: 605, w: 166, h: 41, r: 21 },
    { k: 'media', x: 539, y: 203, w: 321, h: 421, r: 18 },
    { k: 'text', x: 1111, y: 256, w: 242, h: 59 },
    { k: 'text', x: 1191, y: 320, w: 161, h: 59 },
    { k: 'text', x: 1029, y: 383, w: 323, h: 59 },
    { k: 'text', x: 1200, y: 446, w: 153, h: 59 },
    { k: 'text', x: 1156, y: 510, w: 196, h: 59 },
    { k: 'text', x: 48, y: 757, w: 324, h: 18 },
    { k: 'text', x: 48, y: 778, w: 113, h: 24 },
    { k: 'text', x: 177, y: 778, w: 93, h: 24 },
    { k: 'text', x: 285, y: 778, w: 86, h: 24 },
    { k: 'text', x: 1158, y: 776, w: 42, h: 21 },
    { k: 'shape', x: 1213, y: 771, w: 30, h: 30, r: 15 },
    { k: 'shape', x: 1250, y: 771, w: 30, h: 30, r: 15 },
    { k: 'shape', x: 1286, y: 771, w: 30, h: 30, r: 15 },
    { k: 'shape', x: 1322, y: 771, w: 30, h: 30, r: 15 },
  ],
};

export const MOBILE: Artboard = {
  w: 360,
  h: 780,
  boxes: [
    { k: 'shape', x: 16, y: 14, w: 38, h: 38, r: 6 },
    { k: 'shape', x: 227, y: 14, w: 38, h: 38, r: 19 },
    { k: 'shape', x: 273, y: 14, w: 71, h: 39, r: 19 },
    { k: 'text', x: 16, y: 75, w: 314, h: 72 },
    { k: 'text', x: 16, y: 150, w: 207, h: 72 },
    { k: 'shape', x: 16, y: 244, w: 166, h: 41, r: 21 },
    { k: 'media', x: 43, y: 342, w: 273, h: 358, r: 18 },
    { k: 'shape', x: 138, y: 709, w: 38, h: 38, r: 19 },
    { k: 'shape', x: 184, y: 709, w: 38, h: 38, r: 19 },
    { k: 'text', x: 16, y: 760, w: 125, h: 30 },
    { k: 'text', x: 154, y: 760, w: 83, h: 30 },
    { k: 'text', x: 250, y: 760, w: 167, h: 30 },
  ],
};
/** What the wireframe outlines: the same selectors the saved boxes above were measured from. */
const MEASURE: [string, BoxKind][] = [
  ['.logo__mark', 'shape'], ['.logo__date', 'text'], ['.pillnav', 'shape'], ['.pillnav a', 'text'],
  ['.top__tools > *', 'shape'], ['.hero h1 .ln > span', 'text'], ['.hero__title .honey-btn', 'shape'],
  ['.card.is-top', 'media'], ['.deck__ctrl > *', 'shape'], ['[data-topics] button', 'text'],
  ['.infocus small', 'text'], ['.infocus a', 'text'], ['.joinus small', 'text'], ['.joinus a', 'shape'],
];

/** Measure the running template's first screen, in its own viewport px (= artboard px).
 *  Text is measured line by line, tight to the glyph run, so reveal shapes hug the words. */
export function measureBoxes(doc: Document): Box[] {
  const win = doc.defaultView!;
  const W = win.innerWidth, H = win.innerHeight;
  const boxes: Box[] = [];
  const push = (k: BoxKind, r: { left: number; top: number; width: number; height: number }, rad = 0) => {
    const y = r.top + win.scrollY;
    if (r.width < 2 || r.height < 2 || y + r.height <= 0 || y >= H || r.left + r.width <= 0 || r.left >= W) return;
    boxes.push({ k, x: Math.round(r.left), y: Math.round(y), w: Math.round(r.width), h: Math.round(r.height), ...(rad ? { r: Math.round(rad) } : {}) });
  };
  for (const [sel, k] of MEASURE) {
    doc.querySelectorAll(sel).forEach((el) => {
      const cs = win.getComputedStyle(el);
      if (cs.visibility === 'hidden' || cs.display === 'none') return;
      if (k !== 'text') {
        const r = el.getBoundingClientRect();
        push(k, r, Math.min(parseFloat(cs.borderTopLeftRadius) || 0, r.height / 2));
        return;
      }
      // Ink box: line boxes span the font's whole ascent/descent, far taller than capitals.
      // Trim each line to the glyphs' measured extent (canvas text metrics, same font).
      const ctx = doc.createElement('canvas').getContext('2d');
      let trimTop = 0, trimBottom = 0;
      if (ctx) {
        ctx.font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
        const raw = el.textContent ?? '';
        const m = ctx.measureText(cs.textTransform === 'uppercase' ? raw.toUpperCase() : raw);
        if (m.fontBoundingBoxAscent) {
          trimTop = Math.max(0, m.fontBoundingBoxAscent - m.actualBoundingBoxAscent);
          trimBottom = Math.max(0, m.fontBoundingBoxDescent - m.actualBoundingBoxDescent);
        }
      }
      // One box per rendered line: merge the range's fragments that share a line.
      const range = doc.createRange();
      range.selectNodeContents(el);
      const lines: { left: number; top: number; right: number; bottom: number }[] = [];
      for (const f of Array.from(range.getClientRects())) {
        if (f.width < 1) continue;
        const line = lines.find((l) => Math.abs(l.top - f.top) < 4);
        if (line) { line.left = Math.min(line.left, f.left); line.right = Math.max(line.right, f.right); line.bottom = Math.max(line.bottom, f.bottom); }
        else lines.push({ left: f.left, top: f.top, right: f.right, bottom: f.bottom });
      }
      lines.forEach((l) => {
        const h = l.bottom - l.top;
        const t = Math.min(trimTop, h * 0.45), b = Math.min(trimBottom, h * 0.45);
        push('text', { left: l.left, top: l.top + t, width: l.right - l.left, height: h - t - b });
      });
    });
  }
  return boxes;
}
