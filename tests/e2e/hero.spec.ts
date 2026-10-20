import { expect, test } from '@playwright/test';

const slides = (page: import('@playwright/test').Page) => page.locator('[data-slide]');
const active = (page: import('@playwright/test').Page) =>
  page.locator('[data-slide][data-active="true"]');

test('shows four featured titles, current role first', async ({ page }) => {
  await page.goto('/');
  const hero = page.getByRole('region', { name: 'Featured titles' });
  await expect(hero).toHaveAttribute('aria-roledescription', 'carousel');
  await expect(slides(page)).toHaveCount(4);
  await expect(active(page)).toHaveAttribute('aria-label', '1 of 4: F1Jobs.io');
  await expect(active(page).getByRole('img', { name: 'F1Jobs.io' })).toBeVisible();
});

test("the first slide's key art is the high-priority LCP image", async ({ page }) => {
  await page.goto('/');
  const img = slides(page).first().locator('img');
  await expect(img).toHaveAttribute('fetchpriority', 'high');
  await expect(img).toHaveAttribute('loading', 'eager');
  await expect(slides(page).nth(2).locator('img')).toHaveAttribute('loading', 'lazy');
});

test('links Watch now to the player and the i button to the detail page', async ({
  page,
  viewport,
}) => {
  test.skip((viewport?.width ?? 0) < 600, 'phones show only the lettering, as on Prime');
  await page.goto('/');
  const slide = active(page);
  await expect(slide.getByRole('link', { name: /Watch now/ })).toHaveAttribute(
    'href',
    '/watch/f1jobs/',
  );
  await expect(slide.getByRole('link', { name: 'More details for F1Jobs.io' })).toHaveAttribute(
    'href',
    '/title/f1jobs/',
  );
  await expect(slide.getByRole('button', { name: 'Add F1Jobs.io to My List' })).toBeVisible();
});

test('dots, arrows and inert hidden slides', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Show Vastra Kala' }).click();
  await expect(active(page)).toHaveAttribute('aria-label', '3 of 4: Vastra Kala');
  await expect(page.getByRole('button', { name: 'Show Vastra Kala' })).toHaveAttribute(
    'aria-current',
    'true',
  );
  await page.getByRole('button', { name: 'Next title' }).click({ force: true });
  await expect(active(page)).toHaveAttribute('aria-label', /^4 of 4/);
  await page.getByRole('button', { name: 'Next title' }).click({ force: true });
  await expect(active(page)).toHaveAttribute('aria-label', /^1 of 4/);
  // Hidden slides are inert, so keyboard focus can't land in them.
  expect(
    await slides(page)
      .nth(1)
      .evaluate((el) => (el as HTMLElement).inert),
  ).toBe(true);
});

test('pause stops auto-advance and play resumes it', async ({ page }) => {
  await page.goto('/');
  const hero = page.locator('[data-hero]');
  await page.mouse.move(1, 1);
  await expect(hero).toHaveAttribute('data-playing', 'true');
  await page.getByRole('button', { name: 'Pause the carousel' }).click();
  await page.mouse.move(1, 1);
  await expect(hero).toHaveAttribute('data-playing', 'false');
  await expect(page.getByRole('button', { name: 'Play the carousel' })).toBeVisible();
});

test('does not auto-advance under reduced motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await expect(page.locator('[data-hero]')).toHaveAttribute('data-playing', 'false');
});

test('phones keep only the lettering, status and entitlement', async ({ page, viewport }) => {
  test.skip((viewport?.width ?? 0) >= 600, 'phone layout only');
  await page.goto('/');
  await expect(active(page).locator('.hero__actions')).toBeHidden();
  await expect(active(page).getByText('Open to roles')).toBeVisible();
});
