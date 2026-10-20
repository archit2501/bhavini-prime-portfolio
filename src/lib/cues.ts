import { episodesFor, formatPeriod, runtimeYears, type Catalog, type WithSlug } from './catalog';
import type { Title } from './catalog-schema';
import { titleFigures } from './title-page';
import { figure, TRAILER_CUES, type TrailerVars } from './trailers';

/**
 * "Behind the scenes", the site's take on Prime's X-Ray: who and what is in the scene, the
 * skills at work, the facts on screen and some trivia. Every line comes from the catalog or the
 * trailer's own on-screen text, so nothing here is new information.
 */
export type SceneKind = 'scene' | 'skill' | 'fact' | 'trivia';
export type SceneIcon = 'person' | 'pin' | 'calendar' | 'episodes' | 'check' | 'skill' | 'film';

/** A 64px thumbnail: a picture, or an icon or monogram on a coloured tile. */
export interface Thumb {
  src?: string;
  icon?: SceneIcon;
  glyph?: string;
  tone?: string;
}

export interface SceneItem {
  kind: SceneKind;
  title: string;
  detail: string;
  thumb: Thumb;
}

/** The full panel's four tabs. */
export interface SceneSheet {
  scene: SceneItem[];
  skill: SceneItem[];
  fact: SceneItem[];
  trivia: SceneItem[];
}

export interface SceneCue {
  start: number;
  end: number;
  items: SceneItem[];
}

/** Picture thumbnails for one title, already sized (src/lib/thumbs.ts). */
export interface TitleThumbs {
  key: string;
  stills: string[];
}

export const SCENE_TABS: { id: SceneKind; label: string }[] = [
  { id: 'scene', label: 'In scene' },
  { id: 'skill', label: 'Skills' },
  { id: 'fact', label: 'Facts' },
  { id: 'trivia', label: 'Trivia' },
];

/** The quick view shows each new scene for this long, then fades unless the chrome is up. */
export const QUICK_VIEW_MS = 4000;

const ACCENT = '#1a98ff';
const MINT = '#37f1a3';
const MUTED = '#33373d';

const still = (thumbs: TitleThumbs, i: number) =>
  thumbs.stills.length ? thumbs.stills[i % thumbs.stills.length] : thumbs.key;

/** Everything the full panel lists for a title. O(genres + figures + episodes). */
export function sceneSheet(catalog: Catalog, t: WithSlug<Title>, thumbs: TitleThumbs): SceneSheet {
  const linked = (slug?: string) => catalog.titles.find((x) => x.slug === slug);
  const prequel = linked(t.prequel);
  const sequel = linked(t.sequel);
  const link = (label: string, other?: Title): SceneItem[] =>
    other
      ? [
          {
            kind: 'trivia',
            title: `${label}: ${other.title}`,
            detail: other.role,
            thumb: { icon: 'film', tone: MINT },
          },
        ]
      : [];
  const episodes = episodesFor(t);
  const runtime = runtimeYears(t);
  return {
    scene: [
      {
        kind: 'scene',
        title: 'Bhavini Malhotra',
        detail: t.castAs ?? t.role,
        thumb: { glyph: 'BM', tone: ACCENT },
      },
      { kind: 'scene', title: t.organization, detail: t.location, thumb: { src: thumbs.key } },
    ],
    skill: t.genres.flatMap((g) => {
      const skill = catalog.skills.find((s) => s.slug === g);
      return skill
        ? [
            {
              kind: 'skill' as const,
              title: skill.name,
              detail: skill.items.slice(0, 3).join(', '),
              thumb: { icon: 'skill' as const, tone: skill.glow },
            },
          ]
        : [];
    }),
    fact: titleFigures(catalog, t).map((f, i) => ({
      kind: 'fact' as const,
      title: `${f.value} ${f.label}`,
      detail: t.title,
      thumb: { src: still(thumbs, i) },
    })),
    trivia: [
      {
        kind: 'trivia',
        title: 'Open to roles',
        detail: 'Bangalore',
        thumb: { icon: 'check', tone: '#0070f0' },
      },
      {
        kind: 'trivia',
        title: 'On location',
        detail: t.location,
        thumb: { icon: 'pin', tone: MUTED },
      },
      {
        kind: 'trivia',
        title: t.end === null ? 'Still running' : 'Ran',
        detail: formatPeriod(t.start, t.end),
        thumb: { icon: 'calendar', tone: MUTED },
      },
      ...(episodes.length
        ? [
            {
              kind: 'trivia' as const,
              title: `Season ${t.season ?? 1}`,
              detail: `${episodes.length} episode${episodes.length === 1 ? '' : 's'}`,
              thumb: { icon: 'episodes' as const, tone: MUTED },
            },
          ]
        : []),
      ...(runtime
        ? [
            {
              kind: 'trivia' as const,
              title: 'Running time',
              detail: runtime,
              thumb: { icon: 'film' as const, tone: MUTED },
            },
          ]
        : []),
      ...link('Prequel', prequel),
      ...link('Sequel', sequel),
    ],
  };
}

