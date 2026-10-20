import { formatPeriod, type Catalog } from './catalog';
import { periodChip } from './carousel';
import { watchHref } from './player';
import { withBase } from './url';

/** What the expanded hover card shows for one card. */
export interface PreviewData {
  title: string;
  /** Mint status line. */
  status: string;
  synopsis: string;
  ribbon?: string;
  /** Grey chip, e.g. "2026". */
  chip: string;
  /** Grey meta text after the chips, e.g. "Series · 4 episodes". */
  meta: string;
  ctaLabel: string;
  ctaHref: string;
  detailsHref: string;
  /** My List works for titles only. */
  listable: boolean;
}

/** One entry per title and certification, keyed by the slug on its card. O(n). */
export function previewData(catalog: Catalog, base?: string): Record<string, PreviewData> {
  const out: Record<string, PreviewData> = {};
  for (const t of catalog.titles) {
    const episodes = t.episodes?.length ?? 0;
    out[t.slug] = {
      title: t.title,
      status: t.status,
      synopsis: t.synopsis,
      ribbon: t.ribbon,
      chip: periodChip(t.start, t.end),
      meta:
        t.kind === 'series' ? `Series · ${episodes} episode${episodes === 1 ? '' : 's'}` : 'Film',
      ctaLabel: 'Watch now',
      // A title with nothing to play (none today) falls back to its page.
      ctaHref: watchHref(catalog, t, base) ?? withBase(`/title/${t.slug}/`, base),
      detailsHref: withBase(`/title/${t.slug}/`, base),
      listable: true,
    };
  }
  for (const c of catalog.certifications) {
    const skill = c.skills[0];
    const href = withBase(skill ? `/skills/${skill}/` : '/skills/', base);
    out[c.slug] = {
      title: c.name,
      status: c.issuer,
      synopsis: `${c.name}, a certification from ${c.issuer} (${formatPeriod(c.date, c.date)}).`,
      ribbon: 'CERTIFICATE',
      chip: c.date.slice(0, 4),
      meta: 'Certificate',
      ctaLabel: 'View skill',
      ctaHref: href,
      detailsHref: href,
      listable: false,
    };
  }
  return out;
}
