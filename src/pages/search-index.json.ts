import type { APIRoute } from 'astro';
import { loadCatalog } from '../lib/content';
import { searchArt } from '../lib/scene-assets';
import { buildIndex } from '../lib/search';

/** Everything the search panel can find, fetched the first time it opens. */
export const GET: APIRoute = async () => {
  const catalog = await loadCatalog();
  const art = await searchArt([
    ...catalog.titles.map((t) => t.slug),
    ...catalog.certifications.map((c) => c.slug),
  ]);
  const index = buildIndex(catalog, art, import.meta.env.BASE_URL);
  return new Response(JSON.stringify(index), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
};
