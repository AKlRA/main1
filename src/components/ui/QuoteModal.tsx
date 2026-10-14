import { useEffect, useId, useRef, useState, type FormEvent } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowUpRight, Check, EnvelopeSimple, WhatsappLogo, X } from '@phosphor-icons/react';
import { CONTACT, QUOTE_ENDPOINT, onOpenQuote } from '../../data/contact';
import { EASE } from '../../motion/tokens';
import { useScrollApi } from '../../motion/scrollContext';
import { useIsMobile, useReducedMotion } from '../../hooks/useMediaQuery';

const services = [
  'Website / Web App',
  'Mobile Application',
  'AI & Automations',
  'Custom Software / CRM',
  'Other / Consultation',
];

type Fields = { name: string; email: string; phone: string; message: string };
type Errors = Partial<Record<keyof Fields, string>>;
type Status = 'idle' | 'sending' | 'sent' | 'whatsapp' | 'error';

const EMPTY: Fields = { name: '', email: '', phone: '', message: '' };

function validate(f: Fields): Errors {
  const e: Errors = {};
  if (!f.name.trim()) e.name = 'Add your name so we know who to reply to.';
  if (!f.email.trim()) e.email = 'Add an email address.';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email.trim())) e.email = 'That email address looks incomplete.';
  return e;
}

function summary(service: string, f: Fields) {
  return [
    'Hi Axoraa, I want to talk about a project.',
    '',
    `Service: ${service}`,
    `Name: ${f.name}`,
    `Email: ${f.email}`,
    f.phone && `Phone: ${f.phone}`,
    f.message && `Details: ${f.message}`,
  ]
    .filter(Boolean)
    .join('\n');
}

