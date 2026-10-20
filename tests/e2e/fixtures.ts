import { test as base } from '@playwright/test';

/**
 * Every spec but intro.spec.ts starts as a visitor who has already answered "Who's visiting?"
 * (without choosing anyone), so the picker doesn't cover the home page they're testing.
 */
export const test = base.extend({
  page: async ({ page }, use) => {
    await page.addInitScript(() => {
      try {
        sessionStorage.setItem('bhavini:picker', 'seen');
      } catch {
        /* storage blocked in this test: the picker won't open either */
      }
    });
    await use(page);
  },
});

export { expect } from '@playwright/test';
