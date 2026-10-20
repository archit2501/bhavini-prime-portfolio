import { parseMonth } from './catalog';

/** Whole months from a YYYY-MM start to `now` (May 2026 to 20 Oct 2026 is 5). Never negative. */
export function monthsSince(start: string, now: Date): number {
  const { year, month = 1 } = parseMonth(start);
  return Math.max(0, (now.getFullYear() - year) * 12 + (now.getMonth() + 1 - month));
}

/**
 * How far into a "season" (default 12 months) the role is, for the Continue watching bar.
 * Kept between 5% and 95% so the bar always reads as in progress, never empty or finished.
 */
export function seasonProgress(start: string, now: Date, seasonMonths = 12): number {
  const { year, month = 1 } = parseMonth(start);
  const startMs = Date.UTC(year, month - 1, 1);
  const days = (now.getTime() - startMs) / 86_400_000;
  const progress = days / (seasonMonths * 30.44);
  return Math.min(0.95, Math.max(0.05, progress));
}

/** "5 months in" / "1 month in" / "Just started". */
export function tenureLabel(start: string, now: Date): string {
  const m = monthsSince(start, now);
  if (m === 0) return 'Just started';
  return `${m} month${m === 1 ? '' : 's'} in`;
}
