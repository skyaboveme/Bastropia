# Bastrop County government — monitoring URLs and agenda workflow

Researched Monday, Nov. 16, 2026 (America/Chicago). HTTP checks used curl and direct page fetches. CivicWeb’s public Document Center was reachable (HTTP 200). The signed-in CivicWeb Portal was not.

Use this file for the daily/weekly check. The narrative knowledge base is in `county-government.md`.

County site aliases that resolve to the same official site: `https://www.bastropcounty.gov/` and `https://www.co.bastrop.tx.us/`.

---

## What to check, in order

Do this at least twice a week, and every weekday in the week before a regular Commissioners Court date (2nd and 4th Mondays, with posted exceptions).

1. **County Clerk agenda page** (catches working sessions and notices that CivicWeb often does not):  
   https://www.bastropcounty.gov/page/co.county_clerk_Courtagendas
2. **CivicWeb 2026 Commissioners Court agendas folder** (HTML agendas + large PDF packets):  
   https://bastropco.civicweb.net/filepro/documents/122048/
3. **Commissioners Court official page** (upcoming dates, participation forms, archive link):  
   https://www.bastropcounty.gov/page/co.com_court
4. **County calendar**:  
   https://www.bastropcounty.gov/page/calendar
5. After a meeting: look for approved minutes (see the minutes gap below), then unofficial video if needed.

No public RSS or Atom feed was found for CivicWeb or the clerk agenda page on this check. Monitoring is by visiting the pages (or a simple HTTP scrape of the public HTML).

---

## CivicWeb Document Center — how it is organized

Public root: https://bastropco.civicweb.net/filepro/documents

Top-level folders visible without signing in:

| Folder | URL | What’s in it (as of Nov. 16, 2026) |
| --- | --- | --- |
| Agendas | https://bastropco.civicweb.net/filepro/documents/1009 | Mixed older attachments; not the clean year archive. Prefer folder 1021. |
| Minutes | https://bastropco.civicweb.net/filepro/documents/3515 | Points to a Commissioners Court minutes folder. |

### Commissioners Court agendas archive

Canonical archive (also linked from the county’s court page as “Commissioners Court Agenda Archive”):

https://bastropco.civicweb.net/filepro/documents/1021/

Year folders under that archive:

| Year | Folder ID | URL |
| --- | --- | --- |
| 2026 | 122048 | https://bastropco.civicweb.net/filepro/documents/122048/ |
| 2025 | 115345 | https://bastropco.civicweb.net/filepro/documents/115345/ |
| 2024 | 104037 | https://bastropco.civicweb.net/filepro/documents/104037/ |
| 2023 | 4514 | https://bastropco.civicweb.net/filepro/documents/4514/ |
| 2022 | 3582 | https://bastropco.civicweb.net/filepro/documents/3582/ |

Steve’s starting URL, `https://bastropco.civicweb.net/filepro/documents/122048/`, is the **2026 year folder**. It is the right daily stop for this calendar year.

Listings in the 2026 folder (checked Nov. 16, 2026) run from a Jan. 6, 2026, special session through a Nov. 16, 2026, special session. Items appear **newest first**. Each meeting usually has two files:

- **Agenda – Html** — use this first. Small (about 60–75 KB) and readable as a webpage.
- **Agenda – Pdf** — the packet. Often very large (25–100+ MB; the Sep. 14, 2026, PDF was listed at 314.9 MB). Download only when you need attachments.

The date shown next to a CivicWeb file is an upload/modified date, not always the meeting date. Example: the Aug. 24, 2026, regular-session files were dated Sep. 8, 2026, in the listing. Always trust the meeting date in the document title and on the agenda itself.

### Document URL pattern

- Folder: `https://bastropco.civicweb.net/filepro/documents/{folder_id}/`
- Document view (HTML agenda or PDF): `https://bastropco.civicweb.net/document/{document_id}`

Examples from the 2026 folder (IDs as posted Nov. 16, 2026):

| Meeting | HTML | PDF packet |
| --- | --- | --- |
| Special Session, Nov. 16, 2026 | https://bastropco.civicweb.net/document/127971 | https://bastropco.civicweb.net/document/127970 |
| Regular Session, Nov. 9, 2026 | https://bastropco.civicweb.net/document/127949 | https://bastropco.civicweb.net/document/127948 |
| Regular Session, Oct. 26, 2026 | https://bastropco.civicweb.net/document/127744 | https://bastropco.civicweb.net/document/127743 |
| Regular Session, Oct. 13, 2026 | https://bastropco.civicweb.net/document/127487 | https://bastropco.civicweb.net/document/127486 |
| Regular Session, Sep. 28, 2026 | https://bastropco.civicweb.net/document/127309 | https://bastropco.civicweb.net/document/127308 |
| Regular Session, Sep. 14, 2026 | https://bastropco.civicweb.net/document/126541 | https://bastropco.civicweb.net/document/126540 |

Agenda item backup is often linked from the HTML agenda as “AIR-26-XXX – Pdf” (and similar). Those open additional CivicWeb document pages.

