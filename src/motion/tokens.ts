// Shared motion vocabulary. CSS mirrors these as --ease-* / --dur-* in index.css,
// GSAP registers them as named CustomEases in ./gsap.ts. Change values in both places.

export const EASE = {
  /** Entering / exiting elements. */
  out: [0.23, 1, 0.32, 1],
  /** Elements moving or morphing on screen. */
  inOut: [0.77, 0, 0.175, 1],
  /** Drawers and sheets. */
  drawer: [0.32, 0.72, 0, 1],
} as const;

/** Seconds. UI stays under 0.3; reveals/curtains are marketing motion and may run longer. */
export const DUR = {
  press: 0.16,
  ui: 0.24,
  drawer: 0.5,
  reveal: 0.9,
  curtain: 0.7,
} as const;

/** Seconds between items in a group entrance (30-80ms band). */
export const STAGGER = {
  chars: 0.022,
  words: 0.04,
  items: 0.06,
} as const;

/** gsap.matchMedia conditions, shared by every scroll-driven component. */
export const MQ = {
  desktop: '(min-width: 768px) and (prefers-reduced-motion: no-preference)',
  mobile: '(max-width: 767px) and (prefers-reduced-motion: no-preference)',
  reduce: '(prefers-reduced-motion: reduce)',
  finePointer: '(hover: hover) and (pointer: fine)',
} as const;
