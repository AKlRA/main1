# Axoraa

Marketing site and portfolio for Axoraa. React 19, Vite 7, Tailwind CSS v4, TypeScript.

```bash
npm install
npm run dev       # http://localhost:5173
npm run build     # type-check + production build
npm run lint
```

Optional: set `VITE_QUOTE_ENDPOINT` (for example a Google Apps Script web-app URL) to store quote
requests. Without it, the quote form hands the request to WhatsApp with the details filled in.

## Structure

| Path | What lives there |
| --- | --- |
| `src/motion/` | Motion system: easing/duration tokens, GSAP setup (named eases `ax.out`, `ax.inOut`, `ax.drawer`), Lenis smooth scroll, intro state |
| `src/components/chrome/` | Site chrome: preloader, bezel frame, cursor, page-transition curtain, floating quote button |
| `src/components/sections/` | Page sections, one file each |
| `src/components/hero/` | The WebGL hero (three.js, loaded on demand) |
| `src/components/ui/` | Shared pieces: split-text reveal, magnetic wrapper, project card/drawer, quote modal |
| `src/data/` | Content: projects, team, pricing, contact details |

## Motion conventions

- **Tokens.** Curves and durations come from `src/motion/tokens.ts`. CSS mirrors them as `--ease-*` in `src/index.css`; GSAP uses the named eases. Don't add new curves inline.
- **Libraries.** GSAP + ScrollTrigger for scroll-driven and timeline work; Framer Motion only for presence and layout (modals, drawer, tab indicator). The two never animate the same element.
- **Responsive motion.** Every scroll animation is built inside `gsap.matchMedia()` with the `MQ` conditions, so desktop, mobile and reduced-motion variants set up and clean up automatically.
- **No React state per frame.** Pointer and scroll effects write transforms through `gsap.quickTo` or refs.
- **Theme flips.** Each section declares `data-chrome="dark" | "light"`; the bezel and nav follow the section under the nav line.
- **Properties.** Animate `transform`, `opacity` and `clip-path`. Gate hover motion behind `(hover: hover) and (pointer: fine)`.