HTML agendas in this folder are **regular and special sessions of Commissioners Court only**. Working sessions, hazard-mitigation workshops, and some clerk-filed notices were **not** in folder 122048 on this check.

### Minutes gap (important)

Minutes live under:

- https://bastropco.civicweb.net/filepro/documents/3515/ (Minutes)
- https://bastropco.civicweb.net/filepro/documents/3516/ (Commissioners Court)

On Nov. 16, 2026, folder 3516 showed only **2023** (`/filepro/documents/5367/`) and **2022** (`/filepro/documents/3585/`). The 2023 folder listing appeared empty (no document links; earlier tree text also showed “0 B”). There were **no 2024, 2025, or 2026 minutes folders** in the public tree.

Every regular agenda still has “Approve minutes of previous meetings; Krista Bartsch,” so minutes are being approved — they are just not posted in the public year archive, at least not where 2026 agendas are posted.

Until that changes: do not assume a vote from an agenda item. Confirm against a posted minute if one appears, a canvassing/order document, or a recording, and label anything else as what was *on the agenda* rather than what *passed*.

### CivicWeb Portal

`https://bastropco.civicweb.net/Portal/` redirected to a sign-in page. Public monitoring should stay on `/filepro/documents/` and `/document/{id}`. Do not use a signed-in portal workflow for routine news checks.

CivicWeb’s “Show Video” control on the Document Center is a UI label, not a meeting recording. A sampled agenda had no official YouTube, Facebook, Zoom, or Swagit playback link.

---

## County Clerk Commissioners Court agendas page

https://www.bastropcounty.gov/page/co.county_clerk_Courtagendas

This is the clerk’s public posting page (Krista Bartsch is clerk of the Commissioners Court). On Nov. 16, 2026, it listed only the most recent items, not a full-year archive:

- Commissioners Court Regular Session — Nov. 9, 2026 (PDF, 63 KB)
- Hazard Mitigation Working Session — Nov. 9, 2026 (PDF, 11.5 KB)
- Working Session — Nov. 13, 2026 (PDF, 16.3 KB)
- Hazard Mitigation Working Session — Nov. 16, 2026 (PDF, 12.9 KB)
- Commissioners Court Special Session — Nov. 16, 2026 (PDF, 108.5 KB)

PDF path pattern (filenames are URL-encoded):

`https://www.bastropcounty.gov/page/open/5620/0/{filename}`

Examples:

- https://www.bastropcounty.gov/page/open/5620/0/Commissioners%20Court%20Agenda%20November%2016%202026.pdf
- https://www.bastropcounty.gov/page/open/5620/0/Bastrop%20County%20Commissioners%20Notice%20of%20Public%20Meeting%20November%2016%202026.pdf
- https://www.bastropcounty.gov/page/open/5620/0/Bastrop%20County%20Commissioners%20Court%20Working%20Session%20November%2013%202026.pdf
- https://www.bastropcounty.gov/page/open/5620/0/Bastrop%20County%20Commissioners%20Notice%20of%20Public%20Meeting%20November%209%202026.pdf

**Why this page is required:** the Nov. 9 and Nov. 16 hazard-mitigation working sessions, and the Nov. 13 recovery-projects working session, were posted here and were **not** in the CivicWeb 2026 agendas folder. A routine that only watches CivicWeb will miss workshops and some special notices.

The clerk PDFs for regular/special sessions can be shorter than the CivicWeb HTML/PDF packet (the clerk’s Nov. 9 regular-session file was 63 KB; CivicWeb’s PDF packet was listed at 67.2 MB). Prefer CivicWeb HTML for the full item list and attachments; use the clerk page to catch meetings CivicWeb does not list.

Related clerk pages:

- Clerk home: https://www.bastropcounty.gov/page/co.county_clerk
- Public notice postings: https://www.bastropcounty.gov/page/co.county_clerk_notices
- Foreclosure notice postings: https://www.bastropcounty.gov/page/co.county_clerk_foreclosure
- Estray postings: https://www.bastropcounty.gov/page/co.county_clerk_Estray

---

## Meeting dates, location, and public comment

Best official page (current FY 2026–2027 dates): https://www.bastropcounty.gov/page/co.com_court

Older “Court Information” page, which still linked a FY 2025–2026 dates PDF on this check: https://www.bastropcounty.gov/page/com.information

- Dates order (FY 2026–2027): https://www.bastropcounty.gov/upload/page/0331/docs/Commissioners_Court_Dates_26-27.pdf
- Rules of procedure: https://www.bastropcounty.gov/upload/page/0331/docs/scanned_rules_of_commissioners_court.pdf
- Public participation form: https://www.bastropcounty.gov/upload/page/0331/docs/Public_Participation_Form.pdf

Regular terms: 2nd and 4th Mondays at 9:00 a.m., Commissioners Courtroom, 2nd floor of the annex, Bastrop County Courthouse, 804 Pecan Street, Bastrop, TX 78602, except official county holidays and dates the court resets (Oct. 13, 2026, was a Tuesday; June 7, 2027, is a first Monday). Special sessions and working sessions are posted separately.

