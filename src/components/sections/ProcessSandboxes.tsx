import { useEffect, useState } from 'react';

/** Small working demos, one per process step. `active` gates anything that runs on a timer. */

const frame = 'relative flex size-full flex-col justify-between gap-4 overflow-hidden rounded-[1.25rem] bg-white/[0.03] p-6 ring-1 ring-white/10 md:p-8';
const caption = 'text-sm text-white/55';
const chip = 'pressable min-h-10 flex-1 rounded-full text-sm font-medium transition-colors duration-200';

function Discover() {
  const nodes = [
    { x: 52, y: 58, label: 'Flows' },
    { x: 148, y: 52, label: 'Market' },
    { x: 40, y: 140, label: 'Scope' },
    { x: 160, y: 138, label: 'Tech' },
  ];
  const [hover, setHover] = useState<string | null>(null);
  return (
    <div className={frame}>
      <svg viewBox="0 0 200 190" className="mx-auto h-full max-h-60 w-full">
        {nodes.map((n) => (
          <line key={n.label} x1="100" y1="98" x2={n.x} y2={n.y} stroke={hover === n.label ? '#ccff00' : 'rgba(255,255,255,0.18)'} strokeWidth="1" strokeDasharray="3 3" className="transition-[stroke] duration-200" />
        ))}
        <circle cx="100" cy="98" r="17" fill="#ccff00" />
        <text x="100" y="101" fill="#0a0a0a" fontSize="7.5" fontWeight="700" textAnchor="middle">Ideas</text>
        {nodes.map((n) => (
          <g key={n.label} onPointerEnter={() => setHover(n.label)} onPointerLeave={() => setHover(null)} className="cursor-pointer">
            <circle cx={n.x} cy={n.y} r="14" fill="#0a0a0a" stroke={hover === n.label ? '#ccff00' : 'rgba(255,255,255,0.35)'} strokeWidth="1.2" className="transition-[stroke] duration-200" />
            <text x={n.x} y={n.y + 2.5} fill="#fff" fontSize="6.5" textAnchor="middle">{n.label}</text>
          </g>
        ))}
      </svg>
      <p className={caption}>Hover the nodes to trace architecture constraints.</p>
    </div>
  );
}

const THEMES = {
  Lime: { accent: '#ccff00', tint: 'rgba(204,255,0,0.12)' },
  Cyan: { accent: '#00f0ff', tint: 'rgba(0,240,255,0.12)' },
  Mono: { accent: '#ffffff', tint: 'rgba(255,255,255,0.1)' },
} as const;
type ThemeName = keyof typeof THEMES;

function Design() {
  const [theme, setTheme] = useState<ThemeName>('Lime');
  const t = THEMES[theme];
  return (
    <div className={frame}>
      <div className="mx-auto flex w-full max-w-[15rem] flex-col gap-3 rounded-2xl bg-ink p-4 ring-1 ring-white/10">
        <div className="flex items-center justify-between">
          <span className="h-2 w-12 rounded-full bg-white/15" />
          <span className="size-4 rounded-full transition-colors duration-300" style={{ background: t.accent }} />
        </div>
        <span className="h-2 w-full rounded-full bg-white/8" />
        <span className="h-2 w-4/5 rounded-full bg-white/8" />
        <span className="grid h-11 place-items-center rounded-xl text-sm font-semibold transition-colors duration-300" style={{ background: t.tint, color: t.accent, boxShadow: `inset 0 0 0 1px ${t.accent}40` }}>
          Primary action
        </span>
      </div>
      <div className="flex gap-2" role="radiogroup" aria-label="Accent colour">
        {(Object.keys(THEMES) as ThemeName[]).map((name) => (
          <button
            key={name}
            type="button"
            role="radio"
            aria-checked={theme === name}
            onClick={() => setTheme(name)}
            className={`${chip} ${theme === name ? 'bg-white text-ink' : 'text-white/70 ring-1 ring-white/12 hover:text-white'}`}
          >
            {name}
          </button>
        ))}
      </div>
    </div>
  );
}

const BUILD_STEPS: [number, string][] = [
  [0, 'Resolving dependencies'],
  [25, 'Compiling source'],
  [60, 'Running unit tests: pass'],
  [85, 'Optimising bundle'],
  [100, 'Build complete'],
];

function Develop({ active }: { active: boolean }) {
  const [progress, setProgress] = useState(0);
  const [run, setRun] = useState(0);

  useEffect(() => {
    if (!active) return;
    let p = 0;
    const id = window.setInterval(() => {
      p = Math.min(100, p + 4);
      setProgress(p);
      if (p === 100) window.clearInterval(id);
    }, 110);
    return () => window.clearInterval(id);
  }, [active, run]);

  const status = [...BUILD_STEPS].reverse().find(([at]) => progress >= at)?.[1];
  return (
    <div className={frame}>
      <div className="my-auto flex flex-col gap-3 font-mono text-sm">
        <span className="text-white/50">$ npm run build</span>
        <span className={progress >= 100 ? 'text-lime' : 'text-white/85'}>{status}</span>
        <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
          <div className="h-full origin-left rounded-full bg-lime transition-transform duration-150 ease-linear" style={{ transform: `scaleX(${progress / 100})` }} />
        </div>
        <span className="tabular self-end text-white/45">{progress}%</span>
      </div>
      <button type="button" onClick={() => setRun((r) => r + 1)} className={`${chip} flex-none text-white/80 ring-1 ring-white/12 hover:bg-lime hover:text-ink hover:ring-lime`}>
        Run the build again
      </button>
    </div>
  );
}

function Deliver({ active }: { active: boolean }) {
  const edges = [
    { x: 40, y: 42, label: 'NYC' },
    { x: 104, y: 30, label: 'LDN' },
    { x: 202, y: 52, label: 'NRT' },
  ];
  return (
    <div className={frame}>
      <svg viewBox="0 0 240 140" className="h-full max-h-56 w-full">
        {edges.map((e) => (
          <line key={e.label} x1="140" y1="92" x2={e.x} y2={e.y} stroke="rgba(204,255,0,0.35)" strokeWidth="1" strokeDasharray="2 4" />
        ))}
        <circle cx="140" cy="92" r="6" fill="#ccff00" />
        <text x="140" y="110" fill="#ccff00" fontSize="7" textAnchor="middle">BLR</text>
        {edges.map((e, i) => (
          <g key={e.label}>
            {active && (
              <circle cx={e.x} cy={e.y} r="4" fill="none" stroke="#ccff00" strokeWidth="1" className="origin-center animate-ping [transform-box:fill-box]" style={{ animationDelay: `${i * 0.4}s`, animationDuration: '2.4s' }} />
            )}
            <circle cx={e.x} cy={e.y} r="3.5" fill="#fff" />
            <text x={e.x} y={e.y - 9} fill="rgba(255,255,255,0.75)" fontSize="7" textAnchor="middle">{e.label}</text>
          </g>
        ))}
      </svg>
      <p className={caption}>Edge servers online.</p>
    </div>
  );
}

export function Sandbox({ index, active }: { index: number; active: boolean }) {
  switch (index) {
    case 0: return <Discover />;
    case 1: return <Design />;
    case 2: return <Develop active={active} />;
    default: return <Deliver active={active} />;
  }
}
