import { describe, expect, it } from 'vitest';
import type { Catalog } from './catalog';
import {
  alsoViewed,
  detailMeta,
  nextTab,
  seriesLinks,
  tabFromHash,
  tabsFor,
  titleFigures,
} from './title-page';
import { trailerFor, TRAILER_SLUGS } from './trailers';

const catalog = {
  skills: [
    {
      slug: 'sales',
      name: 'Sales & Business Development',
      order: 1,
      glow: '#000000',
      items: ['x'],
    },
    { slug: 'ops', name: 'Operations', order: 2, glow: '#000000', items: ['y'] },
  ],
} as unknown as Catalog;

const title = {
  slug: 'vastra-kala',
  kind: 'series' as const,
  order: 2,
  title: 'Vastra Kala',
  role: 'Intern',
  organization: 'Vastra Kala',
  location: 'Phagwara, India (Hybrid)',
  start: '2025-08',
  end: '2025-12',
  ribbon: 'RECENTLY ADDED',
  tagline: 't',
  status: 's',
  synopsis: 'y',
  genres: ['sales', 'ops', 'unknown'],
  figures: [],
};

describe('detailMeta', () => {
  it('builds the genre row, badges and CTA for a series', () => {
    expect(detailMeta(catalog, title, true, '/')).toEqual({
      skills: [
        { name: 'Sales & Business Development', href: '/skills/sales/' },
        { name: 'Operations', href: '/skills/ops/' },
      ],
      trailing: ['Phagwara', '2025'],
      badges: ['Series', 'CC'],
      cta: ['Episode 1', 'Watch now'],
      watchHref: '/watch/vastra-kala/',
    });
  });

  it('sends a title with no trailer to its sequel, or nowhere', () => {
    const sequel = { ...title, slug: 'christ-university', title: 'Christ University' };
    const prequel = { ...title, slug: 'school', kind: 'film' as const, sequel: sequel.slug };
    const withTitles = { ...catalog, titles: [sequel, prequel] } as unknown as Catalog;
    const meta = detailMeta(withTitles, prequel, false, '/');
    expect(meta.cta).toEqual(['Watch the sequel', 'Christ University']);
    expect(meta.watchHref).toBe('/watch/christ-university/');
    const alone = detailMeta(withTitles, { ...prequel, sequel: undefined }, false, '/');
    expect(alone.cta).toEqual([]);
    expect(alone.watchHref).toBeUndefined();
  });

  it('gives films a one-line CTA and no CC badge without captions', () => {
    const film = {
      ...title,
      kind: 'film' as const,
      location: 'Bengaluru, India',
      start: '2023',
      end: '2026',
    };
    const meta = detailMeta(catalog, film, false, '/');
    expect(meta.cta).toEqual(['Watch now']);
    expect(meta.badges).toEqual(['Film', '3 years']);
    expect(meta.trailing).toEqual(['Bengaluru', '2023–26']);
  });
});

describe('trailerFor', () => {
  it('lists the five trailers and their files', () => {
    expect(TRAILER_SLUGS).toEqual([
      'f1jobs',
      'vastra-kala',
      'christ-university',
      'clinical',
      'youth-for-parivarthan',
    ]);
    expect(trailerFor('f1jobs', '/x')).toEqual({
      webm: '/x/trailers/f1jobs.webm',
      mp4: '/x/trailers/f1jobs.mp4',
      poster: '/x/trailers/f1jobs-poster.jpg',
      captions: '/x/trailers/f1jobs.vtt',
      metadata: '/x/trailers/f1jobs.meta.vtt',
    });
    expect(trailerFor('cambridge-innovative-school')).toBeUndefined();
    expect(trailerFor('f1jobs')?.mp4).toBe('/trailers/f1jobs.mp4');
  });
});

describe('tabs', () => {
  const series = { ...title, episodes: [{ title: 'a', synopsis: 'b', meta: 'c' }] };

  it('opens series on Episodes and films on Related', () => {
    expect(tabsFor(series).map((t) => t.label)).toEqual(['Episodes', 'Related', 'Details']);
    expect(tabsFor({ ...title, kind: 'film' }).map((t) => t.id)).toEqual(['related', 'details']);
    expect(tabsFor({ ...series, episodes: [] }).map((t) => t.id)).toEqual(['related', 'details']);
  });

  it('follows the URL hash, falling back to the first tab', () => {
    const tabs = tabsFor(series);
    expect(tabFromHash('#details', tabs)).toBe('details');
    expect(tabFromHash('', tabs)).toBe('episodes');
    expect(tabFromHash('#nope', tabs)).toBe('episodes');
  });

  it('moves with the arrow keys, Home and End, wrapping at the ends', () => {
    expect(nextTab(0, 3, 'ArrowRight')).toBe(1);
    expect(nextTab(2, 3, 'ArrowRight')).toBe(0);
    expect(nextTab(0, 3, 'ArrowLeft')).toBe(2);
    expect(nextTab(1, 3, 'Home')).toBe(0);
    expect(nextTab(1, 3, 'End')).toBe(2);
    expect(nextTab(1, 3, 'Enter')).toBeUndefined();
  });
});

describe('titleFigures', () => {
  it("lists the title's confirmed figures, skipping unknown ids", () => {
    const c = {
      figures: { regions: { value: '5+', label: 'global regions', source: 's', verified: true } },
    } as unknown as Catalog;
    expect(titleFigures(c, { ...title, figures: ['regions', 'ghost'] })).toEqual([
      { value: '5+', label: 'global regions' },
    ]);
  });
});

describe('film links and the also-viewed row', () => {
  const titles = [
    {
      ...title,
      slug: 'christ',
      title: 'Christ University',
      kind: 'film' as const,
      prequel: 'school',
    },
    { ...title, slug: 'school', title: 'Cambridge', kind: 'film' as const, sequel: 'christ' },
    { ...title, slug: 'f1', title: 'F1Jobs.io' },
  ];
  const c = { ...catalog, titles } as unknown as Catalog;

  it('links prequels and sequels, ignoring missing ones', () => {
    expect(seriesLinks(c, titles[0], '/')).toEqual([
      { label: 'Prequel', title: 'Cambridge', href: '/title/school/' },
    ]);
    expect(seriesLinks(c, titles[1], '/')).toEqual([
      { label: 'Sequel', title: 'Christ University', href: '/title/christ/' },
    ]);
    expect(seriesLinks(c, titles[2], '/')).toEqual([]);
    expect(seriesLinks(c, { ...titles[2], prequel: 'ghost' }, '/')).toEqual([]);
  });

  it('lists every other title', () => {
    expect(alsoViewed(c, 'school').map((t) => t.slug)).toEqual(['christ', 'f1']);
  });
});
