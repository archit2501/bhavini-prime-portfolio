/**
 * Builds the personal brand marks from outlined text (decision Q2: an original "bhavini" wordmark
 * with a blue swoosh that ends in a dot, never Amazon's smile or arrow).
 *
 *   node scripts/brand/build.ts
 *
 * Writes path data for the inline SVG components (src/assets/brand/*.json) and the raster icons
 * and social image in public/. Re-running with unchanged inputs produces identical files.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import sharp from 'sharp';
import { outlineText } from '../../src/lib/art/outline.ts';

const ROOT = new URL('../../', import.meta.url).pathname;
const FONTS = `${ROOT}scripts/art/fonts/`;
const BLUE = '#1A98FF';
const BG = '#00050D';
const TRACKING = -0.035;

/** The swoosh under a word of width w whose baseline is at y: a tapered rise ending in a dot. */
function swoosh(x: number, y: number, w: number, size: number) {
  const k = size / 100;
  const x1 = x + 6 * k;
  const x2 = x + w - 10 * k;
  const sy = y + 21 * k;
  const r = (n: number) => Math.round(n * 100) / 100;
  const d =
    `M${r(x1)} ${r(sy - 2 * k)}` +
    `C${r(x1 + w * 0.25)} ${r(sy + 17 * k)} ${r(x1 + w * 0.6)} ${r(sy + 15 * k)} ${r(x2 - 2 * k)} ${r(sy - 6 * k)}` +
    `L${r(x2)} ${r(sy + 3 * k)}` +
    `C${r(x1 + w * 0.6)} ${r(sy + 26 * k)} ${r(x1 + w * 0.25)} ${r(sy + 24 * k)} ${r(x1)} ${r(sy - 2 * k)}Z`;
  return { d, dot: { cx: r(x2 + 3 * k), cy: r(sy - 3 * k), r: r(8 * k) } };
}

interface Mark {
  viewBox: string;
  width: number;
  height: number;
  text: string;
  /** A second, lighter word ("original") where the mark has one. */
  suffix?: string;
  swoosh: string;
  dot: { cx: number; cy: number; r: number };
}

function wordmark(size = 100, pad = 2): Mark {
  const word = outlineText('bhavini', {
    font: `${FONTS}Inter-ExtraBold.ttf`,
    size,
    tracking: TRACKING,
  });
  // Lowercase ascenders reach about 0.76em above the baseline; the swoosh hangs 0.34em below.
  const top = -0.78 * size;
  const s = swoosh(0, 0, word.width, size);
  const bottom = 0.34 * size;
  const width = word.width + 12 * (size / 100);
  return frame(
    { text: word.d, swoosh: s.d, dot: s.dot },
    -pad,
    top - pad,
    width + 2 * pad,
    bottom - top + 2 * pad,
  );
}

function ident(size = 100, pad = 2): Mark {
  const word = outlineText('bhavini', {
    font: `${FONTS}Inter-ExtraBold.ttf`,
    size,
    tracking: TRACKING,
  });
  const gap = 0.24 * size;
  const suffix = outlineText('original', {
    font: `${FONTS}Inter-Medium.ttf`,
    size,
    tracking: -0.01,
    x: word.width + gap,
  });
  const s = swoosh(0, 0, word.width, size);
  const top = -0.78 * size;
  const bottom = 0.34 * size;
  const width = word.width + gap + suffix.width;
  return {
    ...frame(
      { text: word.d, swoosh: s.d, dot: s.dot },
      -pad,
      top - pad,
      width + 2 * pad,
      bottom - top + 2 * pad,
    ),
    suffix: suffix.d,
  };
}

function frame(
  parts: Pick<Mark, 'text' | 'swoosh' | 'dot'>,
  x: number,
  y: number,
  w: number,
  h: number,
): Mark {
  const r = (n: number) => Math.round(n * 100) / 100;
  return { ...parts, viewBox: `${r(x)} ${r(y)} ${r(w)} ${r(h)}`, width: r(w), height: r(h) };
}

function markSvg(m: Mark, opts: { text?: string; swoosh?: string } = {}): string {
  const text = opts.text ?? '#FFFFFF';
  const blue = opts.swoosh ?? BLUE;
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${m.viewBox}" width="${m.width}" height="${m.height}">` +
    `<path d="${m.text}" fill="${text}"/>` +
    (m.suffix ? `<path d="${m.suffix}" fill="${text}"/>` : '') +
    `<path d="${m.swoosh}" fill="${blue}"/><circle cx="${m.dot.cx}" cy="${m.dot.cy}" r="${m.dot.r}" fill="${blue}"/></svg>`
  );
}

/** Square app icon: a white "b" with the swoosh on the page background. */
function iconSvg(px: number, rounded: boolean): string {
  const size = px * 0.78;
  const b = outlineText('b', { font: `${FONTS}Inter-ExtraBold.ttf`, size });
  const x = (px - b.width) / 2;
  const y = px * 0.68;
  // Scale the swoosh to the glyph's width, as in the wordmark (about 3.8 widths per 100 units),
  // so it stays a gentle rise instead of a deep hook.
  const sw = b.width * 1.2;
  const s = swoosh(x - b.width * 0.1, y, sw, (sw / 3.8) * 1.6);
  const radius = rounded ? px * 0.22 : 0;
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${px} ${px}" width="${px}" height="${px}">` +
    `<rect width="${px}" height="${px}" rx="${radius}" fill="${BG}"/>` +
    `<path d="${b.d}" transform="translate(${x.toFixed(2)} ${y.toFixed(2)})" fill="#FFFFFF"/>` +
    `<path d="${s.d}" fill="${BLUE}"/><circle cx="${s.dot.cx}" cy="${s.dot.cy}" r="${s.dot.r}" fill="${BLUE}"/></svg>`
  );
}

