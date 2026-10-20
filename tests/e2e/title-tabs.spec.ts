import { expect, test } from '@playwright/test';

test('series open on Episodes with Prime-style numbered episodes', async ({ page }) => {
  await page.goto('/title/f1jobs/');
  const tablist = page.getByRole('tablist', { name: 'F1Jobs.io sections' });
  await expect(tablist.getByRole('tab')).toHaveText(['Episodes', 'Related', 'Details']);
  await expect(tablist.getByRole('tab', { name: 'Episodes' })).toHaveAttribute(
    'aria-selected',
    'true',
  );
  const panel = page.getByRole('tabpanel', { name: 'Episodes' });
  await expect(panel.getByText('4 episodes')).toBeVisible();
  await expect(panel.getByRole('heading', { level: 3 })).toHaveText([
    '1. THE PIPELINE',
    '2. SEVEN SALES',
    '3. FACE OF THE BRAND',
    '4. TICKET ZERO',
  ]);
  await expect(panel.getByRole('link', { name: 'Play episode 2: Seven Sales' })).toHaveAttribute(
    'href',
    '/watch/f1jobs/?e=2',
  );
});

test('arrow keys, Home and End move between tabs and update the hash', async ({ page }) => {
  await page.goto('/title/f1jobs/');
  const tabs = page.getByRole('tablist', { name: 'F1Jobs.io sections' });
  await tabs.getByRole('tab', { name: 'Episodes' }).focus();
  await page.keyboard.press('ArrowRight');
  await expect(tabs.getByRole('tab', { name: 'Related' })).toBeFocused();
  await expect(
    page.getByRole('tabpanel', { name: 'Related' }).locator('.card').first(),
  ).toBeVisible();
  await expect(page).toHaveURL(/#related$/);
  await page.keyboard.press('End');
  await expect(tabs.getByRole('tab', { name: 'Details' })).toHaveAttribute('aria-selected', 'true');
  await page.keyboard.press('Home');
  await expect(tabs.getByRole('tab', { name: 'Episodes' })).toHaveAttribute(
    'aria-selected',
    'true',
  );
  await expect(page.getByRole('tabpanel', { name: 'Related' })).toBeHidden();
});

test('a #details link opens Details with her figures', async ({ page }) => {
  await page.goto('/title/vastra-kala/#details');
  const details = page.getByRole('tabpanel', { name: 'Details' });
  await expect(details).toBeVisible();
  await expect(
    details.getByText('Marketing & Brand Operations Intern', { exact: true }),
  ).toBeVisible();
  await expect(details.getByText('100+ product units a month', { exact: true })).toBeVisible();
  await expect(details.getByText('Aug – Dec 2025', { exact: true })).toBeVisible();
});

test('films open on Related and list their credits in Details', async ({ page }) => {
  await page.goto('/title/christ-university/');
  const tabs = page.getByRole('tablist', { name: 'Christ University sections' });
  await expect(tabs.getByRole('tab')).toHaveText(['Related', 'Details']);
  await tabs.getByRole('tab', { name: 'Details' }).click();
  const details = page.getByRole('tabpanel', { name: 'Details' });
  await expect(details.getByText('Student Representative', { exact: true })).toBeVisible();
  await expect(details.getByText('8.81 CGPA', { exact: true })).toBeVisible();
});

test('phones list episodes in one column with synopsis and meta visible', async ({
  page,
  viewport,
}) => {
  test.skip((viewport?.width ?? 0) >= 600, 'phone layout only');
  await page.goto('/title/f1jobs/');
  const columns = await page
    .locator('.episodes')
    .evaluate((el) => getComputedStyle(el).gridTemplateColumns.split(' ').length);
  expect(columns).toBe(1);
  await expect(
    page.getByText('Generated $100,000+ in revenue through 7+ successful D2C sales', {
      exact: false,
    }),
  ).toBeVisible();
  await expect(page.locator('.episode__meta').first()).toBeVisible();
});

test('without JavaScript every section shows', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto('/title/f1jobs/');
  for (const name of ['Episodes', 'Related', 'Details']) {
    await expect(page.getByRole('heading', { level: 2, name })).toBeVisible();
  }
  await context.close();
});

test('the tab bar sticks under the nav and frosts', async ({ page }) => {
  await page.goto('/title/f1jobs/');
  // Room to scroll: on tall screens the page ends before the bar reaches the nav.
  await page.addStyleTag({ content: 'footer { margin-bottom: 150vh; }' });
  const bar = page.locator('[data-tabs-bar]');
  // Just past the bar's resting place, while the episodes are still on screen beneath it.
  await bar.evaluate((el) =>
    window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY - 20),
  );
  await expect(bar).toHaveAttribute('data-stuck', 'true');
  const [barTop, navBottom] = await Promise.all([
    bar.evaluate((el) => el.getBoundingClientRect().top),
    page.locator('header.nav').evaluate((el) => el.getBoundingClientRect().bottom),
  ]);
  expect(Math.abs(barTop - navBottom)).toBeLessThan(2);
});
