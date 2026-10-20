import { describe, expect, it } from 'vitest';
import { loadContent } from '../../tests/fixtures/catalog';
import type { Guide } from './catalog-schema';
import {
  dateIndex,
  guideAxis,
  guideChannels,
  laneCells,
  lanes,
  monthFraction,
  nowLabel,
  nowOffset,
  type Programme,
} from './guide';

const { guide } = loadContent();
const now = new Date(Date.UTC(2026, 9, 20)); // 20 Oct 2026
const axis = guideAxis(guide, now);
const nowIndex = dateIndex(now);

describe('time', () => {
  it('turns dates into month indexes and fractions', () => {
    expect(dateIndex(now)).toBe(2026 * 12 + 9);
    expect(monthFraction(new Date(Date.UTC(2026, 9, 1)))).toBe(0);
    expect(monthFraction(new Date(Date.UTC(2026, 1, 15)))).toBeCloseTo(0.5, 5);
    expect(nowLabel(now)).toBe('20 Oct 2026');
  });
});

describe('guideAxis', () => {
  it('runs from January of the first year to the end of the last programme', () => {
    expect(axis.months[0]).toEqual({
      index: 2023 * 12,
      label: 'Jan',
      full: 'Jan 2023',
      newYear: true,
    });
    // Christ University's "2026" runs to December, past now + 2.
    expect(axis.months.at(-1)?.full).toBe('Dec 2026');
    expect(axis.months).toHaveLength(48);
    expect(axis.months.filter((m) => m.newYear).map((m) => m.full)).toEqual([
      'Jan 2023',
      'Jan 2024',
      'Jan 2025',
      'Jan 2026',
    ]);
  });

  it('keeps two months of runway past now', () => {
    const short: Guide = {
      tracks: [{ id: 'a', name: 'A' }],
      entries: [{ track: 'a', label: 'x', start: '2025-03', end: '2025-04' }],
    };
    expect(guideAxis(short, now).months.at(-1)?.full).toBe('Dec 2026');
    const open: Guide = { ...short, entries: [{ ...short.entries[0], end: null }] };
    expect(guideAxis(open, new Date(Date.UTC(2025, 6, 1))).months.at(-1)?.full).toBe('Sep 2025');
  });

  it('puts the now line inside the current month', () => {
    expect(nowOffset(axis, now)).toBeCloseTo(45 + 19 / 31, 5);
  });
});

describe('lanes', () => {
  const entry = (start: string, end: string | null, label = start) => ({
    track: 't',
    label,
    start,
    end,
  });

  it('stacks overlapping programmes and reuses a lane once it is free', () => {
    const result = lanes(
      [
        entry('2023', '2026', 'degree'),
        entry('2023-04', '2023-04', 'school'),
        entry('2023-06', '2023-08', 'summer'),
      ],
      axis,
      nowIndex,
    );
    expect(result.map((l) => l.map((e) => e.label))).toEqual([['degree'], ['school', 'summer']]);
    // Same start: the shorter one goes first.
    const tie = lanes(
      [entry('2024-01', '2024-06', 'long'), entry('2024-01', '2024-02', 'short')],
      axis,
      nowIndex,
    );
    expect(tie.map((l) => l.map((e) => e.label))).toEqual([['short'], ['long']]);
  });

  it('lays a lane out as gaps and programmes covering the whole axis', () => {
    const cells = laneCells([entry('2024-04', '2024-06'), entry('2026-05', null)], axis, nowIndex);
    expect(cells.map((c) => [c.kind, c.span])).toEqual([
      ['gap', 15],
      ['programme', 3],
      ['gap', 22],
      ['programme', 6],
      ['gap', 2],
    ]);
    expect(cells.reduce((sum, c) => sum + c.span, 0)).toBe(axis.months.length);
    const live = cells[3] as Programme;
    expect(live).toMatchObject({ onNow: true, period: 'May 2026 – now' });
    expect((cells[1] as Programme).onNow).toBe(false);
  });

  it('clamps a programme to the axis and leaves no trailing gap at the end', () => {
    const cells = laneCells([entry('2022-06', '2027-03')], axis, nowIndex);
    expect(cells).toHaveLength(1);
    expect(cells[0]).toMatchObject({ kind: 'programme', span: 48 });
  });
});

describe('guideChannels', () => {
  const channels = guideChannels(guide, axis, now);

  it('makes a channel per track, in order', () => {
    expect(channels.map((c) => c.name)).toEqual([
      'Sales & Operations',
      'Marketing & Brand',
      'Psychology & Clinical',
      'Community',
      'Leadership',
      'Education',
      'Certifications',
    ]);
  });

  it('has F1Jobs.io on now, and when each other channel last aired', () => {
    expect(channels[0].onNow?.label).toBe('F1Jobs.io');
    expect(channels[0].lastAired).toBeUndefined();
    expect(channels[1].onNow).toBeUndefined();
    expect(channels[1].lastAired?.label).toBe('Vastra Kala');
    expect(channels[6].lastAired?.label).toBe(
      'HubSpot Digital Marketing and Social Media Marketing',
    );
  });

  it('gives Education two lanes, so school and degree never overlap', () => {
    const education = channels.find((c) => c.id === 'education');
    expect(education?.lanes).toHaveLength(2);
    const labels = education?.lanes.map((lane) =>
      lane.flatMap((c) => (c.kind === 'programme' ? [c.entry.label] : [])),
    );
    expect(labels).toEqual([['Christ University'], ['Cambridge Innovative School']]);
  });

  it('copes with a channel that has nothing on', () => {
    const empty = guideChannels({ tracks: [{ id: 'x', name: 'X' }], entries: [] }, axis, now);
    expect(empty[0]).toMatchObject({ onNow: undefined, lastAired: undefined, lanes: [] });
  });
});
