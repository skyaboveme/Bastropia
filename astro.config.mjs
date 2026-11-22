// @ts-check
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import mdx from '@astrojs/mdx';

const site = 'https://bastropia.com';
const eventsSourceBuild = process.env.EVENTS_SOURCE === 'bcc' || process.env.EVENTS_SOURCE === 'local' ? process.env.EVENTS_SOURCE : '';
// Inlined so the Cloudflare prerender sandbox can see a mocked feed. Leave unset for a real deploy.
const bccFixtureJson = process.env.BCC_EVENTS_FIXTURE ? readFileSync(resolve(process.env.BCC_EVENTS_FIXTURE), 'utf8') : '';

// https://astro.build/config
export default defineConfig({
  site,
  vite: {
    define: {
      __EVENTS_SOURCE_BUILD__: JSON.stringify(eventsSourceBuild),
      __BCC_EVENTS_FIXTURE_JSON__: JSON.stringify(bccFixtureJson),
    },
  },
  output: 'static',
  adapter: cloudflare({
    imageService: 'passthrough',
    platformProxy: { enabled: true },
  }),
  integrations: [mdx()],
  // Keep a real space between inline elements. Astro 7's default is JSX-style.
  compressHTML: true,
  prefetch: {
    prefetchAll: true,
    defaultStrategy: 'hover',
  },
  redirects: {
    '/events/submit': '/submit',
    '/live': '/videos',
    // Business landings use branded PascalCase paths; send lowercase guesses there.
    '/barronhomes': '/BarronHomes',
    '/stringprairieheatingandair': '/StringPrairieHeatingandAir',
    '/barefootflowerfarms': '/BarefootFlowerFarms',
    '/lostpinestoyota': '/LostPinesToyota',
    '/rosatexlandscaping': '/RosaTexLandscaping',
    '/602brewing': '/602Brewing',
    '/602-brewing-company': '/602Brewing',
  },
});
