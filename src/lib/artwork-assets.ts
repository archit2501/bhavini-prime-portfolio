import type { ImageMetadata } from 'astro';
import type { Lockup } from './art/lockup';
import { artFor, type Artwork } from './artwork';

const images = import.meta.glob<ImageMetadata>('/src/assets/art/generated/**/*.jpg', {
  eager: true,
  import: 'default',
});
const logos = import.meta.glob<Lockup>('/src/assets/art/generated/**/logo.json', {
  eager: true,
  import: 'default',
});

/** Generated art for a title or certification, ready for Astro's <Picture>. */
export function artwork(slug: string): Artwork<ImageMetadata> {
  return artFor(slug, images, logos);
}
