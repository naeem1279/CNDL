/**
 * Lab-case list filters: parsing, defaults, the work-category rule and CSV encoding.
 * Pure (no imports) so the API routes, the page and the tests share one definition.
 */

export const PAGE_SIZES = [20, 50, 100] as const;
export const DEFAULT_SIZE = 20;
export const MAX_EXPORT_ROWS = 20000;

export const STAGE_VALUES = ['Received', 'Designing', 'Milling', 'Quality Control', 'Dispatched', 'Delivered', 'Cancelled'] as const;
/** Stored status values that mean each stage (older rows hold legacy values). */
export const STATUS_ALIASES: Record<string, string[]> = {
  Received: ['Received', 'PENDING'],
  Designing: ['Designing'],
  Milling: ['Milling', 'Production'],
  'Quality Control': ['Quality Control', 'QC'],
  Dispatched: ['Dispatched'],
  Delivered: ['Delivered'],
  Cancelled: ['Cancelled'],
};
/** Out of the lab: nothing more to do on the bench. */
export const DONE_STATUSES = [...STATUS_ALIASES.Dispatched, ...STATUS_ALIASES.Delivered, ...STATUS_ALIASES.Cancelled];

export const SORT_KEYS = ['created', 'due', 'case', 'client', 'stage', 'amount'] as const;
export type SortKey = (typeof SORT_KEYS)[number];
export const BILLING_VALUES = ['unbilled', 'billed', 'invoiced'] as const;
export type Billing = (typeof BILLING_VALUES)[number];
export const BILLING_LABEL: Record<Billing, string> = {
  unbilled: 'No amount set',
  billed: 'Amount set, not invoiced',
  invoiced: 'Invoiced',
};
export const SOURCE_VALUES = ['OFFLINE_RIDER', 'PHONE', 'WHATSAPP', 'ONLINE'] as const;

/**
 * Work categories, matched on the work description (first match wins, in this order). A stored
 * category column is planned; until then this keyword rule is the single definition.
 */
export const CATEGORIES: { key: string; label: string; words: string[] }[] = [
  { key: 'zirconia', label: 'Zirconia & All-Ceramic', words: ['zirconia', 'zircon', 'emax', 'e.max', 'e-max', 'lithium', 'all-ceramic', 'all ceramic', 'veneer', 'inlay', 'onlay', 'monolithic'] },
  { key: 'pfm', label: 'Porcelain (PFM)', words: ['pfm', 'porcelain', 'metal ceramic', 'metal-ceramic', 'ni-cr', 'nicr', 'co-cr', 'cocr'] },
  { key: 'denture', label: 'Dentures & Ortho', words: ['denture', 'ortho', 'retainer', 'aligner', 'splint', 'night guard', 'nightguard', 'acrylic'] },
];
export const CATEGORY_KEYS = [...CATEGORIES.map((c) => c.key), 'other'];
export const CATEGORY_LABEL: Record<string, string> = { ...Object.fromEntries(CATEGORIES.map((c) => [c.key, c.label])), other: 'Other work' };

export function categoryOf(productType: string | null | undefined): string {
  const t = (productType || '').toLowerCase();
  for (const c of CATEGORIES) if (c.words.some((w) => t.includes(w))) return c.key;
  return 'other';
}

export type OrderFilters = {
  q: string;
  /** "open" | "late" | "all" | one of STAGE_VALUES */
  stage: string;
  /** yyyy-mm-dd, Bangladesh date of receipt */
  from: string;
  to: string;
  client: string;
  agent: string;
  category: string;
  billing: '' | Billing;
  source: string;
  sort: SortKey;
  dir: 'asc' | 'desc';
  page: number;
  size: number;
};

export const DEFAULT_FILTERS: OrderFilters = {
  q: '', stage: 'open', from: '', to: '', client: '', agent: '', category: '', billing: '', source: '', sort: 'created', dir: 'desc', page: 1, size: DEFAULT_SIZE,
};

const YMD = /^\d{4}-\d{2}-\d{2}$/;
const ID = /^[A-Za-z0-9_-]{1,64}$/;

