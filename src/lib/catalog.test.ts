import { readdirSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  assertCatalog,
  castLine,
  certificationsForSkill,
  checkCatalog,
  episodesFor,
  formatPeriod,
  monthIndex,
  relatedFor,
  rowTitles,
  titleBySlug,
  titleForFigure,
  topTen,
  titlesForSkill,
  unverifiedFigures,
  type Catalog,
} from './catalog';
import {
  certificationSchema,
  figureSchema,
  guideSchema,
  rowSchema,
  skillSchema,
  titleSchema,
} from './catalog-schema';

const dir = new URL('../content/', import.meta.url);
const json = (name: string) => JSON.parse(readFileSync(new URL(name, dir), 'utf8'));
const keyed = <T>(data: Record<string, unknown>, parse: (v: unknown) => T) =>
  Object.entries(data).map(([slug, v]) => ({ ...parse(v), slug }));

/** The real content, parsed with the same schemas Astro uses. */
function loadContent(): Catalog {
  const titles = readdirSync(new URL('titles/', dir))
    .filter((f) => f.endsWith('.json'))
    .map((f) => ({
      ...titleSchema.parse(json(`titles/${f}`)),
      slug: f.replace(/\.json$/, ''),
    }))
    .sort((a, b) => a.order - b.order);
  return {
    figures: Object.fromEntries(
      Object.entries(json('figures.json')).map(([id, f]) => [id, figureSchema.parse(f)]),
    ),
    titles,
    skills: keyed(json('skills.json'), (v) => skillSchema.parse(v)).sort(
      (a, b) => a.order - b.order,
    ),
    certifications: keyed(json('certifications.json'), (v) => certificationSchema.parse(v)),
    guide: guideSchema.parse(json('timeline.json').guide),
    rows: (json('rows.json') as { id: string }[])
      .map((r) => ({ ...rowSchema.parse(r), id: r.id }))
      .sort((a, b) => a.order - b.order),
  };
}

const clone = (): Catalog => structuredClone(loadContent());

describe('the real catalog', () => {
  const catalog = loadContent();

  it('passes every cross-entry check', () => {
    expect(checkCatalog(catalog)).toEqual([]);
  });

  it('has her six titles in order: four roles, then education', () => {
    expect(catalog.titles.map((t) => [t.slug, t.kind])).toEqual([
      ['f1jobs', 'series'],
      ['vastra-kala', 'series'],
      ['clinical', 'series'],
      ['youth-for-parivarthan', 'series'],
      ['christ-university', 'film'],
      ['cambridge-innovative-school', 'film'],
    ]);
  });

  it('credits only Bhavini', () => {
    for (const t of catalog.titles) expect(castLine(t)).toMatch(/^Bhavini Malhotra as /);
  });

  it('lists the one figure she has not confirmed yet', () => {
    expect(unverifiedFigures(catalog)).toEqual(['highSchool: 90.4% in high school']);
  });

  it('features four titles in the hero carousel, current role first', () => {
    expect(rowTitles(catalog, 'hero').map((t) => t.slug)).toEqual([
      'f1jobs',
      'christ-university',
      'vastra-kala',
      'clinical',
    ]);
    expect(rowTitles(catalog, 'top10')).toEqual([]);
    expect(rowTitles(catalog, 'nope')).toEqual([]);
    // checkCatalog flags unknown slugs; rowTitles just skips them.
    const c = clone();
    c.rows[0] = {
      id: 'hero',
      kind: 'hero',
      order: 1,
      title: 'Featured',
      items: ['ghost', 'clinical'],
    };
    expect(rowTitles(c, 'hero').map((t) => t.slug)).toEqual(['clinical']);
  });

  it('keeps the home rows in page order', () => {
    expect(catalog.rows.map((r) => r.id)).toEqual([
      'hero',
      'continue',
      'top10',
      'experience',
      'education',
      'certifications',
      'skills',
    ]);
  });

  it('every title appears in a home row', () => {
    const inRows = new Set(catalog.rows.flatMap((r) => ('items' in r ? r.items : [])));
    for (const t of catalog.titles) expect(inRows, t.slug).toContain(t.slug);
  });
});

describe('checkCatalog finds each kind of problem', () => {
  it('a listed figure missing from the copy', () => {
    const c = clone();
    c.titles[0].figures.push('cgpa');
    expect(checkCatalog(c)).toEqual([
      'title f1jobs: figure "cgpa" (8.81) is listed but never shown',
    ]);
  });

  it('unknown figures, skills, titles and tracks', () => {
    const c = clone();
    c.titles[0].figures.push('nope');
    c.titles[0].genres.push('juggling');
    c.certifications[0].skills.push('juggling');
    c.rows[0] = { id: 'hero', kind: 'hero', order: 1, title: 'Featured', items: ['ghost'] };
    c.guide.entries[0] = { ...c.guide.entries[0], track: 'space', title: 'ghost' };
    expect(checkCatalog(c)).toEqual([
      'title f1jobs: unknown skill "juggling"',
      'title f1jobs: unknown figure "nope"',
      `certification ${c.certifications[0].slug}: unknown skill "juggling"`,
      'row hero: unknown title "ghost"',
      'guide entry 1 (F1Jobs.io): unknown track "space"',
      'guide entry 1 (F1Jobs.io): unknown title "ghost"',
    ]);
  });

  it('duplicate orders and backwards dates', () => {
    const c = clone();
    c.titles[1].order = 1;
    c.skills[1].order = 1;
    c.rows[1].order = 1;
    c.titles[2].end = '2023-01';
    c.guide.entries[1] = { ...c.guide.entries[1], start: '2026', end: '2025-01' };
    expect(checkCatalog(c)).toEqual([
      'titles: order 1 is used twice',
      'skills: order 1 is used twice',
      'rows: order 1 is used twice',
      'title clinical: starts (2024-04) after it ends (2023-01)',
      'guide entry 2 (Vastra Kala): starts (2026) after it ends (2025-01)',
    ]);
  });

  it('series without episodes and films with episodes', () => {
    const c = clone();
    c.titles[0].episodes = [];
    c.titles[4].episodes = [{ title: 'x', synopsis: 'y', meta: 'z' }];
    expect(checkCatalog(c)).toEqual([
      'title f1jobs: a series needs episodes',
      // The episodes were the only place "20+ tickets" appeared, so the figure guard fires too.
      'title f1jobs: figure "tickets" (20+) is listed but never shown',
      "title christ-university: a film can't have episodes",
    ]);
  });

  it('a Top 10 row without ten different figures', () => {
    const c = clone();
    const top = c.rows.find((r) => r.kind === 'top10');
    if (top?.kind !== 'top10') throw new Error('no top10 row');
    top.figures = ['revenue', 'revenue', 'ghost'];
    expect(checkCatalog(c)).toEqual([
      'row top10: needs 10 different figures',
      'row top10: unknown figure "ghost"',
    ]);
  });
});

