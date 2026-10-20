import { describe, expect, it } from 'vitest';
import type { Lockup } from './art/lockup';
import { artFor } from './artwork';

const G = '/src/assets/art/generated/';
const logo: Lockup = { paths: [], width: 1, height: 1, viewBox: '0 0 1 1' };
const images = {
  [`${G}f1jobs/key.jpg`]: 'key',
  [`${G}f1jobs/card.jpg`]: 'card',
  [`${G}f1jobs/still-10.jpg`]: 's10',
  [`${G}f1jobs/still-2.jpg`]: 's2',
  [`${G}f1jobs/still-1.jpg`]: 's1',
  [`${G}f1jobs-extra/still-3.jpg`]: 'other title',
  [`${G}vastra-kala/key.jpg`]: 'vk',
};

describe('artFor', () => {
  it("picks one title's key, card, logo and numerically ordered stills", () => {
    expect(artFor('f1jobs', images, { [`${G}f1jobs/logo.json`]: logo })).toEqual({
      key: 'key',
      card: 'card',
      stills: ['s1', 's2', 's10'],
      logo,
    });
  });

  it('fails loudly when art is missing', () => {
    expect(() => artFor('vastra-kala', images, {})).toThrow(
      `Missing ${G}vastra-kala/card.jpg: run \`npm run art\``,
    );
    expect(() => artFor('f1jobs', images, {})).toThrow('logo.json');
  });
});
