import { episodesFor, titlesForSkill, type Catalog } from './catalog';
import { periodChip } from './carousel';
import { withBase } from './url';

export type SearchKind = 'title' | 'episode' | 'skill' | 'certification';

/** One searchable thing, as shipped in /search-index.json. */
export interface SearchEntry {
  kind: SearchKind;
  /** The card's big line, e.g. "F1Jobs.io" or "2. The Pitch". */
  name: string;
  /** The grey line under it: a year, "F1Jobs.io · S1 E2", "3 titles". */
  meta: string;
  href: string;
  /** 16:9 art, or a tone for the tile when there is none (skills). */
  image?: string;
  tone?: string;
  /** Normalised words of the name, then of everything else worth matching. */
  words: string;
  more: string;
}

/** Card art per slug, already sized (src/lib/scene-assets.ts). */
export interface SearchArt {
  card: (slug: string) => string | undefined;
  still: (slug: string, index: number) => string | undefined;
}

/** Lower case, accents stripped, "&" read as "and", anything else non-alphanumeric a space. */
export function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9%$+.]+/g, ' ')
    .replace(/(^|\s)[.]+|[.]+(?=\s|$)/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Every title, episode, skill and certification, in catalog order. O(n) at build time. */
export function buildIndex(catalog: Catalog, art: SearchArt, base?: string): SearchEntry[] {
  const entry = (e: Omit<SearchEntry, 'words' | 'more'> & { text: string[] }): SearchEntry => {
    const { text, ...rest } = e;
    return { ...rest, words: normalize(e.name), more: normalize(text.join(' ')) };
  };
  const skillName = (slug: string) => catalog.skills.find((s) => s.slug === slug)?.name ?? '';

  const titles = catalog.titles.map((t) =>
    entry({
      kind: 'title',
      name: t.title,
      meta: periodChip(t.start, t.end),
      href: withBase(`/title/${t.slug}/`, base),
      image: art.card(t.slug),
      text: [t.organization, t.role, t.location, t.synopsis, t.status, ...t.genres.map(skillName)],
    }),
  );
  const episodes = catalog.titles.flatMap((t) =>
    episodesFor(t).map((ep, i) =>
      entry({
        kind: 'episode',
        name: ep.title,
        meta: `${t.title} · S${t.season ?? 1} E${ep.number}`,
        href: withBase(`/title/${t.slug}/#episodes`, base),
        image: art.still(t.slug, i),
        text: [t.title, ep.synopsis, ep.meta],
      }),
    ),
  );
  const skills = catalog.skills.map((s) => {
    const count = titlesForSkill(catalog, s.slug).length;
    return entry({
      kind: 'skill',
      name: s.name,
      meta: `Skill · ${count} title${count === 1 ? '' : 's'}`,
      href: withBase(`/skills/${s.slug}/`, base),
      tone: s.glow,
      text: s.items,
    });
  });
  const certifications = catalog.certifications.map((c) =>
    entry({
      kind: 'certification',
      name: c.name,
      meta: `${c.issuer} · ${c.date.slice(0, 4)}`,
      href: withBase(c.skills[0] ? `/skills/${c.skills[0]}/` : '/skills/', base),
      image: art.card(c.slug),
      text: [c.issuer, 'certificate certification', ...c.skills.map(skillName)],
    }),
  );
  return [...titles, ...episodes, ...skills, ...certifications];
}

const KIND_BONUS: Record<SearchKind, number> = {
  title: 0.5,
  skill: 0.3,
  certification: 0.2,
  episode: 0,
};

/** A word in `text` (space separated) starts with `token`. */
const hasPrefix = (text: string, token: string) =>
  text.startsWith(token) || text.includes(` ${token}`);

/**
 * Matches every word of the query as the start of a word in an entry, the name counting most.
 * A linear scan, O(n x query words): with n around 40, faster than building anything cleverer.
 */
export function search(index: SearchEntry[], query: string, limit = 12): SearchEntry[] {
  const tokens = normalize(query).split(' ').filter(Boolean);
  if (!tokens.length) return [];
  const scored: { entry: SearchEntry; score: number; order: number }[] = [];
  index.forEach((entry, order) => {
    let score = KIND_BONUS[entry.kind];
    for (const token of tokens) {
      if (hasPrefix(entry.words, token)) score += entry.words.startsWith(token) ? 5 : 3;
      else if (hasPrefix(entry.more, token)) score += 1;
      else return;
    }
    scored.push({ entry, score, order });
  });
  return scored
    .sort((a, b) => b.score - a.score || a.order - b.order)
    .slice(0, limit)
    .map((s) => s.entry);
}

/** "1 result", "4 results", "No results for "xyz"". */
export function resultsLabel(count: number, query: string): string {
  if (!count) return `No results for "${query.trim()}"`;
  return `${count} result${count === 1 ? '' : 's'}`;
}