/** The trailer's stat as a fact, word for word as it appears on screen. */
function statFact(vars: TrailerVars, n: 1 | 2, thumb: Thumb): SceneItem {
  return {
    kind: 'fact',
    title: `${figure(vars, n)} ${vars[`stat${n}Label`]}`,
    detail: String(vars[`stat${n}Detail`]),
    thumb,
  };
}

/** What the quick view shows on each beat of the trailer (TRAILER_CUES). Nothing on the ident. */
export function sceneCues(sheet: SceneSheet, vars: TrailerVars, thumbs: TitleThumbs): SceneCue[] {
  const [person, place] = sheet.scene;
  const beat = (key: keyof typeof TRAILER_CUES, items: SceneItem[]): SceneCue => ({
    start: TRAILER_CUES[key][0],
    end: TRAILER_CUES[key][1],
    items,
  });
  return [
    beat('title', [person, place, ...sheet.skill.slice(0, 2)]),
    beat('stat1', [statFact(vars, 1, { src: still(thumbs, 0) }), person]),
    beat('stat2', [statFact(vars, 2, { src: still(thumbs, 1) }), place]),
    beat('end', sheet.trivia.slice(0, 3)),
  ];
}

function stamp(seconds: number): string {
  const ms = Math.round(seconds * 1000);
  const pad = (n: number, w = 2) => String(n).padStart(w, '0');
  return `${pad(Math.floor(ms / 3600000))}:${pad(Math.floor(ms / 60000) % 60)}:${pad(Math.floor(ms / 1000) % 60)}.${pad(ms % 1000, 3)}`;
}

/** A WebVTT metadata track: one JSON payload per cue, on one line, with "-->" escaped. */
export function metadataVtt(cues: SceneCue[]): string {
  return [
    'WEBVTT\n',
    ...cues.map(
      (c, i) =>
        `${i + 1}\n${stamp(c.start)} --> ${stamp(c.end)}\n${JSON.stringify(c.items).replace(/-->/g, '--\\u003e')}\n`,
    ),
  ].join('\n');
}

const KINDS = new Set<string>(['scene', 'skill', 'fact', 'trivia']);
const ICONS = new Set<string>(['person', 'pin', 'calendar', 'episodes', 'check', 'skill', 'film']);

const isString = (v: unknown): v is string => typeof v === 'string';

/** Reads a cue back, keeping only well-formed items. Bad JSON reads as nothing. O(items). */
export function parseCue(text: string): SceneItem[] {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    return [];
  }
  if (!Array.isArray(data)) return [];
  return data.flatMap((raw: unknown) => {
    if (!raw || typeof raw !== 'object') return [];
    const { kind, title, detail, thumb } = raw as Record<string, unknown>;
    if (!isString(kind) || !KINDS.has(kind) || !isString(title) || !isString(detail)) return [];
    const t = (thumb && typeof thumb === 'object' ? thumb : {}) as Record<string, unknown>;
    const clean: Thumb = {};
    if (isString(t.src) && /^\/[^/]/.test(t.src)) clean.src = t.src;
    if (isString(t.icon) && ICONS.has(t.icon)) clean.icon = t.icon as SceneIcon;
    if (isString(t.glyph)) clean.glyph = t.glyph.slice(0, 3);
    if (isString(t.tone) && /^#[0-9a-f]{6}$/i.test(t.tone)) clean.tone = t.tone;
    return [{ kind: kind as SceneKind, title, detail, thumb: clean }];
  });
}