/** 1200x630 social card styled like a Prime Video hero: title, status line, CTA, entitlement. */
function ogSvg(): string {
  const W = 1200;
  const H = 630;
  const left = 80;
  const mark = wordmark(46);
  const [, , mw, mh] = mark.viewBox.split(' ').map(Number);
  const name = outlineText('Bhavini Malhotra', {
    font: `${FONTS}Inter-ExtraBold.ttf`,
    size: 92,
    tracking: -0.02,
    x: left,
    y: 300,
  });
  const role = outlineText('Sales & Operations Executive · F1Jobs.io', {
    font: `${FONTS}Inter-Medium.ttf`,
    size: 34,
    x: left,
    y: 358,
  });
  const status = outlineText('$100K+ in revenue from 7+ sales', {
    font: `${FONTS}Inter-Bold.ttf`,
    size: 30,
    x: left + 44,
    y: 424,
  });
  const cta = outlineText('Watch now', {
    font: `${FONTS}Inter-Medium.ttf`,
    size: 30,
    x: left + 70,
    y: 512,
  });
  const open = outlineText('Open to roles · Bangalore', {
    font: `${FONTS}Inter-Medium.ttf`,
    size: 26,
    x: left + 38,
    y: 576,
  });
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">` +
    `<defs><radialGradient id="glow" cx="78%" cy="38%" r="62%"><stop offset="0" stop-color="${BLUE}" stop-opacity=".55"/>` +
    `<stop offset=".45" stop-color="#0b3a73" stop-opacity=".35"/><stop offset="1" stop-color="${BG}" stop-opacity="0"/></radialGradient>` +
    `<linearGradient id="fade" x1="0" x2="1"><stop offset=".25" stop-color="${BG}"/><stop offset=".75" stop-color="${BG}" stop-opacity="0"/></linearGradient></defs>` +
    `<rect width="${W}" height="${H}" fill="${BG}"/><rect width="${W}" height="${H}" fill="url(#glow)"/><rect width="${W}" height="${H}" fill="url(#fade)"/>` +
    `<svg x="${left}" y="64" width="${mw}" height="${mh}" viewBox="${mark.viewBox}"><path d="${mark.text}" fill="#FFFFFF"/>` +
    `<path d="${mark.swoosh}" fill="${BLUE}"/><circle cx="${mark.dot.cx}" cy="${mark.dot.cy}" r="${mark.dot.r}" fill="${BLUE}"/></svg>` +
    `<path d="${name.d}" fill="#FFFFFF"/><path d="${role.d}" fill="#F1F1F1"/>` +
    // Status line: trending-up arrow in a circle, in the measured mint.
    `<circle cx="${left + 16}" cy="413" r="15" fill="none" stroke="#37F1A3" stroke-width="3"/>` +
    `<path d="M${left + 7} 419l6-7 4 4 8-9" fill="none" stroke="#37F1A3" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>` +
    `<path d="${status.d}" fill="#37F1A3"/>` +
    // Primary CTA: white, radius 8, play triangle.
    `<rect x="${left}" y="468" width="${cta.width + 100}" height="66" rx="8" fill="#FFFFFF"/>` +
    `<path d="M${left + 30} 485l26 16-26 16z" fill="${BG}"/><path d="${cta.d}" fill="${BG}"/>` +
    // Entitlement: blue check circle.
    `<circle cx="${left + 14}" cy="567" r="13" fill="#0070F0"/><path d="M${left + 8} 567l4 4 8-8" fill="none" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>` +
    `<path d="${open.d}" fill="#FFFFFF"/></svg>`
  );
}

/** A .ico holding one 32-bit PNG image: a 6-byte header, one 16-byte entry, then the PNG. */
function ico(png: Buffer, px: number): Buffer {
  const head = Buffer.alloc(22);
  head.writeUInt16LE(0, 0); // reserved
  head.writeUInt16LE(1, 2); // type: icon
  head.writeUInt16LE(1, 4); // one image
  head.writeUInt8(px, 6); // width
  head.writeUInt8(px, 7); // height
  head.writeUInt16LE(1, 10); // colour planes
  head.writeUInt16LE(32, 12); // bits per pixel
  head.writeUInt32LE(png.length, 14); // image size
  head.writeUInt32LE(22, 18); // image offset
  return Buffer.concat([head, png]);
}

mkdirSync(`${ROOT}public`, { recursive: true });
mkdirSync(`${ROOT}src/assets/brand`, { recursive: true });

const json = (m: Mark) => JSON.stringify(m, null, 2) + '\n';
const wm = wordmark();
const id = ident();
writeFileSync(`${ROOT}src/assets/brand/wordmark.json`, json(wm));
writeFileSync(`${ROOT}src/assets/brand/ident.json`, json(id));
writeFileSync(`${ROOT}src/assets/brand/wordmark.svg`, markSvg(wm) + '\n');
writeFileSync(`${ROOT}public/favicon.svg`, iconSvg(64, true) + '\n');

const png = (svg: string) => sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toBuffer();
writeFileSync(`${ROOT}public/apple-touch-icon.png`, await png(iconSvg(180, false)));
writeFileSync(`${ROOT}public/favicon.ico`, ico(await png(iconSvg(32, true)), 32));
writeFileSync(
  `${ROOT}public/og.png`,
  await sharp(Buffer.from(ogSvg())).png({ compressionLevel: 9 }).toBuffer(),
);
console.log(
  'brand: wordmark.json, ident.json, wordmark.svg, favicon.svg, favicon.ico, apple-touch-icon.png, og.png',
);
