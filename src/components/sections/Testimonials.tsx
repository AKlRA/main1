import { useCallback, useRef, type KeyboardEvent, type PointerEvent } from 'react';
import { ArrowsLeftRight } from '@phosphor-icons/react';
import { testimonials } from '../../data';
import { gsap, useGSAP } from '../../motion/gsap';
import SplitReveal from '../ui/SplitReveal';

/** Illustrative before/after figures the comparison interpolates between. */
const METRICS = [
  { label: 'Load time', from: 4.8, to: 0.4, format: (v: number) => `${v.toFixed(1)}s` },
  { label: 'Conversion', from: 0.9, to: 4.2, format: (v: number) => `${v.toFixed(1)}%` },
  { label: 'Bounce rate', from: 72, to: 21, format: (v: number) => `${Math.round(v)}%` },
];

function parseStat(value: string) {
  const m = value.match(/^([+-]?)(\d+(?:\.\d+)?)(.*)$/);
  return m ? { sign: m[1], num: Number(m[2]), suffix: m[3] } : { sign: '', num: 0, suffix: value };
}

function Comparison({ before, after, company }: { before: string; after: string; company: string }) {
  const box = useRef<HTMLDivElement>(null);
  const afterLayer = useRef<HTMLDivElement>(null);
  const handle = useRef<HTMLDivElement>(null);
  const knob = useRef<HTMLDivElement>(null);
  const values = useRef<(HTMLSpanElement | null)[]>([]);
  const pos = useRef(0.5);
  const dragging = useRef(false);

  // Writes straight to the DOM: this runs on every pointer move.
  const apply = useCallback((p: number) => {
    pos.current = Math.min(1, Math.max(0, p));
    const pct = pos.current * 100;
    afterLayer.current!.style.clipPath = `inset(0 ${100 - pct}% 0 0)`;
    handle.current!.style.transform = `translateX(${pct}%)`;
    knob.current!.setAttribute('aria-valuenow', String(Math.round(pct)));
    METRICS.forEach((m, i) => {
      const el = values.current[i];
      if (el) el.textContent = m.format(m.from + (m.to - m.from) * pos.current);
    });
  }, []);

  const fromEvent = (e: PointerEvent) => {
    const b = box.current!.getBoundingClientRect();
    apply((e.clientX - b.left) / b.width);
  };

  // A single sweep on first view shows the image is interactive.
  useGSAP(
    () => {
      apply(0.5);
      const mm = gsap.matchMedia();
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        const proxy = { p: 0.12 };
        gsap.to(proxy, {
          p: 0.5,
          duration: 1.6,
          ease: 'ax.inOut',
          onStart: () => apply(0.12),
          onUpdate: () => { if (!dragging.current) apply(proxy.p); },
          scrollTrigger: { trigger: box.current, start: 'top 70%', once: true },
        });
      });
      return () => mm.revert();
    },
    { scope: box },
  );

  const onKey = (e: KeyboardEvent) => {
    const step = e.shiftKey ? 0.2 : 0.05;
    const next = { ArrowLeft: pos.current - step, ArrowRight: pos.current + step, Home: 0, End: 1 }[e.key];
    if (next === undefined) return;
    e.preventDefault();
    apply(next);
  };

  return (
    <div>
      <div
        ref={box}
        data-cursor="drag"
        onPointerDown={(e) => { dragging.current = true; box.current!.setPointerCapture(e.pointerId); fromEvent(e); }}
        onPointerMove={(e) => { if (dragging.current || e.pointerType === 'mouse') fromEvent(e); }}
        onPointerUp={() => { dragging.current = false; }}
        onPointerCancel={() => { dragging.current = false; }}
        className="relative aspect-[16/10] select-none overflow-hidden rounded-[1.5rem] bg-white/5 ring-1 ring-white/10 [touch-action:pan-y]"
      >
        <img src={before} alt={`${company} website before the redesign`} draggable={false} className="absolute inset-0 size-full object-cover object-top grayscale-[0.6]" />
        <div ref={afterLayer} className="absolute inset-0">
          <img src={after} alt={`${company} website after the Axoraa redesign`} draggable={false} className="size-full object-cover object-top" />
        </div>
        <span className="pointer-events-none absolute left-4 top-4 rounded-full bg-ink/75 px-3 py-1 text-xs font-medium text-white/85 backdrop-blur-sm">Before</span>
        <span className="pointer-events-none absolute right-4 top-4 rounded-full bg-lime px-3 py-1 text-xs font-semibold text-ink">After</span>

        <div ref={handle} className="pointer-events-none absolute inset-0">
          <div className="absolute inset-y-0 left-0 w-0.5 -translate-x-1/2 bg-lime" />
          <div
            ref={knob}
            role="slider"
            tabIndex={0}
            aria-label="Compare before and after"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={50}
            onKeyDown={onKey}
            className="pointer-events-auto absolute left-0 top-1/2 grid size-12 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-lime text-ink shadow-[0_8px_30px_-6px_rgba(204,255,0,0.6)]"
          >
            <ArrowsLeftRight size={20} weight="bold" />
          </div>
        </div>
      </div>

      <dl className="mt-6 grid grid-cols-3 gap-4 border-t border-white/12 pt-6">
        {METRICS.map((m, i) => (
          <div key={m.label}>
            <dt className="text-sm text-white/55">{m.label}</dt>
            <dd className="tabular mt-1 font-display text-3xl font-semibold tracking-[-0.03em] md:text-4xl">
              <span ref={(el) => { values.current[i] = el; }}>{m.format((m.from + m.to) / 2)}</span>
            </dd>
          </div>
        ))}
      </dl>
      <p className="mt-3 text-xs text-white/45">Figures move with the slider: before on the left, after on the right.</p>
    </div>
  );
}

