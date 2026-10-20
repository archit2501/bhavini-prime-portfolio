import { describe, expect, it } from 'vitest';
import { loadContent } from '../../tests/fixtures/catalog';
import { buildIndex, normalize, resultsLabel, search } from './search';

const catalog = loadContent();
const art = {
  card: (slug: string) => `/art/${slug}.webp`,
  still: (slug: string, i: number) => (i < 2 ? `/art/${slug}-${i}.webp` : undefined),
};
const index = buildIndex(catalog, art, '/');
const names = (query: string) => search(index, query).map((e) => e.name);

describe('normalize', () => {
  it('folds case, accents and punctuation, keeping money and percentages', () => {
    expect(normalize('  Café & Crème — B2B!  ')).toBe('cafe and creme b2b');
    expect(normalize('F1Jobs.io (Neurascribe Inc.)')).toBe('f1jobs.io neurascribe inc');
    expect(normalize('$100K+ in revenue, 65% gain')).toBe('$100k+ in revenue 65% gain');
    expect(normalize('...')).toBe('');
  });
});

describe('buildIndex', () => {
  it('indexes titles, episodes, skills and certifications in catalog order', () => {
    const kinds = index.map((e) => e.kind);
    expect(kinds.indexOf('episode')).toBe(6);
    expect(kinds.filter((k) => k === 'title')).toHaveLength(6);
    expect(kinds.filter((k) => k === 'certification')).toHaveLength(2);
    expect(index[0]).toMatchObject({
      kind: 'title',
      name: 'F1Jobs.io',
      meta: '2026',
      href: '/title/f1jobs/',
      image: '/art/f1jobs.webp',
      words: 'f1jobs.io',
    });
  });

  it('describes episodes, skills and certifications for their cards', () => {
    expect(index.find((e) => e.name === 'Seven Sales')).toMatchObject({
      meta: 'F1Jobs.io · S1 E2',
      href: '/title/f1jobs/#episodes',
      image: '/art/f1jobs-1.webp',
    });
    expect(index.find((e) => e.name === 'Ticket Zero')?.image).toBeUndefined();
    const sales = index.find((e) => e.kind === 'skill' && e.name.startsWith('Sales'));
    expect(sales).toMatchObject({ href: '/skills/sales-business-development/', tone: '#1a98ff' });
    expect(sales?.meta).toMatch(/^Skill · \d+ titles?$/);
    expect(index.find((e) => e.name === 'Training of Trainers')).toMatchObject({
      meta: 'NPTEL · 2024',
      href: '/skills/professional/',
    });
  });

  it('copes with a lone title, an unknown skill and a certificate with no skill', () => {
    const c = structuredClone(catalog);
    c.titles = c.titles.filter((t) => t.genres.includes('operations')).slice(0, 1);
    c.titles[0].genres = [...c.titles[0].genres, 'nope'];
    c.titles[0].season = undefined;
    c.certifications[0].skills = [];
    const small = buildIndex(c, art);
    expect(small.find((e) => e.kind === 'episode')?.meta).toMatch(/ · S1 E1$/);
    expect(small.find((e) => e.name === 'Operations')?.meta).toBe('Skill · 1 title');
    expect(small.find((e) => e.kind === 'certification')?.href).toBe('/skills/');
  });
});

describe('search', () => {
  it('finds a title by its name, ahead of things that only mention it', () => {
    expect(names('f1jobs')[0]).toBe('F1Jobs.io');
    expect(names('F1JOBS')).toContain('The Pipeline');
  });

  it('matches word starts anywhere, every word required', () => {
    expect(names('psych')).toContain('Christ University');
    expect(names('seven sales')[0]).toBe('Seven Sales');
    expect(names('seven nonsense')).toEqual([]);
    expect(names('ales')).not.toContain('Seven Sales');
  });

  it('finds skills and certifications too', () => {
    expect(names('hubspot')).toEqual(['Digital Marketing and Social Media Marketing']);
    expect(names('marketing & content')[0]).toBe('Marketing & Content');
    expect(names('certificate')).toHaveLength(2);
  });

  it('ranks by score, then catalog order, and honours the limit', () => {
    const all = search(index, 'a', 100);
    expect(all.length).toBeGreaterThan(3);
    expect(search(index, 'a', 3)).toHaveLength(3);
  });

  it('returns nothing for an empty query', () => {
    expect(search(index, '   ')).toEqual([]);
    expect(search(index, '!!')).toEqual([]);
  });

  it('labels the results for the live region', () => {
    expect(resultsLabel(1, 'x')).toBe('1 result');
    expect(resultsLabel(4, 'x')).toBe('4 results');
    expect(resultsLabel(0, ' zzz ')).toBe('No results for "zzz"');
  });
});
