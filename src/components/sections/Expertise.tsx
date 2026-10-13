import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { Cpu, Database, StackSimple } from '@phosphor-icons/react';
import { gsap, useGSAP } from '../../motion/gsap';
import { MQ } from '../../motion/tokens';
import { useInView } from '../../hooks/useInView';
import SplitReveal from '../ui/SplitReveal';

const card = 'xp-card relative flex flex-col overflow-hidden rounded-[1.5rem] bg-white/[0.03] p-7 ring-1 ring-white/10 md:p-9';
const action =
  'pressable min-h-11 flex-1 rounded-full text-sm font-medium text-white/80 ring-1 ring-white/12 transition-colors duration-200 hover:bg-lime hover:text-ink hover:ring-lime disabled:pointer-events-none disabled:opacity-50';

function CardHead({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) {
  return (
    <>
      <div className="flex items-center gap-3">
        <span className="grid size-10 place-items-center rounded-full bg-lime/10 text-lime">{icon}</span>
        <h3 className="text-display text-2xl md:text-3xl">{title}</h3>
      </div>
      <p className="mt-4 max-w-[46ch] text-base leading-relaxed text-white/65">{children}</p>
    </>
  );
}

/** A wireframe cube that idles on its own and leans toward the pointer. */
function Cube() {
  const stage = useRef<HTMLDivElement>(null);
  const tilt = useRef<HTMLDivElement>(null);
  const spin = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      gsap.set(tilt.current, { rotationX: -18, rotationY: 24 });
      const mm = gsap.matchMedia();
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        gsap.to(spin.current, { rotationY: 360, duration: 28, ease: 'none', repeat: -1 });
      });
      mm.add(`${MQ.finePointer} and (prefers-reduced-motion: no-preference)`, () => {
        const el = stage.current!;
        const rx = gsap.quickTo(tilt.current, 'rotationX', { duration: 0.8, ease: 'ax.out' });
        const ry = gsap.quickTo(tilt.current, 'rotationY', { duration: 0.8, ease: 'ax.out' });
        const move = (e: PointerEvent) => {
          const b = el.getBoundingClientRect();
          rx(-18 - ((e.clientY - b.top) / b.height - 0.5) * 50);
          ry(24 + ((e.clientX - b.left) / b.width - 0.5) * 70);
        };
        const leave = () => { rx(-18); ry(24); };
        el.addEventListener('pointermove', move);
        el.addEventListener('pointerleave', leave);
        return () => { el.removeEventListener('pointermove', move); el.removeEventListener('pointerleave', leave); };
      });
      return () => mm.revert();
    },
    { scope: stage },
  );

  const faces = ['rotateY(0deg)', 'rotateY(180deg)', 'rotateY(90deg)', 'rotateY(-90deg)', 'rotateX(90deg)', 'rotateX(-90deg)'];
  return (
    <div ref={stage} data-cursor="drag" data-cursor-label="Tilt" className="relative mt-8 grid flex-1 place-items-center rounded-[1.1rem] bg-ink/60 py-14 ring-1 ring-white/8 [perspective:700px]">
      <div aria-hidden className="absolute inset-0 rounded-[inherit] bg-[linear-gradient(to_right,rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:24px_24px]" />
      <div ref={tilt} className="relative size-32 [--half:4rem] [transform-style:preserve-3d] md:size-52 md:[--half:6.5rem]">
        <div ref={spin} className="absolute inset-0 [transform-style:preserve-3d]">
          {faces.map((f) => (
            <div key={f} className="absolute inset-0 border border-lime/50 bg-lime/[0.04]" style={{ transform: `${f} translateZ(var(--half))` }} />
          ))}
          <div className="absolute left-1/2 top-1/2 size-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-lime shadow-[0_0_24px_rgba(204,255,0,0.7)]" />
        </div>
      </div>
    </div>
  );
}

const IDLE_LOGS = [
  'HEALTH: cluster status 100% healthy',
  'METRICS: CPU 12% | RAM 29% | disk 15%',
  'SYNC: cron-sync completed, 0 mutations',
  'API: GET /api/v1/health 200 OK 2.8ms',
  'CACHE: recompiling cache metrics, ready',
  'DB: transaction logs rotated',
  'AUDIT: Redis cache hit ratio 99.8%',
];

const stamp = () => new Date().toLocaleTimeString('en-GB', { hour12: false });

function Console() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref);
  const [logs, setLogs] = useState<string[]>([
    'Sys initialised. Node cluster online.',
    'DB connection established (primary).',
    'API gateway listening on port 8080.',
  ]);
  const [busy, setBusy] = useState(false);
  const timers = useRef<number[]>([]);
  const add = useCallback((msg: string) => setLogs((l) => [...l.slice(-5), `[${stamp()}] ${msg}`]), []);
  const later = (ms: number, fn: () => void) => timers.current.push(window.setTimeout(fn, ms));

  useEffect(() => {
    if (!inView) return;
    const id = window.setInterval(() => add(IDLE_LOGS[Math.floor(Math.random() * IDLE_LOGS.length)]), 4500);
    return () => window.clearInterval(id);
  }, [inView, add]);
  useEffect(() => () => timers.current.forEach(window.clearTimeout), []);

  const ping = () => {
    setBusy(true);
    add('PING -> GET /api/v1/metrics');
    later(200, () => add('DB QUERY: SELECT SUM(value) FROM ledger 2.1ms'));
    later(450, () => add('REDIS: cache hit for ledger_sum'));
    later(700, () => { add('RESPONSE: 200 OK, latency 4ms'); setBusy(false); });
  };
  const diagnose = () => {
    add('DB: running diagnostic audit');
    later(400, () => { add('DB: shards compacted, indices rebuilt'); add('AUDIT: 0 leaks found'); });
  };

  return (
    <div ref={ref} className="mt-7 flex flex-1 flex-col gap-4 rounded-[1.1rem] bg-ink/60 p-4 ring-1 ring-white/8">
      <ol aria-live="polite" className="flex min-h-40 flex-1 flex-col justify-end gap-1 overflow-hidden font-mono text-[0.7rem] leading-relaxed text-white/60">
        {logs.map((log, i) => (
          <li key={`${i}-${log}`} className={log.includes('PING') || log.includes('RESPONSE') ? 'text-lime' : undefined}>{log}</li>
        ))}
      </ol>
      <div className="flex gap-2">
        <button type="button" onClick={ping} disabled={busy} className={action}>Ping API</button>
        <button type="button" onClick={diagnose} className={action}>DB diagnostic</button>
      </div>
    </div>
  );
}

