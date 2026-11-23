# Directory ads

Prices, founding rates, and live creatives are in `src/data/directoryAds.ts`. Change a number there and the directory house ads, the `/advertise#directory` cards, and the inquiry total all follow it.

Nothing is charged on the site. Every paid call to action opens the advertise form. `?product=featured&business=Name#directory` checks that product and fills the business name.

## Products

| Product | List price | Founding rate |
| --- | --- | --- |
| Free listing | $0 | Goes to `/directory/submit` |
| Featured | $39/mo | $25/mo |
| Spotlight | $99/mo | $69/mo |
| Partner page | Quote | — |

The founding rate is the first 25 businesses, locked for 12 months. The form still estimates the list price. The desk applies the founding rate when it invoices. Both numbers are in `directoryProducts` and `directoryFounding`.

## What shows on `/directory`

- **Partners row.** The first screen lists partner pages from `src/data/businesses.ts` (String Prairie Heating & Air and the others). Each result card for a partner is a little richer and carries a Partner badge.
- **Featured.** A listing with D1 `tier = 'featured'`, or a match in `directoryFeatured`, pins to the top of results it actually matches. At most 3, rotated by the Chicago date so each one leads in turn. They still have to match the town, category, and search. A Featured badge sits on the card. Text is `#5c3b00` on `#fff6e0`.
- **Spotlight.** One tile above the result list. The most specific active slot wins: town and category, then town, then category, then a slot with no target. Same-day ties rotate.
- **In-feed.** One native card after every 10 results, the same height as a result card. A short list still gets one card at the end.
- **House ads.** An empty Featured, Spotlight, or in-feed slot says “Your business here” or “Advertise on Bastropia” and links to `/advertise#directory`. House tiles are labeled Advertise. Paying tiles are labeled Sponsored or Partner.

Logos on those tiles use `loading="lazy"`. Impressions and clicks beacon to `/api/ad-stat` and land in the same `ad:stat:` keys as the banners.

## Turning a slot on

Add an object to `directoryAdSlots`:

```ts
{
  id: 'spotlight-hvac-elgin',
  kind: 'spotlight', // or 'infeed'
  name: 'String Prairie Heating & Air',
  line: 'Heating & AC in Elgin',
  href: '/StringPrairieHeatingandAir',
  logo: '/images/businesses/string-prairie/logo.svg',
  label: 'Partner',
  towns: ['Elgin'],
  categories: ['home-repair'],
  start: '2026-11-23',
  end: '2027-11-23',
}
```

`id` is lowercase letters, numbers, and hyphens. `towns` and `categories` can be omitted to run on every result set. `categories` uses the group ids in `src/data/directoryCategoryGroups.json` (`home-repair`, `food-drink`, and the rest). Dates are inclusive and use the America/Chicago calendar.

`businessId` is a D1 `businesses.id`. When it is set, the click goes through `/go/biz/:id?to=site` so the listing’s click counter moves.

To feature a partner page that is not a D1 row, add a dated match instead of a slot:

```ts
{ match: 'StringPrairieHeatingandAir', start: '2026-11-23', end: '2027-11-23' }
```

`match` is the slug, the directory id, or the exact name.

The desk listing editor also has a Directory tier menu (Free, Featured, Spotlight badge). Featured is the pin. Spotlight badge is the older badge only. The sponsor tile is the data file, not that menu.

## D1

Database `299e6f33-da56-42cd-81fd-a61b7c163147`.

The column is not required for the page to render. Until it exists, `tier` is ignored and file matches in `directoryFeatured` still work. Apply this once:

```sql
ALTER TABLE businesses ADD COLUMN tier TEXT NOT NULL DEFAULT '';
```

The same statement is in `migrations/0006_directory_tier.sql`. D1 rejects it if the column is already there. After it is applied, set a listing with:

```sql
UPDATE businesses SET tier = 'featured' WHERE slug = 'your-slug';
```

Use `''` or `'spotlight'` the same way. `'spotlight'` only adds the badge. It does not sell the sponsor tile.
