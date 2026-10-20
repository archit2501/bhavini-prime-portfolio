import AxeBuilder from '@axe-core/playwright';
import type { Page } from '@playwright/test';
import { expect, test } from './fixtures';

const player = (page: Page) => page.locator('[data-player]');

/** Whether this browser can load the trailer at all (Linux WebKit may lack the codecs). */
function mediaReady(page: Page): Promise<boolean> {
  return page.evaluate(
    () =>
      new Promise<boolean>((resolve) => {
        const v = document.querySelector('video');
        if (!v) return resolve(false);
        if (v.readyState >= 1) return resolve(true);
        v.addEventListener('loadedmetadata', () => resolve(true), { once: true });
        setTimeout(() => resolve(v.readyState >= 1), 5000);
      }),
  );
}

const currentTime = (page: Page) =>
  page.evaluate(() => document.querySelector('video')?.currentTime ?? -1);

test("the player has Prime's chrome", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/watch/f1jobs/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(/F1Jobs\.io\s*Trailer/);
  for (const name of ['Subtitles', 'Back 10 seconds', 'Play', 'Forward 10 seconds']) {
    await expect(page.getByRole('button', { name, exact: true })).toBeVisible();
  }
  await expect(page.getByRole('button', { name: /^Volume/ })).toHaveAttribute(
    'aria-disabled',
    'true',
  );
  await expect(page.getByRole('link', { name: 'Close player' })).toHaveAttribute(
    'href',
    '/title/f1jobs/',
  );
  const seek = page.getByRole('slider', { name: 'Seek' });
  await expect(seek).toHaveAttribute('aria-valuetext', '0 seconds of 12 seconds');
  await expect(page.locator('.player__time')).toHaveText(/0:00\s*\/\s*remaining\s*0:12/);
  await expect(page.locator('video track[kind="captions"]')).toHaveAttribute(
    'src',
    '/trailers/f1jobs.vtt',
  );
  // A full-screen page: no site navigation or footer.
  await expect(page.locator('header nav, footer')).toHaveCount(0);
});

test('starts playing on arrival, but waits when motion is reduced', async ({ page }) => {
  await page.goto('/watch/f1jobs/');
  test.skip(!(await mediaReady(page)), 'this browser cannot load the trailer');
  await expect(player(page)).toHaveAttribute('data-state', 'playing');
  await expect(page.getByRole('button', { name: 'Pause', exact: true })).toBeVisible();

  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.reload();
  await expect(player(page)).toHaveAttribute('data-state', 'paused');
  expect(await currentTime(page)).toBe(0);
});

test('space plays and pauses; the arrows skip 10 seconds either way', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/watch/f1jobs/');
  test.skip(!(await mediaReady(page)), 'this browser cannot load the trailer');
  await page.keyboard.press('ArrowRight');
  await expect.poll(() => currentTime(page)).toBe(10);
  await expect(page.locator('[data-elapsed]')).toHaveText('0:10');
  await expect(page.locator('[data-remaining]')).toHaveText('0:02');
  await page.keyboard.press('ArrowLeft');
  await expect.poll(() => currentTime(page)).toBe(0);

  await page.keyboard.press(' ');
  await expect(player(page)).toHaveAttribute('data-state', 'playing');
  await page.keyboard.press('k');
  await expect(player(page)).toHaveAttribute('data-state', 'paused');
});

test('c and the Subtitles button switch the captions', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/watch/vastra-kala/');
  const subtitles = page.getByRole('button', { name: 'Subtitles' });
  const mode = () => page.evaluate(() => document.querySelector('video')?.textTracks[0]?.mode);
  await expect(subtitles).toHaveAttribute('aria-pressed', 'false');
  await subtitles.click();
  await expect(subtitles).toHaveAttribute('aria-pressed', 'true');
  expect(await mode()).toBe('showing');
  await page.locator('body').press('c');
  await expect(subtitles).toHaveAttribute('aria-pressed', 'false');
  expect(await mode()).toBe('hidden');
});

test('Skip intro jumps past the ident, then goes away', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/watch/f1jobs/');
  test.skip(!(await mediaReady(page)), 'this browser cannot load the trailer');
  const skip = page.getByRole('button', { name: 'Skip intro' });
  await skip.click();
  await expect.poll(() => currentTime(page)).toBeGreaterThanOrEqual(2.3);
  await expect(skip).toBeHidden();
  await expect(page.getByRole('button', { name: 'Play', exact: true })).toBeFocused();
});

