---
name: bastropia-social
description: Find community highlights in PUBLIC Bastrop County Facebook groups and Pages and add them to Bastropia Social (/social). Use when asked to update Bastropia Social or scan local groups.
---

# Bastropia Social

Items live in `src/content/social/*.md` and show on `/social`. New items arrive as a pull request built from the current `origin/main`. Only add files. Never edit pages, layouts, or styles. Do not deploy from the bot branch. A merge to `main` is what publishes the new items.

## Hard rules
- PUBLIC groups and Pages only. Never read from or post about private groups, even if the account is a member.
- Never invent anything: no made-up facts, dates, prices, places or quotes. If unsure, skip it.
- Attribute every item to its group or Page (`group`, `groupUrl`, and `sourceUrl` for the post when there is one).
- Summarize in Bastropia's own words. At most a short quote.
- No personal info about private individuals: no names, photos, faces, addresses, phone numbers, plates. Officials, agencies and businesses are fine.
- Skip rumors, crime accusations, medical/legal claims and feuds unless an official source confirms them.
- Skip partisan political content. Skip buy/sell, yard sale, rental and job listings unless truly newsworthy (e.g. a business opening).
- Skip anything already covered in `src/content/events` or `src/content/news`.
- One browser pass a day. If Facebook asks for sign-in or a checkpoint, stop and tell the owner.

## Tiers
- **primary**: community/news groups with 10,000+ members. Scan every run; a normal pick is 3-8 items.
- **standout**: everything else. Use only for standout items (openings/closings, road or safety news, lost/found pets, community wins, notable local discussion).

## Front matter
```yaml
title: ""
summary: ""         # one or two sentences, own words
pubDate: 2026-11-01
group: ""
groupUrl: https://www.facebook.com/groups/...
tier: primary        # or standout
topic: ""            # optional: food, pets, roads, business, community...
city: ""             # optional
sourceUrl: ""        # optional: link to the post
```
File name: `YYYY-MM-DD-short-slug.md`.

## Sources (public only, from the owner's group sheet)

### Primary (10,000+ members)
- La Grange, Giddings, Smithville, And Surrounding (43,000; Bastrop-area items only) https://www.facebook.com/groups/710447252326417
- Living in Bastrop County (36,000) https://www.facebook.com/groups/bastropcountytx
- Bastrop County Foodies (26,000) https://www.facebook.com/groups/bastropcountyfoodies
- Totally Free Bastrop/ Helpful Info (23,000) https://www.facebook.com/groups/694412308143544
- Bastrop County Lost & Found Pets (19,000) https://www.facebook.com/groups/1536792033282085
- Bastrop County Scanner Group (14,000; official-confirmed items only) https://www.facebook.com/groups/bastropcountyscanner
- Cedar Creek & Bastrop Texas Community & Yard Sale (13,000) https://www.facebook.com/groups/CedarCreekBastropOnlineYardSale
- 365 Bastrop - Fun in Bastrop County, TX (12,000) https://www.facebook.com/groups/365FunInBastropCounty
- Life in Bastrop (12,000) https://www.facebook.com/groups/1360235892188288
- Manor/Elgin Texas Lost and Found Pets (12,000) https://www.facebook.com/groups/Manor.ElginLostandFoundPets
- Discover Bastrop (Page, 45,000) https://www.facebook.com/DiscoverBastropTX
- Explore Bastrop County (Page, 26,000) https://www.facebook.com/ExploreBastropCounty
- The Bastrop Advertiser (Page, 12,000) https://www.facebook.com/bastropadvertiser
- Bastrop County ESD 2 (Page, 15,000) https://www.facebook.com/BastropESD2

### Standout — community groups
- Everything Bastrop TX https://www.facebook.com/groups/24492050793794111
- Elgin community https://www.facebook.com/groups/447109762593939
- Bastrop County & Surrounding Communities https://www.facebook.com/groups/1002466935248864
- Cedar Creek/Bastrop Community & Surrounding Areas Friends https://www.facebook.com/groups/cedarcreekbastropcommunity
- Bastrop Connect https://www.facebook.com/groups/bastropconnect
- New to Bastrop County https://www.facebook.com/groups/940747607387502
- City Guide: Bastrop, Texas https://www.facebook.com/groups/cityguide.bastrop.texas
- What's Happening in Bastrop County, TX - Bastrop Current https://www.facebook.com/groups/bastropcurrent
- LIVE LOVE BASTROP https://www.facebook.com/groups/1447068099593684
- Bastrop County Living https://www.facebook.com/groups/25994251436893942
- Heart of Texas Connect https://www.facebook.com/groups/heartoftexasconnect
- bastrop/camp swift what's going on around town https://www.facebook.com/groups/3604218266302598
- Bastrop County Resource Guide https://www.facebook.com/groups/bastropreloguide
- BastropTX Positivity Project https://www.facebook.com/groups/999808939302602
- What's happening in or around Bastrop county https://www.facebook.com/groups/1194132712485767
- Highway 21 East: Bastrop To Paige https://www.facebook.com/groups/1564741053822664
- Moving To Bastrop, Texas https://www.facebook.com/groups/460748046751999
- Elgin, Texas https://www.facebook.com/groups/3862194094038531
- Small Town Small Businesses: Elgin https://www.facebook.com/groups/700423867399301
- Elgin, Texas Business Pages https://www.facebook.com/groups/152471171107126
- Elgin Wildcat Athletic Booster Club https://www.facebook.com/groups/156851964453665
- Backstage Pass for Smithville Tiger Sports https://www.facebook.com/groups/smithville
- TWIG: A Fun Place to Shop in Smithville https://www.facebook.com/groups/571217051975668

