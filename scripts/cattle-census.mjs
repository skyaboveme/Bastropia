/**
 * Census of Agriculture figures copied from the published tables.
 * The weekly refresh does not re-read these PDFs. Layout changes in a
 * five-year census are rarer than a broken scrape, and a wrong county
 * number would be worse than a stale one. Update this file when the
 * 2027 census is published.
 *
 * Head counts are animals. Sales values are dollars.
 * Inventory date for every census figure is December 31 of the census year.
 */

export const censusSources = {
  texasTable:
    'https://www.nass.usda.gov/sites/default/files/publications/agcensus/2022/Full_Report/Volume_1,_Chapter_2_County_Level/Texas/st48_2_011_011.pdf',
  usInventory:
    'https://www.nass.usda.gov/sites/default/files/publications/agcensus/2022/Full_Report/Volume_1,_Chapter_1_US/st99_1_011_012.pdf',
  usSales:
    'https://www.nass.usda.gov/sites/default/files/publications/agcensus/2022/Full_Report/Volume_1,_Chapter_1_US/st99_1_013_014.pdf',
  bastropProfile:
    'https://www.nass.usda.gov/sites/default/files/publications/agcensus/2022/Online_Resources/County_Profiles/Texas/cp48021.pdf',
  bastropProfile2017:
    'https://www.nass.usda.gov/sites/default/files/publications/agcensus/2017/Online_Resources/County_Profiles/Texas/cp48021.pdf',
};

const bands = ['1-9', '10-19', '20-49', '50-99', '100-199', '200-499', '500+'];

function size(farms, head) {
  return bands.map((band, index) => ({ band, farms: farms[index], head: head[index] }));
}

export const census = {
  inventoryDate: '2022-12-31',
  priorInventoryDate: '2017-12-31',
  sources: censusSources,
  levels: {
    us: {
      label: 'United States',
      inventory: { head: 87954742, farms: 732123 },
      inventory2017: { head: 93648041, farms: 882692 },
      beefCows: { head: 29214479, farms: 622162 },
      beefCows2017: { head: 31722039, farms: 729046 },
      milkCows: { head: 9309855, farms: 36024 },
      milkCows2017: { head: 9539631, farms: 54599 },
      sales: { dollars: 89377637000, farms: 593004, head: 69090585 },
      sales2017: { dollars: 77189334000, farms: 711827, head: 69812061 },
      size: size(
        [189417, 135886, 177822, 93311, 61595, 45145, 28947],
        [923354, 1859610, 5482413, 6413135, 8390706, 13649704, 51235820],
      ),
      largeBands: [
        { band: '500-999', farms: 17139, head: 11715792 },
        { band: '1,000-2,499', farms: 8375, head: 12197284 },
        { band: '2,500-4,999', farms: 1980, head: 6780419 },
        { band: '5,000 or more', farms: 1453, head: 20542325 },
      ],
    },
    tx: {
      label: 'Texas',
      inventory: { head: 12543300, farms: 131815 },
      inventory2017: { head: 12573876, farms: 152882 },
      beefCows: { head: 4360026, farms: 117838 },
      beefCows2017: { head: 4572742, farms: 134250 },
      milkCows: { head: 639506, farms: 479 },
      milkCows2017: { head: 531849, farms: 467 },
      sales: { dollars: 15502042000, farms: 100863, head: 11697605 },
      sales2017: { dollars: 12291224000, farms: 114079, head: 10478530 },
      size: size(
        [41288, 30244, 32831, 13096, 7038, 4286, 3032],
        [214041, 411457, 988703, 888811, 960400, 1285742, 7794146],
      ),
    },
    bastrop: {
      label: 'Bastrop County',
      fips: '48021',
      inventory: { head: 46801, farms: 1256 },
      inventory2017: { head: 76438, farms: 1536 },
      beefCows: { head: 29780, farms: 1128 },
      beefCows2017: { head: 36749, farms: 1396 },
      milkCows: { head: 65, farms: 5 },
      milkCows2017: { head: 0, farms: 0 },
      cowsCalved: { head: 29845, farms: 1133 },
      sales: { dollars: 26989000, farms: 1014, head: 34279 },
      sales2017: { dollars: 29286000, farms: 1211, head: 34954 },
      size: size(
        [320, 392, 358, 103, 48, 25, 10],
        [1868, 5356, 10627, 7348, 6407, 7282, 7913],
      ),
      beefCowSize: size(
        [449, 300, 252, 80, 26, 16, 5],
        [2416, 3897, 6969, 5329, 3304, 4837, 3028],
      ),
    },
  },
};
