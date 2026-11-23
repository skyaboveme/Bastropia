# Bastropia /directory: mobile-first design spec

Owner: Bastropia Businesses (directory data and UX). Builder: Site Designer.
Audited: live https://bastropia.com/directory, Sun Nov 22 2026, ~7:30 PM CT. Code read at origin/main 24375cf (directory.astro, BaseLayout, InstallPrompt, global.css, directoryCategories.ts).
Evidence: screenshots in `/workspace/directory/ux/` (`m390-*` = iPhone 390×844, `m360-*` = 360×780, `d1280-*` = desktop, all at DPR 2). Raw numbers are in `measure-m390.json`, `measure-m360.json`, and `measure-d1280.json`. The capture script is `pw/cap.mjs`.
Wireframes: `wireframe/mobile-mockups.png` (4 frames), `wireframe/mock-1.png` … `mock-4.png`, `wireframe/result-card.png`, source `wireframe/mock.html`.

---

## 0. The job to be done

A resident is standing in a kitchen with a leak, or in a truck in Elgin at lunch. They need three things:
1. Type "plumber" or tap a town, and **see results without scrolling**.
2. Tell at a glance **who, where, and whether they're open**.
3. **Call or get directions with one thumb tap.**

Everything else (partners, ads, list-your-business, browse atlas) is secondary and must not sit between the user and those three steps.

---

## 1. What we measured (live, iPhone 390×844 unless noted)

| Metric | 390×844 | 360×780 | Target |
|---|---|---|---|
| Y of the search input (top) | **721 px** | **796 px (below the fold)** | ≤ 140 px |
| Y of the first result | **2,180 px** (2.6 screens) | 2,327 px | Results mode ≤ 160 px; browse mode n/a |
| Site masthead before the H1 (date bar, logo, weather, 8 condition tiles, nav) | ~590 px | ~665 px | ≤ 56 px on directory routes |
| Results visible while typing (keyboard up) | **0**: results render below the input, under the keyboard | 0 | ≥ 2 |
| Result card height (avg / max) | 216 / 354 px (all), 157–201 avg filtered | 245 / 411 px | ≤ 130 px avg, so 5 per screen |
| Tap targets < 44 px on first load | **97** | 115 | 0 in directory UI |
| Search input height | 42 px | 42 px | ≥ 48 px |
| Input font-size | 16 px (OK, no iOS zoom) | 16 px | ≥ 16 px ✓ |
| Horizontal page overflow | none (town-card strip scrolls on purpose) | none | ✓ |
| Sticky/fixed chrome | slim-bar 57 px on scroll; sections-bar 55 px (115 px at 360 because the nav wraps to 2 rows) | | ≤ 56 px total, and it should carry the search |
| Modal | **"Add Bastropia to your home screen" opens at 6 s on iOS**, covering the page mid-search | same | never on /directory* or listing pages |
| Image bytes on first load | **930 KB**. ~790 KB is 6 partner banner JPGs inside the *collapsed* "Ads and partner pages" `<details>` | | ≤ 150 KB |
| HTML | 454 KB decoded / 89 KB transferred; **353 KB is the inline search index of all 960 rows** | | ≤ 60 KB HTML; index lazy and cached |
| Fonts | 3 families, ~222 KB | | ≤ 2 families or subset |
| LCP (lab) | 640 ms (H1) | 384 ms | ✓ (keep it) |
| CLS (lab) | 0.054 | 0 | < 0.05 |
| Data coverage (from the live index, 960 rows) | phone 96%, address/maps 71%, website 66%, **hours 1% (6 rows)**, summary 1%, logo 0%, **no town 282 (29%)** | | |

### Search quality (same matcher as the live page, run on the live index)
| Query | Hits | Problem |
|---|---|---|
| `plumber elgin` | **0** | multi-word queries are matched as one substring; the town isn't in the haystack |
| `restaurants smithville` | **0** | same |
| `tacos` | **0** | there are 5–6 Mexican restaurants; no synonyms |
| `hvac`, `ac repair` | **0** | 7 HVAC businesses exist under "air conditioning" |
| `barbecue` | 0 | `bbq` finds 2 |
| `haircut`, `pharmacy`, `grocery`, `daycare`, `gas` | 0 | synonyms missing, or real data gaps |
| `eat` | 70 | substring noise: matches "Heat**ing**" (String Prairie), etc. |
| `vet` | 4 | substring noise: "**Vet**erans of Bastrop County", "Elgin Farmers' Market" |
| `church` | 30 | includes Airrosti (address "Church St") |

