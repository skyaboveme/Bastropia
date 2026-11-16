# Bastrop County news sources (Bastropia monitoring guide)

Researched and URL-tested on Saturday, Nov. 14, 2026 (America/Chicago). HTTP status and feed checks were done with curl (browser user-agent). “Monitorable by feed” means a working RSS/Atom or similar machine-readable listing was confirmed this day, not merely advertised.

Coverage area for this list: Bastrop, Elgin, Smithville, Cedar Creek, Paige, McDade, Red Rock, Rockne, Wyldwood, Camp Swift, Circle D/KC Estates, Lake Bastrop, plus county government, BISD, Elgin ISD, Smithville ISD, McDade ISD, sheriff/police, TxDOT, weather/emergencies, business and development.

The Bastrop County Times is a historical title (archives at the Portal to Texas History). It does not have a current news site. The Bastrop Advertiser and The Smithville Times now live on the Austin American-Statesman Bastrop page rather than as stand-alone sites (smithvilletimes.com redirects to statesman.com/bastrop).

---

## Ranked sources (start here)

### 1. Community Impact — Bastrop–Cedar Creek (priority 1)

- **URL:** https://communityimpact.com/bastrop-cedar-creek/
- **Covers:** The strongest current hyperlocal beat for Bastrop and Cedar Creek: city and county government, business, development, schools, transportation, events, real estate, dining. Staff reporter Amanda Cutshall is regularly bylined.
- **Update frequency:** Several times a week, sometimes more than once a day. Two new Bastrop stories appeared on the afternoon/evening of Nov. 14, 2026.
- **Feed:** Yes, but only the sitewide feed, which must be filtered. Confirmed working: `https://communityimpact.com/rss/` (HTTP 200, `application/rss+xml`, 50 latest stories from all Community Impact markets). On this check it included the two newest Bastrop stories. Section feeds such as `https://communityimpact.com/bastrop-cedar-creek/feed/` and `.../rss/` returned 404. Monitor by filtering item links or titles for `/bastrop-cedar-creek/` or Bastrop County place names.
- **Notes:** Best first stop for website/Facebook rewrites. Still attribute and rewrite; do not copy wording.

### 2. Google News RSS — Bastrop County queries (priority 1, aggregator)

- **URL (news):** https://news.google.com/search?q=Bastrop+County+Texas&hl=en-US&gl=US&ceid=US:en
- **Feeds (confirmed working, `application/xml`, HTTP 200):**
  - `https://news.google.com/rss/search?q=Bastrop+County+Texas+when:7d&hl=en-US&gl=US&ceid=US:en`
  - `https://news.google.com/rss/search?q=Elgin+OR+Smithville+OR+%22Cedar+Creek%22+OR+McDade+OR+Paige+Bastrop+Texas+when:7d&hl=en-US&gl=US&ceid=US:en`
- **Covers:** Austin TV, the Statesman, Community Impact, the Elgin Courier, niche outlets, and occasional statewide stories that mention the county. This is the most reliable way to catch FOX 7, Statesman, and Courier stories that have no useful native feed.
- **Update frequency:** Continuous. The 7-day query returned 24 items on Nov. 14, 2026.
- **Feed:** Yes. Links are Google redirect URLs; resolve to the publisher page before rewriting. Expect some false positives (statewide stories, sports matchup pages, or “Bastrop” confusion).

### 3. The Elgin Courier (priority 1 for Elgin, McDade, and north county)

- **URL:** https://www.elgincourier.com/
- **Covers:** Weekly paper of record for Elgin and nearby communities (McDade, Coupland, and much of northern Bastrop County): city and school board, crime, elections, community events, sports. Published by Granite Media Partners (Taylor office listed on the site).
- **Update frequency:** Weekly print cycle; web stories often dated Monday mornings (this week’s package carried 11/09/2026 6:00 a.m. CT datelines).
- **Feed:** No working RSS. `https://www.elgincourier.com/rss` returns HTML (200), not a feed. `/feed` and `/rss.xml` returned 404. Monitor the homepage and new `/article/` URLs, and catch items via Google News.

### 4. City of Elgin official site (priority 1 for official Elgin news)

- **URL:** https://www.elgintexas.gov/
- **News Flash:** https://www.elgintexas.gov/m/newsflash
- **RSS index:** https://www.elgintexas.gov/rss.aspx
- **Covers:** Official city news, closings, alerts, council agendas, calendar, public hearings.
- **Update frequency:** As needed (a Veterans Day closing notice was posted Nov. 11, 2026).
- **Feeds (confirmed working, `text/xml` RSS 2.0):**
  - News Flash (all): `https://www.elgintexas.gov/RSSFeed.aspx?ModID=1&CID=All-newsflash.xml` (4 items on this check)
  - Elgin News: `https://www.elgintexas.gov/RSSFeed.aspx?ModID=1&CID=Elgin-News-1`
  - Calendar (all): `https://www.elgintexas.gov/RSSFeed.aspx?ModID=58&CID=All-calendar.xml` (67 items; mostly recreation)
  - City Council agendas: `https://www.elgintexas.gov/RSSFeed.aspx?ModID=65&CID=City-Council-2` (feed exists; 0 items on this check)
  - Also listed: alerts, blog, jobs, individual boards. Same `/RSSFeed.aspx?ModID=…` pattern.
