import { TRAILER_CUES } from '../../src/lib/trailers.ts';

/** Beats from media/trailers/shot-plan.json. */
export const CUES = TRAILER_CUES;

export type TrailerVars = Record<string, string | number>;

export function stamp(seconds: number): string {
  const ms = Math.round(seconds * 1000);
  const pad = (n: number, w = 2) => String(n).padStart(w, '0');
  return `${pad(Math.floor(ms / 3600000))}:${pad(Math.floor(ms / 60000) % 60)}:${pad(Math.floor(ms / 1000) % 60)}.${pad(ms % 1000, 3)}`;
}

/** The stat as it appears on screen, e.g. "$100K+" or "8.81". */
export function figure(vars: TrailerVars, n: 1 | 2): string {
  const value = Number(vars[`stat${n}Value`]);
  const decimals = Number(vars[`stat${n}Decimals`] ?? 0);
  const text = value.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  return `${vars[`stat${n}Prefix`] ?? ''}${text}${vars[`stat${n}Suffix`] ?? ''}`;
}

/** WebVTT cue text escapes &, < and > as character references. */
function escape(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/** Captions with the same words, in the same order, as the picture: a text alternative. */
export function captions(title: string, vars: TrailerVars): string {
  const cue = (i: number, [a, b]: readonly number[], lines: string[]) =>
    `${i}\n${stamp(a)} --> ${stamp(b)}\n${lines.map(escape).join('\n')}\n`;
  return [
    'WEBVTT\n',
    cue(1, CUES.ident, ['bhavini original']),
    cue(2, CUES.title, [`${title} · ${vars.tagline}`, String(vars.status)]),
    cue(3, CUES.stat1, [`${figure(vars, 1)} ${vars.stat1Label}`, String(vars.stat1Detail)]),
    cue(4, CUES.stat2, [`${figure(vars, 2)} ${vars.stat2Label}`, String(vars.stat2Detail)]),
    cue(5, CUES.end, [`${title}. Watch now.`, 'Open to roles · Bangalore']),
  ].join('\n');
}
