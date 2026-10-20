import { expect, test } from '@playwright/test';

test('home rows follow the page order', async ({ page }) => {
  await page.goto('/');
  const titles = page.locator('[data-row] .row__title');
  await expect(titles).toHaveText([
    'Continue watching',
    "Top 10 in Bhavini's career",
    'Bhavini Originals: Experience',
    'Education',
    'Certifications',
  ]);
});

test('cards name their title for screen readers and open the detail page', async ({ page }) => {
  await page.goto('/');
  const row = page.getByRole('region', { name: 'Bhavini Originals: Experience' });
  const card = row.getByRole('link', {
    name: /^F1Jobs\.io, Series, May 2026 – now, new episodes$/,
  });
  await expect(card).toHaveAttribute('href', '/title/f1jobs/');
  await expect(row.locator('.card__ribbon').first()).toHaveText('NEW EPISODES');
  const box = await card.boundingBox();
  expect(Math.abs((box?.height ?? 0) - ((box?.width ?? 0) * 9) / 16)).toBeLessThan(1.5);
});

test('See more opens the row as a grid', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'See more Bhavini Originals: Experience' }).click();
  await expect(page).toHaveURL(/\/browse\/experience\/$/);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Bhavini Originals: Experience');
  await expect(page.locator('.browse__grid .card')).toHaveCount(4);
});

test('All titles lists every title', async ({ page }) => {
  await page.goto('/browse/all/');
  await expect(page.locator('.browse__grid .card')).toHaveCount(6);
});

test('chevrons page an overflowing row without dragging', async ({ page, viewport }) => {
  test.skip((viewport?.width ?? 0) >= 880, 'four cards fit without paging on wide screens');
  await page.goto('/');
  const row = page.getByRole('region', { name: 'Bhavini Originals: Experience' });
  await row.scrollIntoViewIfNeeded();
  const next = row.getByRole('button', { name: 'Scroll Bhavini Originals: Experience forward' });
  const back = row.getByRole('button', { name: 'Scroll Bhavini Originals: Experience back' });
  await expect(back).toBeHidden();
  await row.hover();
  await next.click();
  await expect(back).toBeVisible();
  const scrolled = await row.locator('[data-track]').evaluate((el) => el.scrollLeft);
  expect(scrolled).toBeGreaterThan(0);
});
