import { describe, expect, it } from 'vitest';
import { dotScale, periodChip, shouldAdvance, wrapIndex } from './carousel';

describe('wrapIndex', () => {
  it('wraps forwards and backwards', () => {
    expect(wrapIndex(4, 4)).toBe(0);
    expect(wrapIndex(-1, 4)).toBe(3);
    expect(wrapIndex(9, 4)).toBe(1);
    expect(wrapIndex(2, 0)).toBe(0);
  });
});

describe('dotScale', () => {
  it("shrinks dots with distance from the active one, like Prime's", () => {
    expect([0, 1, 2, 3, 4].map((d) => dotScale(d, 0, 5))).toEqual([1, 1, 0.75, 0.75, 1]);
    expect([0, 1, 2, 3, 4, 5, 6].map((d) => dotScale(d, 0, 7))).toEqual([
      1, 1, 0.75, 0.5, 0.5, 0.75, 1,
    ]);
  });
});

describe('shouldAdvance', () => {
  const idle = { paused: false, engaged: false, reducedMotion: false, hidden: false };

  it('advances only when idle', () => {
    expect(shouldAdvance(idle)).toBe(true);
    expect(shouldAdvance({ ...idle, paused: true })).toBe(false);
    expect(shouldAdvance({ ...idle, engaged: true })).toBe(false);
    expect(shouldAdvance({ ...idle, reducedMotion: true })).toBe(false);
    expect(shouldAdvance({ ...idle, hidden: true })).toBe(false);
  });
});

describe('periodChip', () => {
  it('shortens periods for the chip', () => {
    expect(periodChip('2026-05', null)).toBe('2026');
    expect(periodChip('2025-08', '2025-12')).toBe('2025');
    expect(periodChip('2023', '2026')).toBe('2023–26');
  });
});
