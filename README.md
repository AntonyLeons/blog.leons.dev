# Astro Migration

This repository has been migrated from Jekyll to Astro. The migration preserves the original Ghost "Casper" theme CSS and behavior while utilizing Astro's fast static generation.

## Project Structure

- `src/content/posts`: All markdown blog posts
- `src/pages`: Astro page routes (`index.astro`, `[slug].astro`)
- `src/layouts`: Astro layouts
- `public/assets`: Static assets, including the built CSS from the old Jekyll PostCSS pipeline
- `astro.config.mjs`: Astro configuration

## Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

## Deployment

The project is configured to deploy to Netlify automatically. The `netlify.toml` builds using `npm run build` and publishes the `dist` directory.

## Adding Content

To add a new post, create a markdown file in `src/content/posts`.

Example:
```markdown
---
title: My New Post
date: 2026-04-10 10:00:00
tags: [news]
cover: /assets/images/new-cover.jpg
---

Content goes here...
```
