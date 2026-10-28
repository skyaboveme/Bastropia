---
name: event-scout
description: Find public events in Bastrop County, Texas and post new ones on the Bastropia calendar. Use when the user asks to look for events, update the calendar from city or county sites, or run the event bot.
---

# Bastropia event scout

Find events that are already published by a city or the county, then post the new ones on this site.

## Run it

From the Bastropia repo:

```sh
npm run scout
```

`npm run scout -- --dry-run` lists what would be posted and writes nothing.

On this Mac a scheduled job already runs the scout every day at 7:15 AM. Do not create a second schedule unless the user asks. If they ask whether it is running, check `data/scout/launchd.log`.

The script reads:

- City of Elgin calendar
- City of Smithville calendar
- Bastrop County calendar

It keeps events in the next 75 days, skips county holidays and staff paydays, skips anything already on the calendar, and writes at most 40 new Markdown files in `src/content/events/`. Each file keeps the source URL.

When the city page for that event includes a poster, the scout saves the image and the listing shows it. It does not invent a photo, and it skips the generic calendar icon. A photo is kept only when the page title is the same event.

## Rules

- Never invent an event, a time, a price, a venue, or an address. If the script did not print it, it does not get a listing.
- Do not edit or delete a listing a person wrote unless the user asks.
- If a source fails to load, say which one and keep going with the others.
- After a real run, name the events that were posted (title, date, city) and any source that failed.
- Do not claim an event is free, or name a room, unless that text came from the source.
