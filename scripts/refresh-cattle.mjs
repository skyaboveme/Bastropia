/**
 * Refresh src/data/cattle.json from public USDA, ERS, and BLS files.
 * Census of Agriculture figures stay in scripts/cattle-census.mjs.
 *
 *   node scripts/refresh-cattle.mjs
 */
import { execFile } from 'node:child_process';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';
import { census } from './cattle-census.mjs';
import {
  parseBeefAvailability,
  parseBls,
  parseCashReceipts,
  parseErsCattleReceipts,
  parseCutout,
  parseFedSteers,
  parseJanuaryCattle,
  parseJulyCattle,
  parseOnFeed,
  parseRetailSpreads,
  parseSlaughter,
  pdfTextRuns,
  texasFeederFromTokens,
} from './cattle-parse.mjs';

const execFileAsync = promisify(execFile);
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outPath = join(root, 'src/data/cattle.json');
const ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';

const sources = {
  january: 'https://release.nass.usda.gov/reports/catl0126.txt',
  july: 'https://release.nass.usda.gov/reports/catl0726.txt',
  onFeed: 'https://release.nass.usda.gov/reports/cofd1126.txt',
  slaughter: 'https://release.nass.usda.gov/reports/lstk1126.txt',
  cutout: 'https://mpr.datamart.ams.usda.gov/services/v1.1/reports/2453/Current%20Cutout%20Values',
  cutoutPage: 'https://www.ams.usda.gov/mnreports/ams_2453.pdf',
  fed: 'https://mpr.datamart.ams.usda.gov/services/v1.1/reports/2477/Detail',
  fedPage: 'https://www.ams.usda.gov/mnreports/ams_2477.pdf',
  texasFeeder: 'https://www.ams.usda.gov/mnreports/ams_1955.pdf',
  bls: 'https://api.bls.gov/publicAPI/v2/timeseries/data/',
  blsSeries: 'APU0000703112',
  blsPage: 'https://data.bls.gov/timeseries/APU0000703112',
  retail: 'https://www.ers.usda.gov/media/5025/summary-of-retail-prices-and-price-spreads.csv',
  retailPage: 'https://www.ers.usda.gov/data-products/meat-price-spreads',
  availability: 'https://www.ers.usda.gov/media/5361/red-meat-beef-veal-pork-lamb-and-mutton.csv?v=43311',
  availabilityPage: 'https://www.ers.usda.gov/data-products/food-availability-per-capita-data-system',
  receiptsZip: 'https://www.ers.usda.gov/media/29517/september-3-2026-release.zip',
  receiptsPage: 'https://www.ers.usda.gov/data-products/farm-income-and-wealth-statistics/data-files-us-and-state-level-farm-income-and-wealth-statistics',
};

const gaps = [];

async function fetchBuffer(url, { timeout = 60000 } = {}) {
  const response = await fetch(url, {
    headers: { 'User-Agent': ua, Accept: '*/*' },
    signal: AbortSignal.timeout(timeout),
    redirect: 'follow',
  });
  if (!response.ok) throw new Error(`${response.status} ${url}`);
  return Buffer.from(await response.arrayBuffer());
}

async function fetchText(url, options) {
  return (await fetchBuffer(url, options)).toString('utf8');
}

async function fetchJson(url, options) {
  return JSON.parse(await fetchText(url, options));
}

async function tryFetch(label, run) {
  try {
    return await run();
  } catch (error) {
    gaps.push(`${label} did not load (${error.message ?? error}).`);
    return null;
  }
}

function reportName(year, month, prefix) {
  const yy = String(year).slice(2);
  const mm = String(month).padStart(2, '0');
  return `https://release.nass.usda.gov/reports/${prefix}${mm}${yy}.txt`;
}

function levelSnapshot(bucket, year) {
  const value = bucket?.[year];
  return Number.isFinite(value) ? value : null;
}

function seriesFromJanuary(reports) {
  const byYear = new Map();
  for (const report of reports) {
    if (!report) continue;
    for (const year of report.inventoryYears ?? []) {
      const usAll = levelSnapshot(report.levels.us.all, year);
      const txAll = levelSnapshot(report.levels.tx.all, year);
      if (usAll == null && txAll == null) continue;
      byYear.set(year, {
        year,
        usAll,
        txAll,
        usBeef: levelSnapshot(report.levels.us.beef, year),
        txBeef: levelSnapshot(report.levels.tx.beef, year),
        usMilk: levelSnapshot(report.levels.us.milk, year),
        txMilk: levelSnapshot(report.levels.tx.milk, year),
        usOnFeed: levelSnapshot(report.levels.us.onFeed, year),
        txOnFeed: levelSnapshot(report.levels.tx.onFeed, year),
      });
    }
  }
  return [...byYear.values()].sort((a, b) => a.year - b.year);
}

