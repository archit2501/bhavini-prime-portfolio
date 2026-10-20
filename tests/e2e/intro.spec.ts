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
