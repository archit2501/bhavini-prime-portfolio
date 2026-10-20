import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { loadContent } from '../../tests/fixtures/catalog';
import { titleBySlug } from './catalog';
import { metadataVtt, parseCue, sceneCues, sceneSheet, SCENE_TABS, type SceneItem } from './cues';

const catalog = loadContent();
const thumbs = { key: '/_astro/key.webp', stills: ['/_astro/s1.webp', '/_astro/s2.webp'] };
const vars = (slug: string) =>
  JSON.parse(
    readFileSync(new URL(`../../media/trailers/variables/${slug}.json`, import.meta.url), 'utf8'),
  );
const title = (slug: string) => {
  const t = titleBySlug(catalog, slug);
  if (!t) throw new Error(slug);
  return t;
};

describe('sceneSheet', () => {
  it('lists who is in the scene, her skills, her figures and trivia', () => {
    const sheet = sceneSheet(catalog, title('f1jobs'), thumbs);
    expect(sheet.scene.map((i) => [i.title, i.detail])).toEqual([
      ['Bhavini Malhotra', 'Sales & Operations Executive'],
      ['F1Jobs.io (Neurascribe Inc.)', 'India'],
    ]);
    expect(sheet.scene[0].thumb).toEqual({ glyph: 'BM', tone: '#1a98ff' });
    expect(sheet.scene[1].thumb).toEqual({ src: '/_astro/key.webp' });
    expect(sheet.skill[0]).toMatchObject({
      kind: 'skill',
      title: 'Sales & Business Development',
      detail: 'B2B Sales, Lead Hunting, Prospecting',
      thumb: { icon: 'skill', tone: '#1a98ff' },
    });
    expect(sheet.fact.map((f) => f.title)).toEqual([
      '$100K+ in revenue',
      '7+ successful sales',
      '65% workflow efficiency gain',
      '20+ customer tickets resolved',
    ]);
    // Stills cycle under the facts.
    expect(sheet.fact.map((f) => f.thumb.src)).toEqual([
      '/_astro/s1.webp',
      '/_astro/s2.webp',
      '/_astro/s1.webp',
      '/_astro/s2.webp',
    ]);
    expect(sheet.trivia.map((i) => [i.title, i.detail])).toEqual([
      ['Open to roles', 'Bangalore'],
      ['On location', 'India'],
      ['Still running', 'May 2026 – now'],
      ['Season 1', '4 episodes'],
    ]);
  });

  it('gives films a running time and their prequel or sequel', () => {
    const sheet = sceneSheet(catalog, title('christ-university'), { key: '/k.webp', stills: [] });
    expect(sheet.scene[0].detail).toBe('Student Representative, University Student Council');
    expect(sheet.fact[0]).toMatchObject({ title: '8.81 CGPA', thumb: { src: '/k.webp' } });
    expect(sheet.trivia.map((i) => i.title)).toEqual([
      'Open to roles',
      'On location',
      'Ran',
      'Running time',
      'Prequel: Cambridge Innovative School',
    ]);
    const school = sceneSheet(catalog, title('cambridge-innovative-school'), thumbs);
    expect(school.trivia.at(-1)?.title).toBe('Sequel: Christ University');
    expect(school.skill).toEqual([]);
  });

  it('names the season and counts a single episode', () => {
    const t = { ...title('f1jobs'), season: 2, episodes: title('f1jobs').episodes?.slice(0, 1) };
    expect(sceneSheet(catalog, t, thumbs).trivia.at(-1)).toMatchObject({
      title: 'Season 2',
      detail: '1 episode',
    });
    const unnumbered = { ...t, season: undefined };
    expect(sceneSheet(catalog, unnumbered, thumbs).trivia.at(-1)?.title).toBe('Season 1');
  });

  it('skips a skill the catalog does not know', () => {
    const t = { ...title('f1jobs'), genres: ['nope', 'operations'] };
    expect(sceneSheet(catalog, t, thumbs).skill.map((s) => s.title)).toEqual(['Operations']);
  });

  it('has the four tabs of the full panel', () => {
    expect(SCENE_TABS.map((t) => t.label)).toEqual(['In scene', 'Skills', 'Facts', 'Trivia']);
  });
});

describe('sceneCues', () => {
  const sheet = sceneSheet(catalog, title('f1jobs'), thumbs);
  const cues = sceneCues(sheet, vars('f1jobs'), thumbs);

  it('follows the trailer beats, with nothing over the ident', () => {
    expect(cues.map((c) => [c.start, c.end])).toEqual([
      [2.7, 4.9],
      [5.1, 7.7],
      [8.05, 10.1],
      [10.4, 12],
    ]);
  });

  it('shows each stat word for word as the trailer does', () => {
    expect(cues[1].items[0]).toEqual({
      kind: 'fact',
      title: '$100K+ in revenue',
      detail: 'from 7+ successful sales',
      thumb: { src: '/_astro/s1.webp' },
    });
    expect(cues[2].items[0].title).toBe('65% workflow efficiency gain');
    expect(cues[0].items.map((i) => i.kind)).toEqual(['scene', 'scene', 'skill', 'skill']);
    expect(cues[3].items.map((i) => i.kind)).toEqual(['trivia', 'trivia', 'trivia']);
  });

  it('round-trips through a WebVTT metadata track', () => {
    const vtt = metadataVtt(cues);
    expect(vtt.startsWith('WEBVTT\n\n1\n00:00:02.700 --> 00:00:04.900\n[')).toBe(true);
    const payloads = vtt
      .split('\n')
      .filter((line) => line.startsWith('['))
      .map(parseCue);
    expect(payloads).toEqual(cues.map((c) => c.items));
  });

  it('never lets a payload close a cue early', () => {
    const tricky: SceneItem = { kind: 'trivia', title: 'a --> b', detail: '', thumb: {} };
    const vtt = metadataVtt([{ start: 0, end: 1, items: [tricky] }]);
    const payload = vtt.split('\n')[4];
    expect(payload).not.toContain('-->');
    expect(parseCue(payload)[0].title).toBe('a --> b');
  });
});

describe('parseCue', () => {
  it('reads nothing from bad JSON or the wrong shape', () => {
    expect(parseCue('not json')).toEqual([]);
    expect(parseCue('{"kind":"fact"}')).toEqual([]);
    expect(parseCue('[null, 3, {"kind":"nope","title":"x","detail":"y"}]')).toEqual([]);
    expect(parseCue('[{"kind":"fact","title":1,"detail":"y"}]')).toEqual([]);
  });

  it('keeps only safe thumbnails', () => {
    const items = parseCue(
      JSON.stringify([
        { kind: 'fact', title: 'a', detail: 'b', thumb: { src: '//evil.example/x.png' } },
        { kind: 'fact', title: 'a', detail: 'b', thumb: { src: 'javascript:alert(1)' } },
        { kind: 'fact', title: 'a', detail: 'b', thumb: { icon: 'nope', tone: 'red' } },
        { kind: 'fact', title: 'a', detail: 'b', thumb: { glyph: 'ABCD', tone: '#AbCdEf' } },
        { kind: 'fact', title: 'a', detail: 'b' },
        { kind: 'scene', title: 'a', detail: 'b', thumb: { src: '/x.webp', icon: 'pin' } },
      ]),
    );
    expect(items.map((i) => i.thumb)).toEqual([
      {},
      {},
      {},
      { glyph: 'ABC', tone: '#AbCdEf' },
      {},
      { src: '/x.webp', icon: 'pin' },
    ]);
  });
});
