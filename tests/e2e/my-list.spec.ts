import { expect, test, type Page } from '@playwright/test';

const KEY = 'bhavini:my-list';
const stored = (page: Page) =>
  page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? 'null'), KEY);
const status = (page: Page) => page.locator('[data-my-list-status]');

test('the hero + saves a title, shows a check and says so', async ({ page, viewport }) => {
  test.skip((viewport?.width ?? 0) < 880, "phones' hero has no action buttons, as on Prime");
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  const add = page.getByRole('button', { name: 'Add F1Jobs.io to My List' });
  await expect(add).toHaveAttribute('aria-pressed', 'false');
  await add.click();
  const remove = page.getByRole('button', { name: 'Remove F1Jobs.io from My List' });
  await expect(remove).toHaveAttribute('aria-pressed', 'true');
  await expect(remove.locator('.my-list__added')).toBeVisible();
  await expect(remove.locator('.my-list__add')).toBeHidden();
  await expect(status(page)).toHaveText('Added F1Jobs.io to My List');
  expect(await stored(page)).toEqual(['f1jobs']);
  await remove.click();
  await expect(status(page)).toHaveText('Removed F1Jobs.io from My List');
  expect(await stored(page)).toEqual([]);
});

test('the detail page + shares the same list', async ({ page }) => {
  await page.addInitScript((key) => localStorage.setItem(key, '["vastra-kala"]'), KEY);
  await page.goto('/title/vastra-kala/');
  const hero = page.locator('[data-detail-hero]');
  await expect(
    hero.getByRole('button', { name: 'Remove Vastra Kala from My List' }),
  ).toHaveAttribute('aria-pressed', 'true');
  await page.goto('/title/clinical/');
  await page
    .locator('[data-detail-hero]')
    .getByRole('button', { name: /^Add ANR Hospital/ })
    .click();
  expect(await stored(page)).toEqual(['vastra-kala', 'clinical']);
});

test('the hover card + follows the card it opened on', async ({ page, isMobile }) => {
  test.skip(isMobile, 'hover needs a mouse');
  await page.addInitScript((key) => localStorage.setItem(key, '["vastra-kala"]'), KEY);
  await page.goto('/');
  const card = page.locator('[data-row="experience"] [data-card="vastra-kala"]');
  await card.scrollIntoViewIfNeeded();
  await card.hover();
  const preview = page.locator('[data-preview]');
  await expect(preview).toHaveAttribute('data-state', 'open');
  const button = preview.locator('[data-my-list]');
  await expect(button).toHaveAttribute('aria-pressed', 'true');
  await expect(button).toHaveAccessibleName('Remove Vastra Kala from My List');
  await button.click();
  await expect(button).toHaveAttribute('aria-pressed', 'false');
  expect(await stored(page)).toEqual([]);
});

test('/my-list/ shows saved titles newest first, or an empty state', async ({ page }) => {
  await page.goto('/my-list/');
  await expect(page.getByRole('heading', { name: 'Your list is empty' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Download resume' })).toHaveAttribute(
    'href',
    '/bhavini-malhotra-resume.pdf',
  );
  await page.evaluate((key) => localStorage.setItem(key, '["clinical","f1jobs"]'), KEY);
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Your list is empty' })).toBeHidden();
  const cards = page.locator('[data-mylist-item]:not([hidden]) a.card');
  await expect(cards).toHaveCount(2);
  const order = await page.locator('[data-mylist-item]:not([hidden])').evaluateAll((els) =>
    els
      .map((el) => ({
        id: (el as HTMLElement).dataset.mylistItem,
        order: Number((el as HTMLElement).style.order),
      }))
      .sort((a, b) => a.order - b.order)
      .map((e) => e.id),
  );
  expect(order).toEqual(['f1jobs', 'clinical']);
  await expect(page.locator('[data-mylist-count]')).toHaveText('2 titles, saved in this browser');
});

test('with storage blocked, + still works for the visit and says it will not last', async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, 'localStorage', {
      get() {
        throw new DOMException('blocked', 'SecurityError');
      },
    });
  });
  await page.goto('/title/f1jobs/');
  const hero = page.locator('[data-detail-hero]');
  await hero.getByRole('button', { name: 'Add F1Jobs.io to My List' }).click();
  await expect(hero.getByRole('button', { name: 'Remove F1Jobs.io from My List' })).toBeVisible();
  await expect(status(page)).toHaveText(
    "Added F1Jobs.io to My List for this visit; this browser isn't saving it",
  );
});
