import { z } from 'zod';

/**
 * Shareholder shares: 100 in total, 1 share = 1% of each profit payout.
 * Holdings may be fractional down to 0.01 (e.g. 0.2 or 0.5 of a share).
 *
 * Sums and comparisons go through whole hundredths so floating-point noise
 * (0.1 + 0.2 = 0.30000000000000004) can never block an allocation or show odd totals.
 */
export const TOTAL_SHARES = 100;
export const MIN_SHARES = 0.01;

/** 2.75 → 275 */
export const toHundredths = (n: number) => Math.round(n * 100);
/** Rounds to 2 decimals. */
export const roundShares = (n: number) => toHundredths(n) / 100;
/** Exact sum of share holdings. */
export const sumShares = (values: number[]) => values.reduce((h, v) => h + toHundredths(v || 0), 0) / 100;
/** Shares still free out of TOTAL_SHARES (never negative). */
export const unallocatedShares = (allocated: number) => Math.max(0, toHundredths(TOTAL_SHARES) - toHundredths(allocated)) / 100;
/** True when n has no more than 2 decimal places. */
export const hasTwoDecimalsAtMost = (n: number) => Math.abs(n * 100 - Math.round(n * 100)) < 1e-6;

/** 3 → "3", 0.5 → "0.5", 2.25 → "2.25" */
export const formatShares = (n: number) => roundShares(n).toLocaleString('en-US', { maximumFractionDigits: 2 });
/** "1 share", "0.5 share", "2.5 shares" — fractions below one read as "share". */
export const sharesLabel = (n: number) => `${formatShares(n)} ${n > 1 ? 'shares' : 'share'}`;
/** A share holding as a profit fraction, e.g. 0.5 share → 0.005. */
export const shareFraction = (n: number) => toHundredths(n) / toHundredths(TOTAL_SHARES);

/** API field: 0.01–100, at most 2 decimals, stored rounded. */
export const sharesField = z.coerce
  .number({ message: 'Shares must be a number' })
  .min(MIN_SHARES, `Shares must be between ${MIN_SHARES} and ${TOTAL_SHARES}`)
  .max(TOTAL_SHARES, `Shares must be between ${MIN_SHARES} and ${TOTAL_SHARES}`)
  .refine(hasTwoDecimalsAtMost, 'Shares can have at most 2 decimal places (e.g. 0.25)')
  .transform(roundShares);
