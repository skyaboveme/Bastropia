# Directory data

The public directory at `/directory` is D1 database `bastropia-businesses`, plus the paid partner pages in `src/data/businesses.ts`. `src/data/chamberDirectory.json` is only a fallback.

## How a maintainer hides or updates a listing

Use `scripts/directory-admin.mjs`. It runs `wrangler d1 execute` against `bastropia-businesses`. The id is the `businesses.id` value (the desk shows it on `/desk/businesses`).

```bash
node scripts/directory-admin.mjs hide bizabc123 --remote
node scripts/directory-admin.mjs show bizabc123 --remote
node scripts/directory-admin.mjs county bizabc123 0 --remote
node scripts/directory-admin.mjs get bizabc123 --remote
node scripts/directory-admin.mjs update bizabc123 --set category="Restaurants" --set city="Elgin" --set hours="Mon–Fri 8–5" --remote
```

Omit `--remote` to hit the local D1. Add `--dry-run` to print the SQL and skip wrangler.

`hide` sets `status='hidden'`. `show` sets `status='live'`. `county 0` sets `in_county=0` for a business that should not appear in the county directory. `update` accepts `name`, `category`, `city`, `areas`, `phone`, `website`, `email`, `contact`, `address`, `details`, `hours`, `daily_special`, `status`, `source`, `last_verified`, `socials`, and `in_county`.

`last_verified` is `YYYY-MM-DD`. `socials` is a JSON object, for example `--set socials='{"facebook":"https://www.facebook.com/example"}'`. `source` is free text such as `chamber`, `submit`, or `desk`.

`source`, `last_verified`, `socials`, and `in_county` work only after `migrations/0005_directory_meta.sql` is applied. `hide` and `show` work before that migration. The site reads the new columns when they exist and ignores them when they do not.

A person can do the same hide and edit on `/desk/businesses` after signing in with the desk password. That page is for a person at the desk, not for another bot.

`scripts/import-directory.mjs` only inserts chamber names that are not already in D1 (`INSERT OR IGNORE`). It does not hide a listing and it does not update one.

## What the public page shows

`src/lib/directoryFeed.ts` loads the directory:

1. Partner pages from `src/data/businesses.ts` are always included.
2. When D1 answers, live rows with `status='live'` are included. After the migration, rows with `in_county=0` are left out. The query falls back to `status='live'` only if `in_county` is not a column yet.
3. Names still in `src/data/chamberDirectory.json` are added only when D1 has no row for that name. A row with `status='hidden'` or `in_county=0` suppresses that name, so hiding a D1 row removes the JSON copy too.
4. When D1 is not bound, or the query throws, the page uses the full JSON snapshot. A hide cannot be applied during that outage, because the hidden list lives in D1.

Pending rows stay off the public page. The JSON copy of that name still shows until a live row replaces it.

## Towns

The directory town list is `directoryTowns` in `src/data/taxonomy.ts`: Bastrop, Elgin, Smithville, Cedar Creek, McDade, Paige, Rosanky, Red Rock, Wyldwood, Dale, and Camp Swift. A listing with no town, including city `Bastrop County`, is the Countywide filter (`?town=Countywide`).

`scripts/import-directory.mjs` keeps its own copy of those town names. Update both when the list changes.

## Categories

Cards keep the original trade label. Filters use the 15 groups in `src/data/directoryCategories.ts`. A category and a town can be combined, for example `/directory?category=food-drink&town=Elgin`.

## Apply the migration

Do this from the repo root. It is a schema change on production D1. Run it once, by hand:

```bash
npx wrangler d1 execute bastropia-businesses --remote --file migrations/0005_directory_meta.sql
```

Local:

```bash
npx wrangler d1 execute bastropia-businesses --local --file migrations/0005_directory_meta.sql
```

`hours` is already on the table from `migrations/0002_listing_fields.sql`. The new file does not add it again.
