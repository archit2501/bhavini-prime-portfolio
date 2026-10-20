import { expect, test } from './fixtures';

/**
 * The responsive pass (task 4.1.1). Every route is checked for sideways scroll at the plan's seven
 * widths, the home hero's stack for clearing the nav, and the five main screens are screenshotted
 * on every device into the report for review. They are attachments rather than pixel baselines,
 * since macOS and CI's Linux render fonts differently.
 */
const ROUTES = [
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
  '/my-list/',
  '/no-such-page/',
];
const WIDTHS = [375, 448, 600, 880, 1280, 1440, 1800];
const SCREENS: [string, string][] = [
  ['home', '/'],
  ['title', '/title/f1jobs/'],
  ['watch', '/watch/f1jobs/'],
  ['search', '/search/?q=sales'],
  ['guide', '/career-guide/'],
];

test('no page scrolls sideways at any of the seven widths', async ({ page, isMobile }) => {
  test.skip(isMobile, 'sized in a desktop browser; the phones and the iPad run the next test');
  test.setTimeout(120_000);
  const failures: string[] = [];
  for (const width of WIDTHS) {
    await page.setViewportSize({ width, height: width < 600 ? 812 : 900 });
    for (const route of ROUTES) {
      await page.goto(route);
      const over = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      if (over > 0) failures.push(`${route} at ${width}px: ${over}px too wide`);
    }
  }
  expect(failures).toEqual([]);
});

test('no page scrolls sideways on this device', async ({ page }) => {
  for (const route of ROUTES) {
    await page.goto(route);
    const over = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(over, route).toBeLessThanOrEqual(0);
  }
});

test('every hero slide clears the nav', async ({ page, isMobile }) => {
  test.skip(isMobile, 'sized in a desktop browser');
  for (const [width, height] of [
    [600, 900],
    [880, 800],
    [1024, 768],
    [1280, 800],
    [1440, 900],
  ]) {
    await page.setViewportSize({ width, height });
    await page.goto('/');
    const clearance = await page.evaluate(() => {
      const nav = document.querySelector('header.nav')?.getBoundingClientRect().bottom ?? 0;
      return [...document.querySelectorAll<HTMLElement>('.hero__content')].map((c) => {
        const shown = [...c.children].filter((k) => getComputedStyle(k).display !== 'none');
        return Math.min(...shown.map((k) => k.getBoundingClientRect().top)) - nav;
      });
    });
    for (const gap of clearance) expect(gap, `${width}x${height}`).toBeGreaterThanOrEqual(8);
  }
});

for (const [name, route] of SCREENS) {
  test(`${name} screenshot for review`, async ({ page }, testInfo) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(route);
    await page.waitForLoadState('networkidle');
    await testInfo.attach(`${name}-${testInfo.project.name}`, {
      body: await page.screenshot({ fullPage: true }),
      contentType: 'image/png',
    });
  });
}
