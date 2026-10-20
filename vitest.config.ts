import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/**/*.test.ts', 'tests/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      // The 80% gate (decision Q10) covers the logic in src/lib. Browser wiring in src/scripts
      // only connects that logic to the DOM; Playwright drives it in real browsers (tests/e2e).
      // content.ts and artwork-assets.ts only hand Astro's collections and Vite's glob imports to
      // the tested code.
      include: ['src/lib/**/*.ts'],
      exclude: ['src/**/*.test.ts', 'src/lib/content.ts', 'src/lib/artwork-assets.ts'],
      thresholds: { lines: 80, functions: 80, branches: 80, statements: 80 },
    },
  },
});
