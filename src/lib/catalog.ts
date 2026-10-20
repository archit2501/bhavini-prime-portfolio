import type { Certification, Figure, Guide, Row, Skill, Title } from './catalog-schema';

export type WithSlug<T> = T & { slug: string };

/** Everything the site shows, loaded once per build (src/lib/content.ts). */
export interface Catalog {
  figures: Record<string, Figure>;
  /** Sorted by `order`. */
  titles: WithSlug<Title>[];
  /** Sorted by `order`. */
  skills: WithSlug<Skill>[];
  certifications: WithSlug<Certification>[];
  guide: Guide;
  rows: (Row & { id: string })[];
}

export interface NumberedEpisode {
  number: number;
  title: string;
  synopsis: string;
  meta: string;
  /** "1. THE PIPELINE", the way Prime Video titles episodes. */
  heading: string;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

interface ParsedMonth {
  year: number;
  /** 1-12, or undefined when only the year is known. */
  month?: number;
}

export function parseMonth(value: string): ParsedMonth {
  const [year, month] = value.split('-').map(Number);
  return month ? { year, month } : { year };
}

/** Months since year 0, for ordering. A year-only end date counts as December of that year. */
export function monthIndex(value: string, edge: 'start' | 'end' = 'start'): number {
  const { year, month } = parseMonth(value);
  return year * 12 + (month ?? (edge === 'start' ? 1 : 12)) - 1;
}

function formatMonth({ year, month }: ParsedMonth): string {
  return month ? `${MONTHS[month - 1]} ${year}` : String(year);
}

/** "May 2026 – now", "Aug – Dec 2025", "2023 – 2026", "Apr 2023". */
export function formatPeriod(start: string, end: string | null): string {
  const a = parseMonth(start);
  if (end === null) return `${formatMonth(a)} – now`;
  const b = parseMonth(end);
  if (start === end) return formatMonth(a);
  if (a.month && b.month && a.year === b.year) return `${MONTHS[a.month - 1]} – ${formatMonth(b)}`;
  return `${formatMonth(a)} – ${formatMonth(b)}`;
}

export function titleBySlug(catalog: Catalog, slug: string): WithSlug<Title> | undefined {
  return catalog.titles.find((t) => t.slug === slug);
}

export function episodesFor(title: Title): NumberedEpisode[] {
  return (title.episodes ?? []).map((e, i) => ({
    ...e,
    number: i + 1,
    heading: `${i + 1}. ${e.title.toUpperCase()}`,
  }));
}

/** Prime's "Cast:" line. Only Bhavini is credited; no colleagues or clients are named. */
export function castLine(title: Title): string {
  return `Bhavini Malhotra as ${title.role}`;
}

/** Other titles ranked by how many skills they share with this one, then catalog order. O(t·g). */
export function relatedFor(catalog: Catalog, slug: string, limit = 6): WithSlug<Title>[] {
  const self = titleBySlug(catalog, slug);
  if (!self) return [];
  const genres = new Set(self.genres);
  return catalog.titles
    .filter((t) => t.slug !== slug)
    .map((t) => ({ t, shared: t.genres.filter((g) => genres.has(g)).length }))
    .sort((x, y) => y.shared - x.shared || x.t.order - y.t.order)
    .slice(0, limit)
    .map(({ t }) => t);
}

export function titlesForSkill(catalog: Catalog, skill: string): WithSlug<Title>[] {
  return catalog.titles.filter((t) => t.genres.includes(skill));
}

export function certificationsForSkill(catalog: Catalog, skill: string): WithSlug<Certification>[] {
  return catalog.certifications.filter((c) => c.skills.includes(skill));
}

/** All of a title's visible copy, used to prove each listed figure is actually shown. */
export function titleText(title: Title): string {
  return [
    title.status,
    title.synopsis,
    ...(title.episodes ?? []).flatMap((e) => [e.synopsis, e.meta]),
    ...(title.credits ?? []).map((c) => c.synopsis),
  ].join('\n');
}

/**
 * Cross-entry checks the schemas can't express. O(n) over every entry and reference.
 * Returns human-readable errors; an empty list means the catalog is consistent.
 */
export function checkCatalog(catalog: Catalog): string[] {
  const errors: string[] = [];
  const titleSlugs = new Set(catalog.titles.map((t) => t.slug));
  const skillSlugs = new Set(catalog.skills.map((s) => s.slug));
  const trackIds = new Set(catalog.guide.tracks.map((t) => t.id));

  const unique = (what: string, values: number[]) => {
    const seen = new Set<number>();
    for (const v of values) {
      if (seen.has(v)) errors.push(`${what}: order ${v} is used twice`);
      seen.add(v);
    }
  };
  unique(
    'titles',
    catalog.titles.map((t) => t.order),
  );
  unique(
    'skills',
    catalog.skills.map((s) => s.order),
  );
  unique(
    'rows',
    catalog.rows.map((r) => r.order),
  );

  const checkDates = (where: string, start: string, end: string | null) => {
    if (end !== null && monthIndex(start) > monthIndex(end, 'end')) {
      errors.push(`${where}: starts (${start}) after it ends (${end})`);
    }
  };

  for (const t of catalog.titles) {
    const where = `title ${t.slug}`;
    checkDates(where, t.start, t.end);
    const episodes = t.episodes?.length ?? 0;
    if (t.kind === 'series' && episodes === 0) errors.push(`${where}: a series needs episodes`);
    if (t.kind === 'film' && episodes > 0) errors.push(`${where}: a film can't have episodes`);
    for (const g of t.genres) {
      if (!skillSlugs.has(g)) errors.push(`${where}: unknown skill "${g}"`);
    }
    const text = titleText(t);
    for (const id of t.figures) {
      const figure = catalog.figures[id];
      if (!figure) errors.push(`${where}: unknown figure "${id}"`);
      else if (!text.includes(figure.value)) {
        errors.push(`${where}: figure "${id}" (${figure.value}) is listed but never shown`);
      }
    }
  }

  for (const c of catalog.certifications) {
    for (const s of c.skills) {
      if (!skillSlugs.has(s)) errors.push(`certification ${c.slug}: unknown skill "${s}"`);
    }
  }

  for (const row of catalog.rows) {
    const where = `row ${row.id}`;
    if (row.kind === 'hero' || row.kind === 'continue' || row.kind === 'titles') {
      for (const s of row.items)
        if (!titleSlugs.has(s)) errors.push(`${where}: unknown title "${s}"`);
    }
    if (row.kind === 'top10') {
      if (new Set(row.figures).size !== 10) errors.push(`${where}: needs 10 different figures`);
      for (const id of row.figures) {
        if (!catalog.figures[id]) errors.push(`${where}: unknown figure "${id}"`);
      }
    }
  }

  catalog.guide.entries.forEach((e, i) => {
    const where = `guide entry ${i + 1} (${e.label})`;
    if (!trackIds.has(e.track)) errors.push(`${where}: unknown track "${e.track}"`);
    if (e.title && !titleSlugs.has(e.title)) errors.push(`${where}: unknown title "${e.title}"`);
    checkDates(where, e.start, e.end);
  });

  return errors;
}

/** The titles in a row, in the row's order. Unknown slugs never reach here (checkCatalog). */
export function rowTitles(catalog: Catalog, rowId: string): WithSlug<Title>[] {
  const row = catalog.rows.find((r) => r.id === rowId);
  if (!row || !('items' in row)) return [];
  return row.items.flatMap((slug) => titleBySlug(catalog, slug) ?? []);
}

/** "id: value label" for each figure Bhavini hasn't confirmed yet. */
export function unverifiedFigures(catalog: Catalog): string[] {
  return Object.entries(catalog.figures)
    .filter(([, f]) => !f.verified)
    .map(([id, f]) => `${id}: ${f.value} ${f.label}`);
}

/** Throws on any catalog error; the deploy build (requireVerified) also refuses unconfirmed figures. */
export function assertCatalog(catalog: Catalog, options: { requireVerified: boolean }): void {
  const errors = checkCatalog(catalog);
  if (options.requireVerified) {
    errors.push(...unverifiedFigures(catalog).map((f) => `unconfirmed figure ${f}`));
  }
  if (errors.length) throw new Error(`Catalog check failed:\n- ${errors.join('\n- ')}`);
}
