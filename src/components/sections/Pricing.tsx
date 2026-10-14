import { useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowUpRight, Check, Lightning, Minus } from '@phosphor-icons/react';
import { pricingPlans } from '../../data';
import { comparisonData, faqData, planAnalytics, type PlanId, type Tier } from '../../data/pricing';
import { openQuote } from '../../data/contact';
import { gsap, useGSAP } from '../../motion/gsap';
import { EASE } from '../../motion/tokens';
import SplitReveal from '../ui/SplitReveal';

const PLAN_IDS: PlanId[] = ['landing', 'custom', 'software'];
const SHORT: Record<PlanId, string> = { landing: 'Landing', custom: 'Custom', software: 'Software & CRM' };

function Cell({ text, status }: { text: string; status: Tier }) {
  if (status === 'none') {
    return (
      <span className="inline-flex items-center gap-2 text-white/40">
        <Minus size={14} weight="bold" className="shrink-0" /> Not included
      </span>
    );
  }
  const tone = status === 'enterprise' ? 'text-cyan' : status === 'premium' ? 'text-lime' : 'text-white/80';
  const Icon = status === 'enterprise' ? Lightning : Check;
  return (
    <span className={`inline-flex items-start gap-2 ${tone}`}>
      <Icon size={14} weight="bold" className="mt-1 shrink-0" /> <span className="text-white/85">{text}</span>
    </span>
  );
}

function Analytics({ plan }: { plan: PlanId }) {
  const s = planAnalytics[plan];
  const items = [
    { value: s.trafficBoost, label: 'Est. organic traffic increase' },
    { value: s.roiFactor, label: 'Conversion rate multiplier' },
    { value: s.automationLevel, label: s.automationDesc },
    { value: s.loadSpeed, label: `Page load speed, rated ${s.performanceRating}` },
    { value: s.latency, label: 'DNS edge latency' },
  ];
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.dl
        key={plan}
        initial={{ opacity: 0, transform: 'translateY(10px)' }}
        animate={{ opacity: 1, transform: 'translateY(0px)' }}
        exit={{ opacity: 0, transform: 'translateY(-6px)', transition: { duration: 0.15 } }}
        transition={{ duration: 0.35, ease: EASE.out }}
        className="grid grid-cols-2 gap-x-6 gap-y-8 md:grid-cols-5"
      >
        {items.map((it) => (
          <div key={it.label} className="flex flex-col gap-2">
            <dt className="order-last text-sm text-white/55">{it.label}</dt>
            <dd className="tabular font-display text-4xl font-bold tracking-[-0.04em] md:text-5xl">{it.value}</dd>
          </div>
        ))}
      </motion.dl>
    </AnimatePresence>
  );
}