export default function QuoteModal() {
  const [open, setOpen] = useState(false);
  const [service, setService] = useState(services[0]);
  const [fields, setFields] = useState<Fields>(EMPTY);
  const [errors, setErrors] = useState<Errors>({});
  const [status, setStatus] = useState<Status>('idle');
  const { lock, unlock } = useScrollApi();
  const mobile = useIsMobile();
  const reduce = useReducedMotion();
  const firstField = useRef<HTMLInputElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);
  const titleId = useId();

  useEffect(() => onOpenQuote(() => {
    returnFocus.current = document.activeElement as HTMLElement | null;
    setOpen(true);
  }), []);

  useEffect(() => {
    if (!open) return;
    lock();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    const t = window.setTimeout(() => firstField.current?.focus(), 60);
    return () => {
      unlock();
      window.removeEventListener('keydown', onKey);
      window.clearTimeout(t);
      returnFocus.current?.focus?.();
    };
  }, [open, lock, unlock]);

  const close = () => setOpen(false);
  const set = (key: keyof Fields) => (e: { target: { value: string } }) => {
    setFields((f) => ({ ...f, [key]: e.target.value }));
    if (errors[key]) setErrors((er) => ({ ...er, [key]: undefined }));
  };

  const text = summary(service, fields);
  const whatsappHref = `https://wa.me/${CONTACT.whatsapp}?text=${encodeURIComponent(text)}`;
  const mailHref = `mailto:${CONTACT.email}?subject=${encodeURIComponent(`Project enquiry: ${service}`)}&body=${encodeURIComponent(text)}`;

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const found = validate(fields);
    setErrors(found);
    if (Object.keys(found).length) {
      document.getElementById(`${titleId}-${Object.keys(found)[0]}`)?.focus();
      return;
    }
    if (!QUOTE_ENDPOINT) {
      window.open(whatsappHref, '_blank', 'noopener,noreferrer');
      setStatus('whatsapp');
      return;
    }
    setStatus('sending');
    try {
      const body = new FormData();
      Object.entries({ ...fields, service, source: 'Quote modal' }).forEach(([k, v]) => body.append(k, v));
      const res = await fetch(QUOTE_ENDPOINT, { method: 'POST', body });
      setStatus(res.ok ? 'sent' : 'error');
    } catch {
      setStatus('error');
    }
  };

  const reset = () => {
    setFields(EMPTY);
    setErrors({});
    setStatus('idle');
  };

  const panelMotion = reduce
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, transition: { duration: 0.2 } }
    : mobile
      ? {
          initial: { transform: 'translateY(100%)' },
          animate: { transform: 'translateY(0%)' },
          exit: { transform: 'translateY(100%)' },
          transition: { duration: 0.5, ease: EASE.drawer },
        }
      : {
          initial: { opacity: 0, transform: 'translateY(16px) scale(0.96)' },
          animate: { opacity: 1, transform: 'translateY(0px) scale(1)' },
          exit: { opacity: 0, transform: 'translateY(8px) scale(0.98)', transition: { duration: 0.18, ease: EASE.out } },
          transition: { duration: 0.28, ease: EASE.out },
        };

  const input =
    'w-full rounded-xl border border-white/15 bg-white/[0.03] px-4 py-3 text-white placeholder:text-white/40 transition-colors duration-200 hover:border-white/30 focus:border-lime focus:outline-none aria-[invalid=true]:border-lime';

  return (
    <AnimatePresence onExitComplete={reset}>
      {open && (
        <div className="fixed inset-0 flex items-end justify-center md:items-center md:p-6" style={{ zIndex: 'var(--z-modal)' }}>
          <motion.div
            className="absolute inset-0 bg-ink/80 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, ease: EASE.out }}
            onClick={close}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            {...panelMotion}
            className="relative flex max-h-[92svh] w-full flex-col overflow-hidden rounded-t-[1.75rem] bg-ink ring-1 ring-white/12 md:max-w-xl md:rounded-[1.75rem]"
            style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
          >
            <div className="mx-auto mt-3 h-1 w-10 rounded-full bg-white/20 md:hidden" aria-hidden />
            <header className="flex items-start justify-between gap-6 px-6 pb-5 pt-5 md:px-9 md:pt-9">
              <div>
                <h2 id={titleId} className="text-display text-3xl md:text-4xl">Let&apos;s build together</h2>
                <p className="mt-2 max-w-sm text-sm text-white/60">
                  Tell us what you need. An engineer replies within one working day.
                </p>
              </div>
              <button
                type="button"
                onClick={close}
                aria-label="Close"
                className="pressable grid size-11 shrink-0 place-items-center rounded-full bg-white/[0.06] text-white/70 transition-colors duration-200 hover:bg-white/12 hover:text-white"
              >
                <X size={18} weight="bold" />
              </button>
            </header>

            <div data-lenis-prevent className="overflow-y-auto px-6 pb-7 md:px-9 md:pb-9">
              {status === 'sent' || status === 'whatsapp' ? (
                <div className="py-6">
                  <div className="mb-5 grid size-12 place-items-center rounded-full bg-lime text-ink">
                    <Check size={22} weight="bold" />
                  </div>
                  <h3 className="text-display text-2xl">
                    {status === 'sent' ? 'Request received.' : 'Finish in WhatsApp.'}
                  </h3>
                  <p className="mt-3 max-w-md text-white/65">
                    {status === 'sent'
                      ? `Thanks, ${fields.name.split(' ')[0]}. We will reply to ${fields.email} within one working day.`
                      : 'We opened WhatsApp with your details filled in. Press send there and we will pick it up.'}
                  </p>
                  <div className="mt-7 flex flex-wrap gap-3">
                    {status === 'whatsapp' && (
                      <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className="pressable inline-flex items-center gap-2 rounded-full bg-lime px-5 py-3 text-sm font-semibold text-ink">
                        <WhatsappLogo size={18} weight="fill" /> Open WhatsApp again
                      </a>
                    )}
                    <a href={mailHref} className="pressable inline-flex items-center gap-2 rounded-full bg-white/[0.08] px-5 py-3 text-sm font-semibold text-white hover:bg-white/15">
                      <EnvelopeSimple size={18} /> Email instead
                    </a>
                    <button type="button" onClick={close} className="pressable rounded-full px-5 py-3 text-sm font-semibold text-white/70 hover:text-white">
                      Close
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={submit} noValidate className="flex flex-col gap-5">
                  <fieldset>
                    <legend className="mb-3 text-sm font-medium text-white/70">What do you need?</legend>
                    <div className="flex flex-wrap gap-2">
                      {services.map((svc) => {
                        const on = svc === service;
                        return (
                          <button
                            key={svc}
                            type="button"
                            aria-pressed={on}
                            onClick={() => setService(svc)}
                            className={`pressable min-h-11 rounded-full px-4 text-sm transition-colors duration-200 ${
                              on ? 'bg-lime font-semibold text-ink' : 'bg-white/[0.05] text-white/75 ring-1 ring-white/12 hover:text-white hover:ring-white/30'
                            }`}
                          >
                            {svc}
                          </button>
                        );
                      })}
                    </div>
                  </fieldset>

                  <div className="flex flex-col gap-2">
                    <label htmlFor={`${titleId}-name`} className="text-sm font-medium text-white/70">Name</label>
                    <input ref={firstField} id={`${titleId}-name`} autoComplete="name" value={fields.name} onChange={set('name')} aria-invalid={!!errors.name} aria-describedby={errors.name ? `${titleId}-name-err` : undefined} className={input} />
                    {errors.name && <p id={`${titleId}-name-err`} className="text-sm text-lime">{errors.name}</p>}
                  </div>

                  <div className="grid gap-5 sm:grid-cols-2">
                    <div className="flex flex-col gap-2">
                      <label htmlFor={`${titleId}-email`} className="text-sm font-medium text-white/70">Email</label>
                      <input id={`${titleId}-email`} type="email" autoComplete="email" autoCapitalize="none" value={fields.email} onChange={set('email')} aria-invalid={!!errors.email} aria-describedby={errors.email ? `${titleId}-email-err` : undefined} className={input} />
                      {errors.email && <p id={`${titleId}-email-err`} className="text-sm text-lime">{errors.email}</p>}
                    </div>
                    <div className="flex flex-col gap-2">
                      <label htmlFor={`${titleId}-phone`} className="text-sm font-medium text-white/70">
                        Phone or WhatsApp <span className="text-white/45">(optional)</span>
                      </label>
                      <input id={`${titleId}-phone`} type="tel" inputMode="tel" autoComplete="tel" value={fields.phone} onChange={set('phone')} className={input} />
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label htmlFor={`${titleId}-message`} className="text-sm font-medium text-white/70">
                      Project details <span className="text-white/45">(optional)</span>
                    </label>
                    <textarea id={`${titleId}-message`} rows={3} value={fields.message} onChange={set('message')} placeholder="Goals, timeline, links to anything you like" className={`${input} resize-none`} />
                  </div>

                  {status === 'error' && (
                    <p role="alert" className="text-sm text-lime">
                      The request didn&apos;t go through. Try again, or send it on WhatsApp.
                    </p>
                  )}

                  <div className="flex flex-col gap-3 pt-1 sm:flex-row sm:items-center">
                    <button
                      type="submit"
                      disabled={status === 'sending'}
                      className="pressable inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-lime px-6 text-sm font-semibold text-ink transition-opacity disabled:opacity-60"
                    >
                      {QUOTE_ENDPOINT ? (
                        <>{status === 'sending' ? 'Sending' : 'Send request'} <ArrowUpRight size={16} weight="bold" /></>
                      ) : (
                        <><WhatsappLogo size={18} weight="fill" /> Send on WhatsApp</>
                      )}
                    </button>
                    <a href={mailHref} className="link-line inline-flex items-center justify-center gap-2 px-2 py-3 text-sm text-white/70 hover:text-white">
                      <EnvelopeSimple size={16} /> Email us instead
                    </a>
                  </div>

                  <p className="border-t border-white/10 pt-5 text-sm text-white/55">
                    Prefer a call?{' '}
                    <a href={CONTACT.phoneHref} className="link-line tabular text-white">{CONTACT.phoneDisplay}</a>
                  </p>
                </form>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
