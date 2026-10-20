import { expect, test } from '@playwright/test';

const TRAILERS = ['f1jobs', 'vastra-kala', 'christ-university'];
const TYPES: Record<string, string> = {
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '-poster.jpg': 'image/jpeg',
  '.vtt': 'text/vtt',
};

for (const slug of TRAILERS) {
  test(`${slug} trailer files are served with the right types`, async ({ request }) => {
    for (const [suffix, type] of Object.entries(TYPES)) {
      const res = await request.get(`/trailers/${slug}${suffix}`);
      expect(res.status(), suffix).toBe(200);
      expect(res.headers()['content-type'], suffix).toContain(type);
    }
  });
}
