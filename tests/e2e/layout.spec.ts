import { expect, test } from '@playwright/test';

test.describe('base layout', () => {
  test('uses the measured background and Inter', async ({ page }) => {
    await page.goto('/');
    const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    expect(bg).toBe('rgb(0, 5, 13)');
    const interReady = await page.evaluate(async () => {
      await document.fonts.ready;
      return document.fonts.check('500 16px "Inter Variable"');
    });
    expect(interReady).toBe(true);
  });

  test('focus ring is a 3px white outline', async ({ page, browserName }) => {
    await page.goto('/');
    await page.keyboard.press(browserName === 'webkit' ? 'Alt+Tab' : 'Tab');
    const skip = page.getByRole('link', { name: 'Skip to content' });
    await expect(skip).toBeFocused();
    const ring = await skip.evaluate((el) => {
      const s = getComputedStyle(el);
      return { style: s.outlineStyle, width: parseFloat(s.outlineWidth), color: s.outlineColor };
    });
    expect(ring.style).toBe('solid');
    expect(ring.color).toBe('rgb(255, 255, 255)');
    // WebKit on iPad snaps 3px to device pixels and reports 2.8px.
    expect(ring.width).toBeGreaterThanOrEqual(2.5);
  });

  test('keeps focused content clear of the sticky nav', async ({ page }) => {
    await page.goto('/');
    const [padding, nav] = await page.evaluate(() => [
      parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop),
      parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--nav-h')) * 16,
    ]);
    expect(padding).toBeGreaterThanOrEqual(nav);
  });

  test('describes her as a Person for search engines', async ({ page }) => {
    await page.goto('/');
    const data = JSON.parse(
      (await page.locator('script[type="application/ld+json"]').textContent()) ?? '{}',
    );
    expect(data['@type']).toBe('Person');
    expect(data.name).toBe('Bhavini Malhotra');
  });

  test('footer has the copyright, links and disclaimer', async ({ page }) => {
    await page.goto('/');
    const footer = page.getByRole('contentinfo');
    await expect(footer).toContainText('© 2026 Bhavini Malhotra');
    await expect(footer.getByRole('link', { name: 'LinkedIn' })).toHaveAttribute(
      'href',
      /linkedin\.com\/in\//,
    );
    await expect(footer).toContainText('Not affiliated with Amazon, Prime Video or IMDb.');
  });

  test('reduced motion turns motion tokens off', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    const tokens = await page.evaluate(() => {
      const s = getComputedStyle(document.documentElement);
      return [s.getPropertyValue('--dur-base'), s.getPropertyValue('--hover-scale')].map(
        parseFloat,
      );
    });
    // The CSS minifier writes 0ms as 0s, so compare numbers.
    expect(tokens).toEqual([0, 1]);
  });
});
