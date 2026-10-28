// @ts-check
import { defineConfig } from 'astro/config';
import node from '@astrojs/node';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  site: 'https://bastropia.com',
  output: 'static',
  adapter: node({ mode: 'standalone' }),
  // Keep a real space between inline elements. Astro 7's default is JSX-style.
  compressHTML: true,
  integrations: [sitemap()],
  redirects: {
    '/events/submit': '/submit',
  },
});
