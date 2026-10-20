import { readdirSync, readFileSync } from 'node:fs';
import type { Catalog } from '../../src/lib/catalog';
import {
  certificationSchema,
  figureSchema,
  guideSchema,
  rowSchema,
  skillSchema,
  titleSchema,
} from '../../src/lib/catalog-schema';

const dir = new URL('../../src/content/', import.meta.url);
const json = (name: string) => JSON.parse(readFileSync(new URL(name, dir), 'utf8'));
const keyed = <T>(data: Record<string, unknown>, parse: (v: unknown) => T) =>
  Object.entries(data).map(([slug, v]) => ({ ...parse(v), slug }));

/** The real content, parsed with the same schemas Astro uses. */
export function loadContent(): Catalog {
  const titles = readdirSync(new URL('titles/', dir))
    .filter((f) => f.endsWith('.json'))
    .map((f) => ({
      ...titleSchema.parse(json(`titles/${f}`)),
      slug: f.replace(/\.json$/, ''),
    }))
    .sort((a, b) => a.order - b.order);
  return {
    figures: Object.fromEntries(
      Object.entries(json('figures.json')).map(([id, f]) => [id, figureSchema.parse(f)]),
    ),
    titles,
    skills: keyed(json('skills.json'), (v) => skillSchema.parse(v)).sort(
      (a, b) => a.order - b.order,
    ),
    certifications: keyed(json('certifications.json'), (v) => certificationSchema.parse(v)),
    guide: guideSchema.parse(json('timeline.json').guide),
    rows: (json('rows.json') as { id: string }[])
      .map((r) => ({ ...rowSchema.parse(r), id: r.id }))
      .sort((a, b) => a.order - b.order),
  };
}
