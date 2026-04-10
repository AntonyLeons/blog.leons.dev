import { defineConfig } from 'vite';

export default defineConfig({
  // Configure the root to be the _site directory for serving
  root: '_site',
  server: {
    // Enable HMR
    watch: {
      usePolling: true,
    },
    // Open the browser automatically
    open: true,
  },
  // If we were using Vite to build assets, we'd configure build here,
  // but we're using PostCSS CLI + Jekyll for this specific setup
  // to maintain the Jekyll workflow while getting Vite's fast serving.
});