- **Notes:** Best official feed in the county right now. Use for closings, hearings, and city announcements.

### 5. City of Bastrop official site (priority 1 for official city information)

- **URL:** https://www.cityofbastrop.org/
- **Public notices (active):** https://www.cityofbastrop.org/page/city.public_notices
- **Press releases (stale):** https://www.cityofbastrop.org/page/city.news — newest formal release listed was Aug. 19, 2025. Recent statements (for example a Nov. 2026 ICE-policy release quoted by FOX 7) may go out by email or social channels rather than this page.
- **Event registration:** City Eventbrite organizer page, e.g. Community Unity 2026: https://www.eventbrite.com/e/city-of-bastrop-community-unity-2026-tickets-2003739037400
- **Update frequency:** Public notices are current (new bid notice dated Nov. 12, 2026). Press-release page is not a reliable live newsroom.
- **Feed:** No. `/rss`, `/feed`, `/rss.aspx`, and `/RSSFeed.aspx` did not return a feed (404 or custom 404 page).
- **Monitor:** Public notices page, Eventbrite, and city Facebook; confirm TV/newspaper quotes against a city document when one exists.
- **Contact listed on the site:** 1311 Chestnut St., 512-332-8800, info@cityofbastrop.org

### 6. Lost Pines Groundwater Conservation District (priority 1 for water)

- **URL:** https://www.lostpineswater.org/
- **Agenda Center:** https://www.lostpineswater.org/AgendaCenter
- **Blog / process explainers:** e.g. https://www.lostpineswater.org/Blog.aspx?IID=111
- **RSS index:** https://www.lostpineswater.org/rss.aspx
- **Covers:** Groundwater rules, permits, fees, hearings, and data-center/brackish-water issues affecting Bastrop and Lee counties. The district also publishes explainers in the Statesman/Advertiser.
- **Update frequency:** Before board meetings and hearings (a Nov. 18, 2026, rulemaking hearing is on the calendar).
- **Feeds:** Endpoints exist and return valid RSS, but they were empty on this check:
  - `https://www.lostpineswater.org/RSSFeed.aspx?ModID=1&CID=All-newsflash.xml`
  - `https://www.lostpineswater.org/RSSFeed.aspx?ModID=51&CID=All-blog.xml`
- **Monitor:** Agenda Center and posted packets remain the reliable official source even when the feeds are empty. Phone listed in the district’s public column: 512-360-5088; lpgcd@lostpineswater.org.

### 7. Austin American-Statesman / Bastrop Advertiser / Smithville Times (priority 2)

- **URL:** https://www.statesman.com/bastrop/ (HTTP 200)
- **Covers:** Countywide government, water, politics, some sports. The Advertiser (founded 1853) and Smithville Times are presented here rather than on separate sites.
- **Update frequency:** Irregular on the Bastrop page; major county stories appear around elections, hearings, and high school sports.
- **Feed:** No working RSS found (`/feed`, `/arcio/rss`, `/feed/rss` 404). Catch stories via Google News. Many articles are paywalled; confirm facts from the accessible lede and from official documents.

### 8. KXAN (NBC Austin) (priority 2)

- **URL:** https://www.kxan.com/ and Bastrop tag/section https://www.kxan.com/news/local/bastrop/ (homepage often 403 to simple crawlers; the feed worked)
- **Covers:** Breaking local TV news when a Bastrop story rises to the Austin market (data centers, elections, TCEQ, crime).
- **Update frequency:** As news warrants; Bastrop is not on the main feed every day (0 Bastrop items in the 31-item feed on Nov. 14).
- **Feed:** Yes. `https://www.kxan.com/feed/` — HTTP 200, `application/rss+xml`. Filter for Bastrop County place names.

### 9. KVUE (ABC Austin) (priority 2)

- **URL:** https://www.kvue.com/
- **Covers:** Same Austin-market local TV role. Recent example: city ICE-policy story, Nov. 11, 2026 (page fetched as 403 from this host; URL is still the canonical link).
- **Update frequency:** As news warrants. No Bastrop items in the 40-item general news feed on Nov. 14.
- **Feed:** Yes. `https://www.kvue.com/feeds/syndication/rss/news` — HTTP 200, `application/rss+xml`. Filter by keyword. `/rss` returns HTML, not a feed.

### 10. Bastrop County official site, OEM, and Sheriff (priority 2, official)

