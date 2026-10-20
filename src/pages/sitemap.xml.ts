import type { APIRoute } from 'astro';
import { loadCatalog } from '../lib/content';
import { indexablePaths, sitemapXml } from '../lib/seo';
import { withBase } from '../lib/url';

/** /sitemap.xml: every indexable page, as absolute URLs under the site's base path. */
export const GET: APIRoute = async ({ site }) => {
  const catalog = await loadCatalog();
  const urls = indexablePaths(catalog).map((p) => new URL(withBase(p), site).href);
  return new Response(sitemapXml(urls), {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
};
