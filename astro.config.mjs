import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://exocycle2.fr',
  output: 'static',
  build: {
    inlineStylesheets: 'auto'
  },
  vite: {
    build: {
      cssMinify: true
    }
  }
});