- **County home:** https://www.bastropcounty.gov/
- **Office of Emergency Management:** https://www.bastropcounty.gov/page/em.home — 1501 Business Park Drive, 512-581-4022. OEM points residents to local news, NOAA Weather Radio, smartphone alerts, and WarnCentralTexas, and says it uses the same warning colors on the OEM Facebook page.
- **Alert Center:** https://www.bastropcounty.gov/page/co.alerts
- **Sheriff’s Office:** https://www.bastropcounty.gov/page/lec.sheriff — 200 Jackson St., 512-549-5100, SORecords@co.bastrop.tx.us. Sheriff Maurice Cook. Site points to @BastropCountySheriffsOffice and a BCSO YouTube channel.
- **Update frequency:** As needed; the homepage “News and Announcements” module was empty of dated items on this check. Social channels and the OEM Facebook page are likely more current during emergencies.
- **Feed:** No. `/rss` and `/RSSFeed.aspx` 404. The county site is ezTask Titanium, not CivicPlus.
- **Also:** Adopted Budget FY 2026-2027 is posted from the homepage.

### Also monitor (official, schools, roads, TV/radio)

**City of Smithville** — https://www.ci.smithville.tx.us/ (200). News Flash: https://www.ci.smithville.tx.us/m/newsflash. RSS index: https://www.ci.smithville.tx.us/rss.aspx. Feed exists: `https://www.ci.smithville.tx.us/RSSFeed.aspx?ModID=1&CID=All-newsflash.xml` (valid RSS, 0 items on this check). Monitor the site and Facebook until the feed is populated.

**Bastrop ISD** — https://www.bisdtx.org/ and newsroom https://www.bisdtx.org/news/bisd-newsroom (200). No RSS (`/rss` 404). Recent newsroom item: Board of Trustees regular meeting notice dated Nov. 11, 2026.

**Elgin ISD** — https://www.elginisd.net/ and https://www.elginisd.net/view-all-news (200). No RSS (`/rss` 404). Board and superintendent news is also covered quickly by the Elgin Courier.

**Smithville ISD** — https://www.smithvilleisd.org/ and https://www.smithvilleisd.org/news/ (homepage 200; news/feed pages returned a JavaScript “client challenge,” so they are not reliably scrapeable). No usable feed from this host.

**McDade ISD** — https://www.mcdadeisd.com/ and https://www.mcdadeisd.com/news (same client-challenge limitation as Smithville ISD). `mcdadeisd.net` is not a working homepage (405 on HEAD).

**TxDOT Austin District** — https://www.txdot.gov/about/districts/austin-district.html (200). Project example: SH 71 East Corridor, https://www.txdot.gov/projects/projects-studies/austin/sh71-east-corridor.html (200). No general TxDOT or Austin District RSS was found (tested paths 404 or failed). DriveTexas (https://www.drivetexas.org/) did not connect from this host (connection failed). Check project pages and DriveTexas in a browser for lane closures.

**CARTS (transit)** — https://www.ridecarts.com/ (200). No feed tested. Confirm expansion/construction facts against TDLR filings when they appear: e.g. https://www.tdlr.texas.gov/TABS/Projects/TABS2027003948

**KUT (NPR Austin)** — https://www.kut.org/ and https://www.kut.org/news (200). Feed: `https://www.kut.org/kut-rss-feed-all-content.rss` (200, `application/xml`; also reached via `/feeds/latest`). `/feed` and `/news/rss.xml` do not work. Filter for Bastrop County. No Bastrop items in the 12-item feed on this check.

**FOX 7 Austin** — https://www.fox7austin.com/ (200). No RSS found (`/feed`, `/rss`, `/feeds/rss`, `/feeds/latest` 404). Monitor via Google News. Recent county story: ICE presence, Nov. 12, 2026.

**KEYE / CBS Austin** — https://cbsaustin.com/ (200). `keyetv.com` returned 405 on HEAD. No RSS found (`/feed`, `/rss` 404). Monitor via Google News.

**WarnCentralTexas** — https://www.warncentraltexas.org/ (official alert opt-in recommended by county OEM). This host received HTTP 403; treat as a resident-facing alert system, not a scrape source.

**Bastrop EDC** — https://www.bastropedc.org/ (200). Business and development releases; sometimes republishes or originates Community Impact-style business news.

