import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

const card = (page: Page, slug: string) =>
  page.locator(`[data-row="experience"] [data-card="${slug}"]`);
const preview = (page: Page) => page.locator('[data-preview]');

async function hover(page: Page, slug: string) {
  const c = card(page, slug);
  await c.scrollIntoViewIfNeeded();
  await c.hover();
  await expect(preview(page)).toBeVisible();
  await expect(preview(page)).toHaveAttribute('data-state', 'open');
}

test.describe('mouse', () => {
  test.skip(({ isMobile }) => isMobile, 'hover needs a mouse');

  test('opens after the hover delay at 1.56x with the title details', async ({
    page,
    viewport,
  }) => {
    await page.goto('/');
    await hover(page, 'vastra-kala');
    const panel = preview(page);
    await expect(panel.getByRole('heading', { name: 'Vastra Kala' })).toBeVisible();
    await expect(panel.getByText('Shipping to 5+ global regions')).toBeVisible();
    await expect(panel.getByRole('link', { name: 'Watch now' })).toHaveAttribute(
      'href',
      '/watch/vastra-kala/',
    );
    await expect(panel.getByRole('button', { name: 'Add Vastra Kala to My List' })).toBeVisible();
    await expect(panel.getByText('Series · 2 episodes')).toBeVisible();
    if ((viewport?.width ?? 0) >= 1280) {
      // Measured once the 300 ms grow has finished.
      const cw = await card(page, 'vastra-kala').evaluate((el) => el.getBoundingClientRect().width);
      await expect
        .poll(async () => (await panel.evaluate((el) => el.getBoundingClientRect().width)) / cw)
        .toBeCloseTo(1.56, 1);
    }
  });

  test('stays open while the pointer is on it, and closes when it leaves (WCAG 1.4.13)', async ({
    page,
  }) => {
    await page.goto('/');
    await hover(page, 'vastra-kala');
    await preview(page).getByRole('link', { name: 'Watch now' }).hover();
    await page.waitForTimeout(300);
    await expect(preview(page)).toBeVisible();
    await page.mouse.move(5, 5);
    await expect(preview(page)).toBeHidden();
  });

  test('Esc dismisses it', async ({ page }) => {
    await page.goto('/');
    await hover(page, 'vastra-kala');
    await page.keyboard.press('Escape');
    await expect(preview(page)).toBeHidden();
  });

  test('the open card has no serious accessibility issues', async ({ page }) => {
    await page.goto('/');
    await hover(page, 'f1jobs');
    const { violations } = await new AxeBuilder({ page })
      .include('[data-preview]')
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();
    const serious = violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
    expect(serious.map((v) => `${v.id}: ${v.help}`)).toEqual([]);
  });
});

test.describe('keyboard', () => {
  test.skip(({ isMobile }) => isMobile, 'keyboard path tested on desktop');

  test('focus opens it, Tab walks through it to the next card, Esc returns to the card', async ({
    page,
    browserName,
  }) => {
    const tab = browserName === 'webkit' ? 'Alt+Tab' : 'Tab';
    await page.goto('/');
    await page.keyboard.press(tab);
    await card(page, 'f1jobs').focus();
    await expect(preview(page)).toBeVisible();
    await expect(card(page, 'f1jobs')).toHaveAttribute('aria-describedby', 'preview-title');
    await page.keyboard.press(tab);
    await expect(preview(page).getByRole('link', { name: 'Watch now' })).toBeFocused();
    await page.keyboard.press(tab);
    await expect(
      preview(page).getByRole('button', { name: 'Add F1Jobs.io to My List' }),
    ).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(preview(page)).toBeHidden();
    await expect(card(page, 'f1jobs')).toBeFocused();
    await card(page, 'f1jobs').focus();
    await expect(preview(page)).toBeVisible();
    await page.keyboard.press(tab);
    await page.keyboard.press(tab);
    await page.keyboard.press(tab);
    await expect(card(page, 'vastra-kala')).toBeFocused();
  });
});

test.describe('touch', () => {
  test.skip(({ isMobile }) => !isMobile, 'tap behaviour on phones');

  test('the first tap previews, a second tap opens the title', async ({ page }) => {
    await page.goto('/');
    // The first card: later ones can sit under the row's edge chevron on a phone.
    const c = card(page, 'f1jobs');
    await c.scrollIntoViewIfNeeded();
    await c.tap();
    await expect(preview(page)).toBeVisible();
    await expect(page).toHaveURL(/\/$/);
    await c.tap({ force: true });
    await expect(page).toHaveURL(/\/title\/f1jobs\/$/);
  });
});
