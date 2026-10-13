import { useEffect, useRef } from 'react';
import { gsap, useGSAP } from '../../motion/gsap';
import { MQ } from '../../motion/tokens';
import { useReducedMotion } from '../../hooks/useMediaQuery';
import poster from '../../assets/showreel-poster.jpg?w=1280&quality=70&format=webp';

/**
 * The film opens out of a small frame to full-bleed while the section is pinned.
 * Video loads only when the section approaches and plays only while on screen.
 */
export default function Showreel() {
  const root = useRef<HTMLElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const reduce = useReducedMotion();

  useEffect(() => {
    const v = video.current;
    if (!v || reduce) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          if (v.preload !== 'auto') { v.preload = 'auto'; v.load(); }
          v.play().catch(() => {});
        } else {
          v.pause();
        }
      },
      { rootMargin: '200px 0px' },
    );
    io.observe(v);
    return () => io.disconnect();
  }, [reduce]);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      const build = (from: string, distance: string) => {
        const tl = gsap.timeline({
          defaults: { ease: 'none' },
          scrollTrigger: { trigger: root.current, start: 'top top', end: distance, pin: true, scrub: true, anticipatePin: 1 },
        });
        // Words clear out in the first third so they never sit on the growing frame.
        tl.fromTo('.reel-frame', { clipPath: from }, { clipPath: 'inset(0% 0% 0% 0% round 0px)', duration: 1 }, 0)
          .fromTo('.reel-video', { scale: 1.3 }, { scale: 1, duration: 1 }, 0)
          .to('.reel-word-l', { xPercent: -45, opacity: 0, duration: 0.3 }, 0)
          .to('.reel-word-r', { xPercent: 45, opacity: 0, duration: 0.3 }, 0);
      };
      mm.add(MQ.desktop, () => build('inset(27% 30% 27% 30% round 28px)', '+=130%'));
      mm.add(MQ.mobile, () => build('inset(30% 14% 30% 14% round 20px)', '+=90%'));
      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <section ref={root} data-chrome="light" aria-label="Film" className="relative h-[100svh] overflow-hidden bg-ink">
      <div className="reel-frame absolute inset-0 overflow-hidden" style={{ clipPath: reduce ? undefined : 'inset(27% 30% 27% 30% round 28px)' }}>
        <video
          ref={video}
          className="reel-video size-full object-cover"
          src="/hero-video.mp4"
          poster={poster}
          muted
          loop
          playsInline
          preload="none"
          aria-hidden
        />
      </div>
      <p
        aria-hidden
        className="pointer-events-none absolute inset-x-0 flex justify-between px-[5vw] font-display text-[clamp(1.75rem,3.1vw,3.5rem)] font-bold leading-none tracking-[-0.04em] max-md:top-[13%] max-md:flex-col max-md:items-center max-md:gap-1 md:top-1/2 md:-translate-y-1/2"
      >
        <span className="reel-word-l">Detail, motion,</span>
        <span className="reel-word-r">performance.</span>
      </p>
    </section>
  );
}
