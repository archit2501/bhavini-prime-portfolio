import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { contrastRatio, parseHex, relativeLuminance } from '../src/lib/color';

const css = readFileSync(new URL('../src/styles/tokens.css', import.meta.url), 'utf8');
const root = css.slice(css.indexOf(':root {'), css.indexOf('}', css.indexOf(':root {')));
const t: Record<string, string> = Object.fromEntries(
  [...root.matchAll(/--([\w-]+):\s*(#[0-9a-f]{3,6});/gi)].map((m) => [m[1], m[2]]),
);

describe('color math', () => {
  it('parses short and long hex', () => {
    expect(parseHex('#fff')).toEqual([255, 255, 255]);
    expect(parseHex('00050d')).toEqual([0, 5, 13]);
    expect(() => parseHex('navy')).toThrow('Not a hex colour');
  });

  it('matches the WCAG reference values', () => {
    expect(relativeLuminance('#000000')).toBe(0);
    expect(relativeLuminance('#ffffff')).toBeCloseTo(1);
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21);
    expect(contrastRatio('#ffffff', '#000000')).toBeCloseTo(21);
  });
});

describe('design tokens (WCAG 2.2 AA)', () => {
  it('reads the measured Prime Video values', () => {
    expect(t['color-bg']).toBe('#00050d');
    expect(t['color-accent']).toBe('#1a98ff');
    expect(t['color-chip']).toBe('#33373d');
  });

  it('every text colour passes 4.5:1 on the page background', () => {
    for (const name of [
      'color-text',
      'color-text-synopsis',
      'color-text-muted',
      'color-text-meta',
      'color-text-subtle',
      'color-footer-text',
      'color-footer-link',
      'color-mint',
      'color-crown',
    ]) {
      expect(contrastRatio(t[name], t['color-bg']), name).toBeGreaterThanOrEqual(4.5);
    }
  });

  it('text passes 4.5:1 on raised surfaces and black hover panels', () => {
    for (const surface of ['color-surface', 'color-surface-raised', 'color-chip', 'color-panel']) {
      expect(contrastRatio(t['color-text'], t[surface]), surface).toBeGreaterThanOrEqual(4.5);
    }
    expect(contrastRatio(t['color-text-meta'], t['color-panel'])).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(t['color-text-meta'], t['color-surface'])).toBeGreaterThanOrEqual(4.5);
  });

  it('dark text on white buttons and ribbons passes 4.5:1', () => {
    expect(contrastRatio(t['color-on-light'], t['color-btn-solid'])).toBeGreaterThanOrEqual(4.5);
  });

  it('the check icon and Prime blue pass 3:1 as non-text graphics', () => {
    expect(contrastRatio(t['color-check'], t['color-bg'])).toBeGreaterThanOrEqual(3);
    expect(contrastRatio(t['color-accent'], t['color-bg'])).toBeGreaterThanOrEqual(3);
  });
});
