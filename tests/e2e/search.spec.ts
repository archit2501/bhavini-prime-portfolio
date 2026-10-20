import AxeBuilder from '@axe-core/playwright';
import type { Page } from '@playwright/test';
import { expect, test } from './fixtures';

const openPanel = async (page: Page) => {
  await page.getByRole('button', { name: 'Search', exact: true }).click();
  const panel = page.locator('#search-panel');
  await expect(panel).toBeVisible();
  return panel;
};

test('the nav search opens a frosted panel over a dimmed page', async ({ page }) => {
  await page.goto('/');
  const panel = await openPanel(page);
  const field = panel.getByRole('searchbox');
  await expect(field).toBeFocused();
  const look = await panel.evaluate((el) => {
    const s = getComputedStyle(el);
    const b = getComputedStyle(el, '::backdrop');
    return {
      bg: s.backgroundColor,
      radius: s.borderTopLeftRadius,
      padding: s.paddingTop,
      backdrop: b.backgroundColor,
    };
  });
  expect(look).toEqual({
    bg: 'rgba(25, 30, 37, 0.92)',
    radius: '12px',
    padding: '21px',
    backdrop: 'rgba(0, 5, 13, 0.55)',
  });
  const input = await field.evaluate((el) => {
    const s = getComputedStyle(el);
    return [s.height, s.backgroundColor, s.borderTopLeftRadius, s.fontSize, s.fontWeight];
  });
  expect(input).toEqual(['66px', 'rgb(51, 55, 61)', '8px', '20px', '700']);
});

test('results arrive as you type, as landscape cards', async ({ page }) => {
  await page.goto('/');
  const panel = await openPanel(page);
  await panel.getByRole('searchbox').fill('christ');
  const results = panel.getByRole('list', { name: 'Search results' }).getByRole('link');
  await expect(results.first()).toHaveAccessibleName('Christ University 2023–26');
  await expect(results.first()).toHaveAttribute('href', '/title/christ-university/');
  await expect(results.first().locator('img')).toHaveAttribute('src', /\.webp$/);
  await expect(panel.getByRole('status')).toHaveText(/^\d+ results?$/);
  await expect(panel.getByRole('link', { name: 'See all results' })).toHaveAttribute(
    'href',
    '/search/?q=christ',
  );
  // At most four in the panel.
  await panel.getByRole('searchbox').fill('a');
  await expect(results).toHaveCount(4);
  await panel.getByRole('searchbox').fill('zzzz');
  await expect(panel.getByRole('status')).toHaveText('No results for "zzzz"');
  await expect(results).toHaveCount(0);
});

test('arrow keys move through the results and Enter opens one', async ({ page }) => {
  await page.goto('/');
  const panel = await openPanel(page);
  const field = panel.getByRole('searchbox');
  await field.fill('f1jobs');
  const results = panel.getByRole('list', { name: 'Search results' }).getByRole('link');
  await expect(results.first()).toBeVisible();
  await field.press('ArrowDown');
  await expect(results.first()).toBeFocused();
  await page.keyboard.press('ArrowRight');
  await expect(results.nth(1)).toBeFocused();
  await page.keyboard.press('ArrowLeft');
  await page.keyboard.press('ArrowUp');
  await expect(field).toBeFocused();
  await field.press('ArrowDown');
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/title\/f1jobs\/$/);
});

test('Esc closes the panel and puts focus back on the search button', async ({ page }) => {
  await page.goto('/title/vastra-kala/');
  const panel = await openPanel(page);
  await panel.getByRole('searchbox').fill('psych');
  await page.keyboard.press('Escape');
  await expect(panel).toBeHidden();
  await expect(page.getByRole('button', { name: 'Search', exact: true })).toBeFocused();
});

test('Clear empties the field and the results', async ({ page }) => {
  await page.goto('/');
  const panel = await openPanel(page);
  const field = panel.getByRole('searchbox');
  await field.fill('sales');
  const clear = panel.getByRole('button', { name: 'Clear' });
  await clear.click();
  await expect(field).toHaveValue('');
  await expect(field).toBeFocused();
  await expect(clear).toBeHidden();
  await expect(panel.getByRole('list', { name: 'Search results' }).getByRole('link')).toHaveCount(
    0,
  );
});

test('/search/?q= narrows the full list and keeps the URL in step', async ({ page }) => {
  await page.goto('/search/?q=hubspot');
  const field = page.locator('#search-page-q');
  await expect(field).toHaveValue('hubspot');
  const results = page.locator('[data-search-page-results] a.result');
  await expect(results).toHaveCount(1);
  await expect(results.first()).toContainText('Digital Marketing and Social Media Marketing');
  await field.fill('npt');
  await expect(page).toHaveURL(/\/search\/\?q=npt$/);
  await expect(results.first()).toContainText('Training of Trainers');
  await field.fill('');
  await expect(results).toHaveCount(25);
  await expect(page).toHaveURL(/\/search\/$/);
});

test('/search/ lists everything without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto('/search/?q=sales');
  await expect(page.locator('[data-search-page-results] a.result')).toHaveCount(25);
  await expect(page.getByRole('heading', { level: 1, name: 'Search' })).toBeVisible();
  await context.close();
});

test('the open search panel has no serious accessibility issues', async ({ page }) => {
  await page.goto('/');
  const panel = await openPanel(page);
  await panel.getByRole('searchbox').fill('sales');
  await expect(panel.getByRole('status')).toHaveText(/result/);
  const { violations } = await new AxeBuilder({ page })
    .include('#search-panel')
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
    .analyze();
  const serious = violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
  expect(serious.map((v) => `${v.id}: ${v.help}`)).toEqual([]);
});
