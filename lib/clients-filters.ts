/**
 * Clients list: filters, the "new" / "no recent order" rules and the row matcher.
 * Pure (no imports outside lib) so the API, the page and the tests share one definition.
 */
import type { ClientType } from './client-types';

/** Same list as CLIENT_TYPES in client-types.ts (kept here so this file has no runtime imports; a test checks they match). */
export const CLIENT_TYPE_KEYS = ['CLINIC', 'HOSPITAL', 'LAB', 'PERSONAL'] as const;

export const CLIENT_PAGE_SIZES = [20, 50, 100] as const;
/** A client with no case for this many days counts as "gone quiet". */
export const DORMANT_DAYS = 60;

export const ACTIVITY_VALUES = ['new', 'dormant', 'never', 'owing'] as const;
export type Activity = (typeof ACTIVITY_VALUES)[number];
export const ACTIVITY_LABEL: Record<Activity, string> = {
  new: 'Added this month',
  dormant: `No case for ${DORMANT_DAYS}+ days`,
  never: 'Never sent a case',
  owing: 'Owes money',
};

export const CLIENT_SORTS = ['name', 'recent', 'balance', 'created', 'cases'] as const;
export type ClientSort = (typeof CLIENT_SORTS)[number];

export type ClientFilters = {
  q: string;
  type: '' | ClientType;
  division: string;
  /** an agent id, "none" for unassigned, or "" for everyone */
  agent: string;
  activity: '' | Activity;
  sort: ClientSort;
  dir: 'asc' | 'desc';
  page: number;
  size: number;
};

export const DEFAULT_CLIENT_FILTERS: ClientFilters = { q: '', type: '', division: '', agent: '', activity: '', sort: 'name', dir: 'asc', page: 1, size: 20 };

const ID = /^[A-Za-z0-9_-]{1,64}$/;
const DIV = /^[A-Z_]{2,30}$/;

export function parseClientFilters(sp: { get(key: string): string | null }): ClientFilters {
  const d = DEFAULT_CLIENT_FILTERS;
  const pick = <T extends string>(v: string | null, allowed: readonly T[], fallback: T): T => (v && (allowed as readonly string[]).includes(v) ? (v as T) : fallback);
  const size = Number(sp.get('size'));
  const page = Math.floor(Number(sp.get('page')));
  const agent = sp.get('agent') ?? '';
  const division = (sp.get('division') ?? '').toUpperCase();
  const sort = pick(sp.get('sort'), CLIENT_SORTS, d.sort);
  const dirRaw = sp.get('dir');
  return {
    q: (sp.get('q') ?? '').trim().slice(0, 100),
    type: pick(sp.get('type'), CLIENT_TYPE_KEYS, '' as ClientType | ''),
    division: DIV.test(division) ? division : '',
    agent: agent === 'none' || ID.test(agent) ? agent : '',
    activity: pick(sp.get('activity'), ACTIVITY_VALUES, '' as Activity | ''),
    sort,
    dir: dirRaw === 'asc' || dirRaw === 'desc' ? dirRaw : sort === 'name' ? 'asc' : 'desc',
    page: Number.isFinite(page) && page >= 1 ? Math.min(page, 100000) : 1,
    size: (CLIENT_PAGE_SIZES as readonly number[]).includes(size) ? size : d.size,
  };
}

export function clientFiltersToQuery(f: ClientFilters): string {
  const sp = new URLSearchParams();
  const d = DEFAULT_CLIENT_FILTERS;
  if (f.q) sp.set('q', f.q);
  if (f.type) sp.set('type', f.type);
  if (f.division) sp.set('division', f.division);
  if (f.agent) sp.set('agent', f.agent);
  if (f.activity) sp.set('activity', f.activity);
  if (f.sort !== d.sort) sp.set('sort', f.sort);
  if (f.dir !== (f.sort === 'name' ? 'asc' : 'desc')) sp.set('dir', f.dir);
  if (f.page !== 1) sp.set('page', String(f.page));
  if (f.size !== d.size) sp.set('size', String(f.size));
  return sp.toString();
}

/** First instant of the current Bangladesh (UTC+6) calendar month. */
export function bdMonthStart(now = new Date()): Date {
  const bd = new Date(now.getTime() + 6 * 3600000);
  return new Date(Date.UTC(bd.getUTCFullYear(), bd.getUTCMonth(), 1) - 6 * 3600000);
}

/** What the list knows about one client. */
export type ClientRowFacts = {
  /** from clientTypeOf() */
  type: ClientType;
  name: string;
  ownerName: string;
  phone: string;
  email: string | null;
  district: string | null;
  address: string | null;
  division: string;
  assignedAgentId: string | null;
  currentBalance: number;
  createdAt: Date;
  lastCaseAt: Date | null;
  caseCount: number;
};

export const isNewThisMonth = (c: Pick<ClientRowFacts, 'createdAt'>, now = new Date()) => c.createdAt >= bdMonthStart(now);

/** Has not sent a case for DORMANT_DAYS days. A client that never sent one counts once its account is that old. */
export function isDormant(c: Pick<ClientRowFacts, 'createdAt' | 'lastCaseAt'>, now = new Date()): boolean {
  const cutoff = now.getTime() - DORMANT_DAYS * 86400000;
  return (c.lastCaseAt ?? c.createdAt).getTime() < cutoff;
}

const digits = (s: string) => s.replace(/\D/g, '');
/** Bangladesh numbers are stored with or without +880 / 0; compare on the local part. */
const phoneKey = (s: string) => digits(s).replace(/^880/, '').replace(/^0/, '');

export function matchesClient(c: ClientRowFacts, f: ClientFilters, now = new Date()): boolean {
  if (f.type && c.type !== f.type) return false;
  if (f.division && c.division !== f.division) return false;
  if (f.agent === 'none' ? c.assignedAgentId : f.agent && c.assignedAgentId !== f.agent) return false;
  if (f.activity === 'new' && !isNewThisMonth(c, now)) return false;
  if (f.activity === 'dormant' && !isDormant(c, now)) return false;
  if (f.activity === 'never' && c.caseCount > 0) return false;
  if (f.activity === 'owing' && !(c.currentBalance > 0)) return false;
  const q = f.q.trim().toLowerCase();
  if (q) {
    const text = [c.name, c.ownerName, c.email, c.district, c.address].some((v) => (v || '').toLowerCase().includes(q));
    const qd = phoneKey(q);
    if (!text && !(qd.length >= 3 && phoneKey(c.phone).includes(qd))) return false;
  }
  return true;
}

export function compareClients(f: ClientFilters): (a: ClientRowFacts, b: ClientRowFacts) => number {
  const s = f.dir === 'asc' ? 1 : -1;
  const time = (d: Date | null) => (d ? d.getTime() : -Infinity);
  return (a, b) => {
    const v =
      f.sort === 'recent' ? time(a.lastCaseAt) - time(b.lastCaseAt)
      : f.sort === 'balance' ? a.currentBalance - b.currentBalance
      : f.sort === 'created' ? a.createdAt.getTime() - b.createdAt.getTime()
      : f.sort === 'cases' ? a.caseCount - b.caseCount
      : a.name.localeCompare(b.name, 'en', { sensitivity: 'base' });
    return v * s || a.name.localeCompare(b.name, 'en', { sensitivity: 'base' });
  };
}
