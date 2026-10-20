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

/** One trailer's HyperFrames variables (media/trailers/variables/<slug>.json). */
export type TrailerVars = Record<string, string | number>;

/** The stat as it appears on screen, e.g. "$100K+" or "8.81". */
export function figure(vars: TrailerVars, n: 1 | 2): string {
  const value = Number(vars[`stat${n}Value`]);
  const decimals = Number(vars[`stat${n}Decimals`] ?? 0);
  const text = value.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  return `${vars[`stat${n}Prefix`] ?? ''}${text}${vars[`stat${n}Suffix`] ?? ''}`;
}

export interface TrailerFiles {
  webm: string;
  mp4: string;
  poster: string;
  captions: string;
  /** The "Behind the scenes" metadata track (src/pages/trailers/[slug].meta.vtt.ts). */
  metadata: string;
}

/**
 * A trailer's video sources, WebM first (Playwright's Chromium can't decode H.264). Pages put
 * them in data-sources rather than <source> elements, and src/scripts/video-sources.ts adds them
 * once the page has loaded: some engines (WebKit on Linux) fetch a <source> early even with
 * preload="none", and the trailer must never compete with the first paint.
 */
export function videoSources(files: TrailerFiles): { src: string; type: string }[] {
  return [
    { src: files.webm, type: 'video/webm' },
    { src: files.mp4, type: 'video/mp4' },
  ];
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
    metadata: `${dir}.meta.vtt`,
  };
}
