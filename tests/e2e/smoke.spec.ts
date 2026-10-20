import { expect, test } from '@playwright/test';

test('home page renders her name in a main landmark', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle('Bhavini Malhotra · Sales & Operations');
  await expect(page.getByRole('main')).toBeVisible();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Bhavini Malhotra');
});

test('first Tab lands on the skip link', async ({ page, browserName }) => {
  await page.goto('/');
  // WebKit's Tab skips links unless full keyboard access is on; Option+Tab is the Safari way.
  await page.keyboard.press(browserName === 'webkit' ? 'Alt+Tab' : 'Tab');
  await expect(page.getByRole('link', { name: 'Skip to content' })).toBeFocused();
});

test('the footer says the site is not affiliated with Amazon', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('contentinfo')).toContainText(
    'Not affiliated with Amazon, Prime Video or IMDb.',
  );
});

test('unknown paths get the not-found page', async ({ page }) => {
  const response = await page.goto('/no-such-title/');
  expect(response?.status()).toBe(404);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText("We couldn't find that title");
});
