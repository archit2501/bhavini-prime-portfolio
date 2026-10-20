// @ts-check
import { defineConfig } from 'astro/config';

// GitHub Pages serves the site from /bhavini-prime-portfolio/ until she has her own domain, so the
// deploy workflow sets BASE_PATH. Internal links go through src/lib/url.ts to respect it.
export default defineConfig({
  site: process.env.SITE_URL ?? 'https://archit2501.github.io',
  base: process.env.BASE_PATH ?? '/',
  output: 'static',
  trailingSlash: 'always',
});
