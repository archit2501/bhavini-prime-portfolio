import { describe, expect, it } from 'vitest';
import {
  composeCard,
  composeKey,
  composeStill,
  glow,
  lightField,
  motif,
  placeLockup,
  type ArtSpec,
  type MotifKind,
} from './compose';
import type { Lockup } from './lockup';
import { rng } from './prng';

const spec: ArtSpec = {
  palette: { bg: '#02060f', glows: ['#1a98ff', '#0de0c0', '#3a3cff'], accent: '#7cc7ff' },
  motif: 'rising-line',
};
const lockup: Lockup = {
  paths: [{ d: 'M0 0H100V40H0Z', fill: '#fff' }],
  width: 100,
  height: 40,
  viewBox: '0 0 100 40',
};
const KINDS: MotifKind[] = [
  'rising-line',
  'routes',
  'ripples',
  'clusters',
  'arches',
  'steps',
  'funnel',
  'bars',
  'spotlight',
  'tickets',
  'globe',
  'units',
  'pages',
  'mirror',
  'checklist',
  'leaves',
  'badge',
];

describe('glow', () => {
  it('fades from the colour to fully transparent', () => {
    const g = glow(10, 20, 30, 40, '#ff0000', 0.5);
    expect(g).toContain('<ellipse cx="10" cy="20" rx="30" ry="40"');
    expect(g).toContain('stop-color="#ff0000" stop-opacity="0.5"');
    expect(g).toMatch(/offset="1" stop-color="#ff0000" stop-opacity="0"/);
  });
});

describe('motifs', () => {
  for (const kind of KINDS) {
    it(`${kind} draws valid geometry`, () => {
      const out = motif(kind, { x: 100, y: 50, w: 800, h: 450 }, spec.palette, rng(3));
      expect(out.length).toBeGreaterThan(200);
      expect(out).not.toMatch(/NaN|undefined|Infinity/);
    });
  }

  it('draws seven sales on the rising line', () => {
    const out = motif('rising-line', { x: 0, y: 0, w: 1000, h: 500 }, spec.palette, rng(1));
    expect(out.match(/fill="#ffffff"/g)).toHaveLength(7);
  });

  it('draws five export routes', () => {
    const out = motif('routes', { x: 0, y: 0, w: 1000, h: 500 }, spec.palette, rng(1));
    expect(out.match(/stroke-dasharray/g)).toHaveLength(5);
  });

  it('draws a hundred units', () => {
    const out = motif('units', { x: 0, y: 0, w: 1000, h: 500 }, spec.palette, rng(1));
    expect(out.match(/<rect /g)).toHaveLength(100);
  });
});

describe('compositions', () => {
  it('are deterministic for a seed and change with it', () => {
    expect(composeKey(spec, rng(9))).toBe(composeKey(spec, rng(9)));
    expect(composeKey(spec, rng(9))).not.toBe(composeKey(spec, rng(10)));
    expect(lightField(spec.palette, 10, 10, rng(1))).toContain('<rect width="10" height="10"');
  });

  it('size each format', () => {
    expect(composeKey(spec, rng(1))).toContain('width="2560" height="1440"');
    expect(composeCard(spec, lockup, rng(1))).toContain('width="1280" height="720"');
    expect(composeStill(spec, rng(1))).toContain('width="960" height="540"');
  });

  it('bake the title lettering into cards only', () => {
    expect(composeCard(spec, lockup, rng(1))).toContain('M0 0H100V40H0Z');
    expect(composeKey(spec, rng(1))).not.toContain('M0 0H100V40H0Z');
  });

  it('use a photo in place of the light field and motif when one is given', () => {
    const withPhoto = { ...spec, photo: 'data:image/jpeg;base64,AAAA' };
    for (const svg of [composeKey(withPhoto, rng(1)), composeCard(withPhoto, lockup, rng(1))]) {
      expect(svg).toContain('<image href="data:image/jpeg;base64,AAAA"');
      expect(svg).not.toContain('stroke-linecap');
    }
    expect(composeKey(spec, rng(1))).not.toContain('<image');
  });
});

describe('placeLockup', () => {
  it('scales to fit the box and centres vertically', () => {
    expect(placeLockup(lockup, { x: 10, y: 0, w: 200, h: 200 })).toContain(
      'translate(10 60) scale(2)',
    );
    expect(placeLockup(lockup, { x: 0, y: 0, w: 1000, h: 40 })).toContain('scale(1)');
  });
});
