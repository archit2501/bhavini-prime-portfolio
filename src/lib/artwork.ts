import type { Lockup } from './art/lockup';

/** The generated art for one title or certification (scripts/art/build.ts). */
export interface Artwork<Image> {
  /** 2560x1440, hero and detail page background. */
  key: Image;
  /** 1280x720 with the title lettering baked in, for row cards. */
  card: Image;
  /** 960x540, one per episode, in order. */
  stills: Image[];
  /** The title lettering as SVG paths, for the hero and detail overlay. */
  logo: Lockup;
}

const GENERATED = '/src/assets/art/generated/';

/**
 * Picks one slug's files out of Vite's glob maps (keyed by absolute path). Throws when the art
 * is missing, so a page never ships without its imagery. O(files) per call.
 */
export function artFor<Image>(
  slug: string,
  images: Record<string, Image>,
  logos: Record<string, Lockup>,
): Artwork<Image> {
  const dir = `${GENERATED}${slug}/`;
  const need = <T>(map: Record<string, T>, file: string): T => {
    const value = map[`${dir}${file}`];
    if (value === undefined) throw new Error(`Missing ${dir}${file}: run \`npm run art\``);
    return value;
  };
  const stills = Object.keys(images)
    .map((path) => /\/still-(\d+)\.jpg$/.exec(path.startsWith(dir) ? path : '')?.[1])
    .filter((n): n is string => n !== undefined)
    .map(Number)
    .sort((a, b) => a - b)
    .map((n) => images[`${dir}still-${n}.jpg`]);
  return {
    key: need(images, 'key.jpg'),
    card: need(images, 'card.jpg'),
    stills,
    logo: need(logos, 'logo.json'),
  };
}
