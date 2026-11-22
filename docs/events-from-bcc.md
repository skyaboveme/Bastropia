# Events from Bastrop County Calendar

Bastrop County Calendar (`https://bastropcountycalendar.com`) is the authority for county events. Bastropia keeps its own Markdown calendar until `EVENTS_SOURCE` is `bcc`.

## The flag

`EVENTS_SOURCE` in `wrangler.jsonc` is `local` or `bcc`. The default is `local`, so this can ship before `GET /api/public/events` is live.

- `local` reads `src/content/events`.
- `bcc` reads KV key `bcc:events`. The 15-minute cron in `src/worker.ts` fetches `https://bastropcountycalendar.com/api/public/events?from=&to=&since=` and stores a successful response. A failed fetch, or a body that is not an `events` array, leaves the last good copy in place. When the flag is `bcc` and KV has no usable copy, pages use the local collection.

Server-rendered pages read the worker variable on each request. Static story pages bake the calendar at build time. `npm run build` compiles `EVENTS_SOURCE` into the build and, when `BCC_EVENTS_FIXTURE` is set, inlines that JSON so the prerender sandbox can read it. Otherwise the build uses `wrangler.jsonc`. A `bcc` build with no fixture fetches the public feed once while rendering static pages, because KV is empty in that sandbox. If that fetch fails, those pages keep the local calendar. Do not set `BCC_EVENTS_FIXTURE` on a production deploy. Server-rendered pages still read the worker variable on each request, and an empty KV there falls back to the local collection without calling the feed.

A build can use a fixture instead of KV:

```sh
EVENTS_SOURCE=bcc BCC_EVENTS_FIXTURE=scripts/fixtures/bcc-events.json npm run build
```

## Flip it

1. Confirm the public feed is deployed. `curl -fsS 'https://bastropcountycalendar.com/api/public/events?from=&to=&since='` should return an `events` array.
2. Leave the flag on `local` through one cron run after that deploy so `bcc:events` is filled. The cron fetches in either mode.
3. Set `vars.EVENTS_SOURCE` to `"bcc"` in `wrangler.jsonc`.
4. Deploy that commit from `main` with `npm run deploy`. That builds, then runs `wrangler deploy`. Do not deploy a bot branch.
5. Check `/events`, a town page, and an old `/events/[id]` address. A matched listing 301s to the calendar event. An unmatched upcoming listing 301s to `/events?date=YYYY-MM-DD`. An unmatched past listing 301s to `/events`. `/ics/[id]` uses the same redirect.

The match is the calendar URL against the listing `sourceUrl`, then the slug (including a local id that is the slug plus `-YYYY-MM-DD`), then the same title and date.

To switch back, set the variable to `local` and deploy again. The KV copy can stay.

## What `bcc` changes

- Event cards, search, the RSS feed, and `llms-full.txt` link to `https://bastropcountycalendar.com/events/{slug}`.
- `/events`, the front page, and town pages use ItemList schema pointed at those URLs. They do not emit Event schema for the listings.
- Individual event URLs come out of `sitemap.xml` and the HTML sitemap. `/events` stays.
- `/submit`, and the Spotlight, Featured, and Lost Pines choices on `/upgrade`, go to `https://bastropcountycalendar.com/events/submit` with `utm_source=bastropia`, `utm_medium=referral`, and `utm_campaign=add-event`. The prices on `/upgrade` stay the ones in `src/data/commerce.ts`. Move those prices onto the calendar in a later change.

`categoryKey` maps onto `src/data/taxonomy.ts`. `civic` becomes `government`. `faith` and any other unknown key become `community`. An unknown town becomes `Countywide`. A tier of `sponsored` or `premium`, the featured flag, or pinned becomes `featured`. A tier named `featured` with neither flag becomes `spotlight`. `free` and anything else becomes `community`.

The line “Events powered by Bastrop County Calendar” and the button “Add your event on BastropCountyCalendar.com” are on `/events`, `/this-weekend`, the Today and This weekend strip, town pages, and the footer in both modes.

## Retire the scout later

Do not delete `src/content/events` or `scripts/event-scout.mjs` when the flag flips. Old `/events/[id]` addresses still match those files.

After the flag has been `bcc` and the redirects look right:

1. Unload the launchd job. The label is `com.bastropia.event-scout` and the plist is `scripts/com.bastropia.event-scout.plist`. It runs `scripts/run-scout.sh` every day at 7:15 AM.
2. Stop merging `bot/events-inbox`. The scout keeps that one pull request. Close it when nothing new should be written into `src/content/events`.
3. Leave the Markdown files in place. They are how an old URL still finds a slug or a title and date. Removing them turns unmatched old URLs into 404s.
4. Delete the scout, the plist, and `src/content/events` only in a later change, once those redirects are no longer needed.
