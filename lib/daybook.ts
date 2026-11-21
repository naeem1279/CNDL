/**
 * Day book: Bangladesh (UTC+6) calendar days and the comparison maths.
 * Pure (no imports) so the API, the page and the tests share it.
 */

const BD = 6 * 3600000;
const DAY = 86400000;
const YMD = /^(\d{4})-(\d{2})-(\d{2})$/;

/** Today's date in Bangladesh as yyyy-mm-dd. */
export const bdToday = (now = new Date()) => new Date(now.getTime() + BD).toISOString().slice(0, 10);

/** A valid yyyy-mm-dd that is a real date, else null. */
export function parseDay(v: string | null | undefined): string | null {
  const m = YMD.exec(v || '');
  if (!m) return null;
  const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
  return d.toISOString().slice(0, 10) === v ? v : null;
}

/** [start, end) of a Bangladesh calendar day, as UTC instants. */
export function bdDayRange(ymd: string): { start: Date; end: Date } {
  const start = new Date(Date.parse(`${ymd}T00:00:00Z`) - BD);
  return { start, end: new Date(start.getTime() + DAY) };
}

export const shiftDay = (ymd: string, days: number) => new Date(Date.parse(`${ymd}T00:00:00Z`) + days * DAY).toISOString().slice(0, 10);

/** Change against the day before: absolute and percent (null when the day before was 0). */
export function delta(today: number, before: number): { diff: number; pct: number | null } {
  const diff = today - before;
  return { diff, pct: before === 0 ? null : Math.round((diff / Math.abs(before)) * 100) };
}

/** Human label for a day relative to today ("Today", "Yesterday", "Tue 18 Nov"). */
export function dayLabel(ymd: string, today = bdToday()): string {
  if (ymd === today) return 'Today';
  if (ymd === shiftDay(today, -1)) return 'Yesterday';
  return new Date(`${ymd}T00:00:00Z`).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' });
}
