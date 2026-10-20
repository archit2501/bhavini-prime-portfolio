import type { Certification, Title } from './catalog-schema';
import { formatPeriod, type WithSlug } from './catalog';
import { withBase } from './url';

/** What a row card needs, apart from its image. */
export interface CardData {
  slug: string;
  href: string;
  title: string;
  ribbon?: string;
  description: string;
}

export function titleCard(t: WithSlug<Title>, base?: string): CardData {
  return {
    slug: t.slug,
    href: withBase(`/title/${t.slug}/`, base),
    title: t.title,
    ribbon: t.ribbon,
    description: `${t.kind === 'series' ? 'Series' : 'Film'}, ${formatPeriod(t.start, t.end)}`,
  };
}

/** Certificates open the skill they belong to; the first listed skill is the main one. */
export function certificationCard(c: WithSlug<Certification>, base?: string): CardData {
  return {
    slug: c.slug,
    href: withBase(c.skills.length ? `/skills/${c.skills[0]}/` : '/skills/', base),
    title: `${c.issuer}: ${c.name}`,
    ribbon: 'CERTIFICATE',
    description: formatPeriod(c.date, c.date),
  };
}