function Topology() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref);
  const [wave, setWave] = useState(false);
  const fire = useCallback(() => {
    setWave(true);
    window.setTimeout(() => setWave(false), 2500);
  }, []);

  useEffect(() => {
    if (!inView) return;
    const first = window.setTimeout(fire, 400);
    const id = window.setInterval(fire, 6500);
    return () => { window.clearTimeout(first); window.clearInterval(id); };
  }, [inView, fire]);

  const node = (x: number, y: number, label: string, r = 11) => (
    <g key={label}>
      <circle cx={x} cy={y} r={r} fill="#0a0a0a" stroke={wave ? '#ccff00' : 'rgba(255,255,255,0.3)'} strokeWidth="1.4" className="transition-[stroke] duration-300" />
      <text x={x} y={y + 3} fill={label === 'LB' ? '#ccff00' : '#fff'} fontSize="8" fontWeight="600" textAnchor="middle">{label}</text>
    </g>
  );

  return (
    <div ref={ref} className="mt-7 flex flex-1 flex-col gap-4 rounded-[1.1rem] bg-ink/60 p-4 ring-1 ring-white/8">
      <div className="flex items-center justify-between text-xs text-white/50">
        <span>Autoscale</span>
        <span className="tabular text-white/80">{wave ? '2 nodes' : '1 node'}</span>
      </div>
      <svg viewBox="0 0 240 140" className="w-full flex-1">
        {[[30, 70, 90, 70], [90, 70, 150, 35], [90, 70, 150, 105], [150, 35, 210, 70], [150, 105, 210, 70]].map(([a, b, c, d]) => (
          <line key={`${a}${b}${c}${d}`} x1={a} y1={b} x2={c} y2={d} stroke="rgba(255,255,255,0.1)" strokeWidth="1.4" />
        ))}
        {wave && (
          <>
            <path d="M30 70 L90 70 L150 35 L210 70" fill="none" stroke="#ccff00" strokeWidth="2" className="traffic" />
            <path d="M30 70 L90 70 L150 105 L210 70" fill="none" stroke="#ccff00" strokeWidth="2" className="traffic" />
          </>
        )}
        {node(30, 70, 'C', 10)}
        {node(90, 70, 'LB', 12)}
        {node(150, 35, 'N1', 10)}
        {node(150, 105, 'N2', 10)}
        {node(210, 70, 'DB', 10)}
      </svg>
      <button type="button" onClick={fire} disabled={wave} className={`${action} flex-none`}>
        {wave ? 'Routing traffic' : 'Fire a traffic wave'}
      </button>
    </div>
  );
}

export default function Expertise() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        gsap.from('.xp-card', {
          y: 60,
          opacity: 0,
          duration: 1,
          ease: 'ax.out',
          stagger: 0.08,
          scrollTrigger: { trigger: '.xp-grid', start: 'top 80%', once: true },
        });
      });
      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <section ref={root} id="expertise" data-chrome="light" className="relative bg-ink py-24 md:py-40">
      <div className="container-x">
        <SplitReveal as="h2" by="words" className="text-display max-w-[12ch] text-[clamp(3.25rem,8vw,8rem)]">
          Engineering expertise
        </SplitReveal>
        <SplitReveal as="p" className="mt-8 max-w-[52ch] text-lg leading-relaxed text-white/65 md:text-xl">
          We don&apos;t build generic websites. We engineer high-performance systems, custom browser experiences, and automated cloud architectures.
        </SplitReveal>

        <div className="xp-grid mt-14 grid gap-4 md:mt-20 md:grid-cols-12 md:gap-5">
          <article className={`${card} bg-[radial-gradient(90%_70%_at_80%_100%,rgba(204,255,0,0.09),transparent_70%)] md:col-span-7 md:row-span-2`}>
            <CardHead icon={<Cpu size={20} weight="duotone" />} title="Frontend">
              We push browser limits. Using React, Vite, and custom shaders, we build buttery-smooth, interactive interfaces.
            </CardHead>
            <Cube />
          </article>
          <article className={`${card} md:col-span-5`}>
            <CardHead icon={<Database size={20} weight="duotone" />} title="Backend">
              High-throughput systems. We write clean, optimised microservices using Java and Node.js that handle massive traffic effortlessly.
            </CardHead>
            <Console />
          </article>
          <article className={`${card} md:col-span-5`}>
            <CardHead icon={<StackSimple size={20} weight="duotone" />} title="Infrastructure">
              Zero-downtime, self-healing deployments. We leverage AWS, Docker, and CDNs for secure, blazing-fast hosting.
            </CardHead>
            <Topology />
          </article>
        </div>
      </div>
    </section>
  );
}
