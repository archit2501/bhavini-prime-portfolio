import { describe, expect, it } from 'vitest';
import { isCurrent, NAV_CONTACT, NAV_ITEMS, routeOf } from './nav';

describe('nav items', () => {
  it("follow Prime's order, relabelled for the portfolio", () => {
    expect(NAV_ITEMS.map((i) => i.label)).toEqual([
      'Home',
      'Experience',
      'Education',
      'Skills',
      'Career Guide',
    ]);
    expect(NAV_CONTACT.href).toBe('/contact/');
  });
});

describe('routeOf', () => {
  it('strips the deploy base and adds a trailing slash', () => {
    expect(routeOf('/bhavini-prime-portfolio/skills', '/bhavini-prime-portfolio/')).toBe(
      '/skills/',
    );
    expect(routeOf('/bhavini-prime-portfolio/', '/bhavini-prime-portfolio')).toBe('/');
    expect(routeOf('/skills/')).toBe('/skills/');
    expect(routeOf('/skills')).toBe('/skills/');
    // A path outside the base (never served, but defined) is left as it is.
    expect(routeOf('/elsewhere/', '/bhavini-prime-portfolio/')).toBe('/elsewhere/');
  });
});

describe('isCurrent', () => {
  it('matches home only on the home page', () => {
    expect(isCurrent('/', '/')).toBe(true);
    expect(isCurrent('/skills/', '/')).toBe(false);
  });

  it('matches a section and the pages beneath it', () => {
    expect(isCurrent('/skills/', '/skills/')).toBe(true);
    expect(isCurrent('/skills/psychology/', '/skills/')).toBe(true);
    expect(isCurrent('/career-guide/', '/skills/')).toBe(false);
    expect(isCurrent('/base/browse/education/', '/browse/education/', '/base/')).toBe(true);
  });
});
