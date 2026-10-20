import { expect, test } from '@playwright/test';

test('Top 10 ranks her proof numbers and links each to its title', async ({ page }) => {
  await page.goto('/');
  const row = page.getByRole('region', { name: "Top 10 in Bhavini's career" });
  const cards = row.getByRole('link');
  await expect(cards).toHaveCount(10);
  await expect(cards.first()).toHaveAccessibleName('Number 1: $100K+ in revenue, F1Jobs.io');
  await expect(cards.first()).toHaveAttribute('href', '/title/f1jobs/');
  await expect(cards.nth(9)).toHaveAccessibleName(
    'Number 10: 90.4% in high school, Cambridge Innovative School',
  );
  await expect(row.locator('.top__rank').first()).toHaveAttribute('aria-hidden', 'true');
});

test('proof numbers are set at display size, not body size', async ({ page, viewport }) => {
  test.skip((viewport?.width ?? 0) < 1280, 'measured at desktop widths');
  await page.goto('/');
  const value = page.locator('.top__value').first();
  await value.scrollIntoViewIfNeeded();
  const size = await value.evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
  expect(size).toBeGreaterThanOrEqual(28);
});

test('Continue watching shows how far into the season she is', async ({ page }) => {
  await page.goto('/');
  const row = page.getByRole('region', { name: 'Continue watching' });
  const card = row.getByRole('link');
  await expect(card).toHaveAccessibleName(
    /^F1Jobs\.io, .*, Season 1, (Just started|\d+ months? in)$/,
  );
  const width = await row
    .locator('.card__progress > span')
    .evaluate((el) => parseFloat((el as HTMLElement).style.width));
  expect(width).toBeGreaterThanOrEqual(5);
  expect(width).toBeLessThanOrEqual(95);
});
