import { expect, test } from './fixtures';

test('robots.txt points at the sitemap', async ({ request }) => {
  const res = await request.get('/robots.txt');
  expect(res.headers()['content-type']).toContain('text/plain');
  expect(await res.text()).toMatch(
    /^User-agent: \*\nAllow: \/\n\nSitemap: https?:\/\/.+\/sitemap\.xml\n$/,
  );
});

test('the sitemap lists the indexable pages and nothing else', async ({ request }) => {
  const xml = await (await request.get('/sitemap.xml')).text();
  const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]).pathname);
  expect(locs).toContain('/');
  expect(locs).toContain('/title/f1jobs/');
  expect(locs).toContain('/skills/psychology/');
  expect(locs).toContain('/career-guide/');
  expect(locs.some((p) => /watch|search|my-list/.test(p))).toBe(false);
});

test('each title page has its own share card and CreativeWork data', async ({ page, request }) => {
  await page.goto('/title/vastra-kala/');
  const image = await page.locator('meta[property="og:image"]').getAttribute('content');
  expect(image).toMatch(/\/_astro\/card\..+\.jpg$/);
  const res = await request.get(new URL(image ?? '').pathname);
  expect(res.headers()['content-type']).toContain('image/jpeg');
  await expect(page.locator('meta[property="og:image:alt"]')).toHaveAttribute(
    'content',
    'Vastra Kala: Shipping to 5+ global regions',
  );
  const blocks = await page.locator('script[type="application/ld+json"]').allTextContents();
  const types = blocks.map((b) => JSON.parse(b)['@type']);
  expect(types).toEqual(['Person', 'CreativeWork']);
  expect(JSON.parse(blocks[1])).toMatchObject({ name: 'Vastra Kala', dateCreated: '2025-08' });
  // Other pages share the site card.
  await page.goto('/skills/');
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', /\/og\.png$/);
});

test('a missing page is Prime\'s "We couldn\'t find that title", with a way home', async ({
  page,
}) => {
  const res = await page.goto('/title/nope/');
  expect(res?.status()).toBe(404);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText("We couldn't find that title");
  await expect(page.getByRole('link', { name: 'Go to the home page' })).toHaveAttribute(
    'href',
    '/',
  );
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex');
});
