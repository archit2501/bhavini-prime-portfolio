import { describe, expect, it } from 'vitest';
import { rng, seedFrom } from './prng';

describe('seedFrom', () => {
  it('is stable and spreads similar strings apart', () => {
    expect(seedFrom('f1jobs:key')).toBe(seedFrom('f1jobs:key'));
    expect(seedFrom('f1jobs:key')).not.toBe(seedFrom('f1jobs:card'));
    expect(seedFrom('')).toBe(0x811c9dc5);
  });
});

describe('rng', () => {
  it('repeats exactly for the same seed', () => {
    const a = rng(42);
    const b = rng(42);
    expect(Array.from({ length: 5 }, () => a.next())).toEqual(
      Array.from({ length: 5 }, () => b.next()),
    );
  });

  it('keeps every helper inside its range', () => {
    const r = rng(7);
    for (let i = 0; i < 2000; i++) {
      const u = r.next();
      expect(u).toBeGreaterThanOrEqual(0);
      expect(u).toBeLessThan(1);
      const x = r.range(-3, 5);
      expect(x).toBeGreaterThanOrEqual(-3);
      expect(x).toBeLessThan(5);
      const n = r.int(20, 30);
      expect(Number.isInteger(n) && n >= 20 && n <= 30).toBe(true);
      expect(Math.abs(r.normal())).toBeLessThanOrEqual(3);
    }
  });

  it('reaches both ends of an integer range', () => {
    const r = rng(1);
    const seen = new Set(Array.from({ length: 500 }, () => r.int(1, 3)));
    expect([...seen].sort()).toEqual([1, 2, 3]);
  });
});
