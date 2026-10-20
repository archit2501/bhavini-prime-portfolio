import { expect, test } from '@playwright/test';

test('icons and the social image are linked and served', async ({ page, request }) => {
  await page.goto('/');
  for (const selector of [
    'link[rel="icon"][type="image/svg+xml"]',
    'link[rel="icon"][sizes="32x32"]',
    'link[rel="apple-touch-icon"]',
  ]) {
    const href = await page.locator(selector).getAttribute('href');
    expect(href, selector).toBeTruthy();
    expect((await request.get(href ?? '')).status(), selector).toBe(200);
  }
  const og = await page.locator('meta[property="og:image"]').getAttribute('content');
  expect(og).toMatch(/^https?:\/\/.+\/og\.png$/);
  const res = await request.get(new URL(og ?? '').pathname);
  expect(res.status()).toBe(200);
  expect(res.headers()['content-type']).toContain('image/png');
});

test('the footer shows the grey wordmark as decoration', async ({ page }) => {
  await page.goto('/');
  const mark = page.getByRole('contentinfo').locator('svg.mark');
  await expect(mark).toHaveAttribute('aria-hidden', 'true');
  const fill = await mark
    .locator('.mark__swoosh')
    .first()
    .evaluate((el) => getComputedStyle(el).fill);
  expect(fill).toBe('rgb(129, 151, 164)');
});
