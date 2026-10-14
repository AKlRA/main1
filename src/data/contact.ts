export const CONTACT = {
  email: 'info.axoraa@gmail.com',
  phoneDisplay: '+91 82776 30021',
  phoneHref: 'tel:+918277630021',
  whatsapp: '918277630021',
  linkedin: 'https://www.linkedin.com/company/axoraaa',
  github: 'https://github.com/aksharkh',
  city: 'Bengaluru, India',
} as const;

/** Set VITE_QUOTE_ENDPOINT (e.g. a Google Apps Script URL) to store quote requests. */
export const QUOTE_ENDPOINT: string | undefined = import.meta.env.VITE_QUOTE_ENDPOINT || undefined;

const QUOTE_EVENT = 'open-quote-modal';

export function openQuote() {
  window.dispatchEvent(new Event(QUOTE_EVENT));
}

export function onOpenQuote(handler: () => void) {
  window.addEventListener(QUOTE_EVENT, handler);
  return () => window.removeEventListener(QUOTE_EVENT, handler);
}
