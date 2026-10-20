import { openSync, type Font } from 'fontkit';

const fonts = new Map<string, Font>();

function load(file: string): Font {
  let font = fonts.get(file);
  if (!font) {
    font = openSync(file) as Font;
    fonts.set(file, font);
  }
  return font;
}

export interface OutlineOptions {
  /** Path to a static TTF in scripts/art/fonts. */
  font: string;
  /** Font size in SVG user units. */
  size: number;
  /** Extra space between letters, in em (Prime's wordmark runs tight: about -0.03). */
  tracking?: number;
  /** Left edge and baseline of the text. */
  x?: number;
  y?: number;
}

export interface Outline {
  /** SVG path data for every glyph, already positioned. */
  d: string;
  /** Advance width of the whole run, including tracking. */
  width: number;
  /** Distance from the baseline to the top and bottom of the font's design box. */
  ascent: number;
  descent: number;
}

/**
 * Converts text to SVG outlines so artwork renders identically everywhere, including sharp's
 * SVG rasteriser, which can't see web fonts. One layout pass: O(glyphs).
 */
export function outlineText(text: string, options: OutlineOptions): Outline {
  const { size, tracking = 0, x = 0, y = 0 } = options;
  const font = load(options.font);
  const scale = size / font.unitsPerEm;
  const run = font.layout(text);
  let pen = x;
  const parts: string[] = [];
  run.glyphs.forEach((glyph, i) => {
    const pos = run.positions[i];
    const d = glyph.path
      .scale(scale, -scale)
      .translate(pen + pos.xOffset * scale, y - pos.yOffset * scale)
      .toSVG();
    if (d) parts.push(d);
    pen += pos.xAdvance * scale + (i < run.glyphs.length - 1 ? tracking * size : 0);
  });
  return {
    d: parts.join(''),
    width: pen - x,
    ascent: font.ascent * scale,
    descent: -font.descent * scale,
  };
}