To get on a regular-session agenda, the rules say a request must be filed and approved by at least one member of the court and/or the County Judge by 5:00 p.m. on the Tuesday before the meeting. That is a useful hint for when new agendas may appear (often mid-to-late week before a Monday meeting), but posting time is not guaranteed.

---

## Livestream / recordings

No official county livestream, YouTube channel, Swagit, Granicus, or Zoom playback for Commissioners Court was found on the court pages or on sampled CivicWeb agendas (Nov. 16, 2026).

The Nov. 13, 2026, working-session notice said the meeting would be “held virtually, via Webex,” but the public PDF did **not** include a Webex link.

Unofficial recordings: LIVTX (League of Independent Voters of Texas) has been posting recent sessions, including Nov. 9, 2026. This is not an official county source. Attribute it clearly and confirm actions against CivicWeb agendas, posted orders, or (when available) minutes. See also `sources.md`.

---

## Other official pages to watch

| Beat | URL | Notes |
| --- | --- | --- |
| County homepage | https://www.bastropcounty.gov/ | Links the adopted FY 2026–2027 budget. |
| Adopted budget FY 2026–2027 | https://www.bastropcounty.gov/upload/page/0055/docs/FY_26-27_Adopted_Budget_Report.pdf | Linked from the homepage. |
| Tax rate information | https://www.bastropcounty.gov/page/fin.tax_rates | Current order plus historical orders. |
| Order setting 2026–2027 tax rate | https://www.bastropcounty.gov/upload/page/0184/docs/Current/Order%20Setting%20Tax%20Rate%20FY26-27.pdf | Adopted Sep. 14, 2026. |
| Auditor / financial data | https://www.bastropcounty.gov/page/fin.auditor | Jennifer Pacheco. |
| Purchasing / bids | https://www.bastropcounty.gov/page/pur.home | Formal bids often advertised Wednesdays in the Elgin Courier. |
| Development Services | https://www.bastropcounty.gov/page/ds.home | Permits, floodplain, OSSF, subdivision policy. |
| 2026 subdivision regulations | https://www.bastropcounty.gov/upload/page/0157/docs/Bastrop%20County%20Subdivision%20Regulations%20-%202026%20Update.pdf | Confirm before citing a section. |
| OEM | https://www.bastropcounty.gov/page/em.home | Alerts, hazard mitigation, burn bans. |
| OEM Facebook | Check the OEM page for the current official Facebook link. | Used for emergency posts. |
| WarnCentralTexas | Registration is promoted from the OEM page. | Emergency notifications. |
| Sheriff | https://www.bastropcounty.gov/page/lec.sheriff | Maurice Cook. |
| Elections | https://www.bastropvotes.org/ | Official election results and canvass materials. The `/election-results-2/` page returned 403 to one fetch tool and an empty HTTP 202 to curl on Nov. 16, 2026 — retry in a browser if needed. |
| GIS / precinct maps | https://www.bastropcounty.gov/page/co.maps | Interactive commissioner/JP/constable map and PDF maps. |
| Public information requests | https://www.bastropcounty.gov/page/co.public_information | For minutes or records not posted. |
| Road conditions | https://www.bastropcounty.gov/page/co.road_conditions | Points to DriveTexas. |
| Lost Pines Groundwater Conservation District (not a county department, but a key water beat) | https://www.lostpineswater.org/AgendaCenter | Agenda Center is more reliable than empty RSS feeds. |
| Bastrop Central Appraisal District | https://bastropcad.org/ | Board, values, taxing units. |

---

## Suggested automated check (no login)

A daily job can:

1. Fetch `https://www.bastropcounty.gov/page/co.county_clerk_Courtagendas` and diff the PDF link list.
2. Fetch `https://bastropco.civicweb.net/filepro/documents/122048/` and diff `/document/{id}` links and titles. When a new year folder appears under https://bastropco.civicweb.net/filepro/documents/1021/, switch the watch URL.
3. Fetch `https://www.bastropcounty.gov/page/co.com_court` for newly listed special sessions or date changes.
4. Open new **HTML** agendas (`/document/{id}`) and extract item titles. Only fetch the large PDF packet if a lead needs the backup.
5. Recheck the minutes archive (`/filepro/documents/3516/`) in case 2024–2026 folders are added.

Do not treat CivicWeb’s internal/unsigned APIs as a supported method. The public HTML folder pages are enough.

---

## Access problems logged Nov. 16, 2026

- CivicWeb public Document Center: **worked** (HTTP 200). Not blocked.
- CivicWeb `/Portal/`: redirects to sign-in; not usable for public monitoring.
- CivicWeb minutes after 2022/2023: **missing or empty** in the public tree.
- `https://www.bastropvotes.org/` homepage: WebFetch succeeded; curl once returned HTTP 202 with an empty body.
- `https://www.bastropvotes.org/election-results-2/`: WebFetch returned 403; curl returned HTTP 202 with an empty body. Official canvassed totals should be confirmed from this site, the Nov. 16 canvass action, or a posted order — not assumed from unofficial media totals.
- Some official PDFs (rules, dates order, tax-rate order, precinct map) are scanned image PDFs. Text extraction may fail; open the file or render pages.
- Nov. 13 Webex working session: notice posted, join link not on the public PDF.
