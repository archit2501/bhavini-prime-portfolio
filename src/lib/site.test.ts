import { describe, expect, it } from 'vitest';
import { jsonLdScript, pageTitle, personJsonLd, SITE } from './site';

describe('pageTitle', () => {
  it('uses name and role on the home page', () => {
    expect(pageTitle()).toBe('Bhavini Malhotra · Sales & Operations');
    expect(pageTitle('   ')).toBe('Bhavini Malhotra · Sales & Operations');
  });

  it('puts the page name first elsewhere', () => {
    expect(pageTitle(' Career Guide ')).toBe('Career Guide · Bhavini Malhotra');
  });

  it('never mentions Prime Video or Amazon', () => {
    expect(pageTitle('Home')).not.toMatch(/prime|amazon/i);
  });
});

describe('personJsonLd', () => {
  const data = personJsonLd('https://example.com/');

  it('describes her as a schema.org Person', () => {
    expect(data).toMatchObject({
      '@context': 'https://schema.org',
      '@type': 'Person',
      name: 'Bhavini Malhotra',
      url: 'https://example.com/',
      jobTitle: 'Sales & Operations Executive',
      worksFor: { '@type': 'Organization', name: 'F1Jobs.io', url: 'https://f1jobs.io' },
      sameAs: [SITE.linkedin],
    });
  });

  it('leaves email and phone out of the page source', () => {
    expect(JSON.stringify(data)).not.toMatch(/@gmail|email|telephone/i);
  });
});

describe('jsonLdScript', () => {
  it('escapes "<" so data cannot close the script tag', () => {
    expect(jsonLdScript({ a: '</script><b>' })).toBe('{"a":"\\u003c/script>\\u003cb>"}');
  });
});
