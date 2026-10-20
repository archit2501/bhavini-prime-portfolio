import { describe, expect, it } from 'vitest';
import { loadContent } from '../../tests/fixtures/catalog';
import { collections, skillShelf } from './collections';

const catalog = loadContent();

describe('collections', () => {
  const list = collections(catalog);

  it('features revenue wins, certifications, then care and community', () => {
    expect(list.map((c) => c.name)).toEqual(['Revenue wins', 'Certifications', 'Care & community']);
    expect(list.map((c) => c.id)).toEqual(['revenue-wins', 'certifications', 'care-and-community']);
  });

  it('groups titles by the figures they hold', () => {
    expect(list[0].titles.map((t) => t.slug)).toEqual(['f1jobs', 'vastra-kala']);
    expect(list[2].titles.map((t) => t.slug)).toEqual(['clinical', 'youth-for-parivarthan']);
    expect(list[1].certifications).toHaveLength(2);
    expect(list[0].certifications).toEqual([]);
    expect(list[1].titles).toEqual([]);
  });

  it('never features an empty shelf', () => {
    for (const c of list) expect(c.titles.length + c.certifications.length).toBeGreaterThan(0);
  });
});

describe('skillShelf', () => {
  const skill = (slug: string) => {
    const s = catalog.skills.find((x) => x.slug === slug);
    if (!s) throw new Error(slug);
    return s;
  };

  it('lists the titles, certificates and episodes that use a skill', () => {
    const shelf = skillShelf(catalog, skill('marketing-content'));
    expect(shelf.titles.map((t) => t.slug)).toEqual(['f1jobs', 'vastra-kala']);
    expect(shelf.certifications.map((c) => c.slug)).toEqual(['hubspot-digital-marketing']);
    expect(shelf.episodes).toHaveLength(6);
    expect(shelf.episodes[4]).toMatchObject({
      title: { slug: 'vastra-kala' },
      episode: { number: 1, title: 'Content to Dispatch' },
    });
  });

  it('has no episodes for a skill used only by films', () => {
    const c = structuredClone(catalog);
    c.titles = c.titles.filter((t) => t.kind === 'film');
    const shelf = skillShelf(c, skill('psychology'));
    expect(shelf.titles.map((t) => t.slug)).toEqual(['christ-university']);
    expect(shelf.episodes).toEqual([]);
  });
});