describe('topTen', () => {
  const catalog = loadContent();

  it('ranks her ten proof numbers and ties each to its title', () => {
    const items = topTen(catalog);
    expect(items.map((i) => `${i.rank}. ${i.value} ${i.label} (${i.title.slug})`)).toEqual([
      '1. $100K+ in revenue (f1jobs)',
      '2. 7+ successful sales (f1jobs)',
      '3. 65% workflow efficiency gain (f1jobs)',
      '4. 20+ customer tickets resolved (f1jobs)',
      '5. 100+ product units a month (vastra-kala)',
      '6. 5+ global regions (vastra-kala)',
      '7. 8.81 CGPA (christ-university)',
      '8. 20+ therapy and assessment sessions (clinical)',
      '9. 50+ community members engaged (youth-for-parivarthan)',
      '10. 90.4% in high school (cambridge-innovative-school)',
    ]);
  });

  it('is empty without a Top 10 row, and skips figures with no title', () => {
    const c = clone();
    c.rows = c.rows.filter((r) => r.kind !== 'top10');
    expect(topTen(c)).toEqual([]);
    expect(titleForFigure(catalog, 'nope')).toBeUndefined();
  });

  it('flags a Top 10 figure that no title shows', () => {
    const c = clone();
    c.figures.orphan = { value: '1', label: 'x', source: 'y', verified: true };
    const top = c.rows.find((r) => r.kind === 'top10');
    if (top?.kind !== 'top10') throw new Error('no top10 row');
    top.figures[9] = 'orphan';
    expect(checkCatalog(c)).toEqual(['row top10: figure "orphan" belongs to no title']);
    expect(topTen(c)).toHaveLength(9);
  });
});

describe('assertCatalog', () => {
  it('passes the real catalog in a normal build', () => {
    expect(() => assertCatalog(loadContent(), { requireVerified: false })).not.toThrow();
  });

  it('refuses unconfirmed figures in the deploy build', () => {
    expect(() => assertCatalog(loadContent(), { requireVerified: true })).toThrow(
      'unconfirmed figure highSchool: 90.4% in high school',
    );
  });
});

describe('dates', () => {
  it('formats periods the way the resume reads', () => {
    expect(formatPeriod('2026-05', null)).toBe('May 2026 – now');
    expect(formatPeriod('2025-08', '2025-12')).toBe('Aug – Dec 2025');
    expect(formatPeriod('2023', '2026')).toBe('2023 – 2026');
    expect(formatPeriod('2023-04', '2023-04')).toBe('Apr 2023');
    expect(formatPeriod('2024-11', '2025-02')).toBe('Nov 2024 – Feb 2025');
  });

  it('orders year-only dates by their first or last month', () => {
    expect(monthIndex('2024')).toBe(monthIndex('2024-01'));
    expect(monthIndex('2024', 'end')).toBe(monthIndex('2024-12'));
  });
});

describe('getters', () => {
  const catalog = loadContent();

  it('finds titles by slug', () => {
    expect(titleBySlug(catalog, 'vastra-kala')?.title).toBe('Vastra Kala');
    expect(titleBySlug(catalog, 'nope')).toBeUndefined();
  });

  it('numbers episodes with Prime-style uppercase headings', () => {
    const f1 = titleBySlug(catalog, 'f1jobs');
    if (!f1) throw new Error('missing f1jobs');
    expect(episodesFor(f1).map((e) => e.heading)).toEqual([
      '1. THE PIPELINE',
      '2. SEVEN SALES',
      '3. FACE OF THE BRAND',
      '4. TICKET ZERO',
    ]);
    const film = titleBySlug(catalog, 'christ-university');
    if (!film) throw new Error('missing christ-university');
    expect(episodesFor(film)).toEqual([]);
  });

  it('ranks related titles by shared skills, then catalog order', () => {
    expect(relatedFor(catalog, 'vastra-kala', 3).map((t) => t.slug)).toEqual([
      'f1jobs',
      'clinical',
      'youth-for-parivarthan',
    ]);
    expect(relatedFor(catalog, 'clinical', 1).map((t) => t.slug)).toEqual(['christ-university']);
    expect(relatedFor(catalog, 'nope')).toEqual([]);
  });

  it('lists the titles and certifications behind a skill', () => {
    expect(titlesForSkill(catalog, 'psychology').map((t) => t.slug)).toEqual([
      'clinical',
      'christ-university',
    ]);
    expect(certificationsForSkill(catalog, 'marketing-content').map((c) => c.issuer)).toEqual([
      'HubSpot Academy',
    ]);
  });
});
