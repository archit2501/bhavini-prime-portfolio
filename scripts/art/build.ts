/**
 * Renders every piece of key art (task 1.3.2):
 *
 *   node scripts/art/build.ts        (runs before `astro dev` and `astro build`)
 *
 * For each title: key.jpg (2560x1440, hero and detail page), card.jpg (1280x720, title baked in),
 * still-N.jpg (960x540, one per episode) and logo.json (the title lettering as SVG paths for
 * the hero overlay). Certifications get a card and a logo. Output goes to
 * src/assets/art/generated/ (gitignored); Astro turns it into AVIF/WebP at build.
 *
 * A photo dropped at src/assets/photos/<slug>.jpg|png|webp replaces the abstract light field of
 * that title's key art and card, with no layout changes. Unchanged art is skipped (content hash).
 */
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import sharp from 'sharp';
import { composeCard, composeKey, composeStill, type ArtSpec } from '../../src/lib/art/compose.ts';
import { buildLockup } from '../../src/lib/art/lockup.ts';
import { rng, seedFrom } from '../../src/lib/art/prng.ts';
import { CERTIFICATIONS, TITLES, type Direction } from './direction.ts';

const ROOT = new URL('../../', import.meta.url).pathname;
const FONTS = `${ROOT}scripts/art/fonts/`;
const OUT = `${ROOT}src/assets/art/generated/`;
const PHOTOS = `${ROOT}src/assets/photos/`;
/** Bump to force a full re-render after changing the renderer itself. */
const VERSION = 1;

const manifestPath = `${OUT}manifest.json`;
const manifest: Record<string, string> = existsSync(manifestPath)
  ? JSON.parse(readFileSync(manifestPath, 'utf8'))
  : {};
let rendered = 0;
let skipped = 0;

/** Film grain: deterministic grey noise at about 5% opacity, laid over the whole frame. */
function grain(w: number, h: number, seed: number): Buffer {
  const rand = rng(seed);
  const px = Buffer.alloc(w * h * 4);
  for (let i = 0; i < w * h; i++) {
    const v = Math.floor(rand.next() * 255);
    px[i * 4] = v;
    px[i * 4 + 1] = v;
    px[i * 4 + 2] = v;
    px[i * 4 + 3] = 13;
  }
  return px;
}

async function render(file: string, svg: string, w: number, h: number, quality: number) {
  const hash = createHash('sha256')
    .update(`${VERSION}:${quality}:${svg}`)
    .digest('hex')
    .slice(0, 16);
  const key = file.slice(OUT.length);
  if (manifest[key] === hash && existsSync(file)) {
    skipped += 1;
    return;
  }
  await sharp(Buffer.from(svg))
    .composite([{ input: grain(w, h, seedFrom(key)), raw: { width: w, height: h, channels: 4 } }])
    .jpeg({ quality, mozjpeg: true, chromaSubsampling: '4:4:4' })
    .toFile(file);
  manifest[key] = hash;
  rendered += 1;
}

async function photoFor(slug: string): Promise<string | undefined> {
  if (!existsSync(PHOTOS)) return undefined;
  const name = readdirSync(PHOTOS).find((f) => f.replace(/\.(jpe?g|png|webp)$/i, '') === slug);
  if (!name) return undefined;
  const jpeg = await sharp(`${PHOTOS}${name}`)
    .resize(2560, 1440, { fit: 'cover' })
    .jpeg({ quality: 90 })
    .toBuffer();
  return `data:image/jpeg;base64,${jpeg.toString('base64')}`;
}

async function title(slug: string, d: Direction, episodes: number) {
  const dir = `${OUT}${slug}/`;
  mkdirSync(dir, { recursive: true });
  const lockup = buildLockup(d.lockup, FONTS);
  writeFileSync(`${dir}logo.json`, JSON.stringify(lockup) + '\n');
  const spec: ArtSpec = { palette: d.palette, motif: d.motif, photo: await photoFor(slug) };
  await render(`${dir}key.jpg`, composeKey(spec, rng(seedFrom(`${slug}:key`))), 2560, 1440, 82);
  await render(
    `${dir}card.jpg`,
    composeCard(spec, lockup, rng(seedFrom(`${slug}:card`))),
    1280,
    720,
    86,
  );
  for (let i = 0; i < episodes; i++) {
    const still: ArtSpec = { palette: d.palette, motif: d.episodes?.[i] ?? d.motif };
    await render(
      `${dir}still-${i + 1}.jpg`,
      composeStill(still, rng(seedFrom(`${slug}:still:${i}`))),
      960,
      540,
      86,
    );
  }
}

const started = Date.now();
mkdirSync(OUT, { recursive: true });
const titleFiles = readdirSync(`${ROOT}src/content/titles`).filter((f) => f.endsWith('.json'));
for (const file of titleFiles) {
  const slug = file.replace(/\.json$/, '');
  const data = JSON.parse(readFileSync(`${ROOT}src/content/titles/${file}`, 'utf8'));
  const direction = TITLES[slug];
  if (!direction)
    throw new Error(`scripts/art/direction.ts has no art direction for title "${slug}"`);
  const episodes = data.episodes?.length ?? 0;
  if (episodes && direction.episodes?.length !== episodes) {
    throw new Error(
      `"${slug}" has ${episodes} episodes but ${direction.episodes?.length ?? 0} episode motifs`,
    );
  }
  await title(slug, direction, episodes);
}
const certs = JSON.parse(readFileSync(`${ROOT}src/content/certifications.json`, 'utf8'));
for (const slug of Object.keys(certs)) {
  const direction = CERTIFICATIONS[slug];
  if (!direction)
    throw new Error(`scripts/art/direction.ts has no art direction for certification "${slug}"`);
  await title(slug, direction, 0);
}
writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
console.log(`art: ${rendered} rendered, ${skipped} unchanged (${Date.now() - started} ms)`);
