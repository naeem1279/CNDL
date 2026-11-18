/**
 * Site tracking. Each event goes to GA4 (through the first-party tagging server, which
 * forwards it to Meta CAPI) and to the Meta Pixel in the browser. Both copies share one
 * `event_id`, so Meta counts them once. No personal data (names, phones, emails) is sent.
 */
export type TrackEvent = 'generate_lead' | 'submit_case' | 'whatsapp_click' | 'phone_click';

type Fbq = ((...args: unknown[]) => void) & {
  callMethod?: (...args: unknown[]) => void;
  queue?: unknown[];
  loaded?: boolean;
  version?: string;
  push?: unknown;
};

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
    fbq?: Fbq;
    _fbq?: Fbq;
  }
}

/** Public Meta dataset (Pixel) ID, an identifier rather than a secret. */
const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID || '1116147091320191';

const newEventId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

/** Meta's standard loader: queues calls until fbevents.js arrives. Safe to call repeatedly. */
function getFbq(): Fbq {
  if (window.fbq) return window.fbq;
  const n: Fbq = (...args: unknown[]) => {
    if (n.callMethod) n.callMethod(...args);
    else n.queue?.push(args);
  };
  n.push = n;
  n.loaded = true;
  n.version = '2.0';
  n.queue = [];
  window.fbq = n;
  window._fbq = window._fbq || n;
  const s = document.createElement('script');
  s.async = true;
  s.src = 'https://connect.facebook.net/en_US/fbevents.js';
  document.head.appendChild(s);
  n('init', META_PIXEL_ID);
  return n;
}

export function trackPageView() {
  if (typeof window === 'undefined') return;
  try {
    getFbq()('track', 'PageView', {}, { eventID: newEventId() });
  } catch {
    // tracking must never break the page
  }
}

export function track(event: TrackEvent, params: Record<string, unknown> = {}) {
  if (typeof window === 'undefined') return;
  try {
    const event_id = newEventId();
    (window.dataLayer = window.dataLayer || []).push({ event, event_id, ...params });
    window.gtag?.('event', event, { event_id, ...params });
    // The CAPI tag reports generate_lead as Lead; other events keep their names.
    if (event === 'generate_lead') getFbq()('track', 'Lead', params, { eventID: event_id });
    else getFbq()('trackCustom', event, params, { eventID: event_id });
  } catch {
    // tracking must never break the page
  }
}
