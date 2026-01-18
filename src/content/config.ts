import { defineCollection, z } from 'astro:content';

const blog = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    author: z.string().default('Álvaro Torres Cogollo'),
    tags: z.array(z.string()).optional(),
    draft: z.boolean().default(false),
    image: z.object({
      url: z.string(),
      alt: z.string(),
    }).optional(),
  }),
});

const resume = defineCollection({
  type: 'content',
  schema: z.object({
    name: z.string(),
    title: z.string(),
    email: z.string().email(),
    phone: z.string().optional(),
    linkedin: z.string().url().optional(),
    github: z.string().url().optional(),
    pdf: z.string().optional(),
  }),
});

export const collections = { blog, resume };
