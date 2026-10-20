import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

/** Records what the ident asks Web Audio to play, without making a sound. */
async function fakeAudio(page: Page) {
  await page.addInitScript(() => {
    const started: string[] = [];
    (window as unknown as { __started: string[] }).__started = started;
    class FakeContext {
      currentTime = 0;
      destination = {};
      resume() {
        return Promise.resolve();
      }
      close() {
        return Promise.resolve();
      }
      createGain() {
        const param = {
          setValueAtTime() {},
          linearRampToValueAtTime() {},
          exponentialRampToValueAtTime() {},
        };
        return { gain: param, connect() {} };
      }
      createOscillator() {
        const osc = {
          type: '',
          frequency: { value: 0 },
          connect() {},
          start() {
            started.push(`${osc.type} ${Math.round(osc.frequency.value)}`);
          },
          stop() {},
        };
        return osc;
      }
    }
    Object.defineProperty(window, 'AudioContext', { value: FakeContext });
  });
}

const pickInMenu = async (page: Page, name: string) => {
  await page.getByRole('button', { name: /^Profile menu/ }).click();
  await page.locator('#profile-menu').getByRole('button', { name }).click();
};

test.describe('intro ident', () => {
  test('the first profile pick plays the ident with its three-note flourish', async ({ page }) => {
    await fakeAudio(page);
    await page.goto('/title/f1jobs/');
    await pickInMenu(page, 'Recruiter');
    const ident = page.getByRole('dialog', { name: 'bhavini original' });
    await expect(ident).toBeVisible();
    await expect(ident).toHaveAttribute('data-playing', 'true');
    expect(
      await page.evaluate(() => (window as unknown as { __started: string[] }).__started),
    ).toEqual([
      'sine 440',
      'triangle 880',
      'sine 659',
      'triangle 1319',
      'sine 1109',
      'triangle 2217',
    ]);
    await ident.getByRole('button', { name: 'Skip' }).click();
    await expect(ident).toBeHidden();
    await expect(
      page.getByRole('button', { name: /^Profile menu, visiting as Recruiter/ }),
    ).toBeFocused();
    expect(await page.evaluate(() => sessionStorage.getItem('bhavini:ident'))).toBe('1');
  });

  test('it plays once per session', async ({ page }) => {
    await page.goto('/title/f1jobs/');
    await pickInMenu(page, 'Founder');
    const ident = page.getByRole('dialog', { name: 'bhavini original' });
    await page.keyboard.press('Escape');
    await expect(ident).toBeHidden();
    await pickInMenu(page, 'Collaborator');
    await page.waitForTimeout(300);
    await expect(ident).toBeHidden();
  });

  test('it lets go of the page after about 3.2 seconds', async ({ page }) => {
    await page.clock.install();
    await page.goto('/title/vastra-kala/');
    await pickInMenu(page, 'Recruiter');
    const ident = page.getByRole('dialog', { name: 'bhavini original' });
    await expect(ident).toBeVisible();
    await page.clock.runFor(3000);
    await expect(ident).toBeVisible();
    await page.clock.runFor(300);
    await expect(ident).toBeHidden();
  });

  test('reduced motion skips it entirely, sound included', async ({ page }) => {
    await fakeAudio(page);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/title/f1jobs/');
    await pickInMenu(page, 'Recruiter');
    await page.waitForTimeout(300);
    await expect(page.getByRole('dialog', { name: 'bhavini original' })).toBeHidden();
    expect(
      await page.evaluate(() => (window as unknown as { __started: string[] }).__started),
    ).toEqual([]);
  });
});

test.describe("Who's visiting?", () => {
  const picker = (page: Page) => page.getByRole('dialog', { name: "Who's visiting?" });
  const rowTitles = (page: Page) => page.locator('.rows > [data-row] .row__title');

  test('the first home visit asks before anything else', async ({ page }) => {
    await page.goto('/');
    await expect(picker(page)).toBeVisible();
    await expect(picker(page).getByRole('button')).toHaveText([
      'Recruiter',
      'Founder',
      'Collaborator',
      'Just browsing',
      'Skip for now',
    ]);
    await expect(picker(page).getByRole('button', { name: 'Recruiter' })).toBeFocused();
    // A modal dialog: the page behind is inert until it's answered.
    expect(await page.locator('[data-picker]').evaluate((d) => d.matches(':modal'))).toBe(true);
  });

  test('a choice plays the ident, then puts that visitor’s rows first', async ({ page }) => {
    await page.goto('/');
    await picker(page).getByRole('button', { name: 'Recruiter' }).click();
    await expect(picker(page)).toBeHidden();
    const ident = page.getByRole('dialog', { name: 'bhavini original' });
    await expect(ident).toBeVisible();
    await ident.getByRole('button', { name: 'Skip' }).click();
    await expect(rowTitles(page).first()).toHaveText('Bhavini Originals: Experience');
    await expect(page.locator('.hero__entitle').first()).toContainText(
      'Open to roles · Get her resume',
    );
    await expect(page.locator('.hero__entitle-cta').first()).toHaveAttribute(
      'href',
      '/bhavini-malhotra-resume.pdf',
    );
    // Same session: no second ask, and the order holds.
    await page.reload();
    await expect(picker(page)).toBeHidden();
    await expect(rowTitles(page).first()).toHaveText('Bhavini Originals: Experience');
    await expect(page.getByRole('button', { name: /visiting as Recruiter/ })).toBeVisible();
  });

  test('each profile has its own order', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    await picker(page).getByRole('button', { name: 'Collaborator' }).click();
    await expect(rowTitles(page).first()).toHaveText('Browse by skill');
    await expect(page.locator('.hero__entitle-cta').first()).toHaveText('Say hello');
  });

  test('Skip for now and Esc leave the default home, and ask no more', async ({ page }) => {
    await page.goto('/');
    await picker(page).getByRole('button', { name: 'Skip for now' }).click();
    await expect(picker(page)).toBeHidden();
    await expect(page.getByRole('dialog', { name: 'bhavini original' })).toBeHidden();
    await expect(rowTitles(page).first()).toHaveText('Continue watching');
    await page.reload();
    await expect(picker(page)).toBeHidden();

    await page.evaluate(() => sessionStorage.clear());
    await page.reload();
    await expect(picker(page)).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(picker(page)).toBeHidden();
    expect(await page.evaluate(() => sessionStorage.getItem('bhavini:profile'))).toBeNull();
  });

  test('deep links never ask; Switch profile opens it anywhere', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/skills/');
    await expect(picker(page)).toBeHidden();
    await page.getByRole('button', { name: /^Profile menu/ }).click();
    await page.getByRole('button', { name: 'Switch profile' }).click();
    await expect(picker(page)).toBeVisible();
    await picker(page).getByRole('button', { name: 'Founder' }).click();
    await expect(page.getByRole('button', { name: /visiting as Founder/ })).toBeVisible();
  });

  test('without JavaScript there is no picker, just the home page', async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const noJs = await context.newPage();
    await noJs.goto('/');
    await expect(noJs.getByRole('dialog')).toHaveCount(0);
    await expect(noJs.locator('[data-row]').first()).toBeVisible();
    await context.close();
  });

  test('the picker has no serious accessibility issues', async ({ page }) => {
    await page.goto('/');
    await expect(picker(page)).toBeVisible();
    const { violations } = await new AxeBuilder({ page })
      .include('#profile-picker')
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();
    const serious = violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
    expect(serious.map((v) => `${v.id}: ${v.help}`)).toEqual([]);
  });
});
