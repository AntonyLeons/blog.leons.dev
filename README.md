# Casper Astro ⚡

A modernized, high-performance port of Ghost's default theme [Casper 2.0](https://github.com/tryghost/casper) built on top of **Astro 5**.

This port replaces the original Jekyll setup (`jasper2`), offering incredibly fast builds, type-safe content validation, server-side pre-rendering, and client-side page load times.

## 🚀 Key Features

- **Astro 5 & TypeScript**: Full TypeScript configuration and strict schema validations.
- **Type-Safe Content Schema**: Powered by Astro Content Collections and Zod to validate posts, tags, and authors.
- **Modern Asset Pipeline**: Stylesheets are bundled, minified, and optimized via Vite out of the box.
- **Zero-Dependency Vanilla JS Interactivity**: Ported jQuery scripts (infinite scrolling, scroll progress bar, floating headers, and FitVids responsive videos) to clean, performant **Vanilla JS**.
- **100% SEO Compliance**: Automatic metadata, canonical URLs, Open Graph images, Twitter cards, and Schema.org JSON-LD data pre-rendered on the server.
- **Compliance Feeds**: Auto-generated Atom XML RSS feeds matching the original Jekyll feeds exactly (`/feed.xml`, `/tag/[tag]/feed.xml`, `/author/[author]/feed.xml`).
- **Disqus & Subscribe Forms**: Out-of-the-box toggleable Disqus comments and location-aware email newsletter subscription forms.

---

## 🛠️ Local Development

### 1. Installation
Install the project dependencies using `pnpm` (recommended) or `npm`:

```bash
pnpm install
# or
npm install
```

### 2. Development Server
Start the local hot-reloading development server:

```bash
pnpm run dev
# or
npm run dev
```

Your blog will be accessible locally at `http://localhost:4321/casper/` (matching the configured subpath).

### 3. Static Build
Compile the blog into optimized static HTML files:

```bash
pnpm run build
# or
npm run build
```

The output will be generated inside the `dist/` directory.

---

## 📂 Project Structure

- `src/content/posts/`: Contains all Markdown (`.md`) articles. Add new blog posts here.
- `src/data/authors.json`: Dictionary mapping author keys to profile data (avatar, bio, website, location, social links).
- `src/data/tags.json`: Dictionary mapping tags to custom descriptions and cover images.
- `src/layouts/`: Base design frames:
  - `Layout.astro`: Standard page shell containing head SEO elements, footers, and modal overlays.
  - `PostLayout.astro`: Article rendering frame with progress bars, Disqus integrations, and next/prev suggestions.
  - `PageLayout.astro`: Framework for static information pages (like `/about/`).
- `src/components/`: Sub-elements like navigation bars (`SiteNav.astro`), post preview feeds (`PostCard.astro`), or share dialogs (`FloatingHeader.astro`).
- `public/assets/images/`: Stores all static graphics, icons, avatars, and cover photos.

---

## 🌎 Deploying to GitHub Pages

A ready-to-use GitHub Actions workflow is included in `.github/workflows/deploy.yml`. 

To deploy:
1. Push your changes to the `main` branch.
2. In your GitHub repository settings, navigate to **Pages**.
3. Under **Build and deployment**, set the **Source** to **GitHub Actions**.
4. The workflow will automatically trigger, build the Astro application, and publish it directly to GitHub Pages.

---

## 📝 License

Distributed under the MIT License. Same license as original Casper theme by the Ghost Foundation.
