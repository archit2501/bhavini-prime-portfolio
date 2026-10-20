import type { ImageMetadata } from 'astro';
import { getImage } from 'astro:assets';
import { artwork } from './artwork-assets';
import type { TitleThumbs } from './cues';
import type { SearchArt } from './search';
import type { TrailerVars } from './trailers';

const variables = import.meta.glob<TrailerVars>('/media/trailers/variables/*.json', {
  eager: true,
  import: 'default',
});

/** A trailer's on-screen text, the same file HyperFrames renders from. */
export function trailerVars(slug: string): TrailerVars {
  const vars = variables[`/media/trailers/variables/${slug}.json`];
  if (!vars) throw new Error(`No trailer variables for "${slug}"`);
  return vars;
}

/** 228x128 WebP: the 16:9 art cropped to a 64px square at 2x. Same options, same file. */
const thumb = async (src: ImageMetadata) =>
  (await getImage({ src, width: 228, format: 'webp', quality: 70 })).src;

/** Thumbnails for the "Behind the scenes" rows: the key art and each episode still. */
export async function titleThumbs(slug: string): Promise<TitleThumbs> {
  const art = artwork(slug);
  return { key: await thumb(art.key), stills: await Promise.all(art.stills.map(thumb)) };
}

/** 480px WebP card art for search results: each title's and certificate's card, each still. */
export async function searchArt(slugs: string[]): Promise<SearchArt> {
  const card = new Map<string, string>();
  const stills = new Map<string, string[]>();
  const size = async (src: ImageMetadata) =>
    (await getImage({ src, width: 480, format: 'webp', quality: 70 })).src;
  await Promise.all(
    slugs.map(async (slug) => {
      const art = artwork(slug);
      card.set(slug, await size(art.card));
      stills.set(slug, await Promise.all(art.stills.map(size)));
    }),
  );
  return { card: (slug) => card.get(slug), still: (slug, i) => stills.get(slug)?.[i] };
}
