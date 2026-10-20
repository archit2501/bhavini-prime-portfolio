/** Titles with a trailer in public/trailers/ (task 1.3.3). The single list both the site and
 * the trailer scripts read. */
export const TRAILER_SLUGS = ['f1jobs', 'vastra-kala', 'christ-university'] as const;

export interface TrailerFiles {
  webm: string;
  mp4: string;
  poster: string;
  captions: string;
}

export function trailerFor(slug: string, base = '/'): TrailerFiles | undefined {
  if (!(TRAILER_SLUGS as readonly string[]).includes(slug)) return undefined;
  const dir = `${base.endsWith('/') ? base : `${base}/`}trailers/${slug}`;
  return {
    webm: `${dir}.webm`,
    mp4: `${dir}.mp4`,
    poster: `${dir}-poster.jpg`,
    captions: `${dir}.vtt`,
  };
}
