// @ts-check
import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';

const site = 'https://bastropia.com';

// https://astro.build/config
export default defineConfig({
  site,
  output: 'static',
  adapter: cloudflare({ imageService: 'passthrough' }),
  // Keep a real space between inline elements. Astro 7's default is JSX-style.
  compressHTML: true,
  redirects: {
    '/events/submit': '/submit',
    '/live': '/videos',
    // Business landings use branded PascalCase paths; send lowercase guesses there.
    '/barronhomes': '/BarronHomes',
    '/stringprairieheatingandair': '/StringPrairieHeatingandAir',
    '/barefootflowerfarms': '/BarefootFlowerFarms',
    '/lostpinestoyota': '/LostPinesToyota',
    '/rosatexlandscaping': '/RosaTexLandscaping',
  },
});
