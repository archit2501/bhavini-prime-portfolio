import { defineCollection } from 'astro:content';
import { file, glob } from 'astro/loaders';
import {
  certificationSchema,
  figureSchema,
  guideSchema,
  rowSchema,
  skillSchema,
  titleSchema,
} from './lib/catalog-schema';

export const collections = {
  figures: defineCollection({ loader: file('src/content/figures.json'), schema: figureSchema }),
  titles: defineCollection({
    loader: glob({ pattern: '*.json', base: 'src/content/titles' }),
    schema: titleSchema,
  }),
  skills: defineCollection({ loader: file('src/content/skills.json'), schema: skillSchema }),
  certifications: defineCollection({
    loader: file('src/content/certifications.json'),
    schema: certificationSchema,
  }),
  guide: defineCollection({ loader: file('src/content/timeline.json'), schema: guideSchema }),
  rows: defineCollection({ loader: file('src/content/rows.json'), schema: rowSchema }),
};
