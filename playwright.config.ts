import { defineConfig, devices } from '@playwright/test';

// Not Astro's 4321 and not the sibling portfolio's 4417, so another project's server is never reused.
const PORT = 4427;
// The deploy workflow points the smoke run (tests/e2e/deployed.spec.ts) at the live site.
const DEPLOYED = process.env.DEPLOYED_URL;

export default defineConfig({
  testDir: 'tests/e2e',
  ...(DEPLOYED ? { testMatch: 'deployed.spec.ts' } : { testIgnore: 'deployed.spec.ts' }),
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: { baseURL: DEPLOYED ?? `http://localhost:${PORT}`, trace: 'on-first-retry' },
  // Safari's engine on iPhone and iPad, Chrome on Android and two laptop widths
  // (1440x900 is the width the live Prime Video measurements were taken at).
  projects: [
    { name: 'iphone', use: { ...devices['iPhone 15'] } },
    { name: 'pixel', use: { ...devices['Pixel 8'] } },
    { name: 'ipad', use: { ...devices['iPad (gen 11)'] } },
    {
      name: 'laptop',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 } },
    },
    {
      name: 'desktop',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } },
    },
  ],
  webServer: DEPLOYED
    ? undefined
    : {
        // The preview script owns --port 4427 and --ignore-lock (which keeps astro preview in the
        // foreground under agents). Passing --port again makes Astro fall back to 4321.
        command: 'npm run build && npm run preview',
        url: `http://localhost:${PORT}`,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      },
});
