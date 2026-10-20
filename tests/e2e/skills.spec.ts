import { expect, test } from '@playwright/test';

const SKILLS = [
  'sales-business-development',
  'marketing-content',
  'operations',
  'professional',
  'psychology',
];

test("Categories: Prime's genre grid and featured collections", async ({ page }) => {
  await page.goto('/skills/');
  const title = page.getByRole('heading', { level: 1, name: 'Categories' });
  await expect(title).toHaveCSS('font-size', '32px');
  await expect(title).toHaveCSS('font-weight', '700');
  const genres = page.getByRole('region', { name: 'Genres' }).getByRole('link');
  await expect(genres).toHaveText([
    'Sales & Business Development',
    'Marketing & Content',
    'Operations',
    'Professional Skills',
    'Psychology',
  ]);
  const featured = page.getByRole('region', { name: 'Featured collections' }).getByRole('link');
  await expect(featured).toHaveText(['Revenue wins', 'Certifications', 'Care & community']);
  await expect(featured.first()).toHaveCSS('background-color', 'rgb(74, 143, 245)');
  await expect(genres.first()).toHaveAttribute('href', '/skills/sales-business-development/');
});

test('at 1440 the genre tiles are 248x140, five across', async ({ page, viewport }) => {
  test.skip(viewport?.width !== 1440, 'measured at 1440');
  await page.goto('/skills/');
  const boxes = await page
    .getByRole('region', { name: 'Genres' })
    .getByRole('link')
    .evaluateAll((els) => els.map((el) => el.getBoundingClientRect().toJSON()));
  expect(new Set(boxes.map((b) => Math.round(b.top))).size).toBe(1);
  for (const b of boxes) {
    expect(Math.abs(b.width - 248)).toBeLessThan(12);
    expect(Math.abs(b.height - 140)).toBeLessThan(8);
  }
});

test('a skill page lists its titles, certificates and episodes', async ({ page }) => {
  await page.goto('/skills/marketing-content/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Marketing & Content');
  await expect(page.getByRole('list', { name: 'Includes' }).getByRole('listitem')).toHaveCount(4);
  const titles = page.getByRole('region', { name: /^Titles/ }).locator('a.card');
  await expect(titles).toHaveCount(2);
  await expect(titles.first()).toHaveAttribute('href', '/title/f1jobs/');
  await expect(
    page.getByRole('region', { name: 'Certifications' }).locator('a.card'),
  ).toHaveAttribute('href', '/skills/marketing-content/');
  const episodes = page.getByRole('region', { name: /^Episodes/ }).getByRole('link');
  await expect(episodes).toHaveCount(6);
  await expect(episodes.first()).toHaveAttribute('href', '/title/f1jobs/#episodes');
  await expect(episodes.first()).toContainText('1. THE PIPELINE');
  await expect(episodes.first()).toContainText('F1Jobs.io · S1 E1');
  await expect(page.getByRole('region', { name: 'More categories' }).getByRole('link')).toHaveCount(
    4,
  );
});

test('a skill used only by films has no Episodes shelf', async ({ page }) => {
  await page.goto('/skills/professional/');
  await expect(page.getByRole('region', { name: /^Titles/ }).locator('a.card')).toHaveCount(2);
  await expect(page.getByRole('region', { name: /^Episodes/ })).toHaveCount(1);
  await page.goto('/skills/psychology/');
  await expect(page.getByRole('region', { name: 'Certifications' })).toHaveCount(0);
});

test('featured collections open as grids', async ({ page }) => {
  await page.goto('/skills/');
  await page.getByRole('link', { name: 'Revenue wins' }).click();
  await expect(page).toHaveURL(/\/skills\/collections\/revenue-wins\/$/);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Revenue wins');
  await expect(page.locator('main a.card')).toHaveCount(2);
  await page.goto('/skills/collections/certifications/');
  await expect(page.locator('main a.card')).toHaveCount(2);
  await expect(page.locator('main a.card').first()).toContainText(/HubSpot Academy|NPTEL/);
});

test('home ends with Browse by skill, and every skill link resolves', async ({ page, request }) => {
  await page.goto('/');
  const row = page.getByRole('region', { name: 'Browse by skill' });
  await expect(row.locator('[data-tile]')).toHaveCount(5);
  for (const slug of SKILLS) {
    expect((await request.get(`/skills/${slug}/`)).status(), slug).toBe(200);
  }
  // The detail page's genre links land on these pages too.
  await page.goto('/title/f1jobs/');
  await page.locator('[data-detail-hero]').getByRole('link', { name: 'Operations' }).click();
  await expect(page).toHaveURL(/\/skills\/operations\/$/);
});
