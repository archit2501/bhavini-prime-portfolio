import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  contactLink,
  decodeContact,
  encodeContact,
  ENCODED_CONTACT,
  formatPhone,
  pdfSummary,
  spellOut,
} from './contact';

describe('contact encoding', () => {
  it('round-trips any value', () => {
    for (const v of ['someone@example.com', '+911234567890', 'a.b+c@d.co']) {
      expect(decodeContact(encodeContact(v))).toBe(v);
    }
  });

  it('decodes to her email and phone from the resume', () => {
    expect(decodeContact(ENCODED_CONTACT.email)).toMatch(/^bhavini\.malhotra1@gmail\.com$/);
    expect(decodeContact(ENCODED_CONTACT.phone)).toMatch(/^\+91\d{10}$/);
  });

  it('keeps the encoded form free of anything a harvester looks for', () => {
    for (const encoded of Object.values(ENCODED_CONTACT)) {
      expect(encoded).not.toMatch(/@|gmail|\d{5}/);
    }
  });
});

describe('formatting', () => {
  it('groups Indian mobile numbers', () => {
    expect(formatPhone('+911234567890')).toBe('+91 12345 67890');
    expect(formatPhone('+15551234567')).toBe('+15551234567');
  });

  it('spells out the fallback text', () => {
    expect(spellOut('email', 'jo.ann@mail.co')).toBe('jo dot ann at mail dot co');
    // Zero-width spaces break the digit run so number scrapers don't match it.
    const phone = spellOut('phone', '+911234567890');
    expect(phone.replace(/\u200b/g, '')).toBe('+91 12345 67890');
    expect(phone).not.toMatch(/\d{2}/);
  });

  it('builds mailto and tel links', () => {
    expect(contactLink('email', encodeContact('jo@mail.co'))).toEqual({
      href: 'mailto:jo@mail.co',
      text: 'jo@mail.co',
    });
    expect(contactLink('phone', encodeContact('+911234567890'))).toEqual({
      href: 'tel:+911234567890',
      text: '+91 12345 67890',
    });
  });
});

describe('pdfSummary', () => {
  const pdf = (body: string, size = body.length) =>
    new Uint8Array([
      ...new TextEncoder().encode(body),
      ...new Uint8Array(Math.max(0, size - body.length)),
    ]);

  it('counts pages and rounds the size to KB', () => {
    expect(pdfSummary(pdf('<< /Type /Pages >> << /Type /Page >>', 81_631))).toBe(
      'PDF, 1 page, 80 KB',
    );
    expect(pdfSummary(pdf('/Type/Page /Type /Page /Type /Pages', 300_000))).toBe(
      'PDF, 2 pages, 293 KB',
    );
  });

  it('never says 0 KB, and copes with no pages at all', () => {
    expect(pdfSummary(pdf('/Type /Page'))).toBe('PDF, 1 page, 1 KB');
    expect(pdfSummary(pdf('not a pdf'))).toBe('PDF, 0 pages, 1 KB');
  });

  it('reads the real resume', () => {
    const bytes = readFileSync(
      new URL('../../public/bhavini-malhotra-resume.pdf', import.meta.url),
    );
    expect(pdfSummary(bytes)).toMatch(/^PDF, 1 page, \d+ KB$/);
  });
});
