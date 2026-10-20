import {
  certificationsForSkill,
  episodesFor,
  titlesForSkill,
  type Catalog,
  type NumberedEpisode,
  type WithSlug,
} from './catalog';
import type { Certification, Skill, Title } from './catalog-schema';

/** Prime's "Featured collections": hand-picked shelves, here grouped by the figures they hold. */
export interface Collection {
  id: string;
  name: string;
  blurb: string;
  titles: WithSlug<Title>[];
  certifications: WithSlug<Certification>[];
}

const BY_FIGURES: { id: string; name: string; blurb: string; figures: string[] }[] = [
  {
    id: 'revenue-wins',
    name: 'Revenue wins',
    blurb: 'Sales closed, revenue booked and products shipped.',
    figures: ['revenue', 'deals', 'units', 'regions'],
  },
  {
    id: 'care-and-community',
    name: 'Care & community',
    blurb: 'Clinical sessions, case histories and clean-up drives.',
    figures: ['sessions', 'caseHistories', 'cleanups', 'community'],
  },
];

/** The featured collections, in display order: revenue, certifications, then care. O(t x f). */
export function collections(catalog: Catalog): Collection[] {
  const byFigures = (i: number): Collection => {
    const { figures, ...rest } = BY_FIGURES[i];
    return {
      ...rest,
      titles: catalog.titles.filter((t) => t.figures.some((f) => figures.includes(f))),
      certifications: [],
    };
  };
  return [
    byFigures(0),
    {
      id: 'certifications',
      name: 'Certifications',
      blurb: 'Courses she has completed, and the skills they back.',
      titles: [],
      certifications: catalog.certifications,
    },
    byFigures(1),
  ];
}

export interface SkillShelf {
  skill: WithSlug<Skill>;
  titles: WithSlug<Title>[];
  certifications: WithSlug<Certification>[];
  /** Episodes of the titles that use the skill, each with its title. */
  episodes: { title: WithSlug<Title>; episode: NumberedEpisode }[];
}

/** Everything one skill page shows. O(t + c + episodes). */
export function skillShelf(catalog: Catalog, skill: WithSlug<Skill>): SkillShelf {
  const titles = titlesForSkill(catalog, skill.slug);
  return {
    skill,
    titles,
    certifications: certificationsForSkill(catalog, skill.slug),
    episodes: titles.flatMap((title) => episodesFor(title).map((episode) => ({ title, episode }))),
  };
}