---

## 2. Top problems (with screenshots)

1. **The directory doesn't start until ~600 px down.** The site-wide masthead (date bar, logo, weather, burn ban, 8 condition tiles, nav) fills the first screen. On 360×780 the search box is entirely below the fold. → `m390-01-initial-fold.png`, `m360-01-initial-fold.png`
2. **Typing shows nothing.** Results paint ~160 px below the input, under the iOS keyboard, and the heading still says "All businesses". The user can't tell search worked. → `m390-03-search-plumber.png` (input with no visible results), `m390-03-search-plumber-results.png`
3. **A home-screen install modal interrupts at 6 s** on every first iOS visit, including mid-search. → `m390-01b-install-popup-6s.png`
4. **Search misses how people talk:** "plumber elgin" = 0, "tacos" = 0, "hvac" = 0; "eat" matches heating companies. → table above, `m390-03-search-tacos-results.png`
5. **Browse mode is 2.5 screens of tiles before any business.** 15 category cards are 120–150 px each, and the town strip is 75 px cards. The unfiltered list then starts with partners, followed by "(888) Agent 01", "1080Motion Inc.", "10th Planet Airlock". → `m390-02-scrolled-1screen.png`, `m390-02-scrolled-2screens.png`
6. **Cards are tall:** 157–216 px avg and up to 354 px (602 Brewing shows full weekly hours plus summary), so only 3–4 per screen. Action buttons are 38 px and wrap to a second row ("Website" alone on a line). → `m390-02-scrolled-2screens.png`, `m390-05-elgin-food.png`
7. **Empty state is a dead end:** "No businesses. Nothing matches that search." No suggestions, no "did you mean", and it doesn't offer to drop the town filter. → `m390-07-empty.png`, `m390-03-search-tacos-results.png`
8. **"Countywide" is shown for 282 listings that simply have no address** (e.g. "Easy Plumb Co. · Countywide"). This misleads the user and pollutes the Countywide filter. → `m390-03-search-plumber-results.png`
9. **Listing pages bury the business:** on a free listing the H1 is at ~710 px and on the partner page at ~800 px, both under the same masthead. → `m390-08-free-listing.png`, `m390-09-partner-listing.png`. Submit page: H1 at ~700 px → `m390-10-submit.png`
10. **Weight:** ~790 KB of partner banner images load even though their `<details>` is closed, and 353 KB of JSON is inlined into every directory HTML response (`directory.astro` lines 127–155, 301–305, 342).
11. **Taxonomy skew:** "Professional Services" holds 196 rows (banks, insurance, printing, transport, IT…) and "Community & Nonprofit" 132 (includes government). Pet services sit under Health & Wellness. Home Services has only 69, while plumbing/HVAC/electric live partly in Construction & Trades. People think in "Home repair", "Money & legal", "Pets".
12. **Small targets:** search 42 px, clear × 38 px, suggestion chips 33 px, `<summary>` 32 px, card buttons 38 px, Show more 38 px, utility links 21 px, social icons 23 px.

---

## 3. Spec

### P0: must fix (ship together; directory routes only unless noted)

**P0-1 Compact chrome on directory routes** (`/directory`, `/directory?*`, free listing `/[slug]`, partner pages, `/directory/submit`)
- Replace the full masthead with a single **48–56 px bar**: wordmark (links home) · optional one-line status "62° · No burn ban" (tap → /now) · ☰ menu (44×44).
- No date bar, no condition tiles, no second nav row. Add a `compactHeader` prop to BaseLayout/Header and pass it from these pages.
- Also fix the 360 px nav wrap site-wide: sections-bar becomes 115 px tall at 360 because "SECTIONS" and the links wrap.
- **Acceptance:** search input top ≤ 140 px at 360×780 and 390×844; listing H1 ≤ 120 px.

**P0-2 Kill interruptions on directory routes**
- Don't mount `InstallPrompt` (or any newsletter/election pop) on directory routes. Elsewhere, never open it while an input has focus.
- **Acceptance:** no `dialog[open]` within 30 s on /directory at an iPhone UA.

