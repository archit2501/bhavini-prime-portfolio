import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

// WCAG 2.2 AA (decision Q9). Each new screen adds its route here.
const PAGES = [
  '/',
  '/browse/experience/',
  '/title/f1jobs/',
  '/title/christ-university/',
  '/watch/f1jobs/',
  '/search/?q=sales',
  '/skills/',
  '/skills/psychology/',
  '/skills/collections/revenue-wins/',
  '/career-guide/',
  '/contact/',
  '/no-such-title/',
];

for (const path of PAGES) {
  test(`${path} has no serious accessibility issues`, async ({ page }) => {
    await page.goto(path);
    const { violations } = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();
    const serious = violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
    expect(serious.map((v) => `${v.id}: ${v.help} (${v.nodes.length})`)).toEqual([]);
  });
}

test('the open profile menu has no serious accessibility issues', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /^Profile menu/ }).click();
  const { violations } = await new AxeBuilder({ page })
    .include('#profile-menu')
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
    .analyze();
  const serious = violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
  expect(serious.map((v) => `${v.id}: ${v.help}`)).toEqual([]);
});
