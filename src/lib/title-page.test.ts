import { describe, expect, it } from 'vitest';
import type { Catalog } from './catalog';
import { detailMeta } from './title-page';
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
    });
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
    expect(meta.badges).toEqual(['Film']);
    expect(meta.trailing).toEqual(['Bengaluru', '2023–26']);
  });
});

describe('trailerFor', () => {
  it('lists the three trailers and their files', () => {
    expect(TRAILER_SLUGS).toEqual(['f1jobs', 'vastra-kala', 'christ-university']);
    expect(trailerFor('f1jobs', '/x')).toEqual({
      webm: '/x/trailers/f1jobs.webm',
      mp4: '/x/trailers/f1jobs.mp4',
      poster: '/x/trailers/f1jobs-poster.jpg',
      captions: '/x/trailers/f1jobs.vtt',
    });
    expect(trailerFor('clinical')).toBeUndefined();
    expect(trailerFor('f1jobs')?.mp4).toBe('/trailers/f1jobs.mp4');
  });
});