**Secondary / newer digital outlets:** Hyperlocal Loop (https://hyperlocalloop.com/, 200) and Bastrop Current (https://news.bastropcurrent.com/, 200) appeared in search results this week, often summarizing the same events. Use as tips, then confirm against official or established news sources before rewriting.

---

## Suggested weekly monitoring order

1. Google News 7-day RSS (county + cities queries) for anything new from TV, the Statesman, and the Courier.
2. Community Impact Bastrop–Cedar Creek page and/or sitewide RSS filtered to that section.
3. Elgin Courier homepage (especially Monday).
4. Official feeds/pages: Elgin News Flash RSS; City of Bastrop public notices; Lost Pines Agenda Center; Bastrop County OEM/alerts/sheriff; Smithville News Flash (when populated); ISD newsrooms.
5. KXAN, KVUE, and KUT feeds, keyword-filtered.
6. TxDOT Austin project pages / DriveTexas when road work is in the news.
7. City and county Eventbrite, Facebook, and OEM/sheriff social channels during emergencies or event weeks (not machine-readable; still essential).

## Feed test summary (Nov. 14, 2026)

| Source | Feed URL | Result this day |
|---|---|---|
| Community Impact (sitewide) | https://communityimpact.com/rss/ | Working; filter for Bastrop |
| Community Impact section | …/bastrop-cedar-creek/feed/ | 404 |
| Google News (county, 7d) | see URLs above | Working |
| Elgin Courier | /rss, /feed | Not a feed |
| Elgin News Flash | RSSFeed.aspx?ModID=1&CID=All-newsflash.xml | Working (4 items) |
| Elgin calendar | RSSFeed.aspx?ModID=58&CID=All-calendar.xml | Working |
| Smithville News Flash | RSSFeed.aspx?ModID=1&CID=All-newsflash.xml | Valid feed, 0 items |
| Lost Pines News Flash / Blog | RSSFeed.aspx as above | Valid feeds, 0 items |
| City of Bastrop | rss.aspx / RSSFeed.aspx | No feed |
| Bastrop County | rss / RSSFeed.aspx | No feed |
| Statesman | several common RSS paths | No feed |
| KXAN | https://www.kxan.com/feed/ | Working; filter |
| KVUE | https://www.kvue.com/feeds/syndication/rss/news | Working; filter |
| KUT | https://www.kut.org/kut-rss-feed-all-content.rss | Working; filter |
| FOX 7 / CBS Austin | common RSS paths | No feed found |
| BISD / Elgin ISD | /rss | 404 |
| Smithville ISD / McDade ISD | /feed, /news | Bot challenge; not reliably readable |

---

## Video sources

Researched and URL-tested on Saturday, Nov. 14, 2026 (America/Chicago). YouTube channel pages and official government/school/church sites were fetched with curl. Latest upload dates come from YouTube video metadata the same day (shown as the YouTube upload date, then converted only when a timestamp was available). Facebook pages are listed only where an official site points to them for live video; their contents were not readable from this host.

**YouTube RSS test:** For every channel below, the standard feed `https://www.youtube.com/feeds/videos.xml?channel_id=CHANNEL_ID` was requested with curl (and, as a check, wget). Every request returned **HTTP 404** from the server identifying itself as “YouTube RSS Feeds server.” The feed URLs are still the correct monitorable format and should be retried from another network. Until they respond, check the channel’s Videos tab and, for government and church meetings, the Live/streams tab (many meeting recordings are livestream VODs and do not appear first on the Videos tab).

No Swagit or Granicus meeting-video portals were found for Bastrop County, the cities of Bastrop, Elgin, or Smithville, Lost Pines GCD, or the county ISDs.

### YouTube — cities, county agencies, and utility districts

**Bastrop TX Network (City of Bastrop)** — Official city channel, linked from the City Council pages as https://www.youtube.com/c/btxntvonline and https://www.youtube.com/BTXNTVOnline.
- **Channel:** https://www.youtube.com/channel/UCeI3MYcqXy8CPUt5UhA7bpw (ID `UCeI3MYcqXy8CPUt5UhA7bpw`)
- **Covers:** City Council, Planning & Zoning, and Bastrop EDC board meeting recordings (EDC meetings are posted here, not on the EDC’s own channel). The city also broadcasts Council meetings live on Facebook, then posts the recording to this channel 48–72 hours later.
- **Latest upload:** Nov. 5, 2026, 1:50 p.m. CST — “Bastrop City Council - November 3, 2026” (https://www.youtube.com/watch?v=gSiNUujIgLY). The most recent EDC board recording on this channel is Oct. 19, 2026.
- **Feed (standard, 404 from this host):** `https://www.youtube.com/feeds/videos.xml?channel_id=UCeI3MYcqXy8CPUt5UhA7bpw`
- **Also:** Live Council stream on the city Facebook page, https://www.facebook.com/bastroptx. Agendas and minutes: https://bastrop-tx.municodemeetings.com/ (Municode Meetings; a Video column appears in the directory, but no playable video links were found on this check — videos live on YouTube).

**City of Elgin - Texas** — Official city channel, linked from https://www.elgintexas.gov/149/City-Council.
- **Channel:** https://www.youtube.com/@cityofelgin-texas3271 and https://www.youtube.com/channel/UC3OGBV_loV0Nr3AqM1jJTzA (ID `UC3OGBV_loV0Nr3AqM1jJTzA`)
- **Covers:** City Council regular and special meetings on the Live/streams tab (https://www.youtube.com/@cityofelgin-texas3271/streams). The Videos tab is mostly the city’s “78621 Live” staff podcast, not meetings.
- **Latest upload / activity:** Council meeting of Oct. 27, 2026, uploaded Oct. 28, 2026 (https://www.youtube.com/watch?v=m_3JYABrg9k). Latest podcast on the Videos tab was uploaded Sept. 1, 2026.
- **Feed (standard, 404 from this host):** `https://www.youtube.com/feeds/videos.xml?channel_id=UC3OGBV_loV0Nr3AqM1jJTzA`

**City of Smithville, Texas** — Official city channel.
- **Channel:** https://www.youtube.com/@cityofsmithvilletexas9460 and https://www.youtube.com/channel/UCN7rJz0wVkS4zWV9EvKcH5w (ID `UCN7rJz0wVkS4zWV9EvKcH5w`)
- **Covers:** City Council and Planning & Zoning meetings on the Live/streams tab; PSAs and workshop videos on the Videos tab. The city Agenda Center is https://www.ci.smithville.tx.us/agendacenter (CivicPlus; no embedded video player).
- **Latest upload / activity:** “City Council Meeting November 9, 2026,” uploaded Nov. 10, 2026 (https://www.youtube.com/watch?v=Goww7_h8zR8). A special called meeting from Oct. 26, 2026 is also on the streams tab.
- **Feed (standard, 404 from this host):** `https://www.youtube.com/feeds/videos.xml?channel_id=UCN7rJz0wVkS4zWV9EvKcH5w`

**Bastrop County Sheriff’s Office** — Official channel, linked from https://www.bastropcounty.gov/page/lec.sheriff.
- **Channel:** https://www.youtube.com/channel/UC2tbwvg41WQAIl01uSUakVw (ID `UC2tbwvg41WQAIl01uSUakVw`)
- **Covers:** Recruitment and “working in Bastrop County” videos only (two videos). Not a source for incident video or news briefings.
- **Latest upload:** June 26, 2019 — “Bastrop SO Employment Opportunities Video.” Stale; prefer the Sheriff’s Office page and Facebook (https://www.facebook.com/BastropCountySheriffsOffice) for current information.
- **Feed (standard, 404 from this host):** `https://www.youtube.com/feeds/videos.xml?channel_id=UC2tbwvg41WQAIl01uSUakVw`

**Bastrop County Elections** — Official-looking channel used for election-night central-count camera livestreams. The elections site https://www.bastropvotes.org/ points to Facebook, not this channel, but the stream titles match Bastrop County Elections operations.
- **Channel:** https://www.youtube.com/channel/UCum8UX2G7PXTywf5s_xOLWA (ID `UCum8UX2G7PXTywf5s_xOLWA`) — no Videos tab; use the Live/streams tab.
- **Covers:** Ballot central-count cameras (Camera #1 / #2) on election days, with archives back to 2022.
- **Latest activity:** A stream titled “Central Count Camera #1 - November 3, 2026” was still marked live during this check. Previous archived stream: May 4, 2024 (uploaded May 5, 2024). Monitor around election days.
- **Feed (standard, 404 from this host):** `https://www.youtube.com/feeds/videos.xml?channel_id=UCum8UX2G7PXTywf5s_xOLWA`

**Lost Pines Groundwater Conservation District** — Official channel https://www.youtube.com/@LostPinesGCD.
- **Channel:** https://www.youtube.com/channel/UCKIFob3Foqo1XCG8PdeGIGw (ID `UCKIFob3Foqo1XCG8PdeGIGw`)
- **Covers:** Monthly board meetings and short how-to videos for drillers/well tools. Current meeting video is posted here. An older CivicPlus archive remains at https://lostpineswater.org/CivicMedia (confirmed 200; the recent items visible there are from 2020–2024, not the 2026 meetings).
- **Latest upload:** Oct. 22, 2026 — “Public Board Meeting | 10.21.26” (https://www.youtube.com/watch?v=qiJMpK9Ercs). Next advertised board/rules hearing is Nov. 18, 2026 (Agenda Center: https://lostpineswater.org/AgendaCenter).
- **Feed (standard, 404 from this host):** `https://www.youtube.com/feeds/videos.xml?channel_id=UCKIFob3Foqo1XCG8PdeGIGw`

**BastropTX EDC** — Official channel, linked from https://www.bastropedc.org/ as https://www.youtube.com/BastropTXEDC.
- **Channel:** https://www.youtube.com/channel/UCywGUWHDfZx25nzRx27pI7w (ID `UCywGUWHDfZx25nzRx27pI7w`)
- **Covers:** Promotional videos only (two uploads). Board of Directors meetings are on Bastrop TX Network, not this channel.
- **Latest upload:** Sept. 24, 2025 — “Bastrop - Primed for Growth.”
- **Feed (standard, 404 from this host):** `https://www.youtube.com/feeds/videos.xml?channel_id=UCywGUWHDfZx25nzRx27pI7w`

**Discover Bastrop (Visit Bastrop)** — Channel title “Discover Bastrop,” handle https://www.youtube.com/@visitbastrop5961. The tourism site https://www.visitbastrop.com/ redirects to https://www.discoverbastroptx.org/ (200), which uses the Discover Bastrop name and Facebook https://www.facebook.com/DiscoverBastropTX/. The homepage did not expose a clean channel link in the HTML.
- **Channel:** https://www.youtube.com/channel/UCUAgPntbcnLCbx7SNEV18EQ (ID `UCUAgPntbcnLCbx7SNEV18EQ`)
- **Covers:** Tourism and event videos (Opera House, kayaking, Mardi Gras, Big Bang celebration, a short “Bastrop Live” clip). Not a news or meeting source.
- **Latest activity:** Videos are listed on the channel (first item: “Bastrop Live”). Exact upload dates could not be confirmed from this host; individual videos were not extractable (YouTube returned “not available” to the metadata client).
- **Feed (standard, 404 from this host):** `https://www.youtube.com/feeds/videos.xml?channel_id=UCUAgPntbcnLCbx7SNEV18EQ`

### YouTube and board portals — school districts

**Bastrop ISD board meetings (“Boardroom Boardroom”)** — This is the official board livestream account, even though the YouTube name is generic. The district’s Live Video Stream page (https://www.bisdtx.org/about-bisd/board-of-trustees/live-video-stream, 200) links to https://www.youtube.com/@boardroomboardroom2301/streams and to individual meeting videos on this channel. Agendas/minutes: https://meetings.boardbook.org/Public/Organization/1914.
- **Channel:** https://www.youtube.com/channel/UC8Txvten33I3SQ6y5a5aGtw (ID `UC8Txvten33I3SQ6y5a5aGtw`)
- **Covers:** Board of Trustees regular and special meetings (livestream VODs). Upcoming dates are pre-listed on the streams tab into 2027.
- **Latest completed meeting:** Oct. 20, 2026, uploaded Oct. 21, 2026 (https://www.youtube.com/watch?v=bcoNIQvZ-AY). Next scheduled livestream on the tab: Nov. 17, 2026.
- **Feed (standard, 404 from this host):** `https://www.youtube.com/feeds/videos.xml?channel_id=UC8Txvten33I3SQ6y5a5aGtw`

**Bastrop ISD (district communications)** — Official comms channel, listed on the district site as https://www.youtube.com/user/TheBastropISD/featured and https://www.youtube.com/@BastropISD.
- **Channel:** https://www.youtube.com/channel/UCt_oytyw2_mYeH2D-aK7Sgg (ID `UCt_oytyw2_mYeH2D-aK7Sgg`)
- **Covers:** District features, VATRE explainers, first-day and awards videos — not the board livestreams.
- **Latest listed videos:** “What exactly is a VATRE?” and “First Day of School 26-27” appear first on the Videos tab. Some individual videos were not extractable from this host, so exact upload dates were not confirmed.
- **Feed (standard, 404 from this host):** `https://www.youtube.com/feeds/videos.xml?channel_id=UCt_oytyw2_mYeH2D-aK7Sgg`

**EISD Media (Elgin ISD)** — Channel that posts Elgin ISD school board meetings and district videos.
- **Channel:** https://www.youtube.com/channel/UCAhnregqlkNFKkhZAjirEFA (ID `UCAhnregqlkNFKkhZAjirEFA`)
- **Covers:** Regular and special board meetings and workshops (uploaded as regular videos, often below short promo clips on the Videos tab), plus campus/communications videos. Live public access for some meetings is also posted as Zoom links on BoardBook: https://meetings.boardbook.org/Public/Organization/Elgin (200; a Nov. 16, 2026 workshop/special meeting notice included a Zoom join link).
- **Latest upload:** Nov. 6, 2026 — “Elgin ISD - Special School Board Meeting - November 5, 2026.” The most recent regular meeting on the channel is Oct. 26, 2026 (uploaded Oct. 27, 2026).
- **Feed (standard, 404 from this host):** `https://www.youtube.com/feeds/videos.xml?channel_id=UCAhnregqlkNFKkhZAjirEFA`

**EISD Live Broadcasts** — A second Elgin ISD channel, https://www.youtube.com/c/eisdlivebroadcasts / https://www.youtube.com/@eisdlivebroadcasts.
- **Channel:** https://www.youtube.com/channel/UCpmtEzNGr6Rzb7ksTOjFISw (ID `UCpmtEzNGr6Rzb7ksTOjFISw`)
- **Covers:** Ceremony livestreams (e.g., Edgewood HS Graduation 2026). No Videos tab; not the board-meeting channel.
- **Feed (standard, 404 from this host):** `https://www.youtube.com/feeds/videos.xml?channel_id=UCpmtEzNGr6Rzb7ksTOjFISw`

**Smithville ISD board recordings (Quorum + Google Drive)** — No district YouTube board channel was found.
- **Portal:** https://quorum.sparqdata.com/Public/Organization/1738 (200)
- **Covers:** Agendas, minutes, and “Recorded Meeting URL” links. Recordings are Google Drive files, not YouTube or Zoom archives (older 2020–2021 items did use Zoom webinar links).
- **Latest recording:** Regular meeting of Oct. 19, 2026, at https://drive.google.com/file/d/1EbV7Yn79g3_6SUPTSf9NskmmoKtx4FFB/view. A Nov. 16, 2026 regular meeting is posted as upcoming (no recording yet).
- **Feed:** None.

**McDade ISD** — No board-meeting video channel or portal was verified. Do not use similarly named out-of-state “McDade” school board videos.

### Bastrop County Commissioners Court — no official video archive found

The county posts agendas and packets in CivicWeb (https://bastropco.civicweb.net/filepro/documents/122048/, 200) and meeting information at https://www.bastropcounty.gov/page/com.information (200). A sampled Oct. 26, 2026 agenda HTML had no YouTube, Facebook, or Zoom playback link (CivicWeb’s own “Video” UI label is not a meeting recording). No official county YouTube channel, Swagit, Granicus, or Municode Meetings video archive was found.

**LIVTX – League of Independent Voters of Texas (unofficial)** is currently the only verified public archive of recent Commissioners Court sessions.
- **Channel:** https://www.youtube.com/channel/UCfKLuiPFufPzyg1qvYQGhWQ (ID `UCfKLuiPFufPzyg1qvYQGhWQ`)
- **Covers:** Independent recordings of Bastrop County Commissioners Court, often split into parts. This is not an official county source; attribute clearly and confirm actions against the CivicWeb agenda/minutes.
- **Latest upload:** Nov. 14, 2026 — “Bastrop Commissioners Court, Nov. 9, 2026 Part 1” and Part 2.
- **Feed (standard, 404 from this host):** `https://www.youtube.com/feeds/videos.xml?channel_id=UCfKLuiPFufPzyg1qvYQGhWQ`
Third-party event calendars sometimes list Zoom numbers for upcoming court sessions; those were not confirmed on an official county page, so they are not listed here.

### YouTube — local churches (verified in Bastrop County)

These are useful for the church-events beat and community features, not general news. Several other churches appear to post only on Facebook, which was not readable from this host and is omitted.

**Calvary Baptist Church Bastrop** — https://www.youtube.com/c/cbcfamily / https://www.youtube.com/channel/UCrqdqLHXM_Afv0v8_St4pIA (ID `UCrqdqLHXM_Afv0v8_St4pIA`). Weekly sermon videos. Latest upload: Nov. 9, 2026, “Judges Week 6.” Feed: `https://www.youtube.com/feeds/videos.xml?channel_id=UCrqdqLHXM_Afv0v8_St4pIA` (404 from this host).

**Calvary Bastrop (Calvary Episcopal)** — https://www.youtube.com/c/CalvaryBastrop / https://www.youtube.com/channel/UCAAkhMzsJLwARl3dKYYkF1A (ID `UCAAkhMzsJLwARl3dKYYkF1A`). Sunday worship livestreams on the Live tab. Latest: service of Nov. 8, 2026, uploaded Nov. 9, 2026. Feed: `https://www.youtube.com/feeds/videos.xml?channel_id=UCAAkhMzsJLwARl3dKYYkF1A` (404 from this host).

**FBCE Worship (First Baptist Church Elgin, TX)** — Officially linked from https://fbcelgin.org/sermons as https://www.youtube.com/fbclive. Channel: https://www.youtube.com/channel/UCuEN6Zh3namY0AqpnOKcQzw (ID `UCuEN6Zh3namY0AqpnOKcQzw`). Sunday 9:45 a.m. livestreams. Latest completed: “FBC Elgin Live - 11/08/2026”; upcoming streams are already listed for Nov. 15, 22, and 29, 2026. Feed: `https://www.youtube.com/feeds/videos.xml?channel_id=UCuEN6Zh3namY0AqpnOKcQzw` (404 from this host).

**First United Methodist Church of Elgin, TX** — https://www.youtube.com/@fumcelgintx / https://www.youtube.com/channel/UC-cZkYgPWRs7eB4b_iEr_nA (ID `UC-cZkYgPWRs7eB4b_iEr_nA`). Weekly worship livestreams. Latest: “Worship Service 11/08/2026,” uploaded Nov. 9, 2026. Feed: `https://www.youtube.com/feeds/videos.xml?channel_id=UC-cZkYgPWRs7eB4b_iEr_nA` (404 from this host).

**FUMC Bastrop, Texas** — https://www.youtube.com/channel/UC5K6hUYDD0Uecv0BjWAf9yg (ID `UC5K6hUYDD0Uecv0BjWAf9yg`). Service recordings and a short promo. Latest upload: Aug. 3, 2026, “Introducing ‘The Table’ Contemporary Worship.” The most recent full service on the channel is the Dec. 24, 2025 Christmas Eve service (uploaded Dec. 25, 2025). Feed: `https://www.youtube.com/feeds/videos.xml?channel_id=UC5K6hUYDD0Uecv0BjWAf9yg` (404 from this host).

**FBC Bastrop** — https://www.youtube.com/channel/UCEMXOvBvA-fOYShoFsdq92A (ID `UCEMXOvBvA-fOYShoFsdq92A`), also pointed to from https://fbcbastrop.org/media/. Sunday messages. Latest upload: July 5, 2026, “Sunday Morning Message 7/05/26.” Less current than the Elgin and Calvary channels. Feed: `https://www.youtube.com/feeds/videos.xml?channel_id=UCEMXOvBvA-fOYShoFsdq92A` (404 from this host).

Not listed: a “Smithville United Methodist Church” channel exists, but its videos were not playable from this host, so it is unverified for monitoring. A YouTube channel named “Elgin Baptist Church” is a Scotland congregation, not Elgin, Texas. “St. Anne Episcopal Church” is not a Bastrop County parish.

### Austin TV station video pages (Bastrop coverage)

These are regional stations that periodically file Bastrop County video stories. None has a YouTube channel dedicated to the county. Use the pages below plus, where it works, the station RSS already listed in the feed test summary, filtered for Bastrop, Elgin, Smithville, Cedar Creek, and McDade.

**KXAN (NBC Austin)** — https://www.kxan.com/news/local/bastrop-county/ is a working Bastrop County topic page (confirmed via page fetch; a direct curl from this host received HTTP 403). It lists county headlines, including data-center, crash, and fire stories, some of which have accompanying video. The sitewide RSS https://www.kxan.com/feed/ was confirmed working again this check (HTTP 200, `application/rss+xml`); filter for county place names (no Bastrop items were in the current 29-item snapshot). Note: https://www.kxan.com/video/bastrop/ loads the general KXAN Video Center, not a Bastrop-only video list, and should not be used as a county filter.

**KVUE (ABC Austin)** — No dedicated Bastrop tag or topic page was found. The newsroom is https://www.kvue.com/; video stories historically appear under `/video/news/...` paths, but a previously indexed Bastrop video URL returned 404 on this check, so individual video links should be verified before use. The working monitor path is the site RSS already documented, https://www.kvue.com/feeds/syndication/rss/news (HTTP 200 this check), plus Google News, filtered for county place names (no Bastrop items in the current 40-item snapshot). A `/search?q=Bastrop+County` URL returned 403 from this host.

**FOX 7 Austin** — Dedicated tag page: https://www.fox7austin.com/tag/us/tx/bastrop-county (HTTP 200). Covers Bastrop, Elgin, and county crime, crashes, elections, and city news, with both articles and `/video/fmc-...` video pages. Latest dated item on the page this day: “ICE in Texas: Bastrop officials 'aware' of agency presence in city,” Nov. 12, 2026, 1:33 p.m. CST. A Cedar Creek sub-tag also exists: https://www.fox7austin.com/tag/us/tx/bastrop-county/cedar-creek. No useful FOX 7 RSS was found earlier; keep using this tag page and Google News.

**KEYE / CBS Austin** — No dedicated Bastrop tag page was found. The newsroom is https://cbsaustin.com/ (200). A site search works: https://cbsaustin.com/search?search_api_fulltext=Bastrop (200). Use that search or Google News. No RSS was found earlier.

**Spectrum News 1 Austin** — Regional homepage https://spectrumlocalnews.com/tx/austin (200). No dedicated Bastrop tag page was found, and a `/search?q=Bastrop%20County` URL returned 404. Coverage is occasional rather than a standing county beat. A recent verified story is “Voters can clear up confusion over Bastrop liquor licensing,” published 8:35 a.m. CST Nov. 2, 2026, at https://spectrumlocalnews.com/tx/austin/news/2026/11/02/voters-can-clear-up-confusion-over-bastrop-liquor-licensing. Monitor via Google News rather than a station video index.

### Meeting-platform summary (what is actually used)

| Platform | Used by | Video? |
|---|---|---|
| YouTube (official channels above) | City of Bastrop, Elgin, Smithville; LPGCD; BISD board; Elgin ISD; churches | Yes — primary archive |
| Facebook Live | City of Bastrop Council (live); others may post, but were not readable here | Live only; on-demand is YouTube for Bastrop |
| Municode Meetings | City of Bastrop agendas/minutes | Directory has a Video column; no playable files found |
| CivicWeb | Bastrop County Commissioners Court documents | Agendas/minutes only |
| CivicPlus Agenda Center / CivicMedia | Elgin and Smithville agendas; LPGCD CivicMedia | CivicMedia is a legacy LPGCD video archive (not current) |
| BoardBook | BISD and Elgin ISD agendas; Elgin ISD sometimes adds Zoom | Zoom for live access, not a video archive |
| Quorum (Sparq) + Google Drive | Smithville ISD | Yes — Drive recordings |
| Swagit / Granicus | None found in this county | — |
