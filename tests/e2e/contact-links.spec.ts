import { expect, test } from '@playwright/test';

test('the footer email link is decoded in the browser', async ({ page }) => {
  await page.goto('/');
  const email = page.getByRole('contentinfo').getByRole('link', { name: /^Email: / });
  await expect(email).toHaveAttribute('href', /^mailto:[^@\s]+@gmail\.com$/);
});

test('without JavaScript the email is spelled out, not linked', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto('/');
  await expect(page.getByRole('contentinfo')).toContainText(' at gmail dot com');
  await context.close();
});

test('the resume PDF is served', async ({ request }) => {
  const res = await request.get('/bhavini-malhotra-resume.pdf');
  expect(res.status()).toBe(200);
  expect(res.headers()['content-type']).toContain('application/pdf');
});
