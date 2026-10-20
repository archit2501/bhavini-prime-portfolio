import { titleBySlug, type Catalog, type WithSlug } from './catalog';
import type { Title } from './catalog-schema';
import { hasTrailer } from './trailers';
import { withBase } from './url';

/** Back 10 / forward 10, as on Prime's player. */
export const SKIP_SECONDS = 10;
/** The chrome fades after this long without a pointer move, tap or key. */
export const HIDE_AFTER_MS = 3000;
/** The Next up card counts down this many seconds, then plays the next title. */
export const NEXT_UP_SECONDS = 10;

/** Prime's player clock: "0:07", "12:05", "1:17:42". Anything not a positive number reads 0:00. */
export function formatClock(seconds: number): string {
  const s = Number.isFinite(seconds) && seconds > 0 ? Math.floor(seconds) : 0;
  const h = Math.floor(s / 3600);
  const m = Math.floor(s / 60) % 60;
  const ss = String(s % 60).padStart(2, '0');
  return h ? `${h}:${String(m).padStart(2, '0')}:${ss}` : `${m}:${ss}`;
}

/** Time left, rounded up so elapsed + remaining always adds up to the length. */
export function remainingClock(current: number, duration: number): string {
  return formatClock(Math.ceil(Math.max(0, duration - current)));
}

/** The scrubber's spoken value: "4 seconds of 12 seconds", "1 minute 5 seconds of 2 minutes". */
export function spokenPosition(current: number, duration: number): string {
  const say = (seconds: number) => {
    const s = Number.isFinite(seconds) && seconds > 0 ? Math.floor(seconds) : 0;
    const parts: [number, string][] = [
      [Math.floor(s / 3600), 'hour'],
      [Math.floor(s / 60) % 60, 'minute'],
      [s % 60, 'second'],
    ];
    const spoken = parts
      .filter(([n]) => n > 0)
      .map(([n, unit]) => `${n} ${unit}${n === 1 ? '' : 's'}`)
      .join(' ');
    return spoken || '0 seconds';
  };
  return `${say(current)} of ${say(duration)}`;
}

/** Where a skip lands, kept inside the video. An unknown length only clamps at the start. */
export function seekTarget(current: number, delta: number, duration: number): number {
  const target = Math.max(0, current + delta);
  return Number.isFinite(duration) ? Math.min(target, duration) : target;
}

export type PlayerAction =
  'toggle' | 'back' | 'forward' | 'fullscreen' | 'mute' | 'captions' | 'close';

/** The player's keyboard shortcuts. O(1). */
export function keyAction(key: string): PlayerAction | undefined {
  switch (key) {
    case ' ':
    case 'k':
    case 'K':
      return 'toggle';
    case 'ArrowLeft':
    case 'j':
    case 'J':
      return 'back';
    case 'ArrowRight':
    case 'l':
    case 'L':
      return 'forward';
    case 'f':
    case 'F':
      return 'fullscreen';
    case 'm':
    case 'M':
      return 'mute';
    case 'c':
    case 'C':
      return 'captions';
    case 'Escape':
      return 'close';
    default:
      return undefined;
  }
}

/** "Skip intro" shows while the ident plays, and leaves a moment before it would end anyway. */
export function showSkipIntro(current: number, introEnd: number): boolean {
  return current < introEnd - 0.25;
}

/** Whole seconds left on the Next up countdown, from when it started (both in ms). */
export function countdownLeft(startedAt: number, now: number, total = NEXT_UP_SECONDS): number {
  return Math.max(0, total - Math.floor((now - startedAt) / 1000));
}

/**
 * What "Watch now" plays: the title's own trailer or, for a title without one (the school
 * prequel), the next part of its story that has one. O(t) per sequel step.
 */
export function watchTarget(catalog: Catalog, t: WithSlug<Title>): WithSlug<Title> | undefined {
  const seen = new Set<string>();
  let current: WithSlug<Title> | undefined = t;
  while (current && !seen.has(current.slug)) {
    if (hasTrailer(current.slug)) return current;
    seen.add(current.slug);
    current = current.sequel ? titleBySlug(catalog, current.sequel) : undefined;
  }
  return undefined;
}

export function watchHref(catalog: Catalog, t: WithSlug<Title>, base?: string): string | undefined {
  const target = watchTarget(catalog, t);
  return target && withBase(`/watch/${target.slug}/`, base);
}

/** Next up: the next title in catalog order that has a trailer, wrapping round. O(t). */
export function nextUp(catalog: Catalog, slug: string): WithSlug<Title> | undefined {
  const playable = catalog.titles.filter((t) => hasTrailer(t.slug));
  const i = playable.findIndex((t) => t.slug === slug);
  if (i === -1 || playable.length < 2) return undefined;
  return playable[(i + 1) % playable.length];
}
