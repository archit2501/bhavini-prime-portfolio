/** Site-wide identity, from her resume. The catalog content (task 1.2.1) builds on this. */
export const SITE = {
  name: 'Bhavini Malhotra',
  role: 'Sales & Operations',
  jobTitle: 'Sales & Operations Executive',
  organization: { name: 'F1Jobs.io', url: 'https://f1jobs.io' },
  alumniOf: 'Christ University',
  location: 'Bangalore, India',
  description:
    'Bhavini Malhotra, Sales & Operations Executive at F1Jobs.io in Bangalore: $100K+ revenue from 7+ sales, lead generation and customer operations.',
  linkedin: 'https://www.linkedin.com/in/bhavini-malhotra-26b0a224/',
  disclaimer: 'Not affiliated with Amazon, Prime Video or IMDb.',
} as const;

/** "Bhavini Malhotra · Sales & Operations", or "<page> · Bhavini Malhotra". */
export function pageTitle(page?: string): string {
  const trimmed = page?.trim();
  return trimmed ? `${trimmed} · ${SITE.name}` : `${SITE.name} · ${SITE.role}`;
}

/** schema.org Person for search engines. Contact details stay out: they're assembled client-side. */
export function personJsonLd(siteUrl: string): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: SITE.name,
    url: siteUrl,
    jobTitle: SITE.jobTitle,
    worksFor: { '@type': 'Organization', ...SITE.organization },
    alumniOf: { '@type': 'CollegeOrUniversity', name: SITE.alumniOf },
    address: { '@type': 'PostalAddress', addressLocality: SITE.location },
    sameAs: [SITE.linkedin],
  };
}

/** JSON for a <script type="application/ld+json">, safe against a closing </script> in the data. */
export function jsonLdScript(data: unknown): string {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}
