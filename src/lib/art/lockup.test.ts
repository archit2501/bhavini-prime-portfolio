import { describe, expect, it } from 'vitest';
import { buildLockup, type LockupLine } from './lockup';

const FONTS = new URL('../../../scripts/art/fonts/', import.meta.url).pathname;
const big: LockupLine = {
  text: 'CHRIST',
  font: 'PlayfairDisplay-Black.ttf',
  size: 1,
  fill: '#fff',
};
const small: LockupLine = {
  text: 'UNIVERSITY',
  font: 'Inter-Bold.ttf',
  size: 0.22,
  tracking: 0.62,
  fill: '#f2cf63',
};

describe('buildLockup', () => {
  it('stacks lines and keeps each line its own colour', () => {
    const l = buildLockup([big, small], FONTS);
    expect(l.paths.map((p) => p.fill)).toEqual(['#fff', '#f2cf63']);
    expect(l.paths.every((p) => p.d.length > 50)).toBe(true);
    expect(l.viewBox).toBe(`0 0 ${l.width} ${l.height}`);
  });

  it('is as wide as its widest line, indent included', () => {
    const plain = buildLockup([big], FONTS);
    const indented = buildLockup([{ ...big, indent: 0.5 }], FONTS);
    expect(indented.width).toBeCloseTo(plain.width + 50, 1);
  });

  it('leaves a gap based on the larger of two neighbouring lines', () => {
    // A small kicker above a big line gets the same breathing room as one below it.
    const below = buildLockup([big, small], FONTS).height;
    const above = buildLockup([small, big], FONTS).height;
    expect(below).toBeGreaterThan(0.74 * 100 + 0.14 * 100);
    expect(above).toBeGreaterThan(0.74 * 100 + 0.14 * 100);
  });

  it('scales with the base size', () => {
    expect(buildLockup([big], FONTS, 200).width).toBeCloseTo(
      2 * buildLockup([big], FONTS).width,
      1,
    );
  });
});
