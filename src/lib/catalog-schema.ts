import { z } from 'astro/zod';

const text = z.string().trim().min(1);
const slug = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use a lowercase-hyphenated slug');
/** Dates are only as precise as her resume: a year ("2023") or a month ("2025-08"). */
export const monthSchema = z
  .string()
  .regex(/^\d{4}(?:-(?:0[1-9]|1[0-2]))?$/, 'Use YYYY or YYYY-MM');

/** A claim shown on the site. The deploy build refuses figures Bhavini hasn't confirmed. */
export const figureSchema = z.object({
  value: text,
  label: text,
  source: text,
  verified: z.boolean(),
});

const episodeSchema = z.object({
  title: text,
  synopsis: text,
  /** Short chip in the episode's meta row, e.g. "$100K+". */
  meta: text,
});

const creditSchema = z.object({ title: text, synopsis: text });

/** A role (series) or a qualification (film). Every fact must come from her resume. */
export const titleSchema = z.object({
  kind: z.enum(['series', 'film']),
  order: z.number().int().positive(),
  title: text,
  role: text,
  organization: text,
  location: text,
  start: monthSchema,
  /** null while the role is ongoing. */
  end: monthSchema.nullable(),
  ribbon: z.string().regex(/^[A-Z0-9][A-Z0-9 &+-]*$/, 'Ribbons are short uppercase labels'),
  tagline: text,
  /** The mint status line under the title art. */
  status: text,
  synopsis: text.max(320, 'Keep synopses to three lines (320 characters)'),
  genres: z.array(slug),
  figures: z.array(text),
  season: z.number().int().positive().optional(),
  episodes: z.array(episodeSchema).optional(),
  credits: z.array(creditSchema).optional(),
});

export const skillSchema = z.object({
  name: text,
  order: z.number().int().positive(),
  /** Colour of the soft glow on the category tile. */
  glow: z.string().regex(/^#[0-9a-f]{6}$/i),
  items: z.array(text).min(1),
});

export const certificationSchema = z.object({
  name: text,
  issuer: text,
  date: monthSchema,
  skills: z.array(slug),
});

export const guideSchema = z.object({
  tracks: z.array(z.object({ id: slug, name: text })).min(1),
  entries: z.array(
    z.object({
      track: slug,
      label: text,
      start: monthSchema,
      end: monthSchema.nullable(),
      title: slug.optional(),
    }),
  ),
});

/** Astro's file loader sorts entries by id, so rows carry their position on the page. */
const order = z.number().int().positive();

export const rowSchema = z.discriminatedUnion('kind', [
  /** The super-carousel at the top of the home page. */
  z.object({ kind: z.literal('hero'), order, title: text, items: z.array(slug).min(1) }),
  z.object({ kind: z.literal('continue'), order, title: text, items: z.array(slug).min(1) }),
  z.object({ kind: z.literal('top10'), order, title: text, figures: z.array(text) }),
  z.object({ kind: z.literal('titles'), order, title: text, items: z.array(slug).min(1) }),
  z.object({ kind: z.literal('certifications'), order, title: text }),
  z.object({ kind: z.literal('skills'), order, title: text }),
]);

export type Figure = z.infer<typeof figureSchema>;
export type Title = z.infer<typeof titleSchema>;
export type Skill = z.infer<typeof skillSchema>;
export type Certification = z.infer<typeof certificationSchema>;
export type Guide = z.infer<typeof guideSchema>;
export type Row = z.infer<typeof rowSchema>;
