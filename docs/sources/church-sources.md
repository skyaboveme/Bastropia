# Bastrop County church sources (Bastropia monitoring guide)

Researched and URL-tested on Saturday, Nov. 14, 2026 (America/Chicago). HTTP status and feed checks were done with curl (browser user-agent). “Monitorable by feed” means a working RSS/Atom or iCalendar (ICS) listing was confirmed this day, not merely advertised. Church Center / Planning Center public calendars were reachable as web pages; their `/calendar.ics` URLs returned 404 without a private subscribe token.

Coverage: Bastrop, Elgin, Smithville, Cedar Creek, Paige, McDade, Red Rock, Rockne, Wyldwood, Rosanky, and other Bastrop County communities. This is a monitoring list of churches that publicly post events, plus aggregators — not a complete directory of every congregation in the county (the 2020 U.S. Religion Census counted 111 congregations).

Facebook pages and groups often carry the most timely church announcements. This pass used public web pages, calendars, and search results only; it did not log into Facebook. Treat Facebook as essential manual monitoring, not a feed.

---

## How to monitor (practical order)

1. **River Valley ICS** (the only church calendar ICS confirmed working this day), plus Calvary, Epiphany, Good Shepherd, and River Valley RSS for news posts.
2. **Bastrop County Calendar** (https://bastropcountycalendar.com/) and **Community Impact** Austin/Bastrop calendar — no useful native calendar feed; scrape or check the pages, and filter Community Impact’s sitewide RSS for event stories.
3. **Church websites and Church Center calendars** listed below (manual or scripted HTML check). Priority: Calvary Episcopal, Bastrop Bible Church, LifeFamily Bastrop, MyFCM, FBC Elgin, Celebration Community Church, FUMC Bastrop, Smithville FUMC Eventbrite, Rosanky Baptist, Ridgeway Baptist (Paige).
4. **Eventbrite** searches for Bastrop, Elgin, and Smithville (church, Methodist, Baptist, Christmas, Santa, Advent).
5. **Public Facebook pages** for the same churches, plus city/chamber event posts. No machine-readable feed from this environment.
6. Re-check Catholic parish sites (Ascension Bastrop, Sacred Heart Elgin, St. Paul Smithville, Sacred Heart Rockne) when they are reachable — several blocked or failed TLS this day, so Christmas Mass times were not verified.

---

## Aggregators

| Source | URL | Status this day | Feed? |
| --- | --- | --- | --- |
| Bastrop County Calendar | https://bastropcountycalendar.com/ | 200. Listed Rosanky Baptist’s Nov. 15 Pinewood Derby (and older church events such as the Oct. 24 Cedar Valley Baptist car show). | No. `/events.ics`, `/feed`, and `/rss` returned 404. |
| Community Impact calendar | https://communityimpact.com/austin/calendar/ | 200. Listed FUMC Bastrop’s Hope for the Holidays (Nov. 14). A church-keyword search also surfaced Austin-area churches outside the county; filter carefully. | No calendar feed (`/austin/calendar/feed` 404). Sitewide news RSS works: `https://communityimpact.com/rss/` (200, `application/rss+xml`). |
| Eventbrite | https://www.eventbrite.com/d/tx--bastrop/religious-events/ and city searches | 200. Confirmed three Smithville FUMC holiday events (JSON-LD). Many “religious” hits were regular LDS ward meetings, not special community events. | No useful public ICS/RSS tested. Monitor by search. |
| AllEvents | https://allevents.in/bastrop/church | 200 (search redirected to `/bastrop/church`). Use as a tip sheet only; confirm on the church’s own page. | Not tested as a reliable feed. |
| HappeningNext | Third-party scraper (e.g. a “Classic Christmas at River Valley” listing) | Pages exist, but River Valley’s own December ICS did **not** include that event. Do not publish from this source alone. | No. |
| Discover Bastrop | https://www.discoverbastroptx.org/events/ | 200. City/tourism calendar; church events appear only if submitted. | Not confirmed. |
| Bastrop Chamber directory | https://business.bastropchamber.com/member-directory/Search/religious-organizations-647296 | Useful church list with “visit website” links. Events calendar at `/events` returned 403 this day. | No (403). |
| Elgin Chamber directory | https://elginchamberofcommerce.growthzoneapp.com/directory/Search/churches-244398 | Useful Elgin church list and addresses. | No event feed tested. |
| Smithville Chamber churches | https://business.smithvilletx.org/list/category/churches-19 | Directory of Smithville churches. | No event feed tested. |
| Kids Out and About / Beyond the Nest | Syndicated listings for A Joyous Christmas | Useful confirmation of date/time/free admission; they tell readers to verify on the organizer site. | No. |

---

## Churches that publicly post events (verified sites)

Listed only where a website, calendar, events page, or public Eventbrite/Church Center listing was confirmed reachable this day.

### Bastrop

**Calvary Episcopal Church** — 603 Spring St. (sanctuary), 1028 Main St. (Parish Hall), Bastrop, TX 78602. Phone 512-303-7515.  
- Site: https://cecbastrop.org/ (200)  
- Calendar page: https://cecbastrop.org/calendar/ (200; holiday events are also posted on the homepage “Coming up at Calvary” and ministry pages)  
- Thanksgiving dinner: https://cecbastrop.org/seniors/thanksgiving-eve-dinner-at-calvary/  
- Alternative Giving Fair: https://cecbastrop.org/alternative-giving-fair-2/  
- Feed: **Yes, RSS** `https://cecbastrop.org/feed/` (200, `application/rss+xml`) — blog/news, not a full event ICS. `?feed=ical` returned 404.

**Bastrop Bible Church** — 602 Pecan St., Bastrop, TX 78602.  
- Public calendar: https://bastropbible.churchcenter.com/calendar (200)  
- Example events: Hanging of the Greens (`.../calendar/event/242607548`); 1st Sunday of Advent (`.../event/242607552`)  
- Feed: **No public ICS.** `https://bastropbible.churchcenter.com/calendar.ics` and `/calendar/ical` returned 404. Monitor the HTML calendar or individual event URLs. The short domain `bastropbible.church` failed TLS this day.

**LifeFamily Bastrop** — 1096 Highway 71 West, Bastrop, TX 78602. Sundays 9:30 and 11 a.m.  
- Campus: https://life.family/locations/bastrop (200)  
- Christmas Eve: https://life.family/posts/christmas-at-lifefamily and https://life.family/posts/christmas-eve-at-lifefamily  
- OCC: https://life.family/posts/operation-christmas-child  
- Registrations/calendar: https://lifefamily-37151.churchcenter.com/calendar (200); Bingo event https://lifefamily-37151.churchcenter.com/registrations/events/3926951  
- Feed: **No.** `/calendar.ics` 404; `https://life.family/feed/` 404.

**Foundation Christian Ministries (MyFCM)** — 177 Union Chapel Road East, Bastrop, TX 78602. Phone 512-332-0000.  
- Site: https://myfcm.org/ (200)  
- Christmas Eve (English and Spanish page): https://myfcm.org/nochebuena-en-fcm (200)  
- Feed: **No.** `/feed/` 404.

**First United Methodist Church of Bastrop** — 1201 Main St., Bastrop, TX 78602. Phone 512-321-2201. Sundays 8:30 and 11 a.m. traditional; 9:45 a.m. “The Table.”  
- Site: https://fumcbastrop.org/ (200)  
- Events page: https://fumcbastrop.org/events/ (200; little dated detail in the HTML this day)  
- Hope for the Holidays was listed on Community Impact, not in extractable form on the church events page.  
- Feed: **No.** `/feed/` 404.

**Celebration Community Church** — 287 FM 20, Bastrop, TX 78602.  
- Site: https://www.celebrationbastrop.org/ (200; `celebrationbastrop.org` redirects here)  
- Calendar: https://celebrationbastrop.churchcenter.com/calendar (200)  
- OCC event: https://celebrationbastrop.churchcenter.com/calendar/event/240125808  
- Feed: **No public ICS** found (same Church Center pattern).

**River Valley Church** — 1224 Highway 71 W, Bastrop, TX 78602. Sundays 8:15, 9:45, and 11:11 a.m.  
- Site: https://myrivervalley.church/ (200)  
- Events: https://myrivervalley.church/events/ and https://myrivervalley.church/events-calendar/  
- Feed: **Yes, ICS and RSS.**  
  - ICS (confirmed `text/calendar`): `https://myrivervalley.church/events-calendar/?ical=1`  
  - Month ICS: `https://myrivervalley.church/events-calendar/month/2026-12/?ical=1`  
  - RSS: `https://myrivervalley.church/feed/` (200, `application/rss+xml`)  
- Best automated church calendar in the county on this check. December ICS listed regular worship, alliance groups, Intercessory Prayer, and Helping Hannahs (a monthly service group) — not a Classic Christmas or Christmas Eve service.

**First Baptist Church of Bastrop** — 1201 Water St., Bastrop, TX 78602. Phones 512-321-3384 / 512-303-3221.  
- Site: https://fbcbastrop.org/ (200)  
- Events: https://fbcbastrop.org/events/ (200; introductory text only this day — no dated holiday events found)  
- Music director Dr. Brad Nix also directs A Joyous Christmas (see concert site).  
- Feed: **No.** `/feed/` 404.

**Good Shepherd Lutheran Church (and school)** — 202 Highway 71 W, Bastrop, TX 78602. Phone 512-303-3980.  
- Site: https://goodshepherdbastrop.org/ (200)  
- Events: https://goodshepherdbastrop.org/gsbevents/ (200; little public event detail in the HTML this day)  
- Feed: **Yes, RSS** `https://goodshepherdbastrop.org/feed/` (200, `application/rss+xml`) — current items were mostly older school/church posts, not a 2026 holiday calendar.

**Epiphany Lutheran Church** — calendar page refers to 124 Three Oaks Lane, Bastrop.  
- Site: https://epiphanybastrop.org/ (200)  
- Calendar: https://epiphanybastrop.org/calendar/ (200; Simple Calendar / Google Calendar plugin, JavaScript-rendered — no events extracted from static HTML; no working ICS)  
- Feed: **Yes, RSS** `https://epiphanybastrop.org/feed/` (200, `application/rss+xml`) for site news.

**A Joyous Christmas** (multi-church concert, not a single congregation)  
- Site: https://www.ajoyouschristmasbastrop.com/ (200) and https://www.ajoyouschristmasbastrop.com/our-story  
- Venue (BISD): Jerry Fay Wilhelm Center for the Performing Arts, 1401 Cedar St., Bastrop — https://www.bisdtx.org/departments/finearts/performing-arts-center  
- No RSS. `/tickets` returned 404 (admission is described as free, with a love offering).

### Elgin

**First Baptist Church of Elgin** — 13916 County Line Rd., Elgin, TX 78621. Phone 512-285-4161.  
- Site: https://fbcelgin.org/ (200)  
- Events: https://fbcelgin.org/events (200), including dated 2026 URLs for Advent, the Lighted Christmas Parade, XYZ Luncheon, and Christmas Eve.  
- Feed: **No RSS/ICS found** this day. Monitor the events index.

**St. Peter’s Lutheran Church** — 401 E. 8th St., Elgin, TX 78621 (chamber address). Phone 512-285-4844.  
- Site: https://www.stpeterselgin.org/ (200)  
- Activities: https://www.stpeterselgin.org/activities (200) — describes Wednesday Advent services and a Live Nativity as annual traditions, **without 2026 dates**.  
- Newsletters: https://www.stpeterselgin.org/newsletters (200)  
- Feed: **No.** `/feed` 404. Re-check newsletters and Facebook for dates.

**Lost Pines Cowboy Church** — Elgin. Phone 512-281-6644 (chamber).  
- Site: https://www.lostpinescowboychurch.com/ (200). Sunday worship listed at 10:30 a.m. No dated Christmas/Thanksgiving events found this day.  
- Feed: **No.** `/feed` 404.

**First United Methodist Church of Elgin (Texas)**  
- Site: https://fumcelgintx.org/ (200; `www` sometimes failed TLS). `/events` and `/feed` 404. No dated holiday events extracted this day.

### Smithville

**First United Methodist Church of Smithville** — 400 Olive St., Smithville, TX 78957.  
- Official site `http://www.smithville-umc.com/` and `/calendar` returned HTTP 500 this day.  
- Public events are posted on Eventbrite (organizer Kristyna Hubler), all 200 with schema.org event data: Holiday Sing Along, Shop Til You Drop-Off, Free Breakfast With Santa.  
- Feed: Eventbrite pages only; no church ICS.

**First Presbyterian Church of Smithville**  
- Site: https://www.fpcsmithville.org/ (200)  
- Calendar page: https://www.fpcsmithville.org/calendar.html (200; no extractable dated holiday events in the HTML this day)  
- Feed: **No.** `/feed` 404.

### Cedar Creek, Wyldwood, Red Rock, Rosanky, Rockne, Paige

**Wyldwood Baptist Church** — 398 Union Chapel Road, Cedar Creek, TX 78612. Phone 512-303-3443.  
- Site: https://www.wyldwoodbaptistchurch.org/ (200). “What’s Happening” lists a women’s ministry gathering Dec. 12 (10 a.m.–noon) and regular Sunday worship (Bible study 9:30 a.m., worship 11 a.m.).  
- Feed: **No.** `/feed/` 404.

**One Judge Bible Ministry** — 169 Texas 21, Cedar Creek, TX 78612. Phone 512-303-3667.  
- Calendar: https://www.onejudgebibleministry.church/calendar (200). Sunday meeting time 10:30 a.m. No special holiday events extracted this day.

**Christian Country Fellowship** — 1252 FM 20, Cedar Creek, TX 78612 (mailing P.O. Box 326, Red Rock).  
- Events: https://www.christiancountryfellowship.com/events (200). Recurring Bible studies and work days; no dated Thanksgiving/Christmas community events found this day.

**Rosanky Baptist Church** — 2160 FM 535, Rosanky, TX 78953. Phone 512-360-3109.  
- Site: https://www.rosankybc.org/ (200)  
- Community Pinewood Derby also listed at https://bastropcountycalendar.com/events/pinewood-derby-2026-11-15  
- Feed: **No ICS/RSS confirmed.**

**Ridgeway Baptist Church** — 153 Ridgeway Cemetery, Paige, TX 78659. Phone 512-704-6369.  
- News/events: https://www.ridgewaybaptistpaige.org/newsevents (200). Posted a Nov. 14 Day of Service (food, coats, Thanksgiving fixings, oil changes). The page still showed a 2025 copyright and some undated October items — confirm year when reusing older-looking posts.  
- `?format=rss` returned HTML, not RSS.

**Timberline Family Fellowship** — 1199 Highway 21 E, Paige, TX 78659.  
- Site: https://www.tffbastrop.com/ (200). `/feed` 404. No dated holiday events extracted this day.

**Sacred Heart Parish, Rockne**  
- Site: https://catholic.irockne.com/ (200). `/feed` 404. No 2026 Christmas Mass schedule confirmed in this pass.

**Cedar Creek United Methodist Church**  
- Site: https://www.cedarcreekumc.org/ (200). `/calendar` and `/feed` 404. No dated holiday events found this day.

---

## Known churches whose public event pages were blocked, down, or not found

These belong on a later pass; several are likely to post Christmas Mass or service times.

| Church | City | Notes this day |
| --- | --- | --- |
| Ascension Catholic Church | Bastrop | https://ascensionbastrop.com/ and `/events`, `/mass-confession` returned **403**. |
| Sacred Heart Catholic Church | Elgin | https://sacredheartofelgin.org/ failed TLS (no connection). |
| St. Paul Catholic Church | Smithville | https://stpaulsmithville.com/ returned **403**. |
| Bastrop First Assembly of God | Bastrop | Chamber listing; `bastropfirstassembly.org`, `bastropag.com` did not connect. Historically helped start A Joyous Christmas. |
| Bastrop Christian Church | Bastrop | Chamber address 1106 Church St.; guessed domains did not connect. |
| Heart of Texas Church of Christ, New Covenant, Calvary Baptist (Bastrop), Bateman Baptist | Bastrop area | Chamber listings; public sites not confirmed this day. |
| Cedar Valley Baptist Church | Bastrop | https://www.cedarvalleybaptistchurch.com/ returned 200, but `/events` and `/feed` were placeholder/lander pages, not a real calendar. |
| Family Worship Center, Elgin New Life Baptist, Freedom Temple Pentecostal | Elgin | Chamber listings; no confirmed local event calendar this day. |
| Faith Lutheran, McDade; Grace Lutheran and other Smithville churches | McDade / Smithville | Directory hits only; no working event calendars confirmed. |

Many smaller congregations appear to announce only on Facebook or in print. Budget time for manual Facebook checks, especially in McDade, Red Rock, Rockne, and Wyldwood.

---

## Feed test summary (Nov. 14, 2026)

| Feed | URL | Result |
| --- | --- | --- |
| River Valley Church ICS | https://myrivervalley.church/events-calendar/?ical=1 | **Working** (`text/calendar`, HTTP 200). Best church event feed. Also works with `/month/YYYY-MM/?ical=1`. |
| River Valley RSS | https://myrivervalley.church/feed/ | **Working** (`application/rss+xml`). |
| Calvary Episcopal RSS | https://cecbastrop.org/feed/ | **Working** (`application/rss+xml`). News/blog, not a complete calendar. ICS attempt 404. |
| Epiphany Lutheran RSS | https://epiphanybastrop.org/feed/ | **Working** (`application/rss+xml`). Calendar itself is JS/Google Calendar; no ICS. |
| Good Shepherd RSS | https://goodshepherdbastrop.org/feed/ | **Working** (`application/rss+xml`), but items were mostly old and not a holiday event feed. |
| Community Impact news RSS | https://communityimpact.com/rss/ | **Working** (`application/rss+xml`). Sitewide; filter for Bastrop and event stories. |
| Bastrop County Calendar ICS/RSS | https://bastropcountycalendar.com/events.ics (also `/feed`, `/rss`) | **404** |
| Church Center ICS (Bastrop Bible, LifeFamily) | `...churchcenter.com/calendar.ics` | **404** (no public subscribe URL found) |
| FBC Bastrop, FUMC Bastrop, MyFCM, LifeFamily, St. Peter’s, Lost Pines, Wyldwood, Timberline, Rockne, Cedar Creek UMC, FUMC Elgin | various `/feed` | **404** or not a feed |
| Cedar Valley Baptist `/feed` | https://www.cedarvalleybaptistchurch.com/feed | 200 but **HTML lander**, not RSS |

**Feed-monitorable now (7 working endpoints, 5 organizations):** River Valley (ICS + RSS), Calvary Episcopal (RSS), Epiphany Lutheran (RSS), Good Shepherd (RSS), Community Impact (sitewide RSS). Only River Valley’s ICS is a true upcoming-events calendar feed. Everything else in this list needs a scheduled page check or Facebook review.

---

## Full church directory (added Sunday, Nov. 15, 2026)

A countywide worship-times directory now lives at `/workspace/bastropia/church-directory.csv` (123 congregations). It is meant as a resident guide, not only an events-monitoring list. Times were taken from the church’s own website or parish page when possible; aggregator times are flagged. Many smaller churches still do not publish a weekly schedule online.

Use the directory, plus the sites below, when reviewing church events for the daily roundup. Facebook remains essential for congregations without a working calendar.

### Additional church websites found Nov. 15, 2026

**Bastrop**
- BastropFirst (First Assembly of God) — https://www.bastropfirst.org/ — Sunday worship 10:30 a.m.; Wednesday 7:00 p.m.
- Calvary Baptist Church (and Calvario) — https://cbcbastrop.church/ — Sunday 9:45 and 11:00 a.m.; Spanish service 11:00 a.m.; Wednesday 6:00 p.m.
- Heart of Texas Church of Christ — https://heartoftexaschurchofchrist.com/?page_id=61 — Sunday Bible study 9:30 a.m., worship 10:30 a.m., evening 5:00 p.m.; Wednesday 6:30 p.m. Address: 652 Highway 304.
- Bastrop Seventh-day Adventist Church — https://bastroptx.adventistchurch.org/ — Saturday Sabbath School 9:30 a.m., worship 11:00 a.m.; Wednesday 7:00 p.m. Address: 3300 Highway 21 East (not the older Alum Creek listing).
- Ascension Catholic Church Mass times — https://ascensionbastrop.com/mass-confession — reachable with a browser; earlier curl checks returned 403.
- Bastrop Ward, The Church of Jesus Christ of Latter-day Saints — https://local.churchofjesuschrist.org/en/units/us/tx/bastrop-ward — Sunday 12:00 p.m. at 140 Tahitian Drive.

**Elgin and FM 969**
- Cedar Valley Baptist Church — https://www.cvb.life/ — 1905 FM 969, Elgin (between Elgin and Bastrop). Sunday Bible studies 10:00 a.m., worship 11:00 a.m.; Wednesday meal 5:30 p.m., studies 6:30 p.m. The older cedarvalleybaptistchurch.com domain is a lander.
- Family Worship Center — https://www.fwcelgin.com/ — Sunday 10:00 a.m.; Wednesday 7:00 p.m.
- Elgin Church of Christ — https://elgincoc.net/ — Sunday Bible class 9:30 a.m., worship 10:30 a.m.; Wednesday study 7:00 p.m.
- First Presbyterian Church of Elgin — https://www.fpcelgin.org/ — Sunday 10:00 a.m.
- Grace Lutheran Church, Elgin — https://www.graceelgin.org/ — Sunday school 8:45 a.m., Divine Service 10:00 a.m.
- Grace Community Baptist Church — https://gracechurchtx.org/ — Sunday school 9:30 a.m., worship 10:45 a.m., evening 6:00 p.m.
- Elgin Methodist Church (not FUMC) — https://www.elginmethodistchurch.com/new-here — temporarily at Down Home Ranch, 20250 FM 619; Sunday worship 11:00 a.m.
- Elgin Seventh-day Adventist Church — https://elgintx.adventistchurch.org/
- Mount Moriah Missionary Baptist Church — https://www.mtmoriahelgin.org/ — Sunday 11:00 a.m.
- Winn’s Memorial Baptist Church — https://winnsmemorialbaptist.org/
- Pleasant Bethany Missionary Baptist Church — https://www.pleasantbethanybaptistchurch.org/
- Journey Elgin — https://www.journeyelgin.org/
- Sacred Heart Catholic Church, Elgin — https://www.sacredheartofelgin.org/ — Mass times on the homepage; earlier TLS/curl checks failed, but a browser fetch worked Nov. 15.
- Lost Pines Cowboy Church — address confirmed at 334 Roemer Road, Elgin; Sunday 10:30 a.m. (site, Nov. 14).

**Smithville, McDade, Rockne, String Prairie**
- First Baptist Church of Smithville — https://fbcsmithville.com/
- Smithville Church of Christ — https://www.smithvilletxchurch.org/find-us/
- Grace Lutheran Church, Smithville — https://www.glcs.org/
- St. Paul Catholic Church Mass times — https://stpaulsmithville.com/mass-times-1
- Redeemed Community Church, McDade — https://www.myredeemedchurch.com/weekend-services — Sundays 10:00 a.m. at the McDade Elementary cafeteria.
- Sacred Heart Parish, Rockne, Mass times — https://catholic.irockne.com/page/view/mass-times — also lists Sunday 10:00 a.m. at sister parish St. Mary of the Assumption, String Prairie (https://stmarysp.church/).
- Christian Country Fellowship services — https://www.christiancountryfellowship.com/services — Sunday 9:45 and 11:00 a.m.

**Still limited**
Catholic sites and some Wix pages may return 403 or render times only in JavaScript. Prefer a real browser pass for Christmas and Holy Day schedules. Many Baptist, AME, and rural churches still announce only on Facebook.
