import { outlineText } from './outline.ts';

/** One line of a title treatment, e.g. "UNIVERSITY" tracked out under "CHRIST". */
export interface LockupLine {
  text: string;
  /** File name in the fonts folder, e.g. "Archivo-ExpandedBlack.ttf". */
  font: string;
  /** Size relative to the lockup's base size. */
  size: number;
  /** Letter spacing in em. */
  tracking?: number;
  fill: string;
  /** Extra left offset in em of this line's size (for staggered lines). */
  indent?: number;
}

export interface Lockup {
  paths: { d: string; fill: string }[];
  width: number;
  height: number;
  viewBox: string;
}

/**
 * Stacks outlined lines into a title treatment, left-aligned like Prime's title art.
 * Each line drops by its cap height (0.74em) plus a gap of 0.14em of the larger neighbour,
 * so a small kicker line never crowds a big title line, above or below it.
 */
export function buildLockup(lines: LockupLine[], fontsDir: string, base = 100): Lockup {
  const paths: Lockup['paths'] = [];
  let y = 0;
  let width = 0;
  lines.forEach((line, i) => {
    const size = base * line.size;
    if (i > 0) y += 0.14 * base * Math.max(line.size, lines[i - 1].size);
    y += 0.74 * size;
    const x = (line.indent ?? 0) * size;
    const out = outlineText(line.text, {
      font: `${fontsDir}${line.font}`,
      size,
      tracking: line.tracking ?? 0,
      x,
      y,
    });
    paths.push({ d: out.d, fill: line.fill });
    width = Math.max(width, x + out.width);
  });
  // Room for descenders and italic overhang on the last line.
  const height = y + 0.24 * base * lines[lines.length - 1].size;
  const r = (n: number) => Math.round(n * 100) / 100;
  return { paths, width: r(width), height: r(height), viewBox: `0 0 ${r(width)} ${r(height)}` };
}
