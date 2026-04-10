# blog.leons.dev [![Netlify Status](https://api.netlify.com/api/v1/badges/67a915e4-f7f0-48d2-8922-66dec46a72ad/deploy-status)](https://app.netlify.com/sites/blog-leons/deploys)

My personal blog built with [Jekyll](https://jekyllrb.com/).

## 🚀 Quick Start

This project is a pure Ruby/Jekyll stack. **No Node.js or NPM is required!** Styles are compiled using Jekyll's native SCSS support.

### Prerequisites

- [Ruby](https://www.ruby-lang.org/en/documentation/installation/) (Check your version with `ruby -v`)
- [Bundler](https://bundler.io/) (Install with `gem install bundler`)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/AntonyLeons/blog.leons.dev.git
   cd blog.leons.dev
   ```

2. Install the required Ruby gems:
   ```bash
   bundle install
   ```

### Local Development

To run the blog locally with live-reload enabled:

```bash
bundle exec jekyll serve --livereload
```

The site will be available at `http://localhost:4000/`. Any changes you make to Markdown posts, HTML layouts, or SCSS files will automatically compile and refresh the browser.

## 🛠 Architecture & Features

- **CSS/SCSS Processing**: We use Jekyll's native `jekyll-sass-converter`. Global variables and mixins are stored in `_sass/_global.scss`. The main stylesheets are located in `assets/css/*.scss` with proper frontmatter.
- **Search Engine**: Powered by [Algolia](https://www.algolia.com/).
- **Hosting/Deployment**: Automatically deployed via [Netlify](https://www.netlify.com/). The automated build command runs `bundle exec jekyll build && bundle exec jekyll algolia`.
