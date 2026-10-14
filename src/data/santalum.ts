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
