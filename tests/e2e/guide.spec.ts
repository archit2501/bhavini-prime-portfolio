import { expect, test } from '@playwright/test';

test('the Career Guide is a table of channels and months', async ({ page }) => {
  await page.goto('/career-guide/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Career Guide');
  const table = page.getByRole('table', { name: /What Bhavini worked on, by career track/ });
  await expect(table.getByRole('rowheader')).toHaveText([
    'Sales & Operations',
    'Marketing & Brand',
    'Psychology & Clinical',
    'Community',
    'Leadership',
    'Education',
    'Certifications',
  ]);
  await expect(table.getByRole('columnheader', { name: 'Jan 2023', exact: true })).toHaveCount(1);
  await expect(table.getByRole('columnheader', { name: 'Dec 2026', exact: true })).toHaveCount(1);
  // Education stacks school and degree in two lanes rather than overlapping them.
  await expect(table.getByRole('row')).toHaveCount(1 + 8);
});

test('programme blocks open their titles and sit in their months', async ({ page }) => {
  await page.goto('/career-guide/');
  const vastra = page.getByRole('link', { name: /^Vastra Kala/ });
  await expect(vastra).toHaveAttribute('href', '/title/vastra-kala/');
  await expect(vastra).toContainText('Aug – Dec 2025');
  const box = await vastra.boundingBox();
  const month = await page.locator('.guide__month').first().boundingBox();
  // Five months wide, less the 4px gap between programmes.
  expect(Math.abs((box?.width ?? 0) + 4 - (month?.width ?? 0) * 5)).toBeLessThanOrEqual(2);
  await expect(page.getByRole('link', { name: /^NPTEL Training of Trainers/ })).toHaveAttribute(
    'href',
    '/skills/collections/certifications/',
  );
});

test('F1Jobs.io is on now, with a thumbnail and a red progress bar', async ({ page, viewport }) => {
  await page.goto('/career-guide/');
  const live = page.locator('.prog--live');
  await expect(live).toHaveCount(1);
  await expect(live).toContainText(/F1Jobs\.io\s*On now · May 2026 – now/);
  if ((viewport?.width ?? 0) >= 880) {
    const onNow = page.locator('.onnow');
    await expect(onNow).toBeVisible();
    await expect(onNow.locator('img')).toBeVisible();
    await expect(onNow.locator('.onnow__bar > span')).toHaveCSS(
      'background-color',
      'rgb(255, 0, 25)',
    );
    await expect(page.locator('.offair').first()).toContainText('Last: Vastra Kala');
  } else {
    await expect(page.locator('.guide__onnow-mobile')).toContainText('F1Jobs.io');
  }
});

test('today is a white pill with a line, and the guide opens on it', async ({ page }) => {
  await page.goto('/career-guide/');
  const pill = page.locator('.guide__pill');
  await expect(pill).toHaveText(/^\d{1,2} [A-Z][a-z]{2} \d{4}$/);
  await expect(pill).toHaveCSS('background-color', 'rgb(255, 255, 255)');
  await expect(page.locator('.guide__line')).toHaveCSS('width', '1px');
  await expect(pill).toBeInViewport();
});

test('Earlier, Later and Now scroll the guide, no dragging needed', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/career-guide/');
  const scroller = page.locator('[data-guide-scroller]');
  const left = () => scroller.evaluate((el) => el.scrollLeft);
  const start = await left();
  expect(start).toBeGreaterThan(0);
  await page.getByRole('button', { name: 'Earlier' }).click();
  await expect.poll(left).toBeLessThan(start);
  await page.getByRole('button', { name: 'Now', exact: true }).click();
  await expect.poll(left).toBe(start);
  // Tabbing to an early programme scrolls it into view.
  await page.getByRole('link', { name: /^Cambridge Innovative School/ }).focus();
  await expect.poll(left).toBeLessThan(start);
});
