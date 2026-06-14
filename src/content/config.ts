import { defineCollection, z } from 'astro:content';

const posts = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    cover: z.string().optional().nullable(),
    date: z.union([z.date(), z.string()]),
    tags: z.preprocess(
      (val) => {
        if (!val) return [];
        if (typeof val === 'string') return [val];
        if (Array.isArray(val)) return val;
        return [];
      },
      z.array(z.string())
    ).default([]),
    class: z.string().optional(),
    subclass: z.string().optional(),
    author: z.string(),
    current: z.string().optional(),
    navigation: z.union([z.boolean(), z.string()]).optional(),
    layout: z.string().optional(),
    disqus: z.boolean().optional(),
  }),
});

export const collections = {
  posts,
};
