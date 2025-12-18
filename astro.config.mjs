import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://jementraine.fr',
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
