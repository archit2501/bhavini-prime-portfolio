import { describe, expect, it } from 'vitest';
import {
  contactLink,
  decodeContact,
  encodeContact,
  ENCODED_CONTACT,
  formatPhone,
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
