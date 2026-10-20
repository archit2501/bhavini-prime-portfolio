import { describe, expect, it } from 'vitest';
import {
  envelope,
  FLOURISH,
  flourishLength,
  pitch,
  playFlourish,
  type AudioLike,
} from './flourish';

function fakeContext(currentTime = 10) {
  const calls: string[] = [];
  const ctx: AudioLike = {
    currentTime,
    destination: 'out',
    createOscillator: () => {
      const osc = {
        type: '',
        frequency: { value: 0 },
        connect: () => calls.push('osc.connect'),
        start: (t: number) =>
          calls.push(`start ${osc.type} ${osc.frequency.value.toFixed(1)} @${t}`),
        stop: (t: number) => calls.push(`stop @${t.toFixed(2)}`),
      };
      return osc;
    },
    createGain: () => ({
      gain: {
        setValueAtTime: (v, t) => calls.push(`set ${v} @${t}`),
        linearRampToValueAtTime: (v, t) => calls.push(`linear ${v} @${t.toFixed(2)}`),
        exponentialRampToValueAtTime: (v, t) => calls.push(`exp ${v} @${t.toFixed(2)}`),
      },
      connect: (node) => calls.push(`gain.connect ${String(node)}`),
    }),
  };
  return { ctx, calls };
}

describe('flourish', () => {
  it('is three rising notes of an A major arpeggio', () => {
    expect(pitch(0)).toBe(440);
    expect(pitch(12)).toBeCloseTo(880, 6);
    expect(FLOURISH.map((n) => Math.round(n.frequency))).toEqual([440, 659, 1109]);
    expect(FLOURISH.map((n) => n.start)).toEqual([0.3, 1.0, 1.7]);
    expect(flourishLength()).toBeCloseTo(3.5, 6);
  });

  it('shapes each note with a quick attack and an exponential decay', () => {
    expect(envelope(FLOURISH[0], 2)).toEqual([
      { time: 2.3, value: 0.0001, ramp: 'set' },
      { time: 2.3 + 0.02, value: 0.16, ramp: 'linear' },
      { time: 2.3 + 1.4, value: 0.0001, ramp: 'exponential' },
    ]);
  });

  it('schedules a sine and a triangle an octave up per note, from now', () => {
    const { ctx, calls } = fakeContext(10);
    const end = playFlourish(ctx);
    expect(end).toBeCloseTo(13.5, 6);
    const starts = calls.filter((c) => c.startsWith('start'));
    expect(starts).toEqual([
      'start sine 440.0 @10.3',
      'start triangle 880.0 @10.3',
      'start sine 659.3 @11',
      'start triangle 1318.5 @11',
      'start sine 1108.7 @11.7',
      'start triangle 2217.5 @11.7',
    ]);
    expect(calls.filter((c) => c === 'gain.connect out')).toHaveLength(3);
    expect(calls).toContain('exp 0.0001 @11.70');
  });
});
