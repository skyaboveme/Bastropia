# Bastropia

Community desk for Bastrop County, Texas. Built with Astro 7.

The site lists events, news, weather, burn-ban status, public-meeting links, and local government contacts. Neighbors can submit a listing, upgrade that listing, or reserve a labeled ad. The Facebook group is [facebook.com/groups/bastropia](https://www.facebook.com/groups/bastropia).

Bastropia is not the county, a city, or an emergency service. Call 911 in an emergency.

## Run it

Node.js 22.23.4 or newer:

```sh
npm install
npm run dev
```

Open http://localhost:4321. The publisher desk is http://localhost:4321/desk.

```sh
npm run build
npm run preview
```

The build uses the Node adapter so the desk, weather, and order forms keep working after `preview`.

## Publish a listing

Submissions are saved in Cloudflare KV (`SESSION`) and reviewed on `/desk`. Desk forms also email Formspree as a backup copy. To put a listing on the public calendar, add a Markdown file in `src/content/events/`. The desk prints a starter file for each submission. News goes in `src/content/news/`. Public-notice summaries go in `src/content/updates/`. Social highlights go in `src/content/social/` and show on `/groups#highlights`.

## Event scout

`npm run scout` reads the City of Elgin calendar, the City of Smithville calendar, and the Bastrop County calendar. It writes new listings into `src/content/events/` and leaves anything already on the site alone. It skips county holidays and staff paydays. When a city listing has its own poster, the scout saves that photo and the event page shows it. Listings with no poster stay text only. `npm run scout -- --dry-run` prints the list without writing files.

On this Mac it also runs by itself every day at 7:15 AM, through `scripts/com.bastropia.event-scout.plist`. The Mac can be asleep. It runs when the Mac wakes. A log is written to `data/scout/launchd.log`.

A Grok skill at `.grok/skills/event-scout/SKILL.md` runs the same scout. The bot only posts an event that was on one of those public calendars.

## Burn ban

`src/data/burnBan.ts` is the status shown in the header. Check [the county outdoor burning page](https://www.bastropcounty.gov/page/em.outdoor_burning) daily and update `checked` even when the status is unchanged. Change `inEffect` when the county posts a new order. The county page is the order. The masthead must say “No burn ban” or “Ban in effect”, never a bare “Burn”.


## Ads and upgrades

- `/advertise` reserves a weekly placement. Prices are calculated on the server.
- `/upgrade` requests Spotlight ($35), Featured ($89), or Lost Pines ($189) for a listing that is already published.
- Nothing is charged on the form. After you invoice and get paid, open `/desk` and place the ad or apply the upgrade. That writes sponsors and upgrades into Cloudflare KV, and the live pages pick them up.

Set `BASTROPIA_DESK_KEY` before the site is on a public server. Without it, the desk only answers on localhost.

## Status alerts

`/alerts` tags the address in Kit and stores the list in KV. A Worker cron every 15 minutes compares burn ban, school, power, and road status. On a change it emails matching subscribers through Resend (`RESEND_API_KEY`, optional `RESEND_FROM`). Phone numbers are stored for a later text path. SMS is not sent yet.

Government pages and the burn-ban page do not carry ads.

## Weather

Conditions come from Open-Meteo for Bastrop, Elgin, Smithville, Cedar Creek, and McDade. County alerts come from the National Weather Service zone `TXC021`.
