import { describe, expect, it } from 'vitest';
import { monthsSince, seasonProgress, tenureLabel } from './tenure';

const oct20 = new Date(2026, 9, 20);

describe('monthsSince', () => {
  it('counts whole calendar months', () => {
    expect(monthsSince('2026-05', oct20)).toBe(5);
    expect(monthsSince('2025-10', oct20)).toBe(12);
    expect(monthsSince('2026', oct20)).toBe(9);
    expect(monthsSince('2027-01', oct20)).toBe(0);
  });
});

describe('seasonProgress', () => {
  it('measures a 12-month season', () => {
    expect(seasonProgress('2026-05', oct20)).toBeCloseTo(0.47, 2);
  });

  it('stays visibly in progress at both ends', () => {
    expect(seasonProgress('2026-10', new Date(2026, 9, 1))).toBe(0.05);
    expect(seasonProgress('2024-01', oct20)).toBe(0.95);
  });
});

describe('tenureLabel', () => {
  it('reads naturally', () => {
    expect(tenureLabel('2026-05', oct20)).toBe('5 months in');
    expect(tenureLabel('2026-09', oct20)).toBe('1 month in');
    expect(tenureLabel('2026-10', oct20)).toBe('Just started');
  });
});
