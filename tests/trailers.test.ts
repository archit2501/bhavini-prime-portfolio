import { existsSync, readFileSync, statSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { captions, figure, stamp, type TrailerVars } from '../scripts/trailers/captions';
import { TRAILER_TITLES } from '../scripts/trailers/titles';
import { titleText } from '../src/lib/catalog';
import { titleSchema } from '../src/lib/catalog-schema';

const ROOT = new URL('..', import.meta.url).pathname;
const read = (path: string) => readFileSync(`${ROOT}${path}`, 'utf8');
const figures: Record<string, { value: string }> = JSON.parse(read('src/content/figures.json'));
const figureValues = new Set(Object.values(figures).map((f) => f.value));

describe.each(TRAILER_TITLES)('trailer %s', (slug) => {
  const vars: TrailerVars = JSON.parse(read(`media/trailers/variables/${slug}.json`));
  const title = titleSchema.parse(JSON.parse(read(`src/content/titles/${slug}.json`)));

  it('ships an MP4 and a WebM under 2 MB, a poster and captions', () => {
    for (const ext of ['.mp4', '.webm']) {
      const file = `${ROOT}public/trailers/${slug}${ext}`;
      expect(existsSync(file), file).toBe(true);
      expect(statSync(file).size).toBeLessThanOrEqual(2_000_000);
    }
    expect(existsSync(`${ROOT}public/trailers/${slug}-poster.jpg`)).toBe(true);
  });

  it('has captions that match what the trailer shows', () => {
    expect(read(`public/trailers/${slug}.vtt`)).toBe(captions(title.title, vars));
  });

  it('shows only numbers that are on her resume', () => {
    // Every figure, percentage or count on screen must be one of her confirmed figures, appear
    // in the title's own copy, or be the length of the title's dates (e.g. 2023 to 2026: 3 years).
    const years = Number(title.end?.slice(0, 4) ?? 0) - Number(title.start.slice(0, 4));
    const allowed = new Set([...figureValues, String(years)]);
    const copy = titleText(title);
    const onScreen = [
      figure(vars, 1),
      figure(vars, 2),
      ...['status', 'stat1Label', 'stat1Detail', 'stat2Label', 'stat2Detail'].flatMap(
        (k) => String(vars[k]).match(/\$?\d[\d.,]*(?:K\+|\+|%)?/g) ?? [],
      ),
    ];
    for (const token of onScreen) {
      expect(allowed.has(token) || copy.includes(token), `${slug}: "${token}"`).toBe(true);
    }
  });
});

describe('captions helpers', () => {
  it('writes WebVTT timestamps', () => {
    expect(stamp(0.35)).toBe('00:00:00.350');
    expect(stamp(3725.5)).toBe('01:02:05.500');
  });

  it('formats figures with their decimals and affixes', () => {
    const vars = {
      stat1Prefix: '$',
      stat1Value: 100,
      stat1Suffix: 'K+',
      stat2Value: 8.81,
      stat2Decimals: 2,
    };
    expect(figure(vars, 1)).toBe('$100K+');
    expect(figure(vars, 2)).toBe('8.81');
  });

  it('escapes ampersands and angle brackets in cue text', () => {
    const vtt = captions('A & B', {
      tagline: '<x>',
      status: 's',
      stat1Value: 1,
      stat1Label: 'l',
      stat1Detail: 'd',
      stat2Value: 2,
      stat2Label: 'l',
      stat2Detail: 'd',
    });
    expect(vtt.startsWith('WEBVTT\n')).toBe(true);
    expect(vtt).toContain('A &amp; B · &lt;x&gt;');
  });
});
