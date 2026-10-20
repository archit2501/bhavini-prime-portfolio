import { expect, test } from './fixtures';

const isWide = (width: number) => width >= 1280;

test('marks the current page with the active pill', async ({ page, viewport }) => {
  test.skip(!isWide(viewport?.width ?? 0), 'links fold into Menu below 1280px');
  await page.goto('/');
  const home = page
    .getByRole('navigation', { name: 'Primary' })
    .getByRole('link', { name: 'Home' });
  await expect(home).toHaveAttribute('aria-current', 'page');
  const pill = await home.evaluate((el) => {
    const s = getComputedStyle(el);
    return [s.backgroundColor, s.height, s.backgroundImage.startsWith('radial-gradient')];
  });
  expect(pill).toEqual(['rgba(255, 255, 255, 0.2)', '42px', true]);
});

test('turns into a frosted bar once the page scrolls', async ({ page }) => {
  await page.goto('/');
  const nav = page.locator('header.nav');
  await expect(nav).toHaveAttribute('data-scrolled', 'false');
  await page.addStyleTag({ content: 'body { min-height: 300vh; }' });
  await page.evaluate(() => window.scrollTo(0, 600));
  await expect(nav).toHaveAttribute('data-scrolled', 'true');
});

test('folds the links into Menu on narrower screens', async ({ page, viewport }) => {
  test.skip(isWide(viewport?.width ?? 0), 'full links at 1280px and up');
  await page.goto('/');
  await expect(page.getByRole('navigation', { name: 'Primary' })).toBeHidden();
  const menu = page.getByRole('button', { name: 'Menu', exact: true });
  await menu.click();
  const panel = page.locator('#nav-menu');
  await expect(panel.getByRole('link', { name: 'Career Guide' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(panel).toBeHidden();
});

test('profile menu switches who is visiting', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /^Profile menu/ }).click();
  const menu = page.locator('#profile-menu');
  await expect(menu.getByRole('heading', { name: "Who's visiting" })).toBeVisible();
  await menu.getByRole('button', { name: 'Founder' }).click();
  await expect(menu).toBeHidden();
  const avatar = page.getByRole('button', { name: 'Profile menu, visiting as Founder' });
  await expect(avatar).toBeFocused();
  expect(await page.evaluate(() => sessionStorage.getItem('bhavini:profile'))).toBe('founder');
  await page.reload();
  await expect(
    page.getByRole('button', { name: 'Profile menu, visiting as Founder' }),
  ).toBeVisible();
});

test('every nav control is at least 24px tall', async ({ page }) => {
  await page.goto('/');
  for (const control of await page
    .locator('header.nav a:visible, header.nav button:visible')
    .all()) {
    const box = await control.boundingBox();
    expect(box?.height ?? 0).toBeGreaterThanOrEqual(24);
    expect(box?.width ?? 0).toBeGreaterThanOrEqual(24);
  }
});
