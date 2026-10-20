/**
 * Prefixes a site-relative path with Astro's base, so internal links keep working when the
 * site is served from a sub-path such as /bhavini-prime-portfolio/ on GitHub Pages.
 */
export function withBase(path: string, base: string = import.meta.env.BASE_URL): string {
  const prefix = base.endsWith('/') ? base : `${base}/`;
  return prefix + path.replace(/^\/+/, '');
}
