import type { Lockup } from './lockup';
import type { Rng } from './prng';

/**
 * Builds the SVG for every piece of key art (decision Q6: designed art generated in code, with
 * photo slots). Everything here is pure string building, so it's deterministic and unit-tested;
 * scripts/art/build.ts rasterises the result with sharp.
 */

export interface Palette {
  /** Near-black base, tinted toward the title's hue. */
  bg: string;
  /** Three light colours, strongest first. */
  glows: [string, string, string];
  /** Line and dot colour for motifs. */
  accent: string;
}

export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

export type MotifKind =
  | 'rising-line'
  | 'routes'
  | 'ripples'
  | 'clusters'
  | 'arches'
  | 'steps'
  | 'funnel'
  | 'bars'
  | 'spotlight'
  | 'tickets'
  | 'globe'
  | 'units'
  | 'pages'
  | 'mirror'
  | 'checklist'
  | 'leaves'
  | 'badge';

const r = (n: number) => Math.round(n * 10) / 10;

let uid = 0;
/** Unique ids for gradients within one document. Reset per document by svgDocument. */
function id(prefix: string): string {
  uid += 1;
  return `${prefix}${uid}`;
}

/** A soft radial light: an ellipse filled with an eased gradient that fades to nothing. */
export function glow(
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  color: string,
  opacity: number,
): string {
  const g = id('g');
  const stops = [
    [0, 1],
    [0.25, 0.82],
    [0.5, 0.5],
    [0.72, 0.22],
    [0.88, 0.07],
    [1, 0],
  ]
    .map(
      ([o, a]) =>
        `<stop offset="${o}" stop-color="${color}" stop-opacity="${r(a * opacity * 100) / 100}"/>`,
    )
    .join('');
  return (
    `<defs><radialGradient id="${g}">${stops}</radialGradient></defs>` +
    `<ellipse cx="${r(cx)}" cy="${r(cy)}" rx="${r(rx)}" ry="${r(ry)}" fill="url(#${g})"/>`
  );
}

/** Three overlapping lights weighted to the right two-thirds, where Prime's key art sits. */
export function lightField(p: Palette, w: number, h: number, rand: Rng): string {
  const [a, b, c] = p.glows;
  return (
    `<rect width="${w}" height="${h}" fill="${p.bg}"/>` +
    glow(w * rand.range(0.62, 0.78), h * rand.range(0.3, 0.45), w * 0.42, h * 0.62, a, 0.85) +
    glow(w * rand.range(0.45, 0.6), h * rand.range(0.7, 0.85), w * 0.34, h * 0.45, b, 0.55) +
    glow(w * rand.range(0.85, 0.98), h * rand.range(0.05, 0.25), w * 0.28, h * 0.4, c, 0.45)
  );
}

/** Darkens the edges so motifs fall off like a lit set. */
export function vignette(w: number, h: number, strength = 0.75): string {
  const g = id('v');
  return (
    `<defs><radialGradient id="${g}" cx="0.62" cy="0.45" r="0.85">` +
    `<stop offset="0.45" stop-color="#00050d" stop-opacity="0"/>` +
    `<stop offset="1" stop-color="#00050d" stop-opacity="${strength}"/></radialGradient></defs>` +
    `<rect width="${w}" height="${h}" fill="url(#${g})"/>`
  );
}

/** Dark wash from the left edge so a title treatment stays legible over any art. */
export function leftScrim(w: number, h: number, reach = 0.6): string {
  const g = id('s');
  return (
    `<defs><linearGradient id="${g}" x1="0" x2="1">` +
    `<stop offset="0" stop-color="#00050d" stop-opacity="0.92"/>` +
    `<stop offset="${reach * 0.55}" stop-color="#00050d" stop-opacity="0.6"/>` +
    `<stop offset="${reach}" stop-color="#00050d" stop-opacity="0"/></linearGradient></defs>` +
    `<rect width="${w}" height="${h}" fill="url(#${g})"/>`
  );
}

/** A photo filling the frame (slice), graded toward the palette so it sits with the other art. */
export function photoLayer(href: string, w: number, h: number, p: Palette): string {
  return (
    `<rect width="${w}" height="${h}" fill="${p.bg}"/>` +
    `<image href="${href}" x="0" y="0" width="${w}" height="${h}" preserveAspectRatio="xMidYMid slice"/>` +
    `<rect width="${w}" height="${h}" fill="${p.glows[0]}" opacity="0.14"/>` +
    leftScrim(w, h, 0.75)
  );
}

