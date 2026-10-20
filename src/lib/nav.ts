/** The top navigation, in Prime Video's order and relabelled for the portfolio (decision Q5). */
export interface NavItem {
  label: string;
  href: string;
}

export const NAV_ITEMS: readonly NavItem[] = [
  { label: 'Home', href: '/' },
  { label: 'Experience', href: '/browse/experience/' },
  { label: 'Education', href: '/browse/education/' },
  { label: 'Skills', href: '/skills/' },
  { label: 'Career Guide', href: '/career-guide/' },
];

/** Sits after the divider, in the slot Prime gives "Subscriptions". */
export const NAV_CONTACT: NavItem = { label: 'Contact', href: '/contact/' };

/** Strips the deploy base so routes compare the same locally and on GitHub Pages. */
export function routeOf(pathname: string, base = '/'): string {
  const prefix = base.endsWith('/') ? base : `${base}/`;
  const path = pathname.startsWith(prefix) ? `/${pathname.slice(prefix.length)}` : pathname;
  return path.endsWith('/') ? path : `${path}/`;
}

/** Home matches only itself; every other item also matches the pages beneath it. */
export function isCurrent(pathname: string, href: string, base = '/'): boolean {
  const route = routeOf(pathname, base);
  return href === '/' ? route === '/' : route.startsWith(href);
}
