import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import test from 'node:test';
import { coveredWire, coverTokens, pinnedLeadHref } from './frontPage.ts';

const day = (iso: string) => new Date(iso);

test('the newest lead: true story is the homepage lead', () => {
  const href = pinnedLeadHref([
    { id: 'older', data: { pubDate: day('2026-11-20T06:00:00-06:00'), lead: true } },
    { id: 'newer', data: { pubDate: day('2026-11-21T06:00:00-06:00'), lead: true } },
    { id: 'newest-unpinned', data: { pubDate: day('2026-11-21T08:00:00-06:00') } },
  ]);
  assert.equal(href, '/news/newer');
});

test('no lead flag falls through to the newest headline', () => {
  assert.equal(
    pinnedLeadHref([
      { id: 'daily', data: { pubDate: day('2026-11-21T05:05:00-06:00') } },
      { id: 'feature', data: { pubDate: day('2026-11-21T06:25:00-06:00') } },
    ]),
    undefined,
  );
});

test('a wire link is hidden from the desk story sourceUrl', () => {
  const stories = [
    {
      data: {
        sourceUrl:
          'https://communityimpact.com/bastrop-cedar-creek/business/acutronic-lands-100m-investment-eyes-larger-bastrop-factory-in-2027/',
      },
    },
    {
      data: {
        sourceUrl:
          'https://www.elgincourier.com/article/5047,operation-turkey-aims-to-serve-over-3-000-thanksgiving-meals',
      },
    },
  ];
  assert.equal(
    coveredWire(
      'https://communityimpact.com/bastrop-cedar-creek/business/acutronic-lands-100m-investment-eyes-larger-bastrop-factory-in-2027/',
      stories,
    ),
    true,
  );
  assert.equal(
    coveredWire(
      'https://www.elgincourier.com/article/5047,operation-turkey-aims-to-serve-over-3-000-thanksgiving-meals',
      stories,
    ),
    true,
  );
  assert.equal(coveredWire('https://www.kxan.com/news/local/bastrop/some-other-story/', stories), false);
  assert.equal(coverTokens({ data: { sourceUrl: 'https://bastropcountycalendar.com/' } }).length, 0);
});

test('covers adds a wire slug that is not the sourceUrl', () => {
  const stories = [
    {
      data: {
        sourceUrl: 'https://www.tdlr.texas.gov/TABS/Projects/TABS2027003948',
        covers: 'ev-chargers-and-e-bikes-1-47m-bastrop-carts-expansion-planned',
      },
    },
  ];
  assert.equal(
    coveredWire(
      'https://communityimpact.com/bastrop-cedar-creek/transportation/ev-chargers-and-e-bikes-1-47m-bastrop-carts-expansion-planned/',
      stories,
    ),
    true,
  );
});

/** Slugs the homepage used to keep in src/pages/index.astro. */
const previousWireSlugs = [
  'acutronic-lands-100m-investment-eyes-larger-bastrop-factory-in-2027',
  'ev-chargers-and-e-bikes-1-47m-bastrop-carts-expansion-planned',
  'whataburger-to-make-its-bastrop-comeback-dec-8',
  'bastrop-isd-launches-tuition-free-program-to-certify-educators',
  'from-service-to-support-free-roof-repairs-for-bastrop-veterans',
  '10-bastrop-business-updates-to-know',
  'esd-3-responds-to-over-1-000-calls-in-first-month',
  'what-s-next-for-the-290-toll-extension-into-bastrop-county',
  'spacex-strikes-solar-manufacturing-deal-as-bastrop-operations-expand',
  'bee-infestation-stalls-repairs-at-historic-bastrop-courthouse',
  'boots-bling-and-bingo-bastrop-fundraiser-to-benefit-cats',
  '11m-upgrade-wraps-up-on-historic-bastrop-bridge',
  'explore-3-christmas-tree-farms-in-the-bastrop-area',
  'operation-turkey-aims-to-serve-over-3-000-thanksgiving-meals',
];

function field(frontmatter: string, key: string): string | undefined {
  const match = frontmatter.match(new RegExp(`^${key}:\\s*(.+)$`, 'm'));
  if (!match) return undefined;
  return match[1].trim().replace(/^['"]|['"]$/g, '');
}

test('every wire slug the homepage used to list still comes from a news story', () => {
  const stories = readdirSync(new URL('../content/news/', import.meta.url))
    .filter((name) => name.endsWith('.md') || name.endsWith('.mdx'))
    .map((name) => {
      const text = readFileSync(new URL(`../content/news/${name}`, import.meta.url), 'utf8');
      const frontmatter = text.match(/^---\n([\s\S]*?)\n---/)?.[1] ?? '';
      return { data: { sourceUrl: field(frontmatter, 'sourceUrl'), covers: field(frontmatter, 'covers') } };
    });
  const missing = previousWireSlugs.filter(
    (slug) => !coveredWire(`https://example.test/${slug}`, stories),
  );
  assert.deepEqual(missing, []);
});
