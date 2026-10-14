import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { ArrowUpRight } from '@phosphor-icons/react';
import { gsap, ScrollTrigger, useGSAP } from '../../motion/gsap';
import { useScrollApi } from '../../motion/scrollContext';
import { CONTACT, openQuote } from '../../data/contact';
import TransitionLink from '../chrome/TransitionLink';
import Magnetic from '../ui/Magnetic';

const LEFT = [
  { label: 'Work', to: '/#work' },
  { label: 'Process', to: '/#process' },
];
const RIGHT = [{ label: 'Collective', to: '/team' }];
const MENU = [
  { label: 'Work', to: '/#work' },
  { label: 'Process', to: '/#process' },
  { label: 'Expertise', to: '/#expertise' },
  { label: 'Collective', to: '/team' },
];

/** The curved shoulders that join the notch to the top bezel. */
function Shoulder({ side }: { side: 'left' | 'right' }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 50 50"
      className={`absolute top-0 hidden size-12 text-(--chrome) transition-colors duration-500 ease-(--ease-out) md:block ${
        side === 'left' ? '-left-12 rotate-180' : '-right-12 rotate-90'
      }`}
    >
      <path d="M0 0C0 37.3 9 50 50 50H0V0Z" fill="currentColor" />
    </svg>
  );
}

