import AxeBuilder from '@axe-core/playwright';
import { expect, test } from './fixtures';

// WCAG 2.2 AA (decision Q9), on every route the site builds (task 4.1.2).
const TITLES = [
  'f1jobs',
  'vastra-kala',
  'clinical',
  'youth-for-parivarthan',
  'christ-university',
  'cambridge-innovative-school',
];
const TRAILERS = TITLES.filter((t) => t !== 'cambridge-innovative-school');
const SKILLS = [
  'sales-business-development',
  'marketing-content',
  'operations',
  'professional',
  'psychology',
];
const PAGES = [
  '/',
  '/browse/experience/',
  '/browse/education/',
  '/browse/all/',
  ...TITLES.map((t) => `/title/${t}/`),
  ...TRAILERS.map((t) => `/watch/${t}/`),
  '/search/?q=sales',
  '/skills/',
  ...SKILLS.map((s) => `/skills/${s}/`),
  '/skills/collections/revenue-wins/',
  '/skills/collections/certifications/',
  '/skills/collections/care-and-community/',
  '/career-guide/',
  '/contact/',
  '/my-list/',
  '/no-such-title/',
];

for (const path of PAGES) {
  test(`${path} has no serious accessibility issues`, async ({ page }) => {
    await page.goto(path);
    const { violations } = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();
    const serious = violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
    expect(serious.map((v) => `${v.id}: ${v.help} (${v.nodes.length})`)).toEqual([]);
  });
}

test('the open profile menu has no serious accessibility issues', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /^Profile menu/ }).click();
  const { violations } = await new AxeBuilder({ page })
    .include('#profile-menu')
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
    .analyze();
  const serious = violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
  expect(serious.map((v) => `${v.id}: ${v.help}`)).toEqual([]);
});

/** Interactive things smaller than 24x24 that aren't links inside a line of text (WCAG 2.5.8). */
function smallTargets(): string[] {
  const found: string[] = [];
  const selector = 'a[href], button, input, select, textarea, [role="tab"], summary';
  for (const el of document.querySelectorAll<HTMLElement>(selector)) {
    const style = getComputedStyle(el);
    const hidden = el.closest(
      '[hidden], [inert], dialog:not([open]), [popover]:not(:popover-open)',
    );
    if (hidden || style.visibility === 'hidden' || style.display === 'none') continue;
    const box = el.getBoundingClientRect();
    if ((box.width === 0 && box.height === 0) || (box.width >= 24 && box.height >= 24)) continue;
    const around = (el.parentElement?.textContent ?? '').replace(el.textContent ?? '', '');
    if (style.display === 'inline' && /[a-z]/i.test(around)) continue; // inline in text: exempt
    const name = (el.getAttribute('aria-label') ?? el.textContent ?? '').trim().slice(0, 40);
    found.push(
      `${el.tagName.toLowerCase()} "${name}" ${Math.round(box.width)}x${Math.round(box.height)}`,
    );
  }
  return found;
}

test('every control is at least 24px, bar links in running text', async ({ page }) => {
  test.setTimeout(120_000);
  const failures: string[] = [];
  for (const path of PAGES) {
    await page.goto(path);
    failures.push(...(await page.evaluate(smallTargets)).map((f) => `${path}: ${f}`));
  }
  expect(failures).toEqual([]);
});

test('Tab never leaves focus hidden under the nav', async ({ page, isMobile }) => {
  test.skip(isMobile, 'keyboard walk on desktop browsers');
  test.setTimeout(120_000);
  const failures: string[] = [];
  for (const path of [
    '/',
    '/title/f1jobs/',
    '/skills/marketing-content/',
    '/career-guide/',
    '/contact/',
  ]) {
    await page.goto(path);
    for (let i = 0; i < 45; i++) {
      await page.keyboard.press('Tab');
      const hidden = await page.evaluate(() => {
        const el = document.activeElement as HTMLElement | null;
        if (!el || el === document.body || el.closest('header.nav, [popover], dialog')) return null;
        const box = el.getBoundingClientRect();
        const x = Math.min(Math.max(box.left + box.width / 2, 0), innerWidth - 1);
        const y = Math.min(Math.max(box.top + Math.min(box.height / 2, 12), 0), innerHeight - 1);
        const top = document.elementFromPoint(x, y);
        // Covered only if something else (the nav) is painted over its middle.
        return top && !el.contains(top) && !top.contains(el) && top.closest('header.nav')
          ? (el.getAttribute('aria-label') ?? el.textContent ?? '').trim().slice(0, 40)
          : null;
      });
      if (hidden) failures.push(`${path}: ${hidden}`);
    }
  }
  expect(failures).toEqual([]);
});

test('reduced motion stills the motion tokens and the autoplay', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  const tokens = await page.evaluate(() =>
    ['--dur-fast', '--dur-base', '--dur-fade'].map((t) =>
      parseFloat(getComputedStyle(document.documentElement).getPropertyValue(t)),
    ),
  );
  expect(tokens).toEqual([0, 0, 0]);
  await page.goto('/watch/f1jobs/');
  await expect(page.locator('[data-player]')).toHaveAttribute('data-state', 'paused');
});

test('every route reads without JavaScript', async ({ browser }) => {
  test.setTimeout(120_000);
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  for (const path of PAGES) {
    await page.goto(path);
    await expect(page.getByRole('heading', { level: 1 }).first(), path).toBeAttached();
    await expect(page.locator('main'), path).not.toBeEmpty();
  }
  await context.close();
});