function dot(x: number, y: number, rad: number, fill: string, opacity = 1): string {
  return `<circle cx="${r(x)}" cy="${r(y)}" r="${r(rad)}" fill="${fill}" opacity="${opacity}"/>`;
}

/** A dot with a soft halo, for highlighted data points. */
function beacon(x: number, y: number, rad: number, color: string): string {
  return glow(x, y, rad * 5, rad * 5, color, 0.55) + dot(x, y, rad, '#ffffff');
}

function stroke(d: string, color: string, width: number, opacity = 1, extra = ''): string {
  return `<path d="${d}" fill="none" stroke="${color}" stroke-width="${r(width)}" stroke-opacity="${opacity}" stroke-linecap="round" stroke-linejoin="round"${extra}/>`;
}

/** The motif library. Each draws inside `b`, scaled to its size, using the palette's accent. */
export function motif(kind: MotifKind, b: Box, p: Palette, rand: Rng): string {
  const u = Math.min(b.w, b.h) / 100;
  const { accent } = p;
  const parts: string[] = [];

  switch (kind) {
    case 'rising-line': {
      // Seven sales on a rising trend, with faint grid lines behind.
      for (let i = 1; i <= 4; i++) {
        const y = b.y + (b.h * i) / 5;
        parts.push(stroke(`M${r(b.x)} ${r(y)}H${r(b.x + b.w)}`, accent, u * 0.25, 0.18));
      }
      const pts: [number, number][] = [];
      for (let i = 0; i <= 7; i++) {
        const t = i / 7;
        const x = b.x + b.w * (0.04 + 0.92 * t);
        const y = b.y + b.h * (0.86 - 0.7 * t ** 1.35 + rand.range(-0.04, 0.04));
        pts.push([x, y]);
      }
      const d = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${r(x)} ${r(y)}`).join('');
      parts.push(stroke(d, accent, u * 4, 0.18), stroke(d, accent, u * 1.1, 0.95));
      pts.slice(1).forEach(([x, y]) => parts.push(beacon(x, y, u * 1.3, accent)));
      break;
    }
    case 'routes': {
      // Dispatch from one origin to five regions, over a block-print band.
      const ox = b.x + b.w * 0.08;
      const oy = b.y + b.h * 0.62;
      for (let row = 0; row < 3; row++) {
        for (let col = 0; col < 14; col++) {
          const x = b.x + (col + (row % 2) * 0.5) * (b.w / 13);
          const y = b.y + b.h * (0.86 + row * 0.06);
          const s = u * 1.6;
          parts.push(
            `<path d="M${r(x)} ${r(y - s)}L${r(x + s)} ${r(y)}L${r(x)} ${r(y + s)}L${r(x - s)} ${r(y)}Z" fill="${accent}" opacity="0.16"/>`,
          );
        }
      }
      for (let i = 0; i < 5; i++) {
        const tx = b.x + b.w * rand.range(0.55, 0.95);
        const ty = b.y + b.h * (0.1 + i * 0.15 + rand.range(-0.03, 0.03));
        const mx = (ox + tx) / 2;
        const my = Math.min(oy, ty) - b.h * rand.range(0.15, 0.3);
        parts.push(
          stroke(
            `M${r(ox)} ${r(oy)}Q${r(mx)} ${r(my)} ${r(tx)} ${r(ty)}`,
            accent,
            u * 0.7,
            0.85,
            ` stroke-dasharray="${r(u * 2.2)} ${r(u * 1.6)}"`,
          ),
          beacon(tx, ty, u * 1.2, accent),
        );
      }
      parts.push(beacon(ox, oy, u * 1.8, accent));
      break;
    }
    case 'ripples': {
      const cx = b.x + b.w * 0.6;
      const cy = b.y + b.h * 0.5;
      for (let i = 1; i <= 20; i++) {
        parts.push(
          `<circle cx="${r(cx)}" cy="${r(cy)}" r="${r(u * 2.6 * i)}" fill="none" stroke="${accent}" stroke-width="${r(u * 0.35)}" stroke-opacity="${r((1 - i / 22) * 0.6 * 100) / 100}"/>`,
        );
      }
      const wave = Array.from({ length: 41 }, (_, i) => {
        const x = b.x + (b.w * i) / 40;
        const y = cy + Math.sin(i / 3.2) * u * 9 * Math.exp(-(((i - 24) / 14) ** 2));
        return `${i ? 'L' : 'M'}${r(x)} ${r(y)}`;
      }).join('');
      parts.push(stroke(wave, '#ffffff', u * 0.8, 0.7));
      break;
    }
    case 'clusters': {
      // Five clean-up drives, each a cluster of 20-30 volunteers.
      for (let c = 0; c < 5; c++) {
        const cx = b.x + b.w * (0.12 + c * 0.19) + rand.range(-u * 3, u * 3);
        const cy = b.y + b.h * (0.35 + (c % 2) * 0.3) + rand.range(-u * 4, u * 4);
        const n = rand.int(20, 30);
        for (let i = 0; i < n; i++) {
          parts.push(
            dot(
              cx + rand.normal() * u * 4.5,
              cy + rand.normal() * u * 4.5,
              u * rand.range(0.5, 1.1),
              accent,
              rand.range(0.45, 0.95),
            ),
          );
        }
        parts.push(glow(cx, cy, u * 14, u * 14, accent, 0.25));
      }
      break;
    }
    case 'arches': {
      // A receding colonnade, in gold line.
      for (let i = 0; i < 6; i++) {
        const s = 1 - i * 0.12;
        const aw = b.w * 0.15 * s;
        const ah = b.h * 0.8 * s;
        const x = b.x + b.w * 0.05 + i * b.w * 0.16;
        const yb = b.y + b.h * 0.92 - i * b.h * 0.02;
        const d = `M${r(x)} ${r(yb)}V${r(yb - ah + aw / 2)}A${r(aw / 2)} ${r(aw / 2)} 0 0 1 ${r(x + aw)} ${r(yb - ah + aw / 2)}V${r(yb)}`;
        parts.push(stroke(d, accent, u * 0.7, 0.85 - i * 0.1));
      }
      for (let i = 0; i < 40; i++) {
        parts.push(
          dot(
            b.x + rand.range(0, b.w),
            b.y + rand.range(0, b.h * 0.5),
            u * rand.range(0.15, 0.45),
            '#ffffff',
            rand.range(0.3, 0.9),
          ),
        );
      }
      break;
    }
    case 'steps': {
      for (let i = 0; i < 6; i++) {
        const sw = b.w / 7;
        const sh = b.h * 0.12 * (i + 1);
        const x = b.x + i * sw * 1.05;
        const y = b.y + b.h * 0.9 - sh;
        parts.push(
          `<rect x="${r(x)}" y="${r(y)}" width="${r(sw)}" height="${r(sh)}" rx="${r(u)}" fill="${accent}" opacity="${r((0.12 + i * 0.07) * 100) / 100}"/>`,
        );
      }
      parts.push(
        beacon(
          b.x + 5.5 * (b.w / 7) * 1.05 + b.w / 14,
          b.y + b.h * 0.9 - b.h * 0.72 - u * 4,
          u * 1.6,
          accent,
        ),
      );
      break;
    }
    case 'funnel': {
      // Leads entering the pipeline at the top and leaving qualified at the bottom.
      const cx = b.x + b.w / 2;
      for (let i = 0; i < 4; i++) {
        const top = b.y + b.h * (0.18 + i * 0.17);
        const wTop = b.w * (0.7 - i * 0.15);
        const wBot = b.w * (0.7 - (i + 1) * 0.15);
        const bot = top + b.h * 0.14;
        parts.push(
          `<path d="M${r(cx - wTop / 2)} ${r(top)}H${r(cx + wTop / 2)}L${r(cx + wBot / 2)} ${r(bot)}H${r(cx - wBot / 2)}Z" fill="${accent}" opacity="${r((0.2 + i * 0.15) * 100) / 100}"/>`,
        );
      }
      for (let i = 0; i < 16; i++)
        parts.push(
          dot(
            cx + rand.range(-b.w * 0.33, b.w * 0.33),
            b.y + rand.range(0, b.h * 0.14),
            u * 0.9,
            '#ffffff',
            0.8,
          ),
        );
      parts.push(beacon(cx, b.y + b.h * 0.92, u * 2, accent));
      break;
    }
    case 'bars': {
      for (let i = 0; i < 7; i++) {
        const bw = b.w / 10;
        const bh = b.h * (0.18 + i * 0.11);
        const x = b.x + b.w * 0.08 + i * bw * 1.3;
        parts.push(
          `<rect x="${r(x)}" y="${r(b.y + b.h * 0.92 - bh)}" width="${r(bw)}" height="${r(bh)}" rx="${r(u * 1.2)}" fill="${accent}" opacity="${r((0.35 + i * 0.09) * 100) / 100}"/>`,
        );
      }
      break;
    }
    case 'spotlight': {
      const cx = b.x + b.w * 0.55;
      parts.push(
        `<path d="M${r(cx - b.w * 0.06)} ${r(b.y)}H${r(cx + b.w * 0.06)}L${r(cx + b.w * 0.34)} ${r(b.y + b.h)}H${r(cx - b.w * 0.34)}Z" fill="#ffffff" opacity="0.08"/>`,
        `<rect x="${r(cx - b.w * 0.2)}" y="${r(b.y + b.h * 0.3)}" width="${r(b.w * 0.4)}" height="${r(b.h * 0.5)}" rx="${r(u * 3)}" fill="none" stroke="${accent}" stroke-width="${r(u * 0.8)}"/>`,
        dot(cx, b.y + b.h * 0.5, u * 7, accent, 0.9),
        `<path d="M${r(cx - u * 13)} ${r(b.y + b.h * 0.8)}A${r(u * 13)} ${r(u * 11)} 0 0 1 ${r(cx + u * 13)} ${r(b.y + b.h * 0.8)}Z" fill="${accent}" opacity="0.9"/>`,
      );
      break;
    }
    case 'tickets': {
      for (let i = 0; i < 5; i++) {
        const tw = b.w * 0.5;
        const th = b.h * 0.2;
        const x = b.x + b.w * 0.22 + i * u * 2.5;
        const y = b.y + b.h * 0.62 - i * th * 0.55;
        parts.push(
          `<rect x="${r(x)}" y="${r(y)}" width="${r(tw)}" height="${r(th)}" rx="${r(u * 2)}" fill="${i === 4 ? accent : '#ffffff'}" opacity="${i === 4 ? 0.95 : 0.12 + i * 0.05}" transform="rotate(${r(-6 + i * 2.5)} ${r(x + tw / 2)} ${r(y + th / 2)})"/>`,
        );
      }
      const cx = b.x + b.w * 0.47 + 10 * u;
      const cy = b.y + b.h * 0.62 - 4 * b.h * 0.2 * 0.55 + b.h * 0.1;
      parts.push(
        stroke(
          `M${r(cx - u * 4)} ${r(cy)}l${r(u * 3)} ${r(u * 3)}l${r(u * 6)} ${r(-u * 6)}`,
          '#00050d',
          u * 1.6,
        ),
      );
      break;
    }
    case 'globe': {
      const cx = b.x + b.w * 0.55;
      const cy = b.y + b.h * 0.5;
      const R = Math.min(b.w, b.h) * 0.4;
      parts.push(
        `<circle cx="${r(cx)}" cy="${r(cy)}" r="${r(R)}" fill="none" stroke="${accent}" stroke-width="${r(u * 0.6)}" opacity="0.8"/>`,
      );
      for (let i = 1; i <= 3; i++) {
        parts.push(
          `<ellipse cx="${r(cx)}" cy="${r(cy)}" rx="${r((R * i) / 4)}" ry="${r(R)}" fill="none" stroke="${accent}" stroke-width="${r(u * 0.35)}" opacity="0.5"/>`,
        );
        parts.push(
          `<ellipse cx="${r(cx)}" cy="${r(cy)}" rx="${r(R)}" ry="${r((R * i) / 4)}" fill="none" stroke="${accent}" stroke-width="${r(u * 0.35)}" opacity="0.35"/>`,
        );
      }
      for (let i = 0; i < 5; i++) {
        const a = rand.range(0, Math.PI * 2);
        parts.push(
          beacon(cx + Math.cos(a) * R * 0.75, cy + Math.sin(a) * R * 0.6, u * 1.1, accent),
        );
      }
      break;
    }
    case 'units': {
      // A hundred units a month: a 10x10 grid, a few highlighted.
      const cell = Math.min(b.w, b.h) * 0.075;
      const ox = b.x + b.w / 2 - cell * 5;
      const oy = b.y + b.h / 2 - cell * 5;
      for (let i = 0; i < 100; i++) {
        const on = rand.next() < 0.18;
        parts.push(
          `<rect x="${r(ox + (i % 10) * cell)}" y="${r(oy + Math.floor(i / 10) * cell)}" width="${r(cell * 0.78)}" height="${r(cell * 0.78)}" rx="${r(cell * 0.12)}" fill="${on ? accent : '#ffffff'}" opacity="${on ? 0.95 : 0.14}"/>`,
        );
      }
      break;
    }
    case 'pages': {
      for (let i = 0; i < 4; i++) {
        const pw = b.w * 0.34;
        const ph = b.h * 0.7;
        const x = b.x + b.w * 0.2 + i * u * 7;
        const y = b.y + b.h * 0.12 + i * u * 3;
        parts.push(
          `<rect x="${r(x)}" y="${r(y)}" width="${r(pw)}" height="${r(ph)}" rx="${r(u * 1.5)}" fill="#ffffff" opacity="${r((0.08 + i * 0.07) * 100) / 100}"/>`,
        );
        if (i === 3) {
          for (let l = 0; l < 7; l++) {
            const lw = pw * (l === 0 ? 0.5 : rand.range(0.55, 0.8));
            parts.push(
              `<rect x="${r(x + pw * 0.1)}" y="${r(y + ph * (0.12 + l * 0.11))}" width="${r(lw)}" height="${r(u * 1.2)}" rx="${r(u * 0.6)}" fill="${accent}" opacity="${l === 0 ? 0.95 : 0.55}"/>`,
            );
          }
        }
      }
      break;
    }
    case 'mirror': {
      const cy = b.y + b.h * 0.5;
      const R = Math.min(b.w, b.h) * 0.28;
      parts.push(
        `<circle cx="${r(b.x + b.w * 0.42)}" cy="${r(cy)}" r="${r(R)}" fill="${accent}" opacity="0.32"/>`,
        `<circle cx="${r(b.x + b.w * 0.62)}" cy="${r(cy)}" r="${r(R)}" fill="none" stroke="#ffffff" stroke-width="${r(u * 0.7)}" opacity="0.8"/>`,
        stroke(
          `M${r(b.x + b.w * 0.52)} ${r(b.y + b.h * 0.08)}V${r(b.y + b.h * 0.92)}`,
          '#ffffff',
          u * 0.4,
          0.35,
          ` stroke-dasharray="${r(u * 2)} ${r(u * 2)}"`,
        ),
      );
      break;
    }
    case 'checklist': {
      const x = b.x + b.w * 0.3;
      for (let l = 0; l < 6; l++) {
        const y = b.y + b.h * (0.16 + l * 0.13);
        const done = l < 4;
        parts.push(
          `<rect x="${r(x)}" y="${r(y - u * 2.4)}" width="${r(u * 4.8)}" height="${r(u * 4.8)}" rx="${r(u)}" fill="${done ? accent : 'none'}" stroke="${accent}" stroke-width="${r(u * 0.5)}"/>`,
          `<rect x="${r(x + u * 8)}" y="${r(y - u * 0.7)}" width="${r(b.w * rand.range(0.25, 0.4))}" height="${r(u * 1.4)}" rx="${r(u * 0.7)}" fill="#ffffff" opacity="${done ? 0.7 : 0.25}"/>`,
        );
        if (done)
          parts.push(
            stroke(
              `M${r(x + u * 1.1)} ${r(y)}l${r(u * 1.2)} ${r(u * 1.2)}l${r(u * 2.4)} ${r(-u * 2.4)}`,
              '#00050d',
              u * 0.7,
            ),
          );
      }
      break;
    }
    case 'leaves': {
      for (let i = 0; i < 9; i++) {
        const cx = b.x + b.w * rand.range(0.2, 0.85);
        const cy = b.y + b.h * rand.range(0.2, 0.8);
        const s = u * rand.range(5, 11);
        parts.push(
          `<path d="M${r(cx)} ${r(cy - s)}Q${r(cx + s)} ${r(cy)} ${r(cx)} ${r(cy + s)}Q${r(cx - s)} ${r(cy)} ${r(cx)} ${r(cy - s)}Z" fill="${accent}" opacity="${r(rand.range(0.35, 0.9) * 100) / 100}" transform="rotate(${r(rand.range(-50, 50))} ${r(cx)} ${r(cy)})"/>`,
        );
      }
      break;
    }
    case 'badge': {
      const cx = b.x + b.w * 0.6;
      const cy = b.y + b.h * 0.45;
      const R = Math.min(b.w, b.h) * 0.32;
      const star = Array.from({ length: 24 }, (_, i) => {
        const a = (i / 24) * Math.PI * 2;
        const rr = i % 2 ? R * 0.9 : R;
        return `${i ? 'L' : 'M'}${r(cx + Math.cos(a) * rr)} ${r(cy + Math.sin(a) * rr)}`;
      }).join('');
      parts.push(
        `<path d="${star}Z" fill="${accent}" opacity="0.28"/>`,
        `<circle cx="${r(cx)}" cy="${r(cy)}" r="${r(R * 0.68)}" fill="none" stroke="#ffffff" stroke-width="${r(u * 0.6)}" opacity="0.75"/>`,
        stroke(
          `M${r(cx - R * 0.25)} ${r(cy)}l${r(R * 0.17)} ${r(R * 0.17)}l${r(R * 0.33)} ${r(-R * 0.33)}`,
          '#ffffff',
          u * 1.2,
          0.95,
        ),
      );
      break;
    }
  }
  return `<g>${parts.join('')}</g>`;
}

/** Places a title lockup inside a box, scaled to fit its width or height, vertically centred. */
export function placeLockup(lockup: Lockup, box: Box): string {
  const scale = Math.min(box.w / lockup.width, box.h / lockup.height);
  const y = box.y + (box.h - lockup.height * scale) / 2;
  return (
    `<g transform="translate(${r(box.x)} ${r(y)}) scale(${Math.round(scale * 10000) / 10000})">` +
    lockup.paths.map((p) => `<path d="${p.d}" fill="${p.fill}"/>`).join('') +
    `</g>`
  );
}

export function svgDocument(w: number, h: number, body: string): string {
  uid = 0;
  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${body}</svg>`;
}

export interface ArtSpec {
  palette: Palette;
  motif: MotifKind;
  /** Data URI of a photo for this title, which replaces the light field. */
  photo?: string;
}

/** Full-bleed key art for the hero and detail page: no title, weighted right, dark left. */
export function composeKey(spec: ArtSpec, rand: Rng, w = 2560, h = 1440): string {
  uid = 0;
  const base = spec.photo
    ? photoLayer(spec.photo, w, h, spec.palette)
    : lightField(spec.palette, w, h, rand);
  const art = spec.photo
    ? ''
    : motif(spec.motif, { x: w * 0.48, y: h * 0.16, w: w * 0.44, h: h * 0.62 }, spec.palette, rand);
  return svgDocument(w, h, base + art + vignette(w, h) + leftScrim(w, h, 0.45));
}

/** A 16:9 row card: the key art with the title treatment baked in, as on Prime's cards. */
export function composeCard(spec: ArtSpec, lockup: Lockup, rand: Rng, w = 1280, h = 720): string {
  uid = 0;
  const base = spec.photo
    ? photoLayer(spec.photo, w, h, spec.palette)
    : lightField(spec.palette, w, h, rand);
  // Title on the left 46%, motif on the right 40%, so the two never overlap.
  const art = spec.photo
    ? ''
    : motif(spec.motif, { x: w * 0.55, y: h * 0.14, w: w * 0.4, h: h * 0.66 }, spec.palette, rand);
  const title = placeLockup(lockup, { x: w * 0.07, y: h * 0.2, w: w * 0.46, h: h * 0.6 });
  return svgDocument(w, h, base + art + vignette(w, h, 0.6) + leftScrim(w, h, 0.62) + title);
}

/** An episode still: the title's light with this episode's motif, no text. */
export function composeStill(spec: ArtSpec, rand: Rng, w = 960, h = 540): string {
  uid = 0;
  const base = lightField(spec.palette, w, h, rand);
  const art = motif(
    spec.motif,
    { x: w * 0.2, y: h * 0.12, w: w * 0.62, h: h * 0.76 },
    spec.palette,
    rand,
  );
  return svgDocument(w, h, base + art + vignette(w, h, 0.7));
}