test('the controls fade after 3 s of playback and come back on a key', async ({ page }) => {
  await page.clock.install();
  await page.goto('/watch/f1jobs/');
  // Playback starts once the page is idle; the fake clock has to get there.
  await page.clock.runFor(1600);
  test.skip(!(await mediaReady(page)), 'this browser cannot load the trailer');
  await expect(player(page)).toHaveAttribute('data-state', 'playing');
  await expect(player(page)).toHaveAttribute('data-chrome', 'shown');
  await page.clock.runFor(3500);
  await expect(player(page)).toHaveAttribute('data-chrome', 'hidden');
  await expect(page.getByRole('button', { name: 'Pause', exact: true })).toBeHidden();
  await page.keyboard.press('Shift');
  await expect(player(page)).toHaveAttribute('data-chrome', 'shown');
});

test('a tap shows and hides the controls on a touch screen', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'touch devices only');
  await page.clock.install();
  await page.goto('/watch/f1jobs/');
  await page.clock.runFor(1600);
  test.skip(!(await mediaReady(page)), 'this browser cannot load the trailer');
  await expect(player(page)).toHaveAttribute('data-state', 'playing');
  const surface = page.locator('[data-surface]');
  await surface.tap({ position: { x: 40, y: 200 } });
  await expect(player(page)).toHaveAttribute('data-chrome', 'hidden');
  await surface.tap({ position: { x: 40, y: 200 } });
  await expect(player(page)).toHaveAttribute('data-chrome', 'shown');
  // Tapping the picture never pauses it.
  await expect(player(page)).toHaveAttribute('data-state', 'playing');
});

test('Next up counts down to the next title, and Hide cancels it', async ({ page }) => {
  await page.clock.install();
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/watch/f1jobs/');
  const card = page.getByRole('complementary', { name: 'Vastra Kala' });
  await expect(card).toBeHidden();
  // The end of the trailer, without waiting 12 seconds for it.
  await page.evaluate(() => document.querySelector('video')?.dispatchEvent(new Event('ended')));
  await expect(card).toBeVisible();
  await expect(card).toContainText('Next up in 10');
  await expect(page.locator('[data-player-status]')).toHaveText(
    'Next up: Vastra Kala, in 10 seconds',
  );
  await page.clock.runFor(4000);
  await expect(card).toContainText('Next up in 6');
  await card.getByRole('button', { name: 'Hide' }).click();
  await expect(card).toBeHidden();
  await expect(page.getByRole('button', { name: 'Replay' })).toBeFocused();
  await page.clock.runFor(8000);
  await expect(page).toHaveURL(/\/watch\/f1jobs\/$/);
});

test('Next up plays the next title when the countdown ends', async ({ page }) => {
  await page.clock.install();
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/watch/christ-university/');
  // The last title with a trailer wraps round to the first.
  await expect(page.getByRole('link', { name: 'Play now', includeHidden: true })).toHaveAttribute(
    'href',
    '/watch/f1jobs/',
  );
  await page.evaluate(() => document.querySelector('video')?.dispatchEvent(new Event('ended')));
  await page.clock.runFor(10_500);
  await expect(page).toHaveURL(/\/watch\/f1jobs\/$/);
});

test('Esc closes the player back to the title', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/watch/clinical/');
  await page.keyboard.press('Escape');
  await expect(page).toHaveURL(/\/title\/clinical\/$/);
});

test("the school prequel's Watch now plays its sequel", async ({ page, request }) => {
  await page.goto('/title/cambridge-innovative-school/');
  const cta = page.locator('[data-detail-hero] .dh__cta');
  await expect(cta).toHaveAttribute('href', '/watch/christ-university/');
  await expect(cta).toHaveText(/Watch the sequel\s*Christ University/);
  expect((await request.get('/watch/cambridge-innovative-school/')).status()).toBe(404);
});

