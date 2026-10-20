/**
 * Turns the HyperFrames renders into web files (task 1.3.3):
 *
 *   node scripts/trailers/finalize.ts
 *
 * For each trailer in media/trailers/renders/<slug>.mp4 it writes to public/trailers/:
 *   <slug>.mp4         H.264, faststart, no audio track
 *   <slug>.webm        VP9, no audio (Playwright's Chromium can't decode H.264)
 *   <slug>-poster.jpg  the title beat at 3.9 s, 1280x720
 *   <slug>.vtt         captions carrying the on-screen text, as a text alternative
 * and fails if any video is over 2 MB.
 */
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { captions } from './captions.ts';
import { TRAILER_TITLES } from './titles.ts';

const ROOT = new URL('../../', import.meta.url).pathname;
const RENDERS = `${ROOT}media/trailers/renders/`;
const OUT = `${ROOT}public/trailers/`;
const BUDGET = 2_000_000;
const ffmpeg = (args: string[]) =>
  execFileSync('ffmpeg', ['-v', 'error', '-y', ...args], { stdio: 'inherit' });

mkdirSync(OUT, { recursive: true });
const over: string[] = [];
for (const slug of TRAILER_TITLES) {
  const src = `${RENDERS}${slug}.mp4`;
  const vars = JSON.parse(readFileSync(`${ROOT}media/trailers/variables/${slug}.json`, 'utf8'));
  const { title } = JSON.parse(readFileSync(`${ROOT}src/content/titles/${slug}.json`, 'utf8'));
  ffmpeg([
    '-i',
    src,
    '-map',
    '0:v:0',
    '-c',
    'copy',
    '-an',
    '-movflags',
    '+faststart',
    `${OUT}${slug}.mp4`,
  ]);
  ffmpeg([
    '-i',
    src,
    '-map',
    '0:v:0',
    '-an',
    '-c:v',
    'libvpx-vp9',
    '-b:v',
    '0',
    '-crf',
    '36',
    '-row-mt',
    '1',
    '-deadline',
    'good',
    '-cpu-used',
    '2',
    '-pix_fmt',
    'yuv420p',
    `${OUT}${slug}.webm`,
  ]);
  ffmpeg([
    '-ss',
    '3.9',
    '-i',
    src,
    '-frames:v',
    '1',
    '-vf',
    'scale=1280:720',
    '-q:v',
    '3',
    `${OUT}${slug}-poster.jpg`,
  ]);
  writeFileSync(`${OUT}${slug}.vtt`, captions(title, vars));
  for (const ext of ['mp4', 'webm']) {
    const size = statSync(`${OUT}${slug}.${ext}`).size;
    console.log(`${slug}.${ext}: ${(size / 1e6).toFixed(2)} MB`);
    if (size > BUDGET) over.push(`${slug}.${ext}`);
  }
}
if (over.length) throw new Error(`Over the 2 MB budget: ${over.join(', ')}`);
