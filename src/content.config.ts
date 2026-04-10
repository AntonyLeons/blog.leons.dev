import { defineCollection } from 'astro:content';
import { z } from 'astro:schema';
import { glob } from 'astro/loaders';

const postsCollection = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/posts" }),
  schema: z.object({
    layout: z.string().optional(),
    current: z.string().optional(),
    cover: z.string().optional(),
    navigation: z.boolean().optional(),
    title: z.string(),
    date: z.date(),
    tags: z.array(z.string()).optional(),
    class: z.string().optional(),
    subclass: z.string().optional(),
    author: z.string().optional(),
  })
});

export const collections = {
  'posts': postsCollection,
};
