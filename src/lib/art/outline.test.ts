import { describe, expect, it } from 'vitest';
import { outlineText } from './outline';

const FONTS = new URL('../../../scripts/art/fonts/', import.meta.url).pathname;
const bold = `${FONTS}Inter-ExtraBold.ttf`;

describe('outlineText', () => {
  it('turns text into positioned SVG path data', () => {
    const out = outlineText('bhavini', { font: bold, size: 100 });
    expect(out.d).toMatch(/^M[\d.-]+ [\d.-]+/);
    expect(out.width).toBeGreaterThan(300);
    expect(out.ascent).toBeGreaterThan(80);
    expect(out.descent).toBeGreaterThan(10);
  });

  it('scales linearly with font size', () => {
    const a = outlineText('bhavini', { font: bold, size: 100 }).width;
    const b = outlineText('bhavini', { font: bold, size: 50 }).width;
    expect(b).toBeCloseTo(a / 2, 5);
  });

  it('applies tracking between letters only', () => {
    const plain = outlineText('ab', { font: bold, size: 100 }).width;
    const tight = outlineText('ab', { font: bold, size: 100, tracking: -0.05 }).width;
    expect(plain - tight).toBeCloseTo(5, 5);
    expect(outlineText('a', { font: bold, size: 100, tracking: -0.05 }).width).toBe(
      outlineText('a', { font: bold, size: 100 }).width,
    );
  });

  it('places the run at the requested origin', () => {
    const out = outlineText('i', { font: bold, size: 100, x: 500, y: 900 });
    const xs = [...out.d.matchAll(/[ML](-?[\d.]+) (-?[\d.]+)/g)].map((m) => Number(m[1]));
    expect(Math.min(...xs)).toBeGreaterThanOrEqual(500);
  });

  it('skips glyphs with no outline, like spaces', () => {
    const word = outlineText('ab', { font: bold, size: 100 });
    const spaced = outlineText('a b', { font: bold, size: 100 });
    expect(spaced.width).toBeGreaterThan(word.width);
    expect(spaced.d.split('Z').length).toBe(word.d.split('Z').length);
  });
});
