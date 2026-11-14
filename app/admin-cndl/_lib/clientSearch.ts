/* Client search for the console's client picker (and, later, list filters).
   Pure functions, no imports beyond types, so they are easy to test.

   Matching rules
   - The query is split on spaces; EVERY word must match (name, doctor, phone, division, district, email).
   - Phone numbers match however they were typed: 01743167963, +8801743167963, 1743 167963, 743 …
   - Words that start a name or doctor name rank above words found in the middle.
   - With no query, recently used clients come first, then everyone A–Z. */
import type { ErpAccount } from './types';

const clean = (s: string | null | undefined) => (s ?? '').toLowerCase().normalize('NFKC');

/** Digits of a phone number without the 880 country code or the leading 0. */
export const phoneKey = (s: string | null | undefined) => (s ?? '').replace(/\D/g, '').replace(/^(?:880|0)/, '');

const wordsOf = (s: string) => s.split(/[\s,./()\-_]+/).filter(Boolean);

/** Score of one word against one account; -1 when it does not match. */
function scoreToken(a: ErpAccount, token: string): number {
  const name = clean(a.name);
  const owner = clean(a.ownerName);
  let best = -1;

  if (/^\+?\d+$/.test(token)) {
    const key = phoneKey(token);
    const phone = phoneKey(a.phone);
    if (key.length >= 2 && phone.startsWith(key)) best = 90;
    else if (key.length >= 2 && phone.includes(key)) best = 60;
  }

  if (name.startsWith(token)) best = Math.max(best, 100);
  else if (wordsOf(name).some((w) => w.startsWith(token))) best = Math.max(best, 80);
  if (wordsOf(owner).some((w) => w.startsWith(token))) best = Math.max(best, 70);
  if (name.includes(token)) best = Math.max(best, 50);
  if (owner.includes(token)) best = Math.max(best, 40);
  if (best < 0 && [a.division, a.district, a.email].some((v) => clean(v).includes(token))) best = 20;
  return best;
}

export type ClientSearchResult = {
  /** Best matches, at most `limit`. */
  hits: ErpAccount[];
  /** How many clients matched in total (hits may be a shorter list). */
  matched: number;
  /** With no query: how many of the first hits are "recent" ones. */
  recentCount: number;
};

export function searchClients(accounts: ErpAccount[], query: string, recentIds: string[] = [], limit = 60): ClientSearchResult {
  const byName = (x: ErpAccount, y: ErpAccount) => x.name.localeCompare(y.name, undefined, { sensitivity: 'base' });
  const recentRank = new Map(recentIds.map((id, i) => [id, i]));
  const tokens = clean(query).split(/\s+/).filter(Boolean);

  if (tokens.length === 0) {
    const recent = recentIds.map((id) => accounts.find((a) => a.id === id)).filter((a): a is ErpAccount => !!a);
    const rest = accounts.filter((a) => !recentRank.has(a.id)).sort(byName);
    const all = [...recent, ...rest];
    return { hits: all.slice(0, limit), matched: all.length, recentCount: Math.min(recent.length, limit) };
  }

  const scored: { a: ErpAccount; score: number }[] = [];
  for (const a of accounts) {
    let total = 0;
    let ok = true;
    for (const t of tokens) {
      const s = scoreToken(a, t);
      if (s < 0) {
        ok = false;
        break;
      }
      total += s;
    }
    if (ok) scored.push({ a, score: total });
  }
  scored.sort(
    (x, y) =>
      y.score - x.score ||
      (recentRank.get(x.a.id) ?? 99) - (recentRank.get(y.a.id) ?? 99) ||
      byName(x.a, y.a),
  );
  return { hits: scored.slice(0, limit).map((s) => s.a), matched: scored.length, recentCount: 0 };
}
