import type { Catalog, WithSlug } from './catalog';
import type { Title } from './catalog-schema';
import { collections } from './collections';
import { SITE } from './site';

/**
 * Every page worth a search result, in a sensible crawl order. The player, search, My List and
 * 404 pages are left out: they are noindex or empty for a crawler. O(t + s).
 */
export function indexablePaths(catalog: Catalog): string[] {
  return [
    '/',
    ...catalog.rows.filter((r) => r.kind === 'titles').map((r) => `/browse/${r.id}/`),
    '/browse/all/',
    ...catalog.titles.map((t) => `/title/${t.slug}/`),
    '/skills/',
    ...catalog.skills.map((s) => `/skills/${s.slug}/`),
    ...collections(catalog).map((c) => `/skills/collections/${c.id}/`),
    '/career-guide/',
    '/contact/',
  ];
}

const escapeXml = (text: string) =>
  text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** A sitemaps.org urlset of absolute URLs. */
export function sitemapXml(urls: string[]): string {
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urls.map((u) => `  <url><loc>${escapeXml(u)}</loc></url>`),
    '</urlset>',
    '',
  ].join('\n');
}

/** Everything may be crawled; here is the sitemap. */
export function robotsTxt(sitemapUrl: string): string {
  return `User-agent: *\nAllow: /\n\nSitemap: ${sitemapUrl}\n`;
}

/**
 * schema.org CreativeWork for a title page: the role or course as a "work" by her, with its dates,
 * skills as genres and its card art. Contact details stay out, as on the Person.
 */
export function creativeWorkJsonLd(
  t: WithSlug<Title>,
  pageUrl: string,
  imageUrl: string,
  homeUrl: string,
): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'CreativeWork',
    name: t.title,
    headline: `${t.role}, ${t.organization}`,
    description: t.synopsis,
    url: pageUrl,
    image: imageUrl,
    dateCreated: t.start,
    ...(t.end ? { dateModified: t.end } : {}),
    genre: t.genres,
    locationCreated: { '@type': 'Place', name: t.location },
    author: { '@type': 'Person', name: SITE.name, url: homeUrl },
  };
}
