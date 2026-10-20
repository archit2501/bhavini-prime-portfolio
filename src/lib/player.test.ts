import { describe, expect, it } from 'vitest';
import type { Catalog } from './catalog';
import {
  countdownLeft,
  formatClock,
  keyAction,
  nextUp,
  remainingClock,
  seekTarget,
  showSkipIntro,
  spokenPosition,
  watchHref,
  watchTarget,
} from './player';

const title = (slug: string, order: number, extra = {}) =>
  ({ slug, order, title: slug, kind: 'film', ...extra }) as Catalog['titles'][number];

const catalog = {
  titles: [
    title('f1jobs', 1),
    title('vastra-kala', 2),
    title('christ-university', 5, { prequel: 'cambridge-innovative-school' }),
    title('cambridge-innovative-school', 6, { sequel: 'christ-university' }),
  ],
} as unknown as Catalog;

describe('player clock', () => {
  it('formats like Prime: m:ss, then h:mm:ss', () => {
    expect(formatClock(0)).toBe('0:00');
    expect(formatClock(7.9)).toBe('0:07');
    expect(formatClock(725)).toBe('12:05');
    expect(formatClock(4662)).toBe('1:17:42');
    expect(formatClock(Number.NaN)).toBe('0:00');
    expect(formatClock(-3)).toBe('0:00');
  });

  it('rounds the time left up, so the two clocks add up', () => {
    expect(remainingClock(4.2, 12)).toBe('0:08');
    expect(remainingClock(12, 12)).toBe('0:00');
    expect(remainingClock(13, 12)).toBe('0:00');
  });

  it('speaks the position in words', () => {
    expect(spokenPosition(4.4, 12)).toBe('4 seconds of 12 seconds');
    expect(spokenPosition(0, 3725)).toBe('0 seconds of 1 hour 2 minutes 5 seconds');
    expect(spokenPosition(61, Number.NaN)).toBe('1 minute 1 second of 0 seconds');
  });
});

describe('seeking', () => {
  it('stays inside the video', () => {
    expect(seekTarget(4, 10, 12)).toBe(12);
    expect(seekTarget(4, -10, 12)).toBe(0);
    expect(seekTarget(1, 10, 30)).toBe(11);
    expect(seekTarget(1, 10, Number.NaN)).toBe(11);
  });

  it('offers Skip intro only during the ident', () => {
    expect(showSkipIntro(0, 2.3)).toBe(true);
    expect(showSkipIntro(1.9, 2.3)).toBe(true);
    expect(showSkipIntro(2.1, 2.3)).toBe(false);
    expect(showSkipIntro(8, 2.3)).toBe(false);
  });
});

describe('keyboard shortcuts', () => {
  it('maps the player keys', () => {
    expect([' ', 'k', 'K'].map(keyAction)).toEqual(['toggle', 'toggle', 'toggle']);
    expect(['ArrowLeft', 'j', 'J'].map(keyAction)).toEqual(['back', 'back', 'back']);
    expect(['ArrowRight', 'l', 'L'].map(keyAction)).toEqual(['forward', 'forward', 'forward']);
    expect(['f', 'F', 'm', 'M', 'c', 'C', 'Escape'].map(keyAction)).toEqual([
      'fullscreen',
      'fullscreen',
      'mute',
      'mute',
      'captions',
      'captions',
      'close',
    ]);
    expect(keyAction('Tab')).toBeUndefined();
  });
});

describe('Next up', () => {
  it('counts down whole seconds and stops at zero', () => {
    expect(countdownLeft(1000, 1000)).toBe(10);
    expect(countdownLeft(1000, 1999)).toBe(10);
    expect(countdownLeft(1000, 2000)).toBe(9);
    expect(countdownLeft(0, 60_000)).toBe(0);
    expect(countdownLeft(0, 2500, 3)).toBe(1);
  });

  it('goes to the next title with a trailer, wrapping round', () => {
    expect(nextUp(catalog, 'f1jobs')?.slug).toBe('vastra-kala');
    expect(nextUp(catalog, 'christ-university')?.slug).toBe('f1jobs');
    expect(nextUp(catalog, 'cambridge-innovative-school')).toBeUndefined();
    const single = { titles: [title('f1jobs', 1)] } as unknown as Catalog;
    expect(nextUp(single, 'f1jobs')).toBeUndefined();
  });
});

describe('Watch now', () => {
  it("plays the title's trailer, or its sequel's when it has none", () => {
    expect(watchTarget(catalog, catalog.titles[0])?.slug).toBe('f1jobs');
    expect(watchTarget(catalog, catalog.titles[3])?.slug).toBe('christ-university');
    expect(watchHref(catalog, catalog.titles[3], '/x/')).toBe('/x/watch/christ-university/');
  });

  it('gives up on a title with nothing to play', () => {
    const loop = {
      titles: [title('a', 1, { sequel: 'b' }), title('b', 2, { sequel: 'a' }), title('c', 3)],
    } as unknown as Catalog;
    expect(watchTarget(loop, loop.titles[0])).toBeUndefined();
    expect(watchTarget(loop, loop.titles[2])).toBeUndefined();
    expect(watchHref(loop, loop.titles[2])).toBeUndefined();
  });
});
