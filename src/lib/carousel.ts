/** Slide maths for the hero super-carousel. Pure, so the timing rules are unit-tested. */

/** Wraps around in both directions: O(1). */
export function wrapIndex(index: number, count: number): number {
  if (count <= 0) return 0;
  return ((index % count) + count) % count;
}

/** Prime's dots: the active one is a wide pill and the dots shrink with distance from it. */
export function dotScale(dot: number, active: number, count: number): number {
  const distance = Math.min(Math.abs(dot - active), count - Math.abs(dot - active));
  return distance <= 1 ? 1 : distance === 2 ? 0.75 : 0.5;
}

export interface AutoplayState {
  /** The visitor pressed pause. */
  paused: boolean;
  /** Pointer or keyboard focus is inside the carousel. */
  engaged: boolean;
  /** prefers-reduced-motion: reduce. */
  reducedMotion: boolean;
  /** The tab is hidden. */
  hidden: boolean;
}

/** Auto-advance only while nobody is reading, nobody asked to stop, and motion is welcome. */
export function shouldAdvance(s: AutoplayState): boolean {
  return !s.paused && !s.engaged && !s.reducedMotion && !s.hidden;
}

/** Short period for the slide's chip: "2026", "2023–26", "2024". */
export function periodChip(start: string, end: string | null): string {
  const a = start.slice(0, 4);
  const b = (end ?? start).slice(0, 4);
  return a === b || end === null ? a : `${a}–${b.slice(2)}`;
}
