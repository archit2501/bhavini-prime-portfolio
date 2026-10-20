/**
 * The intro ident's sound: an original three-note flourish, a rising A major arpeggio with a
 * soft bell-like voice, synthesised with Web Audio (no recording, nothing of Prime's). Each note
 * lands on a beat of the ident: the swoosh starts, the dot lands, the light sweeps.
 */
export interface Note {
  /** Hz. */
  frequency: number;
  /** Seconds after the flourish starts. */
  start: number;
  /** Seconds from attack to silence. */
  duration: number;
  /** Peak gain, 0-1. */
  gain: number;
}

/** Equal temperament: semitones above A4 (440 Hz). */
export function pitch(semitonesFromA4: number): number {
  return 440 * 2 ** (semitonesFromA4 / 12);
}

export const FLOURISH: Note[] = [
  { frequency: pitch(0), start: 0.3, duration: 1.4, gain: 0.16 }, // A4
  { frequency: pitch(7), start: 1.0, duration: 1.4, gain: 0.14 }, // E5
  { frequency: pitch(16), start: 1.7, duration: 1.8, gain: 0.12 }, // C#6
];

const ATTACK = 0.02;
const SILENT = 0.0001;

/** The gain automation for one note: up fast, then an exponential bell-like decay. */
export function envelope(
  note: Note,
  at: number,
): { time: number; value: number; ramp: 'set' | 'linear' | 'exponential' }[] {
  const t0 = at + note.start;
  return [
    { time: t0, value: SILENT, ramp: 'set' },
    { time: t0 + ATTACK, value: note.gain, ramp: 'linear' },
    { time: t0 + note.duration, value: SILENT, ramp: 'exponential' },
  ];
}

/** When the last note has died away, in seconds after the flourish starts. */
export function flourishLength(notes: Note[] = FLOURISH): number {
  return Math.max(...notes.map((n) => n.start + n.duration));
}

/** The parts of Web Audio the flourish uses, so tests can pass a fake. */
export interface AudioLike {
  currentTime: number;
  destination: unknown;
  createOscillator(): {
    type: string;
    frequency: { value: number };
    connect(node: unknown): unknown;
    start(when: number): void;
    stop(when: number): void;
  };
  createGain(): {
    gain: {
      setValueAtTime(v: number, t: number): void;
      linearRampToValueAtTime(v: number, t: number): void;
      exponentialRampToValueAtTime(v: number, t: number): void;
    };
    connect(node: unknown): unknown;
  };
}

/**
 * Schedules the flourish on an audio context: per note a sine and a quieter triangle an octave
 * up (the bell), through one gain envelope. Returns when it ends, in context time.
 */
export function playFlourish(ctx: AudioLike, notes: Note[] = FLOURISH): number {
  const at = ctx.currentTime;
  for (const note of notes) {
    const gain = ctx.createGain();
    for (const step of envelope(note, at)) {
      if (step.ramp === 'set') gain.gain.setValueAtTime(step.value, step.time);
      else if (step.ramp === 'linear') gain.gain.linearRampToValueAtTime(step.value, step.time);
      else gain.gain.exponentialRampToValueAtTime(step.value, step.time);
    }
    gain.connect(ctx.destination);
    for (const [type, multiple] of [
      ['sine', 1],
      ['triangle', 2],
    ] as const) {
      const osc = ctx.createOscillator();
      osc.type = type;
      osc.frequency.value = note.frequency * multiple;
      osc.connect(gain);
      osc.start(at + note.start);
      osc.stop(at + note.start + note.duration);
    }
  }
  return at + flourishLength(notes);
}