**P0-3 Search that shows results where the eye is**
- When the user focuses the search (or types), the search bar becomes **sticky at top:0** (it replaces the slim-bar there). Scroll so the input sits at the top, and render results **directly beneath it** in results mode, with browse tiles hidden.
- Heading reflects the query: **"3 plumbers in Elgin"**, not "All businesses". `aria-live="polite"` on the count (already present).
- Input: height ≥ 48 px, font-size ≥ 16 px (keep), `type="search"`, `enterkeyhint="search"` (keep), `autocapitalize="none"`, `autocorrect="off"`, `spellcheck="false"`. **No autofocus** (it would pop the keyboard over the browse tiles on load). Enter = `input.blur()` so the keyboard drops and results show.
- Clear button 44×44.
- Debounce 120 ms; URL `?q=` via `replaceState` (keep).
- **Acceptance:** at 390×844 with a ~300 px keyboard, ≥ 2 result names are visible while typing "plumber".

**P0-4 Search matching** (client-side, same index)
- Tokenize the query; **all tokens must match** (AND), each token matching on **word starts**, not raw substrings (fixes eat→heating, vet→veterans).
- **Town tokens are filters:** if a token equals a town (`elgin`, `smithville`, `cedar creek`, `paige`, `mcdade`, `bastrop`, `red rock`, `rosanky`, `dale`, `wyldwood`, `camp swift`), apply it as the town filter and drop it from the text query ("plumber elgin" → q=plumber, town=Elgin).
- Haystack: name, raw category, public group label, town, **synonym tags**.
- Synonym map v1 (I'll own and extend it as `src/data/directorySynonyms.ts`, data only):
  `tacos|taco|mexican|tex-mex → Mexican restaurants`; `bbq|barbecue|brisket`; `hvac|ac|a/c|ac repair|air conditioning|heating`; `vet|veterinarian|animal hospital|pet`; `mechanic|auto repair|oil change|tires|brakes`; `haircut|barber|salon|hair`; `doctor|clinic|urgent care|physician`; `lawyer|attorney|law firm`; `realtor|real estate agent`; `pharmacy|drugstore`; `grocery|groceries|supermarket`; `daycare|childcare|preschool`; `church|worship` (exclude address-only matches); `food|eat|restaurant|dining|lunch|dinner|breakfast`.
- Rank: exact name prefix > name word > synonym/category > address. Partners and featured only win ties, never outrank a better text match.
- **Acceptance:** `plumber elgin` > 0; `tacos` ≥ 5; `hvac` ≥ 7; `eat` and `vet` return no heating companies or veteran groups.

**P0-5 Compact result card** (see `wireframe/result-card.png`)
```
┌──────────────────────────────────────────┐
│ [icon40]  Business Name (Fraunces 18/1.15, ≤2 lines)  [Partner]
│           Plumbing · Elgin  [Open now]   (14px, soft)
│           714 Hwy 71 W, Elgin            (14px, 1 line, ellipsis)
│ [ 📞 Call ][ ➤ Directions ][ 🌐 ]         (44px tall, one row)
└──────────────────────────────────────────┘
```
- Row 1: name (links to the listing page). Badge only for Partner/Featured, small, after the name.
- Row 2: `trade · town`. **If there's no town, show "Bastrop County"**, not "Countywide", and add "· no address listed" in soft text.
- Row 3: one-line address (ellipsis). Omit if none.
- Hours: **never print the full weekly schedule on a card**. Show an "Open now" / "Closes 9 PM" / "Closed" pill when hours are parseable; otherwise nothing. Full hours go on the listing page.
- Summary/daily special: hide on mobile cards (listing page only), or 1 line max for partners.
- Actions: one row in a 3-column grid. **Call** (sun, primary) · **Directions** (if address) or **Website** · overflow icon button (website/Facebook/share). Each ≥ 44 px tall, ≥ 8 px apart. The Call label is just "Call"; the full number goes on the listing page (it's already tappable).
- No phone and no address → the button row becomes "Website" / "Facebook" / "Details".
- Card: white, 1 px line border, 14 px radius, 12 px padding, 8 px gap between cards.
- **Acceptance:** avg card ≤ 130 px and max ≤ 170 px at 390 wide; 5 cards visible per 844 px screen in results mode.

**P0-6 Filters that combine and stay put**
- Below the sticky search: a horizontally scrolling **chip row**: `📍 Town ▾` · `Category ▾` · `Sort ▾` (plus `Open now` later, P1). Active chips are filled pine with "×" to remove. Chips are 40 px tall with 44 px hit areas (padding).
- Tapping `Town`/`Category`/`Sort` opens **one bottom sheet** (`<dialog>` with `showModal`, focus-trapped; Esc and swipe-down close it). It has town chips, a category list with live counts **scoped to the other filter**, sort, and a primary button **"Show N places"**. See `wireframe/mock-3.png`.
- Town and category never reset each other or the query. All three live in the URL (`?q=&town=&category=&sort=`) so Back works and links are shareable.
- On desktop ≥ 1024 px the same controls render as a left sidebar.

**P0-7 First screen in browse mode** (no query, no filters). See `wireframe/mock-1.png`
1. Compact bar (P0-1).
2. H1 "Find a local business" (25 px) + "960 businesses across Bastrop County" (14 px).
3. Search (48–52 px) with placeholder "Plumber, tacos, dentist…".
4. Town chip row (All · Bastrop · Elgin · Smithville · Cedar Creek · Paige · McDade · Red Rock · Rosanky · Dale…); single-select, scrolls sideways, counts in the sheet only.
5. "Browse": a **3-column icon grid of 12 groups**, ~82 px tiles (icon + label, no counts).
6. "Popular": 5 text links (Plumber, AC repair, Mexican food, Vet, Mechanic), each a ≥ 44 px hit area.
7. A thin footer strip, "Own a business here? **List it free →**", at the end of the first screen. It isn't a full-width yellow button competing with search.
- **Don't render the A–Z list of all 960 in browse mode on mobile.** The first business appears only after a search, town, or category. (Desktop can keep a list.)
- Move "Ads and partner pages" out of `/directory` mobile entirely, or render it after results with lazy images (see P0-8).
- **Acceptance:** at 390×844 everything in items 1–6 sits above the fold.

**P0-8 Performance budget**
- **Lazy-load partner banner images** (`loading="lazy"` plus `decoding="async"`), and don't render HomeBanner inside a closed `<details>`. Better: move it below results and only render it when its section is opened or scrolled into view. Saves ~790 KB per visit.
- **Move the search index out of the HTML** into `/directory/index.json` (cacheable, ETag/`s-maxage`, ~60 KB br). Keep only the 24 server-rendered rows in HTML. Fetch the index on first search focus or `requestIdleCallback`. Trim fields to what the card needs (no summary, no hours text, just an `open` hours code).
- Don't preload `header/directory.webp` (67 KB) when the compact header is used.
- Budget on mobile 4G, first load of `/directory`: **HTML ≤ 60 KB decoded, ≤ 200 KB total transfer excluding fonts, LCP ≤ 1.5 s, CLS < 0.05, INP < 200 ms while typing.**

**P0-9 Empty state that rescues the search**
- "No matches for **tacos** in **Elgin**." Then, in order:
  - Retry county-wide ("**5 matches** in all of Bastrop County →") when a town filter is on.
  - Did-you-mean / synonym ("Try **Mexican restaurants** (6)").
  - 3–4 group tiles.
  - "Know a business we're missing? **Tell us**" → /directory/submit.
- Never show a bare "No businesses."

### P1: next

- **P1-1 Taxonomy for people, not the chamber:** 12 public groups (data owner: me; I'll send the remap as a data file):
  🍽️ Food & Drink · 🔧 Home Repair (plumbing, HVAC, electric, pest, cleaning, landscaping, pools, locksmith) · 🏗️ Builders & Contractors (construction, roofing/solar, remodeling, engineering, supplies) · 🩺 Health & Medical (clinics, dental, chiro, therapy, senior care) · 💇 Beauty & Fitness · 🚗 Auto · 🛍️ Shopping · ⚖️ Money & Legal (banks, insurance, accountants, attorneys) · 🏠 Real Estate & Housing · 🛏️ Places to Stay · 🌲 Things to Do (recreation, venues, attractions) · ⛪ Churches & Community (nonprofits, civic, government).
  B2B rows (marketing, IT, manufacturing, utilities, storage, printing) go into "Business Services", reachable via search and the sheet's "More" list but not on the 12-tile grid. 🐾 Pets becomes a synonym/sub-filter.
- **P1-2 Sort:** default is **relevance** with a query and **A–Z (letters before digits/punctuation)** without. Add "📍 Nearest" via an explicit tap → `navigator.geolocation` (never on load). It needs lat/lng on rows; I'll geocode the 682 rows with addresses. Rows without coordinates sort last under "No address listed".
- **P1-3 Open-now:** only 6 of 960 rows have hours. Show the pill only when hours parse to a structured `hours_json`. I'll backfill hours from Google Business data for food/auto/health first, then add an `Open now` filter chip once ≥ 30% of a group has hours.
- **P1-4 Pagination:** keep "Show 24 more" (full-width, 48 px) with "Showing 24 of 164" above it. Keep `?page=` server fallback for no-JS/SEO. When appending, move focus to the first new card for screen readers.
- **P1-5 Back-to-top:** 48 px round FAB bottom-right after 2 screens of scroll. It hides while the keyboard is open and respects `prefers-reduced-motion`.
- **P1-6 Listing page layout** (`wireframe/mock-4.png`): compact bar → "‹ Back to results" (history.back when the referrer is /directory, else the group+town link) → kicker `Trade · Town` → H1 → action grid: **Call (full width)**, Directions, Website/Share (each 52 px) → Address / Hours (or "Not listed yet · Know them? Tell us") / Phone / Website / Facebook rows → "More [group] in [town]" (3–5 compact rows with call icons) → "Own this business? Update this listing" → (free only) soft upsell to a partner page.
  After 1 screen of scroll, a **sticky bottom bar** with Call + Directions (56 px, safe-area-inset aware). Partner pages get the same compact bar and the same sticky action bar. Their hero images need `srcset`/WebP: team.jpg 622 KB and van.jpg 561 KB today.
- **P1-7 Submit CTA placement:** one quiet strip at the end of the browse screen, one line in empty states, and one link at the bottom of results ("Missing a business? Add it free"). Remove the full-width yellow "List your business free" button that sits between search and results on mobile; it's the most prominent element after the search box today. On /directory/submit, put the form in the first screen (compact bar) and keep the 16.6 px / 47–49 px fields (already good).
- **P1-8 Town pages:** `/elgin` etc. should link to `/directory?town=Elgin` with a "Businesses in Elgin (158)" module.

### P2: polish

- Desktop ≥ 1024: two columns (filters sidebar 280 px + results), cards in 2 columns at ≥ 1280.
- Recent searches (localStorage, 5 max) shown under the focused empty search.
- Share a result: `navigator.share` in the card overflow menu.
- "Verified Nov 2026" microcopy from `last_verified` on the listing page.
- Map view toggle (Leaflet, lazy) only after geocoding is done and only on tap.
- Logo thumbnails for partners only; icon tiles for the rest (logos are at 0% coverage anyway).

---

## 4. Accessibility checklist
- All interactive targets ≥ 44×44 CSS px with ≥ 8 px spacing (WCAG 2.5.5 AAA / Apple HIG). Currently 97 targets fail on first load.
- Text ≥ 14 px on cards and ≥ 16 px for inputs. Contrast ≥ 4.5:1 (check `--ink-soft #55625b` on white = 6.4:1 ✓; `.badge` uses `--river #17b7d4` text on white = **2.4:1, fails**; switch badge text to `--river-deep #0a7590` = 5.3:1).
- The search has a visible label or an `aria-label`. The result count is `aria-live="polite"` (keep). The heading updates with the query.
- The bottom sheet is a `<dialog>` with `aria-labelledby`, focus trap, and Esc to close, and it returns focus to the chip that opened it.
- Chips: town single-select uses `aria-pressed` or a radiogroup. Remove buttons have accessible names ("Remove Elgin filter"; keep the existing `.sr` spans).
- Card links: Call is labeled "Call Doug the Plumber, (512) 629-7408" via `aria-label`. Directions/Website say they open a new tab.
- Respect `prefers-reduced-motion` for sticky transitions and the FAB scroll.
- Works without JS: the server-rendered form + `?q=&town=&category=&page=` (already true; keep).

## 5. Acceptance test (re-run `pw/cap.mjs`)
- 360×780 and 390×844: search top ≤ 140 px; no dialog within 30 s; `plumber elgin` → results visible above a 300 px keyboard; avg card ≤ 130 px; 0 directory targets < 44 px; total image transfer on /directory ≤ 150 KB; HTML ≤ 60 KB decoded; CLS < 0.05.

## 6. Data work that the design depends on (mine, not Site Designer's)
- Town for the 282 no-town rows (address lookup), so "Bastrop County / no address" shrinks.
- Synonym file + 12-group remap (P0-4, P1-1).
- Structured hours (P1-3) and lat/lng (P1-2).
- Person-name listings that slipped in (e.g. "Adena Lewis") and junk names that sort first ("(888) Agent 01").
