import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Keeps Amazon's marks out of the site (decision Q2, research/02-market-tech.md §5). The look
 * matches Prime Video, but the names, fonts, hosted art and feature labels are Amazon's, so the
 * only place they may appear is the footer disclaimer below.
 */
const ROOT = new URL('..', import.meta.url).pathname;
const TEXT_FILE = /\.(astro|css|ts|js|mjs|json|md|svg|html|txt|xml|webmanifest|vtt)$/;
const DISCLAIMER = 'Not affiliated with Amazon, Prime Video or IMDb.';

// Checked everywhere, including source comments: these can never ship.
const ALWAYS: [RegExp, string][] = [
  [/amazon ember|ember modern|prime video sharp/i, "Amazon's proprietary font"],
  [/m\.media-amazon\.com|images-amazon\.com|aboutamazon\.com/i, 'art hosted by Amazon'],
];
// Checked in what visitors see (public/ and the built site), after removing the disclaimer.
const VISIBLE: [RegExp, string][] = [
  [/\bprime video\b/i, '"Prime Video"'],
  [/\bamazon\b/i, '"Amazon"'],
  [/\bimdb\b/i, '"IMDb"'],
  [/\bx-ray\b/i, 'the "X-Ray" feature name'],
  [/included with prime/i, '"Included with Prime"'],
  [/\b(prime|amazon) originals?\b/i, '"Prime/Amazon Original"'],
  [/\bjoin prime\b/i, '"Join Prime"'],
];

function files(dir: string): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return files(path);
    return TEXT_FILE.test(name) ? [path] : [];
  });
}

function brandViolations(paths: string[], visible: boolean): string[] {
  const found: string[] = [];
  for (const path of paths) {
    const text = readFileSync(path, 'utf8');
    const where = relative(ROOT, path);
    for (const [pattern, label] of ALWAYS) if (pattern.test(text)) found.push(`${where}: ${label}`);
    if (!visible) continue;
    const shown = text.split(DISCLAIMER).join('');
    for (const [pattern, label] of VISIBLE)
      if (pattern.test(shown)) found.push(`${where}: ${label}`);
  }
  return found;
}

describe('brand guard', () => {
  it('finds no Amazon fonts or Amazon-hosted art in src/', () => {
    expect(brandViolations(files(join(ROOT, 'src')), false)).toEqual([]);
  });

  it('finds no Amazon marks in public/', () => {
    expect(brandViolations(files(join(ROOT, 'public')), true)).toEqual([]);
  });

  // CI runs this file again after `npm run build`, so the built pages are scanned too.
  it.skipIf(!existsSync(join(ROOT, 'dist')))('finds no Amazon marks in the built site', () => {
    const built = files(join(ROOT, 'dist'));
    expect(built.length).toBeGreaterThan(0);
    expect(brandViolations(built, true)).toEqual([]);
  });

  it('keeps "prime" and "amazon" out of the domain', () => {
    const cname = join(ROOT, 'public', 'CNAME');
    if (!existsSync(cname)) return;
    expect(readFileSync(cname, 'utf8').toLowerCase()).not.toMatch(/prime|amazon/);
  });

  it('allows the footer disclaimer and catches each kind of violation', () => {
    const sample = join(ROOT, 'tests', 'fixtures', 'brand-violations.html');
    const where = 'tests/fixtures/brand-violations.html';
    expect(brandViolations([sample], true)).toEqual([
      `${where}: Amazon's proprietary font`,
      `${where}: art hosted by Amazon`,
      `${where}: "Prime Video"`,
      `${where}: "Amazon"`,
      `${where}: "IMDb"`,
      `${where}: the "X-Ray" feature name`,
      `${where}: "Included with Prime"`,
      `${where}: "Prime/Amazon Original"`,
      `${where}: "Join Prime"`,
    ]);
  });
});
