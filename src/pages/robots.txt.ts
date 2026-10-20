import type { APIRoute } from 'astro';
import { robotsTxt } from '../lib/seo';
import { withBase } from '../lib/url';

/** /robots.txt: crawl everything (noindex pages say so themselves) and find the sitemap. */
export const GET: APIRoute = ({ site }) =>
  new Response(robotsTxt(new URL(withBase('/sitemap.xml'), site).href), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
