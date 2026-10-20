import { describe, expect, it } from 'vitest';
import { atEnd, atStart, pageTarget } from './rows';

const box = (scrollLeft: number) => ({ scrollLeft, clientWidth: 1000, scrollWidth: 3000 });

describe('row edges', () => {
  it('knows the start and the end, with sub-pixel slack', () => {
    expect(atStart(box(0))).toBe(true);
    expect(atStart(box(1.5))).toBe(true);
    expect(atStart(box(10))).toBe(false);
    expect(atEnd(box(2000))).toBe(true);
    expect(atEnd(box(1998.6))).toBe(true);
    expect(atEnd(box(1500))).toBe(false);
  });
});

describe('pageTarget', () => {
  it('moves one page less a card, so the peeking card stays visible', () => {
    expect(pageTarget(box(0), 1, 260)).toBe(740);
    expect(pageTarget(box(740), -1, 260)).toBe(0);
  });

  it('clamps to the ends of the track', () => {
    expect(pageTarget(box(1800), 1, 260)).toBe(2000);
    expect(pageTarget(box(100), -1, 260)).toBe(0);
    expect(pageTarget({ scrollLeft: 0, clientWidth: 1000, scrollWidth: 900 }, 1, 260)).toBe(0);
  });

  it('always moves at least one card on very narrow rows', () => {
    expect(pageTarget({ scrollLeft: 0, clientWidth: 300, scrollWidth: 3000 }, 1, 260)).toBe(260);
  });
});
