import { expect, test } from './fixtures';
import { TRAILER_SLUGS as TRAILERS } from '../../src/lib/trailers';

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