/** Reads filters from a query string. Anything unknown or malformed falls back to its default. */
export function parseOrderFilters(sp: { get(key: string): string | null }): OrderFilters {
  const d = DEFAULT_FILTERS;
  const pick = <T extends string>(v: string | null, allowed: readonly T[], fallback: T): T => (v && (allowed as readonly string[]).includes(v) ? (v as T) : fallback);
  const size = Number(sp.get('size'));
  const page = Math.floor(Number(sp.get('page')));
  const from = sp.get('from') ?? '';
  const to = sp.get('to') ?? '';
  const id = (k: string) => {
    const v = sp.get(k) ?? '';
    return ID.test(v) ? v : '';
  };
  return {
    q: (sp.get('q') ?? '').trim().slice(0, 100),
    stage: pick(sp.get('stage'), ['open', 'late', 'all', ...STAGE_VALUES], d.stage),
    from: YMD.test(from) ? from : '',
    to: YMD.test(to) ? to : '',
    client: id('client'),
    agent: id('agent'),
    category: pick(sp.get('category'), CATEGORY_KEYS, '' as string),
    billing: pick(sp.get('billing'), BILLING_VALUES, '' as Billing | ''),
    source: pick(sp.get('source'), SOURCE_VALUES, '' as string),
    sort: pick(sp.get('sort'), SORT_KEYS, d.sort),
    dir: sp.get('dir') === 'asc' ? 'asc' : 'desc',
    page: Number.isFinite(page) && page >= 1 ? Math.min(page, 100000) : 1,
    size: (PAGE_SIZES as readonly number[]).includes(size) ? size : d.size,
  };
}

/** Only the non-default filters, so shared links stay short. */
export function filtersToQuery(f: OrderFilters, opts: { withPaging?: boolean } = {}): string {
  const sp = new URLSearchParams();
  const d = DEFAULT_FILTERS;
  if (f.q) sp.set('q', f.q);
  if (f.stage !== d.stage) sp.set('stage', f.stage);
  if (f.from) sp.set('from', f.from);
  if (f.to) sp.set('to', f.to);
  if (f.client) sp.set('client', f.client);
  if (f.agent) sp.set('agent', f.agent);
  if (f.category) sp.set('category', f.category);
  if (f.billing) sp.set('billing', f.billing);
  if (f.source) sp.set('source', f.source);
  if (f.sort !== d.sort) sp.set('sort', f.sort);
  if (f.dir !== d.dir) sp.set('dir', f.dir);
  if (opts.withPaging !== false) {
    if (f.page !== 1) sp.set('page', String(f.page));
    if (f.size !== d.size) sp.set('size', String(f.size));
  }
  return sp.toString();
}

/** Start of a Bangladesh (UTC+6) calendar day as a Date, or null when the input is not yyyy-mm-dd. */
export function bdDayStart(ymd: string): Date | null {
  if (!YMD.test(ymd)) return null;
  const t = Date.parse(`${ymd}T00:00:00+06:00`);
  return Number.isNaN(t) ? null : new Date(t);
}

/** Start of the Bangladesh day that contains `now`. */
export function bdTodayStart(now = new Date()): Date {
  const ymd = new Date(now.getTime() + 6 * 3600000).toISOString().slice(0, 10);
  return bdDayStart(ymd)!;
}

/* ------------------------------------------------------------------ CSV */

/**
 * One CSV cell. Quotes when needed, and neutralises spreadsheet formulas: a value starting with
 * = + - @ (or a tab / CR) gets a leading apostrophe so Excel and Sheets show it as text.
 */
export function csvCell(v: string | number | boolean | null | undefined): string {
  if (v === null || v === undefined) return '';
  let s = typeof v === 'number' ? String(v) : String(v);
  if (typeof v === 'string' && /^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** UTF-8 CSV with a byte-order mark (so Excel reads Bengali text) and CRLF line ends. */
export function toCsv(header: string[], rows: (string | number | boolean | null | undefined)[][]): string {
  return '﻿' + [header, ...rows].map((r) => r.map(csvCell).join(',')).join('\r\n') + '\r\n';
}
