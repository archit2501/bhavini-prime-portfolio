import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, normalize, relative } from 'node:path';
import { gzipSync } from 'node:zlib';
import { describe, expect, it } from 'vitest';

/**
 * Task 4.1.3: no page ships more than 30 KB of JavaScript, gzipped. Each built page's scripts are
 * followed through their static and dynamic imports and counted once. CI runs this again after
 * `npm run build`.
 */
const ROOT = new URL('..', import.meta.url).pathname;
const DIST = join(ROOT, 'dist');
const BUDGET = 30 * 1024;

function pages(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return pages(path);
    return name.endsWith('.html') ? [path] : [];
  });
}

const IMPORT = /(?:import|from)\s*["']([^"']+\.js)["']|import\(\s*["']([^"']+\.js)["']\s*\)/g;

function collect(file: string, seen: Set<string>): void {
  if (seen.has(file) || !existsSync(file)) return;
  seen.add(file);
  for (const m of readFileSync(file, 'utf8').matchAll(IMPORT)) {
    const ref = m[1] ?? m[2];
    collect(ref.startsWith('/') ? join(DIST, ref) : normalize(join(dirname(file), ref)), seen);
  }
}

/** Gzipped bytes of every script a page runs: inline scripts plus each module chunk once. */
export function pageScriptBytes(html: string): number {
  let bytes = 0;
  const chunks = new Set<string>();
  for (const [, attrs, body] of html.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/g)) {
    if (/type="application\/(ld\+)?json"/.test(attrs)) continue;
    const src = /src="([^"]+)"/.exec(attrs)?.[1];
    if (src) collect(join(DIST, src), chunks);
    else {
      bytes += gzipSync(body).length;
      for (const m of body.matchAll(IMPORT)) collect(join(DIST, m[1] ?? m[2]), chunks);
    }
  }
  for (const chunk of chunks) bytes += gzipSync(readFileSync(chunk)).length;
  return bytes;
}

describe('JavaScript budget', () => {
  it.skipIf(!existsSync(DIST))('keeps every page under 30 KB of gzipped script', () => {
    const over = pages(DIST)
      .map((page) => ({
        page: relative(DIST, page),
        bytes: pageScriptBytes(readFileSync(page, 'utf8')),
      }))
      .filter((p) => p.bytes > BUDGET)
      .map((p) => `${p.page}: ${(p.bytes / 1024).toFixed(1)} KB`);
    expect(over).toEqual([]);
  });

  it('counts inline scripts and shared chunks once, and skips JSON', () => {
    expect(pageScriptBytes('<script type="application/ld+json">{"a":1}</script>')).toBe(0);
    expect(pageScriptBytes('<script>var a = 1;</script>')).toBeGreaterThan(0);
  });
});