async function mapPool(items, limit, worker) {
  const results = new Array(items.length);
  let cursor = 0;
  async function next() {
    while (cursor < items.length) {
      const index = cursor;
      cursor += 1;
      results[index] = await worker(items[index], index);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, () => next()));
  return results;
}

function recentMonths(count, from = new Date()) {
  const months = [];
  const cursor = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), 1));
  for (let index = 0; index < count; index += 1) {
    months.push({ year: cursor.getUTCFullYear(), month: cursor.getUTCMonth() + 1 });
    cursor.setUTCMonth(cursor.getUTCMonth() - 1);
  }
  return months.reverse();
}

function tail(points, count) {
  return points.slice(-count);
}

async function loadReceipts() {
  const dir = await mkdtemp(join(tmpdir(), 'cattle-ers-'));
  try {
    const zipPath = join(dir, 'release.zip');
    await writeFile(zipPath, await fetchBuffer(sources.receiptsZip, { timeout: 120000 }));
    await execFileAsync('unzip', ['-q', '-o', zipPath, '-d', dir]);
    const { readdir } = await import('node:fs/promises');
    const names = await readdir(dir);
    const csvNames = names.filter((name) => name.toLowerCase().endsWith('.csv'));
    let best = [];
    let used = null;
    for (const name of csvNames) {
      const text = (await readFile(join(dir, name))).toString('latin1');
      if (!/Cattle and calves/.test(text)) continue;
      const cattle = parseErsCattleReceipts(text);
      if (cattle.length > best.length) {
        best = cattle;
        used = name;
      }
    }
    const txYears = new Set(best.filter((point) => point.state === 'Texas').map((point) => point.year));
    for (const point of best) {
      if (point.state === 'United States' && !txYears.has(point.year)) point.forecast = true;
    }
    if (!best.length) {
      const sample = csvNames[0] ? (await readFile(join(dir, csvNames[0]))).toString('latin1').split(/\r?\n/)[0] : 'no csv';
      gaps.push(`The ERS farm-income zip had no Cattle and calves rows. Files: ${csvNames.join(', ') || 'none'}. First header: ${sample}`);
      return null;
    }
    const keep = (name) => /^(united states|u\.s\.|us|usa)$/i.test(name);
    const texas = (name) => /^texas$/i.test(name);
    return {
      file: used,
      sourceUrl: sources.receiptsPage,
      us: best.filter((point) => keep(point.state)).sort((a, b) => a.year - b.year),
      tx: best.filter((point) => texas(point.state)).sort((a, b) => a.year - b.year),
    };
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

async function main() {
  const now = new Date();
  const year = now.getUTCFullYear();
  const januaryYears = [];
  for (let reportYear = year - 19; reportYear <= year + 1; reportYear += 1) januaryYears.push(reportYear);

  const [januaryReports, julyText, onFeedPoints, slaughter, cutout, fed, feederPdf, bls, retailText, availabilityText, receipts] = await Promise.all([
    mapPool(januaryYears, 6, async (reportYear) => {
      const url = reportName(reportYear, 1, 'catl');
      try {
        const parsed = parseJanuaryCattle(await fetchText(url));
        if (!parsed.levels.us.all[reportYear] && !parsed.levels.us.all[reportYear - 1]) return null;
        return { ...parsed, sourceUrl: url, reportYear };
      } catch {
        return null;
      }
    }),
    tryFetch('July Cattle report', async () => fetchText(reportName(year, 7, 'catl'))),
    (async () => {
      const points = new Map();
      const months = recentMonths(20, now);
      await mapPool(months, 6, async ({ year: reportYear, month }) => {
        try {
          const parsed = parseOnFeed(await fetchText(reportName(reportYear, month, 'cofd')));
          for (const point of parsed) points.set(point.date, point);
        } catch {
          // A month with no report is normal (the series is monthly, names follow the release).
        }
      });
      return [...points.values()].sort((a, b) => a.date.localeCompare(b.date));
    })(),
    (async () => {
      for (const { year: reportYear, month } of [...recentMonths(4, now)].reverse()) {
        const url = reportName(reportYear, month, 'lstk');
        try {
          const parsed = parseSlaughter(await fetchText(url));
          if (parsed?.usHead && parsed.usBeefPounds) return { ...parsed, sourceUrl: url };
        } catch {
          // try the previous release
        }
      }
      gaps.push('Livestock Slaughter report did not load.');
      return null;
    })(),
    tryFetch('Boxed beef cutout', () => fetchJson(sources.cutout, { timeout: 120000 })),
    tryFetch('5-area fed cattle', () => fetchJson(sources.fed, { timeout: 120000 })),
    tryFetch('Texas weekly cattle auction summary', () => fetchBuffer(sources.texasFeeder)),
    tryFetch('BLS ground beef', async () => {
      const response = await fetch(sources.bls, {
        method: 'POST',
        headers: { 'User-Agent': ua, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          seriesid: [sources.blsSeries],
          startyear: String(year - 3),
          endyear: String(year),
        }),
        signal: AbortSignal.timeout(30000),
      });
      if (!response.ok) throw new Error(`${response.status} BLS`);
      const payload = await response.json();
      if (payload.status && payload.status !== 'REQUEST_SUCCEEDED') {
        throw new Error(payload.message?.join?.(' ') || payload.status);
      }
      return payload;
    }),
    tryFetch('ERS retail beef values', () => fetchText(sources.retail)),
    tryFetch('ERS beef availability', () => fetchText(sources.availability)),
    tryFetch('ERS cash receipts', () => loadReceipts()),
  ]);

  const january = januaryReports.filter(Boolean).sort((a, b) => a.reportYear - b.reportYear);
  const latestJanuary = [...january].reverse().find((report) => report.levels.us.all[report.reportYear] || report.levels.tx.all[report.reportYear]);
  if (!latestJanuary) throw new Error('No January Cattle report parsed. Refusing to write cattle.json.');
  const inventoryYear = latestJanuary.inventoryYears?.[1] ?? latestJanuary.reportYear;
  const usAll = levelSnapshot(latestJanuary.levels.us.all, inventoryYear);
  const txAll = levelSnapshot(latestJanuary.levels.tx.all, inventoryYear);
  if (usAll == null || usAll < 70_000_000 || usAll > 110_000_000) {
    throw new Error(`US January inventory ${usAll} is outside the expected range.`);
  }
  if (txAll == null || txAll < 8_000_000 || txAll > 16_000_000) {
    throw new Error(`Texas January inventory ${txAll} is outside the expected range.`);
  }

  const july = julyText ? parseJulyCattle(julyText) : null;
  const cut = cutout ? parseCutout(cutout) : null;
  const steer = fed ? parseFedSteers(fed) : null;
  const feeder = feederPdf ? texasFeederFromTokens(pdfTextRuns(feederPdf)) : null;
  const ground = bls ? parseBls(bls, sources.blsSeries) : { latest: null, monthly: [] };
  const retail = retailText ? parseRetailSpreads(retailText) : null;
  const availability = availabilityText ? parseBeefAvailability(availabilityText) : null;

  if (!cut?.latest) gaps.push('Boxed beef Choice and Select cutout did not parse.');
  if (!steer?.latest) gaps.push('5-area fed steer price did not parse.');
  if (!feeder) gaps.push('Texas weekly feeder steer price did not parse.');
  if (!ground.latest) gaps.push('BLS ground beef price did not parse.');
  if (!onFeedPoints.length) gaps.push('Cattle on Feed monthly inventory did not parse.');
  if (receipts && (!receipts.us.length || !receipts.tx.length)) {
    gaps.push('ERS cash receipts parsed, but United States or Texas cattle-and-calves rows were missing.');
  }

  const calfYear = inventoryYear - 1;
  const document = {
    generatedAt: now.toISOString(),
    census,
    january: {
      inventoryYear,
      calfYear,
      sourceUrl: latestJanuary.sourceUrl,
      reportList: 'https://release.nass.usda.gov/reports/catl0126.txt',
      us: {
        all: usAll,
        beef: levelSnapshot(latestJanuary.levels.us.beef, inventoryYear),
        milk: levelSnapshot(latestJanuary.levels.us.milk, inventoryYear),
        calf: levelSnapshot(latestJanuary.levels.us.calf, calfYear),
        onFeed: levelSnapshot(latestJanuary.levels.us.onFeed, inventoryYear),
      },
      tx: {
        all: txAll,
        beef: levelSnapshot(latestJanuary.levels.tx.beef, inventoryYear),
        milk: levelSnapshot(latestJanuary.levels.tx.milk, inventoryYear),
        calf: levelSnapshot(latestJanuary.levels.tx.calf, calfYear),
        onFeed: levelSnapshot(latestJanuary.levels.tx.onFeed, inventoryYear),
      },
      prior: {
        year: inventoryYear - 1,
        usAll: levelSnapshot(latestJanuary.levels.us.all, inventoryYear - 1),
        txAll: levelSnapshot(latestJanuary.levels.tx.all, inventoryYear - 1),
        usBeef: levelSnapshot(latestJanuary.levels.us.beef, inventoryYear - 1),
        txBeef: levelSnapshot(latestJanuary.levels.tx.beef, inventoryYear - 1),
      },
      series: seriesFromJanuary(january),
    },
    july: july?.all?.[july.years[1]]
      ? {
          year: july.years[1],
          sourceUrl: reportName(year, 7, 'catl'),
          usAll: july.all[july.years[1]],
          usBeef: july.beef?.[july.years[1]] ?? null,
          usMilk: july.milk?.[july.years[1]] ?? null,
          usOnFeed: july.onFeed?.[july.years[1]] ?? null,
          calfRevisedPrior: july.calf?.[july.years[0]] ?? null,
          calfPreliminary: july.calf?.[july.years[1]] ?? null,
        }
      : null,
    onFeed: {
      sourceUrl: sources.onFeed,
      note: 'Feedlots with capacity of 1,000 or more head.',
      points: onFeedPoints,
    },
    slaughter,
    prices: {
      cutout: cut?.latest
        ? {
            sourceUrl: sources.cutoutPage,
            latest: cut.latest,
            monthly: tail(cut.monthly, 24),
          }
        : null,
      fedSteer: steer?.latest
        ? {
            sourceUrl: sources.fedPage,
            basis: 'Live FOB, steers, over 80% Choice',
            latest: steer.latest,
            monthly: tail(steer.monthly, 24),
          }
        : null,
      texasFeeder: feeder
        ? {
            sourceUrl: sources.texasFeeder,
            basis: 'Medium and large 1 steers, per cwt',
            ...feeder,
          }
        : null,
      groundBeef: ground.latest
        ? {
            seriesId: sources.blsSeries,
            sourceUrl: sources.blsPage,
            latest: ground.latest,
            monthly: ground.monthly,
          }
        : null,
      retail: retail?.choiceLatest
        ? {
            sourceUrl: sources.retailPage,
            choice: retail.choiceLatest,
            allFresh: retail.allFreshLatest,
            choiceMonthly: tail(retail.choice, 24),
            allFreshMonthly: tail(retail.allFresh, 24),
          }
        : null,
    },
    consumption: availability?.latest
      ? {
          sourceUrl: sources.availabilityPage,
          basis: 'Food availability, retail weight. This is supply per person, not pounds eaten after waste.',
          latest: availability.latest,
          series: availability.series.filter((point) => point.year >= availability.latest.year - 20),
        }
      : null,
    receipts: receipts
      ? {
          sourceUrl: sources.receiptsPage,
          file: receipts.file,
          us: receipts.us.filter((point) => point.year >= 2008),
          tx: receipts.tx.filter((point) => point.year >= 2008),
        }
      : null,
    gaps,
  };

  await mkdir(dirname(outPath), { recursive: true });
  await writeFile(outPath, `${JSON.stringify(document, null, 2)}\n`);
  const latestFeed = onFeedPoints.at(-1);
  console.log(`Wrote ${outPath}`);
  console.log(`January ${inventoryYear}: US ${usAll} head, Texas ${txAll} head`);
  console.log(`On feed points: ${onFeedPoints.length}, latest ${latestFeed ? `${latestFeed.date} US ${latestFeed.us} TX ${latestFeed.tx}` : 'none'}`);
  console.log(`Cutout ${cut?.latest?.date ?? 'missing'} Choice ${cut?.latest?.choice ?? ''}`);
  console.log(`Fed steer ${steer?.latest?.date ?? 'missing'} $${steer?.latest?.price ?? ''}`);
  console.log(`Texas feeder $${feeder?.price ?? 'missing'} ${feeder?.range ?? ''}`);
  console.log(`Receipts US rows ${receipts?.us.length ?? 0}, TX rows ${receipts?.tx.length ?? 0}, file ${receipts?.file ?? 'none'}`);
  if (gaps.length) console.log(gaps.map((gap) => `- ${gap}`).join('\n'));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
