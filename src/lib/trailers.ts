/** Titles with a trailer in public/trailers/ (task 1.3.3). The single list both the site and
 * the trailer scripts read. */
export const TRAILER_SLUGS = [
  'f1jobs',
  'vastra-kala',
  'christ-university',
  'clinical',
  'youth-for-parivarthan',
] as const;

/** Every trailer's beats, in seconds (media/trailers/shot-plan.json). The ident is the intro the
 * player's "Skip intro" skips. */
export const TRAILER_CUES = {
  ident: [0.35, 2.3],
  title: [2.7, 4.9],
  stat1: [5.1, 7.7],
  stat2: [8.05, 10.1],
  end: [10.4, 12],
} as const;

export interface TrailerFiles {
  webm: string;
  mp4: string;
  poster: string;
  captions: string;
}

export function hasTrailer(slug: string): boolean {
  return (TRAILER_SLUGS as readonly string[]).includes(slug);
}

export function trailerFor(slug: string, base = '/'): TrailerFiles | undefined {
  if (!hasTrailer(slug)) return undefined;
  const dir = `${base.endsWith('/') ? base : `${base}/`}trailers/${slug}`;
  return {
    webm: `${dir}.webm`,
    mp4: `${dir}.mp4`,
    poster: `${dir}-poster.jpg`,
    captions: `${dir}.vtt`,
  };
}
