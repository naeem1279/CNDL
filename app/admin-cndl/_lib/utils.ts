/* Formatting and validation helpers shared by the console sections. */
import { UPLOAD_MAX_BYTES, UPLOAD_TYPES } from './constants';
import type { Message } from './types';

/** Today's date as a yyyy-mm-dd string for <input type="date"> (local time). */
export function todayInput(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Date part only of an ISO timestamp (e.g. "12 Oct 2026"). */
export function formatDay(iso: string | null | undefined): string {
  if (!iso) return '—';
  const full = formatDate(iso);
  return full === '—' ? '—' : full.split(',')[0];
}

export function formatBDT(n: number) {
  const v = Math.round(n || 0);
  return `${v < 0 ? '-' : ''}৳${Math.abs(v).toLocaleString('en-IN')}`;
}

const BD_OFFSET_MS = 6 * 60 * 60 * 1000;

/** "YYYY-MM" of a timestamp in Bangladesh time (UTC+6), the same month
    boundaries /api/admin/erp/overview-metrics uses. Empty for bad input. */
export function bdMonthKey(iso: string | null | undefined): string {
  if (!iso) return '';
  const t = new Date(iso).getTime();
  return Number.isNaN(t) ? '' : new Date(t + BD_OFFSET_MS).toISOString().slice(0, 7);
}

/** "November 2026" for "2026-11"; anything else is returned as stored. */
export function monthLabel(key: string, short = false): string {
  const m = /^(\d{4})-(\d{2})$/.exec(key || '');
  if (!m) return key || '—';
  return new Date(Date.UTC(+m[1], +m[2] - 1, 1)).toLocaleDateString('en-GB', {
    month: short ? 'short' : 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

/** Client-side check before uploading: returns an error message, or null if OK. */
export function checkImageFile(file: File): string | null {
  if (!UPLOAD_TYPES.includes(file.type)) return 'Use a JPEG, PNG, WebP, GIF or AVIF image';
  if (file.size > UPLOAD_MAX_BYTES) return `Image is ${(file.size / 1048576).toFixed(1)} MB — the limit is 10 MB`;
  return null;
}

export function apiError(body: unknown, fallback: string): string {
  const b = (body ?? {}) as { issues?: unknown; error?: unknown };
  if (Array.isArray(b.issues) && typeof b.issues[0] === 'string' && b.issues[0]) return b.issues[0];
  if (typeof b.error === 'string' && b.error && b.error !== 'Validation failed') return b.error;
  return fallback;
}

export function slugify(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export function parseClinical(productType: string | null) {
  const out = { patient: '', work: '', teeth: '', shade: '', notes: '', trial: '', insertion: '' };
  if (!productType) return out;
  const work: string[] = [];
  for (const seg of productType.split(' | ')) {
    const m = seg.match(/^(Patient|Teeth|Shade|Notes|Trial|Insertion):\s*([\s\S]*)$/);
    if (m) out[m[1].toLowerCase() as 'patient' | 'teeth' | 'shade' | 'notes' | 'trial' | 'insertion'] = m[2];
    else work.push(seg);
  }
  out.work = work.join(' | ');
  return out;
}

export function formatDate(iso: string | null | undefined) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** Normalize BD phone numbers to their last-10-digit core for matching
    (01XXXXXXXXX / 8801XXXXXXXXX → same core) — used for lead↔account dedupe. */
export function phoneCore(p: string | null | undefined) {
  const d = (p || '').replace(/\D/g, '');
  return d.length > 10 ? d.slice(-10) : d;
}

/** Single-৳ price label — strips any ৳/whitespace already stored in the value
    so a "৳3500" DB value can never render as "৳৳3500". */
export function priceLabel(v: string | null | undefined) {
  const clean = (v || '').replace(/[৳\s]/g, '');
  return clean ? `৳${clean}` : 'Quote';
}

export function phoneLinks(phone: string): { tel: string; wa: string } | null {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 9) return null;
  let wa = digits;
  if (wa.startsWith('880')) {
    // already international
  } else if (wa.startsWith('0')) {
    wa = '880' + wa.slice(1);
  } else if (wa.length === 10) {
    wa = '880' + wa; // 1XXXXXXXXX → 8801XXXXXXXXX
  }
  return { tel: phone, wa };
}

/**
 * Best-effort callable/WhatsApp number from an inquiry.
 * Quote-request call-backs submit `callback+<digits>@cndl-global.com` placeholder
 * emails; some senders also type a Bangladeshi number inside the message body.
 */
export function extractWaPhone(msg: Message): string | null {
  const candidates: string[] = [];
  // The phone the sender typed into the form wins.
  const typed = (msg.phone || '').replace(/\D/g, '');
  if (typed.length >= 10) candidates.push(typed);
  const local = msg.email.split('@')[0] ?? '';
  const digitsFromEmail = local.replace(/\D/g, '');
  if (digitsFromEmail.length >= 10) candidates.push(digitsFromEmail);
  const inBody = msg.message.match(/(?:\+?88)?01[3-9]\d{8}/);
  if (inBody) candidates.push(inBody[0].replace(/\D/g, ''));
  for (const c of candidates) {
    if (c.startsWith('880')) return c;
    if (c.startsWith('0')) return '880' + c.slice(1);
    if (c.length === 10) return '880' + c;
  }
  return null;
}

/** Reads a saved preference; safe on the server and in private mode. */
export function readPref(key: string): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}