export default function Testimonials() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      gsap.utils.toArray<HTMLElement>('.stat-num').forEach((el) => {
        const { sign, num, suffix } = parseStat(el.dataset.value ?? '');
        const counter = { v: 0 };
        const mm = gsap.matchMedia();
        mm.add('(prefers-reduced-motion: no-preference)', () => {
          gsap.to(counter, {
            v: num,
            duration: 1.6,
            ease: 'ax.out',
            scrollTrigger: { trigger: el, start: 'top 85%', once: true },
            onUpdate: () => { el.textContent = `${sign}${Math.round(counter.v)}${suffix}`; },
          });
        });
      });
    },
    { scope: root },
  );

  return (
    <section ref={root} id="testimonials" data-chrome="light" className="relative bg-ink py-24 md:py-40">
      <div className="container-x">
        <p className="text-sm font-medium text-lime">Case study</p>
        <SplitReveal as="h2" by="words" className="text-display mt-5 max-w-[14ch] text-[clamp(3.25rem,8vw,8rem)]">
          Real business impact
        </SplitReveal>
        <SplitReveal as="p" className="mt-8 max-w-[52ch] text-lg leading-relaxed text-white/65 md:text-xl">
          Websites and apps should grow your revenue, not just look pretty. Drag across the screenshot to compare the before and after.
        </SplitReveal>

        {testimonials.map((t) => (
          <div key={t.id} className="mt-14 grid gap-14 md:mt-20 lg:grid-cols-12 lg:gap-16">
            <div className="lg:col-span-7">
              {t.beforeImage && t.afterImage && <Comparison before={t.beforeImage} after={t.afterImage} company={t.companyName} />}
            </div>

            <figure className="flex flex-col lg:col-span-5">
              <span aria-hidden className="font-display text-7xl leading-none text-lime">&ldquo;</span>
              <blockquote className="mt-2 text-xl leading-relaxed text-white/85 md:text-2xl">{t.content}</blockquote>
              <figcaption className="mt-8 flex items-center gap-4">
                <span className="grid size-12 place-items-center rounded-full bg-lime font-display text-lg font-bold text-ink" aria-hidden>
                  {t.clientName[0]}
                </span>
                <span>
                  <span className="block font-semibold">{t.clientName}</span>
                  <span className="block text-sm text-white/55">{t.clientRole}, {t.companyName}</span>
                </span>
              </figcaption>

              <dl className="mt-auto grid grid-cols-3 gap-4 pt-12">
                {t.growthStats.map((s) => (
                  <div key={s.label} className="flex flex-col gap-2 border-t border-lime/40 pt-4">
                    <dt className="order-last text-sm text-white/60">{s.label}</dt>
                    <dd className="stat-num tabular font-display text-[clamp(1.6rem,7.5vw,3rem)] font-bold leading-none tracking-[-0.04em] text-lime" data-value={s.value}>
                      {s.value}
                    </dd>
                  </div>
                ))}
              </dl>
            </figure>
          </div>
        ))}
      </div>
    </section>
  );
}
