import type { APIRoute, GetStaticPaths } from 'astro';
import { titleBySlug } from '../../lib/catalog';
import { loadCatalog } from '../../lib/content';
import { metadataVtt, sceneCues, sceneSheet } from '../../lib/cues';
import { titleThumbs, trailerVars } from '../../lib/scene-assets';
import { TRAILER_SLUGS } from '../../lib/trailers';

/** The "Behind the scenes" metadata track for each trailer, written from the catalog. */
export const getStaticPaths = (() =>
  TRAILER_SLUGS.map((slug) => ({ params: { slug } }))) satisfies GetStaticPaths;

export const GET: APIRoute = async ({ params }) => {
  const catalog = await loadCatalog();
  const title = titleBySlug(catalog, String(params.slug));
  if (!title) throw new Error(`No title "${params.slug}"`);
  const thumbs = await titleThumbs(title.slug);
  const vtt = metadataVtt(
    sceneCues(sceneSheet(catalog, title, thumbs), trailerVars(title.slug), thumbs),
  );
  return new Response(vtt, { headers: { 'Content-Type': 'text/vtt; charset=utf-8' } });
};
