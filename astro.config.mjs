import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  site: 'https://casper.leons.dev',
  base: '/',
  markdown: {
    shikiConfig: {
      themes: {
        light: 'github-light',
        dark: 'github-dark',
      },
    },
  },
});
