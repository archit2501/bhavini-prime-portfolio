import { describe, expect, it } from 'vitest';
import { certificationCard, titleCard } from './cards';

const series = {
  slug: 'f1jobs',
  kind: 'series' as const,
  order: 1,
  title: 'F1Jobs.io',
  role: 'Sales & Operations Executive',
  organization: 'F1Jobs.io',
  location: 'India',
  start: '2026-05',
  end: null,
  ribbon: 'NEW EPISODES',
  tagline: 't',
  status: 's',
  synopsis: 'y',
  genres: [],
  figures: [],
};

describe('titleCard', () => {
  it('links to the detail page and describes the title for screen readers', () => {
    expect(titleCard(series, '/')).toEqual({
      slug: 'f1jobs',
      href: '/title/f1jobs/',
      title: 'F1Jobs.io',
      ribbon: 'NEW EPISODES',
      description: 'Series, May 2026 – now',
    });
    expect(
      titleCard({ ...series, kind: 'film', start: '2023', end: '2026' }, '/x/').description,
    ).toBe('Film, 2023 – 2026');
    expect(titleCard(series, '/x/').href).toBe('/x/title/f1jobs/');
  });
});

describe('certificationCard', () => {
  it('opens the main skill behind the certificate', () => {
    const cert = {
      slug: 'nptel',
      name: 'Training of Trainers',
      issuer: 'NPTEL',
      date: '2024-10',
      skills: ['professional'],
    };
    expect(certificationCard(cert, '/')).toEqual({
      slug: 'nptel',
      href: '/skills/professional/',
      title: 'NPTEL: Training of Trainers',
      ribbon: 'CERTIFICATE',
      description: 'Oct 2024',
    });
    expect(certificationCard({ ...cert, skills: [] }, '/').href).toBe('/skills/');
  });
});