export default function Navbar() {
  const nav = useRef<HTMLElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  const menuTl = useRef<gsap.core.Timeline | null>(null);
  const { pathname } = useLocation();
  // The menu belongs to the route it was opened on, so any navigation closes it.
  const [openOn, setOpenOn] = useState<string | null>(null);
  const menuOpen = openOn === pathname;
  const setMenuOpen = (next: boolean | ((open: boolean) => boolean)) =>
    setOpenOn((prev) => ((typeof next === 'function' ? next(prev === pathname) : next) ? pathname : null));
  const { lock, unlock } = useScrollApi();

  // Hide on scroll down, return on scroll up.
  useGSAP(() => {
    const el = nav.current!;
    let hidden = false;
    const st = ScrollTrigger.create({
      start: 0,
      end: 'max',
      onUpdate: (self) => {
        const hide = self.direction === 1 && self.scroll() > 240;
        if (hide === hidden) return;
        hidden = hide;
        gsap.to(el, { yPercent: hide ? -130 : 0, duration: 0.45, ease: 'ax.out', overwrite: true });
      },
    });
    return () => st.kill();
  });

  // Menu timeline: lime panel wipes down, links rise out of their masks.
  useGSAP(
    () => {
      menuTl.current = gsap
        .timeline({ paused: true })
        .set(menu.current, { display: 'flex' })
        .fromTo(menu.current, { clipPath: 'inset(0% 0% 100% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.6, ease: 'ax.inOut' })
        // Explicit end values: `.from()` would capture whatever offset a previous (StrictMode) run left behind.
        .fromTo('.menu-link', { yPercent: 110 }, { yPercent: 0, duration: 0.7, ease: 'ax.out', stagger: 0.06 }, '-=0.25')
        .fromTo('.menu-foot', { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.4 }, '-=0.45');
    },
    { scope: menu },
  );

  useEffect(() => {
    const tl = menuTl.current;
    if (!tl) return;
    if (menuOpen) {
      lock();
      tl.timeScale(1).play();
      const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpenOn(null);
      window.addEventListener('keydown', onKey);
      menu.current?.querySelector<HTMLElement>('a')?.focus();
      return () => { window.removeEventListener('keydown', onKey); unlock(); };
    }
    tl.timeScale(1.6).reverse();
  }, [menuOpen, lock, unlock]);

  const link =
    'link-line py-2 text-[0.8125rem] font-medium uppercase tracking-[0.08em] text-(--chrome-ink)/70 transition-colors duration-200 hover:text-(--chrome-ink)';

  return (
    <>
      <header
        ref={nav}
        className="fixed inset-x-0 top-0 flex justify-center px-(--bezel)"
        style={{ zIndex: menuOpen ? 'calc(var(--z-menu) + 1)' : 'var(--z-chrome)' }}
      >
        <nav
          aria-label="Primary"
          className="relative flex h-16 w-full max-w-5xl items-center justify-between rounded-b-[1.25rem] bg-(--chrome) px-5 text-(--chrome-ink) transition-colors duration-500 ease-(--ease-out) md:h-[4.5rem] md:rounded-b-[2rem] md:px-10"
          style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
        >
          <Shoulder side="left" />
          <Shoulder side="right" />

          <ul className="hidden flex-1 items-center gap-8 md:flex">
            {LEFT.map((item) => (
              <li key={item.to}>
                <Magnetic strength={0.2}>
                  <TransitionLink to={item.to} className={link}>{item.label}</TransitionLink>
                </Magnetic>
              </li>
            ))}
          </ul>

          <Magnetic strength={0.15}>
            <TransitionLink to="/" aria-label="Axoraa, home" className="block py-2 font-display text-lg font-bold tracking-[-0.04em] md:text-[1.75rem]">
              AXORAA©
            </TransitionLink>
          </Magnetic>

          <ul className="hidden flex-1 items-center justify-end gap-8 md:flex">
            {RIGHT.map((item) => (
              <li key={item.to}>
                <Magnetic strength={0.2}>
                  <TransitionLink to={item.to} className={link}>{item.label}</TransitionLink>
                </Magnetic>
              </li>
            ))}
            <li>
              <Magnetic strength={0.25}>
                <button
                  type="button"
                  onClick={openQuote}
                  className="pressable inline-flex items-center gap-1.5 rounded-full bg-lime px-4 py-2 text-[0.8125rem] font-semibold uppercase tracking-[0.08em] text-ink"
                >
                  Get a quote
                </button>
              </Magnetic>
            </li>
          </ul>

          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            className="pressable relative grid size-11 place-items-center rounded-full bg-(--chrome-ink)/10 md:hidden"
          >
            <span aria-hidden className={`absolute h-[1.5px] w-5 rounded-full bg-current transition-transform duration-300 ease-(--ease-out) ${menuOpen ? 'rotate-45' : '-translate-y-[4px]'}`} />
            <span aria-hidden className={`absolute h-[1.5px] w-5 rounded-full bg-current transition-transform duration-300 ease-(--ease-out) ${menuOpen ? '-rotate-45' : 'translate-y-[4px]'}`} />
          </button>
        </nav>
      </header>

      <div
        id="mobile-menu"
        ref={menu}
        data-surface="lime"
        aria-hidden={!menuOpen}
        className="fixed inset-0 hidden flex-col justify-between bg-lime px-6 pb-[calc(env(safe-area-inset-bottom,0px)+2rem)] pt-28 text-ink"
        style={{ zIndex: 'var(--z-menu)' }}
      >
        <ul className="flex flex-col gap-1">
          {MENU.map((item) => (
            <li key={item.to} className="split-mask">
              <TransitionLink
                to={item.to}
                onClick={() => setMenuOpen(false)}
                tabIndex={menuOpen ? 0 : -1}
                className="menu-link transition-opacity duration-150 active:opacity-60 block font-display text-[clamp(2.5rem,12.5vw,5rem)] font-bold leading-[1.05] tracking-[-0.05em]"
              >
                {item.label}
              </TransitionLink>
            </li>
          ))}
          <li className="split-mask">
            <button
              type="button"
              tabIndex={menuOpen ? 0 : -1}
              onClick={() => { setMenuOpen(false); openQuote(); }}
              className="menu-link transition-opacity duration-150 active:opacity-60 flex flex-wrap items-center gap-x-3 text-left font-display text-[clamp(2.5rem,12.5vw,5rem)] font-bold leading-[1.05] tracking-[-0.05em]"
            >
              Get a quote <ArrowUpRight className="size-[0.7em]" weight="bold" />
            </button>
          </li>
        </ul>
        <div className="menu-foot flex flex-col gap-1 border-t border-ink/20 pt-5 text-base font-medium">
          <a href={`mailto:${CONTACT.email}`} tabIndex={menuOpen ? 0 : -1}>{CONTACT.email}</a>
          <a href={CONTACT.phoneHref} tabIndex={menuOpen ? 0 : -1} className="tabular">{CONTACT.phoneDisplay}</a>
        </div>
      </div>
    </>
  );
}
