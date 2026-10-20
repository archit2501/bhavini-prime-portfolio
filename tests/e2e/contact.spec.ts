import { expect, test } from './fixtures';

test('the storefront hero: two-line headline, white Email CTA and Download resume', async ({
  page,
}) => {
  await page.goto('/contact/');
  const title = page.getByRole('heading', { level: 1 });
  await expect(title).toHaveText(/Start a conversation,\s*your way/);
  await expect(title.locator('.store__blue')).toHaveCSS('color', 'rgb(4, 120, 252)');
  const email = page.getByRole('link', { name: /^Email Bhavini: / });
  await expect(email).toHaveAttribute('href', /^mailto:[^@\s]+@gmail\.com$/);
  await expect(email).toHaveCSS('background-color', 'rgb(255, 255, 255)');
  const resume = page.getByRole('link', { name: 'Download resume' });
  await expect(resume).toHaveAttribute('href', '/bhavini-malhotra-resume.pdf');
  await expect(resume).toHaveAttribute('download', '');
  await expect(page.locator('a[href="/contact/"][aria-current="page"]').first()).toBeAttached();
});

test('channels: email, phone, LinkedIn, F1Jobs.io and the resume', async ({ page }) => {
  await page.goto('/contact/');
  const channels = page.getByRole('region', { name: 'Channels' });
  await expect(channels.getByRole('heading', { level: 3 })).toHaveText([
    'Email',
    'Phone',
    'LinkedIn',
    'F1Jobs.io',
    'Resume',
  ]);
  await expect(channels.locator('a[href^="mailto:"]')).toHaveCount(1);
  await expect(channels.locator('a[href^="tel:+91"]')).toHaveText(/^\+91 \d{5} \d{5}$/);
  const linkedin = channels.getByRole('link', { name: /^Open profile/ });
  await expect(linkedin).toHaveAttribute('href', /^https:\/\/www\.linkedin\.com\/in\//);
  await expect(linkedin).toHaveAttribute('target', '_blank');
  await expect(channels.getByRole('link', { name: /^Visit f1jobs\.io/ })).toHaveAttribute(
    'href',
    'https://f1jobs.io',
  );
  await expect(channels).toContainText(/PDF, 1 page, \d+ KB/);
  await expect(channels.getByRole('link', { name: 'Download' })).toHaveAttribute('download', '');
});

test('Copy puts the address on the clipboard and says so', async ({
  page,
  context,
  browserName,
}) => {
  test.skip(browserName !== 'chromium', 'clipboard permissions are Chromium-only in Playwright');
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('/contact/');
  // The button's name changes as it reports back, so find it by what it copies.
  const copy = page.locator('[data-copy="email"]');
  await copy.click();
  await expect(copy).toHaveText('Copied');
  await expect(page.locator('[data-copy-status]')).toHaveText('Email address copied');
  expect(await page.evaluate(() => navigator.clipboard.readText())).toMatch(/^[^@\s]+@gmail\.com$/);
  await page.locator('[data-copy="phone"]').click();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toMatch(/^\+91\d{10}$/);
  await expect(copy).toHaveText('Copy email address', { timeout: 4000 });
});

test('when the clipboard is blocked, Copy says it could not', async ({ page }) => {
  await page.goto('/contact/');
  await page.evaluate(() => {
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: () => Promise.reject(new Error('blocked')) },
    });
  });
  const copy = page.locator('[data-copy="phone"]');
  await expect(copy).toHaveAccessibleName('Copy phone number');
  await copy.click();
  await expect(copy).toHaveText("Couldn't copy");
  await expect(page.locator('[data-copy-status]')).toHaveText(
    "Couldn't copy the phone number; select it instead",
  );
});

test('without JavaScript the email is spelled out and the resume still downloads', async ({
  browser,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto('/contact/');
  await expect(page.locator('.store__ctas')).toContainText(' at gmail dot com');
  await expect(page.getByRole('link', { name: 'Download resume' })).toBeVisible();
  await context.close();
});
