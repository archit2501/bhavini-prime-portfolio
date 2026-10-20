import { describe, expect, it } from 'vitest';
import { previewGeometry, previewScale } from './position';

const bounds = { width: 1440, top: 66, margin: 16 };
// Prime's measured card at 1440: 251x141.
const card = { x: 594, y: 634, width: 251, height: 141 };

/** Where a point of the expanded box lands when scaled down by 1/scale about the origin. */
function shrink(g: ReturnType<typeof previewGeometry>, scale: number) {
  const x = g.left + g.originX - g.originX / scale;
  const y = g.top + g.originY - g.originY / scale;
  return { x, y, width: g.width / scale, height: g.artHeight / scale };
}

describe('previewGeometry', () => {
  it('grows 1.56x about the card centre, like Prime', () => {
    const g = previewGeometry(card, bounds, 1.56);
    expect(g.width).toBeCloseTo(391.56);
    expect(g.artHeight).toBeCloseTo(219.96);
    expect(g.left + g.width / 2).toBeCloseTo(card.x + card.width / 2);
    expect(g.top + g.artHeight / 2).toBeCloseTo(card.y + card.height / 2);
  });

  it('starts exactly over the card, whatever the clamping', () => {
    for (const c of [card, { ...card, x: 72 }, { ...card, x: 1300 }, { ...card, y: 60 }]) {
      const g = previewGeometry(c, bounds, 1.56);
      const s = shrink(g, 1.56);
      expect(s.x).toBeCloseTo(c.x);
      expect(s.y).toBeCloseTo(c.y);
      expect(s.width).toBeCloseTo(c.width);
      expect(s.height).toBeCloseTo(c.height);
    }
  });

  it('slides inward at the screen edges instead of being cut off', () => {
    expect(previewGeometry({ ...card, x: 72 }, bounds, 1.56).left).toBe(16);
    const right = previewGeometry({ ...card, x: 1300 }, bounds, 1.56);
    expect(right.left + right.width).toBeCloseTo(1440 - 16);
  });

  it('never rises under the nav', () => {
    expect(previewGeometry({ ...card, y: 60 }, bounds, 1.56).top).toBe(82);
  });

  it('needs no origin when nothing scales', () => {
    const g = previewGeometry(card, bounds, 1);
    expect([g.originX, g.originY]).toEqual([0, 0]);
  });
});

describe('previewScale', () => {
  it("follows Prime's steps", () => {
    expect(previewScale(1440)).toBe(1.56);
    expect(previewScale(1280)).toBe(1.56);
    expect(previewScale(1024)).toBe(1.4);
    expect(previewScale(375)).toBe(1.25);
  });
});
