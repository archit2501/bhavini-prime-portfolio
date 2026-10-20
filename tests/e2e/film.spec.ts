import { expect, test } from './fixtures';

test('education is a film with its own credit and a prequel', async ({ page }) => {
  await page.goto('/title/christ-university/');
  const hero = page.locator('[data-detail-hero]');
  await expect(
    hero.getByText('as Student Representative, University Student Council'),
  ).toBeVisible();
  await page.getByRole('link', { name: 'Cambridge Innovative School' }).first().click();
  await expect(page).toHaveURL(/\/title\/cambridge-innovative-school\/$/);
  await expect(page.getByText('Sequel:')).toBeVisible();
  await expect(
    page.getByRole('link', { name: 'Christ University', exact: true }).first(),
  ).toHaveAttribute('href', '/title/christ-university/');
});

test('every title page ends with Recruiters also viewed', async ({ page }) => {
  await page.goto('/title/cambridge-innovative-school/');
  const row = page.getByRole('region', { name: 'Recruiters also viewed' });
  await expect(row.locator('.card')).toHaveCount(5);
  await expect(row.locator('[data-card="cambridge-innovative-school"]')).toHaveCount(0);
  // The school prequel is the one title without a trailer.
  await expect(page.getByRole('region', { name: 'Trailers' })).toHaveCount(0);
});

test('titles with a trailer end with a captioned Trailers row', async ({ page }) => {
  await page.goto('/title/f1jobs/');
  const row = page.getByRole('region', { name: 'Trailers' });
  await expect(row.getByRole('link', { name: 'F1Jobs.io: Trailer' })).toHaveAttribute(
    'href',
    '/watch/f1jobs/',
  );
  await expect(row.locator('.trailer__caption')).toHaveText('F1Jobs.io: Trailer');
});
