import { runtimeYears, type Catalog, type WithSlug } from './catalog';
import type { Title } from './catalog-schema';
import { periodChip } from './carousel';
import { withBase } from './url';

export interface DetailMeta {
  /** Skill links in the genre row, Prime-style underlined and separated by bullets. */
  skills: { name: string; href: string }[];
  /** Grey words after the skills, like Prime's mood and year: location, then year. */
  trailing: string[];
  /** Small badges in the right-hand column. */
  badges: string[];
  /** Two-line CTA for a series ("Episode 1" / "Watch now"), one line for a film. */
  cta: string[];
}

/** Everything the detail hero shows beyond the title's own fields. O(genres). */
export function detailMeta(
  catalog: Catalog,
  t: WithSlug<Title>,
  hasCaptions: boolean,
  base?: string,
): DetailMeta {
  const skills = t.genres.flatMap((g) => {
    const skill = catalog.skills.find((s) => s.slug === g);
    return skill ? [{ name: skill.name, href: withBase(`/skills/${g}/`, base) }] : [];
  });
  const place = t.location
    .replace(/\s*\(.*\)$/, '')
    .split(',')[0]
    .trim();
  return {
    skills,
    trailing: [place, periodChip(t.start, t.end)],
    badges: [
      t.kind === 'series' ? 'Series' : 'Film',
      ...(t.kind === 'film' && runtimeYears(t) ? [runtimeYears(t) as string] : []),
      ...(hasCaptions ? ['CC'] : []),
    ],
    cta: t.kind === 'series' ? ['Episode 1', 'Watch now'] : ['Watch now'],
  };
}

export type TabId = 'episodes' | 'related' | 'details';

/** Series get Episodes first; films, like Prime's movies, open on Related. */
export function tabsFor(t: Title): { id: TabId; label: string }[] {
  const tabs: { id: TabId; label: string }[] = [
    { id: 'related', label: 'Related' },
    { id: 'details', label: 'Details' },
  ];
  return t.kind === 'series' && t.episodes?.length
    ? [{ id: 'episodes', label: 'Episodes' }, ...tabs]
    : tabs;
}

/** The tab a URL hash asks for, or the first tab. */
export function tabFromHash(hash: string, tabs: { id: TabId }[]): TabId {
  const wanted = hash.replace(/^#/, '');
  return tabs.find((t) => t.id === wanted)?.id ?? tabs[0].id;
}

/** Arrow-key movement along a tab list, wrapping at the ends (ARIA tabs pattern). */
export function nextTab(index: number, count: number, key: string): number | undefined {
  if (key === 'ArrowRight') return (index + 1) % count;
  if (key === 'ArrowLeft') return (index - 1 + count) % count;
  if (key === 'Home') return 0;
  if (key === 'End') return count - 1;
  return undefined;
}

/** The title's confirmed figures, as "value label" pairs for the Details panel. */
export function titleFigures(catalog: Catalog, t: Title): { value: string; label: string }[] {
  return t.figures.flatMap((id) => {
    const f = catalog.figures[id];
    return f ? [{ value: f.value, label: f.label }] : [];
  });
}

/** "Prequel: Cambridge Innovative School" / "Sequel: Christ University" links for films. */
export function seriesLinks(
  catalog: Catalog,
  t: Title,
  base?: string,
): { label: string; title: string; href: string }[] {
  const link = (label: string, slug?: string) => {
    const other = slug ? catalog.titles.find((x) => x.slug === slug) : undefined;
    return other
      ? [{ label, title: other.title, href: withBase(`/title/${other.slug}/`, base) }]
      : [];
  };
  return [...link('Prequel', t.prequel), ...link('Sequel', t.sequel)];
}

/** "Recruiters also viewed": every other title, in catalog order (the Related tab ranks by skill). */
export function alsoViewed(catalog: Catalog, slug: string): WithSlug<Title>[] {
  return catalog.titles.filter((t) => t.slug !== slug);
}