export default function Pricing() {
  const root = useRef<HTMLElement>(null);
  const [active, setActive] = useState<PlanId>('custom');

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        gsap.from('.plan-card', { y: 50, opacity: 0, duration: 1, stagger: 0.08, ease: 'ax.out', scrollTrigger: { trigger: '.plan-grid', start: 'top 85%', once: true } });
      });
      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <section ref={root} id="pricing" data-chrome="light" className="relative bg-ink pb-24 pt-36 md:pb-40 md:pt-48">
      <div className="container-x">
        <SplitReveal as="h1" on="intro" by="words" className="text-display max-w-[11ch] text-[clamp(3.5rem,10vw,10rem)] leading-[0.85]">
          Investment architecture
        </SplitReveal>
        <SplitReveal as="p" on="intro" delay={0.3} className="mt-8 max-w-[46ch] text-lg leading-relaxed text-white/65 md:text-2xl">
          World-class engineering mapped directly to business returns. Choose a plan to calculate your system analytics below.
        </SplitReveal>

        {/* Value proposition */}
        <div className="mt-16 grid gap-8 rounded-[1.5rem] bg-white/[0.03] p-7 ring-1 ring-white/10 md:mt-24 md:grid-cols-12 md:p-10">
          <div className="md:col-span-8">
            <h2 className="text-display text-3xl md:text-4xl">One-time burn, lifetime returns</h2>
            <p className="mt-4 max-w-[60ch] leading-relaxed text-white/65">
              Instead of paying recurring salaries or monthly SaaS subscriptions forever, invest{' '}
              <span className="font-semibold text-lime">1 month of a single staff member&apos;s salary</span> into a high-performance digital asset.
              It runs 24/7/365, never takes sick leave, and builds your brand value for a lifetime. One-time investment, lifelong margins. Period.
            </p>
          </div>
          <dl className="flex flex-col justify-center gap-3 border-white/10 text-sm max-md:border-t max-md:pt-6 md:col-span-4 md:border-l md:pl-8">
            <div className="flex justify-between gap-4"><dt className="text-lime">1 month of staff pay</dt><dd>1x cost</dd></div>
            <div className="flex justify-between gap-4"><dt className="text-cyan">An Axoraa site</dt><dd>&infin; returns</dd></div>
            <div className="border-t border-white/10 pt-3 text-white/55">Zero subscription fees</div>
          </dl>
        </div>

        {/* Plans */}
        <div role="radiogroup" aria-label="Plans" className="plan-grid mt-6 grid gap-4 md:grid-cols-3 md:gap-5">
          {pricingPlans.map((plan) => {
            const id = plan.id as PlanId;
            const on = id === active;
            return (
              <div
                key={plan.id}
                role="radio"
                aria-checked={on}
                tabIndex={on ? 0 : -1}
                onClick={() => setActive(id)}
                onKeyDown={(e) => {
                  const i = PLAN_IDS.indexOf(id);
                  if (e.key === 'ArrowRight' || e.key === 'ArrowDown') setActive(PLAN_IDS[(i + 1) % 3]);
                  if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') setActive(PLAN_IDS[(i + 2) % 3]);
                  if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); setActive(id); }
                }}
                className={`plan-card relative flex cursor-pointer flex-col rounded-[1.5rem] p-7 transition-[background-color,color,box-shadow] duration-300 ease-(--ease-out) md:p-9 ${
                  on ? 'bg-lime text-ink' : 'bg-white/[0.03] ring-1 ring-white/10 hover:ring-white/25'
                }`}
              >
                <div className="flex items-center justify-between gap-4">
                  <h3 className="text-display text-2xl md:text-[1.7rem]">{plan.name}</h3>
                  {plan.recommended && (
                    <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${on ? 'bg-ink text-lime' : 'bg-lime/12 text-lime'}`}>Recommended</span>
                  )}
                </div>
                <p className={`mt-4 text-sm leading-relaxed ${on ? 'text-ink/70' : 'text-white/60'}`}>{plan.description}</p>
                <div className="mt-8 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <span className="tabular font-display text-[clamp(1.9rem,3vw,2.6rem)] font-bold tracking-[-0.04em]">{plan.price}</span>
                  {plan.originalPrice && <s className={`tabular text-lg ${on ? 'text-ink/45' : 'text-white/40'}`}>{plan.originalPrice}</s>}
                </div>
                <ul className={`mt-8 flex flex-col gap-3 border-t pt-6 text-sm ${on ? 'border-ink/15' : 'border-white/10'}`}>
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2.5">
                      <Check size={14} weight="bold" className={on ? 'text-ink' : 'text-lime'} /> {f}
                    </li>
                  ))}
                </ul>
                <span className={`mt-8 text-sm font-semibold ${on ? 'text-ink' : 'text-white/55'}`}>{on ? 'Selected' : 'Select plan'}</span>
              </div>
            );
          })}
        </div>

        {/* Analytics for the selected plan */}
        <div className="mt-6 rounded-[1.5rem] bg-white/[0.03] p-7 ring-1 ring-white/10 md:p-10">
          <p className="mb-8 text-sm text-white/55">
            Projected profile for <span className="font-semibold text-white">{SHORT[active]}</span>
          </p>
          <Analytics plan={active} />
        </div>

        {/* Comparison */}
        <div className="mt-28 md:mt-40">
          <SplitReveal as="h2" by="words" className="text-display max-w-[14ch] text-[clamp(2.75rem,6vw,5.5rem)]">
            System specifications comparison
          </SplitReveal>

          <div className="mt-12 hidden md:block">
            <table className="w-full table-fixed border-collapse text-left">
              <thead>
                <tr className="text-sm text-white/55">
                  <th scope="col" className="w-[34%] pb-5 font-medium">Capability</th>
                  {PLAN_IDS.map((id) => (
                    <th key={id} scope="col" className="pb-5 font-medium">
                      <button
                        type="button"
                        onClick={() => setActive(id)}
                        className={`pressable rounded-full px-4 py-2 transition-colors duration-200 ${id === active ? 'bg-lime font-semibold text-ink' : 'ring-1 ring-white/15 hover:text-white'}`}
                      >
                        {SHORT[id]}
                      </button>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {comparisonData.map((row) => (
                  <tr key={row.feature} className="border-t border-white/10 align-top">
                    <th scope="row" className="py-6 pr-10 font-normal">
                      <span className="block font-semibold text-white">{row.feature}</span>
                      <span className="mt-1.5 block text-sm leading-relaxed text-white/50">{row.description}</span>
                    </th>
                    {PLAN_IDS.map((id) => (
                      <td key={id} className={`py-6 pr-6 text-sm transition-colors duration-300 ${id === active ? 'bg-white/[0.03]' : ''}`}>
                        <Cell {...row[id]} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Phones: one plan at a time */}
          <div className="mt-10 md:hidden">
            <div role="tablist" aria-label="Compare plan" className="flex gap-2">
              {PLAN_IDS.map((id) => (
                <button
                  key={id}
                  role="tab"
                  type="button"
                  aria-selected={id === active}
                  onClick={() => setActive(id)}
                  className={`pressable min-h-11 flex-1 rounded-full px-2 text-sm transition-colors duration-200 ${id === active ? 'bg-lime font-semibold text-ink' : 'text-white/65 ring-1 ring-white/15'}`}
                >
                  {SHORT[id]}
                </button>
              ))}
            </div>
            <dl className="mt-6">
              {comparisonData.map((row) => (
                <div key={row.feature} className="border-t border-white/10 py-5">
                  <dt className="font-semibold">{row.feature}</dt>
                  <dd className="mt-2 text-sm"><Cell {...row[active]} /></dd>
                  <dd className="mt-2 text-sm leading-relaxed text-white/50">{row.description}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>

        {/* FAQ: every answer visible beside its question (no accordion) */}
        <div className="mt-28 md:mt-40">
          <SplitReveal as="h2" by="words" className="text-display text-[clamp(2.75rem,6vw,5.5rem)]">Frequently asked questions</SplitReveal>
          <p className="mt-6 text-lg text-white/60">Get answers to critical delivery questions and technical workflows.</p>
          <dl className="mt-12">
            {faqData.map((f) => (
              <div key={f.q} className="grid gap-3 border-t border-white/10 py-8 md:grid-cols-12 md:gap-10">
                <dt className="text-lg font-semibold md:col-span-5">{f.q}</dt>
                <dd className="max-w-[60ch] leading-relaxed text-white/65 md:col-span-7">{f.a}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="mt-20 flex flex-col items-start gap-6 rounded-[1.5rem] bg-white/[0.03] p-7 ring-1 ring-white/10 md:flex-row md:items-center md:justify-between md:p-10">
          <p className="text-display text-2xl md:text-3xl">Not sure which plan fits?</p>
          <button
            type="button"
            onClick={openQuote}
            className="pressable group inline-flex items-center gap-4 rounded-full bg-lime py-2 pl-6 pr-2 font-semibold text-ink"
          >
            Get a quote
            <span className="grid size-10 place-items-center rounded-full bg-ink text-lime transition-transform duration-300 ease-(--ease-out) group-hover:translate-x-0.5">
              <ArrowUpRight size={18} weight="bold" />
            </span>
          </button>
        </div>
      </div>
    </section>
  );
}
