/**
 * Tracking events pushed to the GTM dataLayer. The GTM web container maps them to
 * Meta Pixel / GA4 tags; the server container forwards them to Meta CAPI.
 * Every event carries an `event_id` so browser and server copies de-duplicate.
 * No personal data (names, phones, emails) is ever sent.
 */
export type TrackEvent = 'generate_lead' | 'submit_case' | 'whatsapp_click' | 'phone_click';

declare global {
  interface Window {
    dataLayer?: Record<string, unknown>[];
  }
}

export function track(event: TrackEvent, params: Record<string, unknown> = {}) {
  if (typeof window === 'undefined') return;
  try {
    const event_id =
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    (window.dataLayer = window.dataLayer || []).push({ event, event_id, ...params });
  } catch {
    // tracking must never break the page
  }
}
