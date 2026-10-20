/**
 * Her email and phone are public (decision Q7), but they never appear as plain text in the HTML,
 * the JavaScript or this repository: they're stored reversed and base64-encoded, and only the
 * visitor's browser decodes them. That stops the regex harvesters that scrape addresses and
 * numbers, without hiding anything from people.
 */
export const ENCODED_CONTACT = {
  email: 'bW9jLmxpYW1nQDFhcnRvaGxhbS5pbml2YWhi',
  phone: 'OTc3OTI3NzM4ODE5Kw==',
} as const;

export type ContactKind = keyof typeof ENCODED_CONTACT;

export const RESUME_PATH = '/bhavini-malhotra-resume.pdf';

export function encodeContact(value: string): string {
  return btoa([...value].reverse().join(''));
}

export function decodeContact(encoded: string): string {
  return [...atob(encoded)].reverse().join('');
}

/** "+911234567890" -> "+91 12345 67890" (Indian mobile grouping). */
export function formatPhone(e164: string): string {
  const m = /^\+91(\d{5})(\d{5})$/.exec(e164);
  return m ? `+91 ${m[1]} ${m[2]}` : e164;
}

/** What a person reads before the script runs (or without JavaScript): "name at gmail dot com". */
export function spellOut(kind: ContactKind, value: string): string {
  if (kind === 'phone') return formatPhone(value).replace(/\d/g, (d) => `${d}\u200b`);
  return value.replace('@', ' at ').replace(/\./g, ' dot ');
}

/** The decoded link for a contact kind: its href and visible text. */
export function contactLink(kind: ContactKind, encoded: string): { href: string; text: string } {
  const value = decodeContact(encoded);
  return kind === 'email'
    ? { href: `mailto:${value}`, text: value }
    : { href: `tel:${value}`, text: formatPhone(value) };
}

/** "PDF, 1 page, 80 KB": read from the file itself at build time, so it can't go stale. */
export function pdfSummary(bytes: Uint8Array): string {
  const text = new TextDecoder('latin1').decode(bytes);
  const pages = (text.match(/\/Type\s*\/Page(?!s)/g) ?? []).length;
  const kb = Math.max(1, Math.round(bytes.length / 1024));
  return `PDF, ${pages} page${pages === 1 ? '' : 's'}, ${kb} KB`;
}
