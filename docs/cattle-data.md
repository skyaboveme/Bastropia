# Cattle and beef data

The page at `/cattle` reads `src/data/cattle.json`. Census of Agriculture counts are written by hand in `scripts/cattle-census.mjs` from the published tables. Everything that moves — January inventory when a new Cattle report is posted, cattle on feed, slaughter, prices, retail values, and cash receipts — is fetched by `scripts/refresh-cattle.mjs`.

Refresh it locally:

```sh
node scripts/refresh-cattle.mjs
```

GitHub Actions runs that script every Monday (`.github/workflows/cattle.yml`) and commits `src/data/cattle.json` when the file changes. A push to `main` deploys the site, so the page updates with that commit. No NASS Quick Stats API key is used. The key form needs a person. The script uses the public report files instead.

The script refuses to write the file if the latest January U.S. or Texas inventory is missing or outside a wide sanity range. A source that fails leaves a note in `gaps` and keeps the page from inventing a number for that series. Census figures are not re-parsed from the PDFs.

## What each block uses

| Block | Source | Period on the page |
| --- | --- | --- |
| January inventory, beef cows, milk cows, prior-year calf crop, cattle on feed in all feedlots | NASS Cattle text, `https://release.nass.usda.gov/reports/catl01YY.txt` | January 1 of the report year. The calf crop is the previous calendar year. The chart uses every January file from 2016 on. Older files are not on that server. |
| July inventory | NASS Cattle text, `catl07YY.txt` | July 1, United States only. The report has no state table. |
| Monthly cattle on feed | NASS Cattle on Feed text, `cofdMMYY.txt` | Feedlots with capacity of 1,000 head or more. This is not the January “all feedlots” number. |
| Slaughter and beef production | NASS Livestock Slaughter text, `lstkMMYY.txt` | Latest month in the report. Beef production in pounds is national. Texas is published as commercial cattle slaughter in head. |
| Choice and Select cutout | AMS report 2453, LM_XB403, section Current Cutout Values | Dollars per hundredweight. The chart keeps the last trading day of each of the last 24 months. |
| Fed steers | AMS report 2477, LM_CT150, 5-area weekly, live FOB steers, over 80% Choice | Dollars per hundredweight. |
| Texas feeder steers | AMS Texas Weekly Cattle Auction Summary, `ams_1955.pdf` | Medium and large 1 steers in the 500-pound class with no flesh or condition note, same rule as the price on `/now`. |
| Ground beef | BLS series `APU0000703112` | U.S. city average, dollars per pound. |
| Choice and all-fresh retail value | ERS Meat Price Spreads summary CSV | Cents per pound of retail weight. |
| Beef per person | ERS Food Availability red-meat CSV | Retail weight. The file currently ends in 2021. This is supply per person, not pounds eaten after waste. |
| Cash receipts | ERS farm-income release `FarmIncome_WealthStatisticsData_September2026.csv`, rows where part 1 is “Cattle and calves” and part 2 is “All” | Dollars. State codes in the file are `US` and `TX`. A U.S. year with no Texas row is marked as a forecast. |
| Bastrop County, and the census columns for Texas and the United States | Census of Agriculture 2022, with 2017 beside it | December 31 of the census year. |

## Census tables

Copied once, and checked so the size classes add back to the published inventory.

- Bastrop County and Texas cattle inventory, beef cows, milk cows, farms, size classes, and sales: [Table 11, Texas county chapter](https://www.nass.usda.gov/sites/default/files/publications/agcensus/2022/Full_Report/Volume_1,_Chapter_2_County_Level/Texas/st48_2_011_011.pdf). The [Bastrop profile](https://www.nass.usda.gov/sites/default/files/publications/agcensus/2022/Online_Resources/County_Profiles/Texas/cp48021.pdf) matches the inventory (46,801 head) and cattle sales ($26,989,000).
- United States inventory and size classes: [Table 12](https://www.nass.usda.gov/sites/default/files/publications/agcensus/2022/Full_Report/Volume_1,_Chapter_1_US/st99_1_011_012.pdf). The “500 or more” row on the page is the sum of the 500–999, 1,000–2,499, 2,500–4,999, and 5,000-or-more bands.
- United States sales: [Table 13](https://www.nass.usda.gov/sites/default/files/publications/agcensus/2022/Full_Report/Volume_1,_Chapter_1_US/st99_1_013_014.pdf).

Shares on the page use one source and one period. A January 1 survey count is never divided by a December 31 census count.

## Not in the file

- An annual NASS cattle estimate for Bastrop County between censuses. The county number stays on the census until the next one.
- A current national feeder-cattle cash average. The SJ_LS850 text report ended April 13, 2026. The AMS dashboard did not return a file.
- Texas beef production in pounds, and any county slaughter or county cattle-on-feed series.
- A confirmed weekly commercial auction inside Bastrop County. The local links are AgriLife Extension and the Bastrop Area Livestock Show.

When the 2027 census is published, update `scripts/cattle-census.mjs` from the new tables and run the size-class test.
