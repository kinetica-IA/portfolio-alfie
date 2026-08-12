import { defineCollection, z } from 'astro:content'
import { glob } from 'astro/loaders'

const informes = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/informes' }),
  schema: z.object({
    title: z.string(),
    slug: z.string(),
    summary: z.string().max(200),
    pubmed_refs: z.array(z.object({ doi: z.string(), title: z.string() })).default([]),
    patient_register: z.boolean().default(true),
    date: z.date(),
  }),
})

const lab = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/lab' }),
  schema: z.object({
    title: z.string(),
    slug: z.string(),
    summary: z.string().max(200),
    kind: z.enum(['n-of-1', 'essay', 'coursera-derived']),
    date: z.date(),
  }),
})

const pages = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/pages' }),
  schema: z.object({
    title: z.string(),
    summary: z.string().max(200).optional(),
  }),
})

export const collections = { informes, lab, pages }
