// @ts-check
import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import sitemap from '@astrojs/sitemap';

const site = 'https://bastropia.com';
const hidden = ['/desk', '/thanks', '/search', '/404', '/ics/', '/api/'];

function contentUrls(folder, prefix) {
  return readdirSync(join(process.cwd(), 'src/content', folder))
    .filter((file) => file.endsWith('.md'))
    .map((file) => `${site}${prefix}${file.slice(0, -3)}`);
}

// https://astro.build/config
export default defineConfig({
  site,
  output: 'static',
  adapter: cloudflare({ imageService: 'passthrough' }),
  // Keep a real space between inline elements. Astro 7's default is JSX-style.
  compressHTML: true,
  integrations: [
    sitemap({
      filter: (page) => !hidden.some((part) => page.includes(part)),
      customPages: [
        ...contentUrls('events', '/events/'),
        `${site}/llms.txt`,
        `${site}/llms-full.txt`,
        `${site}/rss.xml`,
        `${site}/events.xml`,
      ],
      serialize(item) {
        const url = new URL(item.url);
        if (url.pathname.length > 1 && url.pathname.endsWith('/')) url.pathname = url.pathname.slice(0, -1);
        item.url = url.toString();
        const path = url.pathname;
        if (path === '/') item.priority = 1;
        else if (path === '/events' || path === '/news' || path === '/go-vote') item.priority = 0.9;
        else if (path.startsWith('/events/')) item.priority = 0.8;
        else if (path.startsWith('/news/') || path.startsWith('/government')) item.priority = 0.7;
        else item.priority = 0.6;
        return item;
      },
    }),
  ],
  redirects: {
    '/events/submit': '/submit',
  },
});
