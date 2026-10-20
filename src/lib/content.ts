import { getCollection, getEntry } from 'astro:content';
import { assertCatalog, type Catalog } from './catalog';

let cached: Promise<Catalog> | undefined;

/** Loads every collection once per build and fails the build if the catalog is inconsistent. */
export function loadCatalog(): Promise<Catalog> {
  cached ??= (async () => {
    const bySlug = <T>(entries: { id: string; data: T }[]) =>
      entries.map((e) => ({ ...e.data, slug: e.id }));
    const byOrder = <T extends { order: number }>(a: T, b: T) => a.order - b.order;

    const guide = await getEntry('guide', 'guide');
    if (!guide) throw new Error('src/content/timeline.json needs a "guide" entry');
    const catalog: Catalog = {
      figures: Object.fromEntries((await getCollection('figures')).map((f) => [f.id, f.data])),
      titles: bySlug(await getCollection('titles')).sort(byOrder),
      skills: bySlug(await getCollection('skills')).sort(byOrder),
      certifications: bySlug(await getCollection('certifications')).sort((a, b) =>
        b.date.localeCompare(a.date),
      ),
      guide: guide.data,
      rows: (await getCollection('rows')).map((r) => ({ ...r.data, id: r.id })).sort(byOrder),
    };
    assertCatalog(catalog, { requireVerified: process.env.REQUIRE_VERIFIED === '1' });
    return catalog;
  })();
  return cached;
}
