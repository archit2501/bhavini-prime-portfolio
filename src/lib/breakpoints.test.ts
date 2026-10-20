import { describe, expect, it } from 'vitest';
import { BREAKPOINTS, minWidth } from './breakpoints';

describe('breakpoints', () => {
  it("matches Prime Video's steps", () => {
    expect(Object.values(BREAKPOINTS)).toEqual([448, 600, 880, 1280, 1400, 1800]);
  });

  it('builds em-based media queries like tokens.css', () => {
    expect(minWidth('md')).toBe('(min-width: 55em)');
    expect(minWidth('xl')).toBe('(min-width: 87.5em)');
  });
});