test.describe('Behind the scenes', () => {
  test('each trailer has a metadata track written from the catalog', async ({ request }) => {
    const res = await request.get('/trailers/f1jobs.meta.vtt');
    expect(res.headers()['content-type']).toContain('text/vtt');
    const vtt = await res.text();
    expect(vtt.startsWith('WEBVTT')).toBe(true);
    const payloads = vtt.split('\n').filter((line) => line.startsWith('['));
    expect(payloads).toHaveLength(4);
    expect(JSON.parse(payloads[1])[0]).toMatchObject({
      kind: 'fact',
      title: '$100K+ in revenue',
      detail: 'from 7+ successful sales',
    });
  });

  test('the quick view follows the scene', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/watch/f1jobs/');
    test.skip(!(await mediaReady(page)), 'this browser cannot load the trailer');
    const quick = page.getByRole('region', { name: 'Behind the scenes' });
    await expect(quick.getByRole('listitem')).toHaveCount(0);
    await page.evaluate(() => {
      const v = document.querySelector('video');
      if (v) v.currentTime = 3.5;
    });
    await expect(quick.getByRole('listitem').first()).toContainText(
      'Bhavini MalhotraSales & Operations Executive',
    );
    await page.evaluate(() => {
      const v = document.querySelector('video');
      if (v) v.currentTime = 6;
    });
    await expect(quick.getByRole('listitem').first()).toContainText('$100K+ in revenue');
    await expect(quick.locator('img').first()).toHaveJSProperty('complete', true);
  });

  test('the quick view fades with the chrome and comes back on pause', async ({ page }) => {
    await page.clock.install();
    await page.goto('/watch/f1jobs/');
    await page.clock.runFor(1600);
    test.skip(!(await mediaReady(page)), 'this browser cannot load the trailer');
    const quick = page.locator('[data-bts]');
    await page.evaluate(() => {
      const v = document.querySelector('video');
      if (v) v.currentTime = 5.2;
    });
    await expect(quick.getByRole('listitem').first()).toContainText('$100K+');
    await expect(quick).toHaveAttribute('data-visible', 'true');
    await page.clock.runFor(4500);
    await expect(player(page)).toHaveAttribute('data-chrome', 'hidden');
    await expect(quick).toHaveAttribute('data-visible', 'false');
    await page.keyboard.press('k');
    await expect(player(page)).toHaveAttribute('data-state', 'paused');
    await expect(quick).toHaveAttribute('data-visible', 'true');
  });

  test('View all opens every tab; Esc closes the panel, not the player', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/watch/christ-university/');
    const open = page.getByRole('button', { name: 'View all' });
    await open.click();
    const panel = page.getByRole('dialog', { name: 'Behind the scenes' });
    await expect(panel).toBeVisible();
    const tabs = panel.getByRole('tab');
    await expect(tabs).toHaveText(['In scene', 'Skills', 'Facts', 'Trivia']);
    await expect(panel.getByRole('tabpanel')).toContainText('Bhavini Malhotra');
    await tabs.first().focus();
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowRight');
    await expect(tabs.nth(2)).toBeFocused();
    await expect(tabs.nth(2)).toHaveAttribute('aria-selected', 'true');
    await expect(panel.getByRole('tabpanel')).toContainText('8.81 CGPA');
    await tabs.nth(3).click();
    await expect(panel.getByRole('tabpanel')).toContainText('Prequel: Cambridge Innovative School');
    await page.keyboard.press('Escape');
    await expect(panel).toBeHidden();
    await expect(page).toHaveURL(/\/watch\/christ-university\/$/);
    await expect(open).toBeFocused();
  });

  test('the open panel has no serious accessibility issues', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/watch/vastra-kala/');
    await page.getByRole('button', { name: 'View all' }).click();
    const { violations } = await new AxeBuilder({ page })
      .include('[data-bts-full]')
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();
    const serious = violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
    expect(serious.map((v) => `${v.id}: ${v.help}`)).toEqual([]);
  });
});

test('the trailer never loads before the page has', async ({ page }) => {
  const order: string[] = [];
  page.on('load', () => order.push('load'));
  page.on('request', (r) => {
    if (/\/trailers\/.+\.(webm|mp4)$/.test(r.url())) order.push('video');
  });
  await page.goto('/watch/f1jobs/');
  await expect(page.locator('video')).toHaveAttribute('preload', /none|metadata/);
  // The detail page's trailer has no sources at all until someone asks for it.
  await page.goto('/title/f1jobs/');
  await expect(page.locator('[data-detail-hero] video source')).toHaveCount(0);
  await page.getByRole('button', { name: 'Watch trailer' }).click();
  await expect(page.locator('[data-detail-hero] video source')).toHaveCount(2);
  await expect.poll(() => order.includes('video')).toBe(true);
  expect(order.indexOf('load')).toBeLessThan(order.indexOf('video'));
});