### Standout — families, pets, neighborhoods, hobbies
- Healthy Bastrop Women's Community https://www.facebook.com/groups/healthybastropmamas
- Bastrop CAN Parent Network https://www.facebook.com/groups/bastropcan
- Bastrop County TX Kids Activities https://www.facebook.com/groups/966620728305386
- Bastrop TX pet rehoming https://www.facebook.com/groups/1089338274574619
- Bastrop CATS Network https://www.facebook.com/groups/184255915069076
- Bastrop DOGS Network https://www.facebook.com/groups/338319589674475
- Bastrop County Lost and Found https://www.facebook.com/groups/578490938884686
- Bastrop County TX Poultry https://www.facebook.com/groups/514480513454937
- Bastrop County Beekeepers Association https://www.facebook.com/groups/481797524085650
- Bastrop County Veterans Collaborative https://www.facebook.com/groups/2385284978409161
- Bastrop County African American Cultural Center https://www.facebook.com/groups/711136093960387
- Bastrop Neighborhood Watch https://www.facebook.com/groups/615734365822335
- Pecan Park Community Residents https://www.facebook.com/groups/778889837727857
- Pine Forest in Bastrop, Texas https://www.facebook.com/groups/246188132414640
- valverde bastrop tx https://www.facebook.com/groups/529705696880411
- Utley, TX and surrounding areas https://www.facebook.com/groups/653156568453918
- Hills Prairie Community Page https://www.facebook.com/groups/1757799261584662
- City of Bastrop Recreation Center https://www.facebook.com/groups/bastroprecreation
- Bastrop 1832 Farmers Market https://www.facebook.com/groups/Bastrop1832FarmersMarket
- Bastrop Area Off-Road and Recovery https://www.facebook.com/groups/bastropareaoffroadrecovery
- Bastrop County Craft Shows & Events https://www.facebook.com/groups/2002546010088233
- Bastrop Community PLANT EXCHANGE https://www.facebook.com/groups/3175960352732538
- Fishing Lake Bastrop https://www.facebook.com/groups/fishinglakebastropgroup
- Bastrop Area Cruisers https://www.facebook.com/groups/398024867036356
- Crafters of Bastrop Texas https://www.facebook.com/groups/447179058761500
- Bastrop County Organic Gardeners https://www.facebook.com/groups/443212390301239
- Bastrop Dance https://www.facebook.com/groups/201204464338624
- FAITH & FAMILY Movies in Bastrop https://www.facebook.com/groups/264834713701049
- Bastrop County A&M Club https://www.facebook.com/groups/140590212677474
- The New Backstage Pass for Bastrop Athletes https://www.facebook.com/groups/bastropbears
- Bastrop Running Club https://www.facebook.com/groups/bastroprunningclub
- Bastrop County Amateur Radio Club https://www.facebook.com/groups/bcarchams

### Standout — public Pages
- Bastrop County Weather https://www.facebook.com/BastropCountyCommentary
- We Are Okay In Bastrop https://www.facebook.com/weareokayinbastrop
- Bastrop Guide https://www.facebook.com/bastropguide
- City of Bastrop TX https://www.facebook.com/bastroptx
- City of Bastrop Parks & Recreation https://www.facebook.com/parksandrecbastroptx
- Bastrop County Elections https://www.facebook.com/BastropCountyElections
- Bastrop County OEM https://www.facebook.com/BastropCountyOEM
- Bastrop Police Department https://www.facebook.com/bastroppd
- Bastrop County ESD No. 1 https://www.facebook.com/bastropesd1
- Bastrop/Travis ESD1 https://www.facebook.com/nbcfrtx
- Bastrop County First Responders https://www.facebook.com/BastropCountyFirstResponders
- Bastrop County Animal Services https://www.facebook.com/bastropcountyanimalcontrolandshelter
- Bastrop EDC https://www.facebook.com/BastropTXEDC
- Bastrop County WCID #2 https://www.facebook.com/BCWCID2
- Bastrop Public Library https://www.facebook.com/BastropPublicLibrary
- Bastrop ISD https://www.facebook.com/bastropisdtx
- Bastrop ISD Community Relations https://www.facebook.com/BastropISDCommunityRelations
- Bastrop Regional Chamber of Commerce https://www.facebook.com/BastropChamber
- Bastrop County Cares https://www.facebook.com/BastropCares
- Bastrop County Emergency Food Pantry https://www.facebook.com/BastropCountyFoodPantry
- Bastrop County Long Term Recovery Team https://www.facebook.com/bcltrt
- Children's Advocacy Center (Bastrop, Lee, Fayette) https://www.facebook.com/CACBastropLeeFayette
- Bastrop County Historical Commission https://www.facebook.com/bastropcountyhistoricalcommissiontexas
- Bastrop County AgriLife Extension/4-H https://www.facebook.com/BastropCounty4H
- Bastrop County Master Gardeners https://www.facebook.com/BastropCountyMasterGardeners
- Bastrop County Aggie Moms' Club https://www.facebook.com/bastropcountyaggiemoms
- Bastrop County Gem and Mineral Society https://www.facebook.com/bastropcountygemandmineralsociety

### Not used
Private groups (any size), public buy/sell/yard-sale/rental/job groups (except for genuinely newsworthy items), and political groups or Pages.
