import { describe, expect, it } from 'vitest';
import { loadContent } from '../../tests/fixtures/catalog';
import { titleBySlug } from './catalog';
import { creativeWorkJsonLd, indexablePaths, robotsTxt, sitemapXml } from './seo';

const catalog = loadContent();

describe('indexablePaths', () => {
  const paths = indexablePaths(catalog);

  it('lists the pages worth a search result', () => {
    expect(paths[0]).toBe('/');
    expect(paths).toContain('/browse/experience/');
    expect(paths).toContain('/title/christ-university/');
    expect(paths).toContain('/skills/psychology/');
    expect(paths).toContain('/skills/collections/revenue-wins/');
    expect(paths.slice(-2)).toEqual(['/career-guide/', '/contact/']);
    expect(new Set(paths).size).toBe(paths.length);
  });

  it('leaves out the player, search, My List and 404', () => {
    expect(paths.some((p) => /watch|search|my-list|404/.test(p))).toBe(false);
  });
});

describe('sitemap and robots', () => {
  it('writes a urlset, escaping what XML needs escaped', () => {
    const xml = sitemapXml(['https://x.test/', 'https://x.test/a?b=1&c=2']);
    expect(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>\n<urlset')).toBe(true);
    expect(xml).toContain('<url><loc>https://x.test/</loc></url>');
    expect(xml).toContain('<loc>https://x.test/a?b=1&amp;c=2</loc>');
  });

  it('points robots at the sitemap', () => {
    expect(robotsTxt('https://x.test/sitemap.xml')).toBe(
      'User-agent: *\nAllow: /\n\nSitemap: https://x.test/sitemap.xml\n',
    );
  });
});

describe('creativeWorkJsonLd', () => {
  const get = (slug: string) => {
    const t = titleBySlug(catalog, slug);
    if (!t) throw new Error(slug);
    return t;
  };

  it('describes a title as her work, without contact details', () => {
    const ld = creativeWorkJsonLd(
      get('vastra-kala'),
      'https://x.test/title/vastra-kala/',
      'https://x.test/og.jpg',
      'https://x.test/',
    );
    expect(ld).toMatchObject({
      '@type': 'CreativeWork',
      name: 'Vastra Kala',
      dateCreated: '2025-08',
      dateModified: '2025-12',
      image: 'https://x.test/og.jpg',
      author: { '@type': 'Person', name: 'Bhavini Malhotra', url: 'https://x.test/' },
    });
    expect(JSON.stringify(ld)).not.toMatch(/@gmail|\+91/);
  });

  it('leaves dateModified off a title that is still running', () => {
    const ld = creativeWorkJsonLd(get('f1jobs'), 'u', 'i', 'h');
    expect(ld).not.toHaveProperty('dateModified');
  });
});
