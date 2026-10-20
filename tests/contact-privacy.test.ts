import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';
import { decodeContact, ENCODED_CONTACT } from '../src/lib/contact';

/**
 * Her email and phone are public, but only ever decoded in the visitor's browser (decision Q7).
 * This proves neither appears in plain text in the source, public files or the built site.
 * The values are decoded here rather than written out, so this file doesn't leak them either.
 */
const ROOT = new URL('..', import.meta.url).pathname;
const TEXT_FILE = /\.(astro|css|ts|js|mjs|json|md|svg|html|txt|xml|webmanifest)$/;
const email = decodeContact(ENCODED_CONTACT.email);
const local = decodeContact(ENCODED_CONTACT.phone).replace(/\D/g, '').slice(-10);
// The ways a number is written: optional +91, then 5 + 5 digits joined by nothing, a space or a
// hyphen. The spelled-out fallback (a zero-width space after every digit) is deliberately not a
// match, and neither is SVG path data, where digits run on across coordinates.
const phone = new RegExp(
  `(?<!\\d)(?:\\+?91[ -]?)?${local.slice(0, 5)}[ -]?${local.slice(5)}(?!\\d)`,
);

function files(dir: string): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return files(path);
    return TEXT_FILE.test(name) ? [path] : [];
  });
}

function leaks(paths: string[]): string[] {
  return paths.flatMap((path) => {
    const text = readFileSync(path, 'utf8');
    const where = relative(ROOT, path);
    return [
      ...(text.toLowerCase().includes(email) ? [`${where}: plain email`] : []),
      ...(phone.test(text) ? [`${where}: plain phone number`] : []),
    ];
  });
}

describe('contact privacy', () => {
  it('recognises the usual ways of writing the number, and not the obfuscated fallback', () => {
    const [a, b] = [local.slice(0, 5), local.slice(5)];
    for (const written of [`${a}${b}`, `+91${a}${b}`, `+91 ${a} ${b}`, `${a}-${b}`]) {
      expect(phone.test(`call ${written} today`), written).toBe(true);
    }
    expect(phone.test([...`${a}${b}`].join('\u200b'))).toBe(false);
    expect(phone.test(`9${a}${b}`)).toBe(false);
  });

  it('src/ and public/ hold no plain email or phone', () => {
    expect(leaks([...files(join(ROOT, 'src')), ...files(join(ROOT, 'public'))])).toEqual([]);
  });

  it.skipIf(!existsSync(join(ROOT, 'dist')))('the built site holds no plain email or phone', () => {
    expect(leaks(files(join(ROOT, 'dist')))).toEqual([]);
  });
});
