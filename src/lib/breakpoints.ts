/** Prime Video's breakpoints in px, mirrored from tokens.css for matchMedia and srcset sizes. */
export const BREAKPOINTS = {
  xs: 448,
  sm: 600,
  md: 880,
  lg: 1280,
  xl: 1400,
  xxl: 1800,
} as const;

export type Breakpoint = keyof typeof BREAKPOINTS;

/** `(min-width: 55em)`-style query for a breakpoint, in em like the CSS so zoom behaves the same. */
export function minWidth(bp: Breakpoint): string {
  return `(min-width: ${BREAKPOINTS[bp] / 16}em)`;
}
