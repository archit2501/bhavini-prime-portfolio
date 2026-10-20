import { expect, test } from './fixtures';

test('series hero: lettering, actions, CTA, genres, cast and badges', async ({ page }) => {
  await page.goto('/title/f1jobs/');
  await expect(page).toHaveTitle('F1Jobs.io · Bhavini Malhotra');
  await expect(page.getByRole('heading', { level: 1, name: 'F1Jobs.io' })).toBeVisible();
  const actions = page.getByRole('group', { name: 'Title actions' });
  for (const name of ['Watch trailer', 'Add F1Jobs.io to My List', 'Like', 'Not for me', 'Share']) {
    await expect(actions.getByRole('button', { name })).toBeVisible();
  }
  const cta = page.getByRole('link', { name: 'Episode 1 Watch now' });
  await expect(cta).toHaveAttribute('href', '/watch/f1jobs/');
  const hero = page.locator('[data-detail-hero]');
  await expect(hero.getByText('$100K+ in revenue from 7+ sales')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Sales & Business Development' })).toHaveAttribute(
    'href',
    '/skills/sales-business-development/',
  );
  await expect(hero.getByText('as Sales & Operations Executive')).toBeVisible();
  await expect(page.getByRole('list', { name: 'Badges' }).getByRole('listitem')).toHaveText([
    'Series',
    'CC',
  ]);
});

test('films get a one-line CTA; titles without a trailer get no trailer button', async ({
  page,
}) => {
  await page.goto('/title/christ-university/');
  await expect(page.getByRole('link', { name: 'Watch now', exact: true })).toBeVisible();
  await expect(page.getByRole('list', { name: 'Badges' }).getByRole('listitem')).toHaveText([
    'Film',
    '3 years',
    'CC',
  ]);
  await page.goto('/title/cambridge-innovative-school/');
  await expect(page.getByRole('button', { name: 'Watch trailer' })).toHaveCount(0);
  await expect(page.getByRole('list', { name: 'Badges' }).getByRole('listitem')).toHaveText([
    'Film',
  ]);
});

test('Like and Not for me are one choice per title, kept across visits', async ({ page }) => {
  await page.goto('/title/vastra-kala/');
  const like = page.getByRole('button', { name: 'Like', exact: true });
  const nope = page.getByRole('button', { name: 'Not for me' });
  await like.click();
  await expect(like).toHaveAttribute('aria-pressed', 'true');
  await nope.click();
  await expect(nope).toHaveAttribute('aria-pressed', 'true');
  await expect(like).toHaveAttribute('aria-pressed', 'false');
  await page.reload();
  await expect(page.getByRole('button', { name: 'Not for me' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
});

test('the trailer button plays the trailer full-bleed and Esc stops it', async ({ page }) => {
  await page.goto('/title/f1jobs/');
  const hero = page.locator('[data-detail-hero]');
  const button = page.getByRole('button', { name: 'Watch trailer' });
  await button.click();
  await expect(hero).toHaveAttribute('data-immersive', 'true');
  await expect(button).toHaveAttribute('aria-pressed', 'true');
  await page.keyboard.press('Escape');
  await expect(hero).toHaveAttribute('data-immersive', 'false');
});

test('scrolling in plays the trailer full-bleed, scrolling back stops it', async ({ page }) => {
  await page.goto('/title/f1jobs/');
  const hero = page.locator('[data-detail-hero]');
  await page.evaluate(() => window.scrollTo(0, 300));
  await expect(hero).toHaveAttribute('data-immersive', 'true');
  await page.evaluate(() => window.scrollTo(0, 0));
  await expect(hero).toHaveAttribute('data-immersive', 'false');
});

test('reduced motion: scrolling never starts the trailer', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/title/f1jobs/');
  await page.evaluate(() => window.scrollTo(0, 400));
  await page.waitForTimeout(300);
  await expect(page.locator('[data-detail-hero]')).not.toHaveAttribute('data-immersive', 'true');
});

test('share copies the link where there is no share sheet', async ({
  page,
  context,
  browserName,
}) => {
  test.skip(browserName !== 'chromium', 'clipboard permissions are Chromium-only in Playwright');
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('/title/f1jobs/');
  await page.evaluate(() => Object.defineProperty(navigator, 'share', { value: undefined }));
  await page.getByRole('button', { name: 'Share' }).click();
  await expect(page.locator('[data-hero-status]')).toHaveText('Link copied');
});
