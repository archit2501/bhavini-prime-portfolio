import { describe, expect, it } from 'vitest';
import { withBase } from './url';

describe('withBase', () => {
  it('leaves paths alone at the root base', () => {
    expect(withBase('/title/f1jobs/', '/')).toBe('/title/f1jobs/');
  });

  it('prefixes a sub-path base, with or without its trailing slash', () => {
    expect(withBase('/title/f1jobs/', '/bhavini-prime-portfolio/')).toBe(
      '/bhavini-prime-portfolio/title/f1jobs/',
    );
    expect(withBase('title/f1jobs/', '/bhavini-prime-portfolio')).toBe(
      '/bhavini-prime-portfolio/title/f1jobs/',
    );
  });

  it('maps the home path to the base itself', () => {
    expect(withBase('/', '/bhavini-prime-portfolio/')).toBe('/bhavini-prime-portfolio/');
  });

  it("defaults to Astro's configured base", () => {
    expect(withBase('/skills/')).toBe(`${import.meta.env.BASE_URL.replace(/\/$/, '')}/skills/`);
  });
});
