import { expect, test } from './fixtures';

/**
 * Smoke test for the live site, run by .github/workflows/deploy.yml with DEPLOYED_URL set to the
 * Pages URL (which ends in the base path, e.g. https://archit2501.github.io/bhavini-prime-portfolio/).
 * Paths here are relative, so they resolve under that base.
 */
const PAGES = ['', 'title/f1jobs/', 'watch/f1jobs/', 'skills/', 'career-guide/', 'contact/'];

for (const path of PAGES) {
  test(`/${path} is live, with its assets and the disclaimer`, async ({ page }) => {
    const failed: string[] = [];
    page.on('response', (r) => {
      if (r.status() >= 400 && new URL(r.url()).host === new URL(page.url() || r.url()).host)
        failed.push(`${r.status()} ${r.url()}`);
    });
    const res = await page.goto(path);
    expect(res?.status()).toBe(200);
    await expect(page.getByRole('heading', { level: 1 }).first()).toBeAttached();
    await expect(page.locator('body')).toContainText(
      'Not affiliated with Amazon, Prime Video or IMDb.',
    );
    await page.waitForLoadState('networkidle');
    expect(failed).toEqual([]);
  });
}

test('links stay under the base path', async ({ page, baseURL }) => {
  await page.goto('');
  const base = new URL(baseURL ?? '').pathname;
  const hrefs = await page
    .locator('a[href^="/"]')
    .evaluateAll((links) => links.map((a) => a.getAttribute('href') ?? ''));
  expect(hrefs.length).toBeGreaterThan(10);
  expect(hrefs.filter((h) => !h.startsWith(base))).toEqual([]);
});

test('an unknown path gets the not-found page', async ({ page }) => {
  const res = await page.goto('no-such-title/');
  expect(res?.status()).toBe(404);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText("We couldn't find that title");
});
