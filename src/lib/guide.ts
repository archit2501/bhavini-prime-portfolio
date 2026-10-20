import { formatPeriod, monthIndex } from './catalog';
import type { Guide } from './catalog-schema';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export type GuideEntry = Guide['entries'][number];

/** Months since year 0 (monthIndex) for a Date. */
export function dateIndex(date: Date): number {
  return date.getUTCFullYear() * 12 + date.getUTCMonth();
}

/** How far through its month a date is, 0-1. */
export function monthFraction(date: Date): number {
  const days = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)).getUTCDate();
  return (date.getUTCDate() - 1) / days;
}

export interface AxisMonth {
  index: number;
  /** "Jan", "Feb" ... */
  label: string;
  /** "Jan 2023" for screen readers and the year markers. */
  full: string;
  /** January starts a new year on the axis. */
  newYear: boolean;
}

export interface Axis {
  start: number;
  /** Inclusive. */
  end: number;
  months: AxisMonth[];
}

/** The time axis: January of the first year in the guide to two months past now. O(m). */
export function guideAxis(guide: Guide, now: Date): Axis {
  const nowIndex = dateIndex(now);
  const firstYear = Math.min(...guide.entries.map((e) => Number(e.start.slice(0, 4))));
  const start = firstYear * 12;
  const end = Math.max(
    nowIndex + 2,
    ...guide.entries.map((e) => (e.end === null ? nowIndex : monthIndex(e.end, 'end'))),
  );
  const months: AxisMonth[] = [];
  for (let i = start; i <= end; i++) {
    const label = MONTHS[i % 12];
    months.push({ index: i, label, full: `${label} ${Math.floor(i / 12)}`, newYear: i % 12 === 0 });
  }
  return { start, end, months };
}

export interface Programme {
  kind: 'programme';
  entry: GuideEntry;
  /** Inclusive month indexes, clamped to the axis. */
  from: number;
  to: number;
  span: number;
  period: string;
  onNow: boolean;
}

export interface Gap {
  kind: 'gap';
  span: number;
}

export type Cell = Programme | Gap;

/** Where an entry sits on the axis; an open-ended entry runs to now. */
function placement(e: GuideEntry, axis: Axis, nowIndex: number) {
  const from = Math.max(axis.start, monthIndex(e.start));
  const to = Math.min(axis.end, e.end === null ? nowIndex : monthIndex(e.end, 'end'));
  return { from, to };
}

/**
 * Interval partitioning: entries that overlap in time go to separate lanes, so no two blocks in
 * a row ever cover each other. Greedy over entries sorted by start, O(n log n + n x lanes).
 */
export function lanes(entries: GuideEntry[], axis: Axis, nowIndex: number): GuideEntry[][] {
  const placed = entries
    .map((entry) => ({ entry, ...placement(entry, axis, nowIndex) }))
    .sort((a, b) => a.from - b.from || a.to - b.to);
  const result: { ends: number; items: GuideEntry[] }[] = [];
  for (const { entry, from, to } of placed) {
    const lane = result.find((l) => l.ends < from);
    if (lane) {
      lane.items.push(entry);
      lane.ends = to;
    } else result.push({ ends: to, items: [entry] });
  }
  return result.map((l) => l.items);
}

/** One lane as table cells: gaps and programmes that together span the whole axis. O(n). */
export function laneCells(lane: GuideEntry[], axis: Axis, nowIndex: number): Cell[] {
  const cells: Cell[] = [];
  let cursor = axis.start;
  for (const entry of lane) {
    const { from, to } = placement(entry, axis, nowIndex);
    if (from > cursor) cells.push({ kind: 'gap', span: from - cursor });
    cells.push({
      kind: 'programme',
      entry,
      from,
      to,
      span: to - from + 1,
      period: formatPeriod(entry.start, entry.end),
      onNow: entry.end === null,
    });
    cursor = to + 1;
  }
  if (cursor <= axis.end) cells.push({ kind: 'gap', span: axis.end - cursor + 1 });
  return cells;
}

export interface Channel {
  id: string;
  name: string;
  lanes: Cell[][];
  /** What is on now (an open-ended entry), if anything. */
  onNow?: GuideEntry;
  /** Otherwise the channel's most recent entry. */
  lastAired?: GuideEntry;
}

/** Every track as a channel, in guide order. O(n log n). */
export function guideChannels(guide: Guide, axis: Axis, now: Date): Channel[] {
  const nowIndex = dateIndex(now);
  return guide.tracks.map((track) => {
    const entries = guide.entries.filter((e) => e.track === track.id);
    const onNow = entries.find((e) => e.end === null);
    const ended = entries
      .flatMap((e) => (e.end === null ? [] : [{ e, end: monthIndex(e.end, 'end') }]))
      .sort((a, b) => b.end - a.end)
      .map(({ e }) => e);
    return {
      id: track.id,
      name: track.name,
      lanes: lanes(entries, axis, nowIndex).map((lane) => laneCells(lane, axis, nowIndex)),
      onNow,
      lastAired: onNow ? undefined : ended[0],
    };
  });
}

/** Months from the axis start to now, with the fraction of this month: where the line goes. */
export function nowOffset(axis: Axis, now: Date): number {
  return dateIndex(now) - axis.start + monthFraction(now);
}

/** The white pill over the guide: "20 Oct 2026". */
export function nowLabel(now: Date): string {
  return `${now.getUTCDate()} ${MONTHS[now.getUTCMonth()]} ${now.getUTCFullYear()}`;
}
