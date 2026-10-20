import type { Catalog, WithSlug } from './catalog';
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
    badges: [t.kind === 'series' ? 'Series' : 'Film', ...(hasCaptions ? ['CC'] : [])],
    cta: t.kind === 'series' ? ['Episode 1', 'Watch now'] : ['Watch now'],
  };
}
