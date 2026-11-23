/**
 * Parsers for the public cattle files this site stores.
 * Counts that NASS prints as "1,000 head" are returned as head.
 */
import { inflateSync } from 'node:zlib';

const MONTHS = {
  january: 1,
  february: 2,
  march: 3,
  april: 4,
  may: 5,
  june: 6,
  july: 7,
  august: 8,
  september: 9,
  october: 10,
  november: 11,
  december: 12,
};

export function thousandHead(token) {
  const value = Number(String(token).replace(/,/g, ''));
  if (!Number.isFinite(value)) return null;
  return Math.round(value * 1000);
}

export function millionPounds(token) {
  const value = Number(String(token).replace(/,/g, ''));
  if (!Number.isFinite(value)) return null;
  return Math.round(value * 1_000_000);
}

function decimals(line) {
  return [...line.matchAll(/[\d,]+\.\d+/g)].map((match) => thousandHead(match[0]));
}

function linesOf(text) {
  return text.split(/\r?\n/);
}

function placeLine(line) {
  const match = line.match(/^([A-Za-z][A-Za-z ]*?)\s*\.+:\s*(.*)$/);
  if (!match) return null;
  const name = match[1].replace(/\s+/g, ' ').trim();
  if (name !== 'Texas' && name !== 'United States') return null;
  return { name, values: decimals(line) };
}

/** State rows that follow a column header, through the United States total. */
function rowsUnder(lines, headerIndex) {
  const rows = [];
  for (let index = headerIndex + 1; index < lines.length && index < headerIndex + 100; index += 1) {
    const place = placeLine(lines[index]);
    if (place) rows.push(place);
    if (place?.name === 'United States') break;
  }
  return rows;
}

function nearestYears(lines, headerIndex) {
  for (let index = headerIndex; index >= 0 && index > headerIndex - 12; index -= 1) {
    const years = yearsOn(lines[index]);
    if (years) return years;
  }
  return null;
}

function yearsOn(line) {
  const match = line.match(/(\d{4}) and (\d{4})/);
  if (!match) return null;
  return [Number(match[1]), Number(match[2])];
}

function blankLevel() {
  return {
    all: {},
    beef: {},
    milk: {},
    calf: {},
    onFeed: {},
  };
}

function assignPair(bucket, years, values) {
  if (!years || values.length < 2 || values[0] == null || values[1] == null) return;
  bucket[years[0]] = values[0];
  bucket[years[1]] = values[1];
}

/** January Cattle report text (catl01YY.txt). */
export function parseJanuaryCattle(text) {
  const lines = linesOf(text);
  const levels = { us: blankLevel(), tx: blankLevel() };
  const apply = (rows, years, write) => {
    for (const row of rows) {
      const level = row.name === 'Texas' ? levels.tx : levels.us;
      write(level, years, row.values);
    }
  };

  const dataHeader = (index) => {
    const look = lines.slice(index, index + 12).join('\n');
    return /-{10,}/.test(look) || /1,000 head/.test(look);
  };
  const headers = (test) => lines.map((line, index) => (test(line) && dataHeader(index) ? index : -1)).filter((index) => index >= 0);
  const inventoryHeaders = headers((line) => line.includes('All cattle and calves') && line.includes('All cows and heifers that have calved'));
  const cowHeaders = headers((line) => line.includes('Beef cows that have calved') && line.includes('Milk cows that have calved'));
  const calfHeaders = headers((line) => line.startsWith('Calf Crop - States'));
  const feedHeaders = headers((line) => line.startsWith('All Cattle on Feed Inventory - States'));
  const inventoryYears = inventoryHeaders.length ? nearestYears(lines, inventoryHeaders[0]) : null;
  const calfYears = calfHeaders.length ? nearestYears(lines, calfHeaders[0]) : null;
  const feedYears = feedHeaders.length ? nearestYears(lines, feedHeaders[0]) : null;

  for (const index of inventoryHeaders) {
    apply(rowsUnder(lines, index), nearestYears(lines, index) ?? inventoryYears, (level, years, values) => {
      assignPair(level.all, years, values);
    });
  }
  for (const index of cowHeaders) {
    apply(rowsUnder(lines, index), inventoryYears, (level, years, values) => {
      assignPair(level.beef, years, values);
      assignPair(level.milk, years, values.slice(2));
    });
  }
  for (const index of calfHeaders) {
    apply(rowsUnder(lines, index), nearestYears(lines, index) ?? calfYears, (level, years, values) => {
      assignPair(level.calf, years, values);
    });
  }
  for (const index of feedHeaders) {
    apply(rowsUnder(lines, index), nearestYears(lines, index) ?? feedYears, (level, years, values) => {
      assignPair(level.onFeed, years, values);
    });
  }

  return { inventoryYears, calfYears, feedYears, levels };
}

/** July Cattle report text. State rows are not published. */
export function parseJulyCattle(text) {
  const start = text.indexOf('Cattle Inventory by Class and Calf Crop - United States: July 1');
  if (start < 0) return null;
  const slice = text.slice(start, start + 2500);
  const header = slice.match(/July 1, (\d{4}) and (\d{4})/);
  if (!header) return null;
  const years = [Number(header[1]), Number(header[2])];
  const row = (label) => {
    const match = slice.match(new RegExp(`^\\s*${label}\\s+\\.*:+\\s+([\\d,]+\\.\\d+)\\s+([\\d,]+\\.\\d+)`, 'm'));
    if (!match) return null;
    return { [years[0]]: thousandHead(match[1]), [years[1]]: thousandHead(match[2]) };
  };
  const calf = row('Calf crop');
  return {
    years,
    all: row('Cattle and calves'),
    beef: row('Beef cows'),
    milk: row('Milk cows'),
    onFeed: row('Cattle on feed'),
    calf,
  };
}

function isoDate(monthName, day, year) {
  const month = MONTHS[monthName.toLowerCase()];
  if (!month) return null;
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

/** Monthly Cattle on Feed text. Returns 1,000+ capacity inventory points. */
export function parseOnFeed(text) {
  const lines = linesOf(text);
  const title = lines.findIndex((line) => line.startsWith('Cattle on Feed Inventory on 1,000+ Capacity Feedlots by Month'));
  if (title < 0) return [];
  const window = lines.slice(title, title + 40);
  const stateHeader = window.findIndex((line) => /^\s*State\b/.test(line) && /1, \d{4}/.test(line));
  if (stateHeader < 0) return [];
  const columnDates = [...window[stateHeader].matchAll(/\b([A-Z][a-z]+) 1, (\d{4})\b/g)]
    .map((match) => isoDate(match[1], 1, match[2]))
    .filter(Boolean);
  const above = window.slice(0, stateHeader).reverse().find((line) => /\b[A-Z][a-z]+ 1, \d{4}\b/.test(line));
  const current = above?.match(/\b([A-Z][a-z]+) 1, (\d{4})\b/);
  const dates = [...columnDates];
  if (current) dates.push(isoDate(current[1], 1, current[2]));
  if (dates.length < 3) return [];
  const integers = (line) => [...line.split(':').slice(1).join(':').matchAll(/[\d,]+/g)].map((match) => Number(match[0].replace(/,/g, '')));
  const find = (name) => {
    const line = window.find((row) => row.startsWith(name));
    if (!line) return null;
    const values = integers(line);
    return values.length >= 3 ? values.slice(0, 3) : null;
  };
  const us = find('United States');
  const tx = find('Texas');
  if (!us || !tx) return [];
  return dates.slice(0, 3).map((date, index) => ({
    date,
    us: us[index] * 1000,
    tx: tx[index] * 1000,
  }));
}

function lastSection(text, marker, probe) {
  let from = 0;
  let found = -1;
  while (from < text.length) {
    const at = text.indexOf(marker, from);
    if (at < 0) break;
    if (probe(text.slice(at, at + 8000))) found = at;
    from = at + marker.length;
  }
  return found;
}

/** Livestock Slaughter text. Beef production is national; slaughter head includes Texas. */
export function parseSlaughter(text) {
  const beef = text.match(/^Beef\s+\.+:\s+([\d,.]+)\s+([\d,.]+)\s+([\d,.]+)\s+[\d,.]+\s+[\d,.]+\s+([\d,.]+)\s+([\d,.]+)/m);
  if (!beef) return null;
  const slaughterStart = lastSection(
    text,
    'Commercial Cattle Slaughter - States and United States:',
    (slice) => slice.includes('\nTexas'),
  );
  if (slaughterStart < 0) return null;
  const block = text.slice(slaughterStart, slaughterStart + 8000);
  const title = block.match(/Commercial Cattle Slaughter - States and United States: ([A-Z][a-z]+) (\d{4}) and (\d{4})/);
  if (!title) return null;
  const month = MONTHS[title[1].toLowerCase()];
  const year = Number(title[3]);
  const headLine = (name) => {
    const line = linesOf(block).find((row) => row.startsWith(name));
    if (!line) return null;
    const values = [...line.matchAll(/[\d,]+\.\d+/g)].map((match) => thousandHead(match[0]));
    return values.length >= 2 ? values[1] : null;
  };
  const cattleBlock = text.slice(text.indexOf('Livestock Slaughter and Average Live Weight'));
  const ytd = cattleBlock.match(/Commercial\s+\.*1,000:\s+[\d,.]+\s+[\d,.]+\s+[\d,.]+\s+\d+\s+[\d,.]+\s+([\d,.]+)/);
  return {
    period: `${year}-${String(month).padStart(2, '0')}`,
    label: `${title[1]} ${year}`,
    usHead: headLine('United States'),
    txHead: headLine('Texas'),
    usBeefPounds: millionPounds(beef[3]),
    usBeefYtdPounds: millionPounds(beef[5]),
    usHeadYtd: ytd ? thousandHead(ytd[1]) : null,
  };
}

export function parseSlashDate(value) {
  const match = String(value).match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!match) return null;
  return `${match[3]}-${match[1].padStart(2, '0')}-${match[2].padStart(2, '0')}`;
}

export function monthKey(iso) {
  return iso.slice(0, 7);
}

/** Last daily cutout in each month, plus the newest day. Prices are dollars per cwt. */
export function parseCutout(payload) {
  const rows = (payload.results ?? [])
    .map((row) => ({
      date: parseSlashDate(row.report_date),
      choice: Number(row.choice_600_900_current),
      select: Number(row.select_600_900_current),
    }))
    .filter((row) => row.date && Number.isFinite(row.choice) && Number.isFinite(row.select))
    .sort((a, b) => a.date.localeCompare(b.date));
  const byMonth = new Map();
  for (const row of rows) byMonth.set(monthKey(row.date), row);
  return {
    latest: rows.at(-1) ?? null,
    monthly: [...byMonth.values()],
  };
}

/** 5-area weekly negotiated steers, live FOB, over 80% Choice. Dollars per cwt. */
export function parseFedSteers(payload) {
  const rows = (payload.results ?? [])
    .filter((row) => {
      return row.class_description === 'STEER'
        && row.selling_basis_description === 'LIVE FOB'
        && String(row.grade_description).trim() === 'Over 80% Choice'
        && row.weighted_avg_price;
    })
    .map((row) => ({
      date: parseSlashDate(row.report_date),
      price: Number(row.weighted_avg_price),
      head: Number(String(row.head_count ?? '').replace(/,/g, '')),
      weight: Number(String(row.weight_range_avg ?? '').replace(/,/g, '')),
    }))
    .filter((row) => row.date && Number.isFinite(row.price))
    .sort((a, b) => a.date.localeCompare(b.date));
  const byMonth = new Map();
  for (const row of rows) byMonth.set(monthKey(row.date), row);
  return {
    latest: rows.at(-1) ?? null,
    monthly: [...byMonth.values()],
  };
}

const MONEY = /^\d+\.\d{2}(?:-\d+\.\d{2})?$/;
const COUNT = /^\d+$/;
const WEIGHT = /^\d+(?:-\d+)?$/;

/** Medium and large 1 feeder steers from the Texas weekly auction summary tokens. */
export function texasFeederFromTokens(tokens) {
  const start = tokens.findIndex((token) => token.startsWith('STEERS - Medium and Large 1 (Per Cwt'));
  if (start < 0) return null;
  const rows = [];
  for (let index = start + 1; index < tokens.length; index += 1) {
    const token = tokens[index];
    if (/^(HEIFERS|BULLS|SLAUGHTER|STEERS -|COWS|LIVESTOCK)/.test(token)) break;
    const weight = tokens[index + 1];
    const averageWeight = tokens[index + 2];
    const priceRange = tokens[index + 3];
    const average = tokens[index + 4];
    if (!COUNT.test(token) || !WEIGHT.test(weight) || !COUNT.test(averageWeight) || !MONEY.test(priceRange) || !MONEY.test(average) || average.includes('-')) {
      continue;
    }
    const following = tokens[index + 5] ?? '';
    const note = following && !COUNT.test(following) && !following.includes('(') && !following.endsWith(':') ? following : '';
    rows.push({ head: Number(token), range: weight, price: Number(average), note });
    index += note ? 5 : 4;
  }
  const plain = rows.filter((row) => !row.note);
  const fiveHundreds = plain.filter((row) => {
    const [low, high] = row.range.split('-').map(Number);
    return low <= 599 && (high || low) >= 500;
  });
  const picked = (fiveHundreds.length ? fiveHundreds : plain).sort((a, b) => b.head - a.head)[0];
  if (!picked) return null;
  const weekLine = tokens.find((token) => token.includes('Weighted Average Report for'));
  const week = weekLine?.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})\s*-\s*(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  return {
    price: picked.price,
    head: picked.head,
    range: picked.range,
    week: week ? `${week[3]}-${week[1].padStart(2, '0')}-${week[2].padStart(2, '0')}/${week[6]}-${week[4].padStart(2, '0')}-${week[5].padStart(2, '0')}` : null,
  };
}

export function pdfTextRuns(bytes) {
  const source = Buffer.isBuffer(bytes) ? bytes : Buffer.from(bytes);
  const streamMark = Buffer.from('stream');
  const endMark = Buffer.from('endstream');
  const runs = [];
  let cursor = 0;
  while (cursor < source.length) {
    const at = source.indexOf(streamMark, cursor);
    if (at < 0) break;
    let start = at + streamMark.length;
    if (source[start] === 13) start += 1;
    if (source[start] === 10) start += 1;
    const stop = source.indexOf(endMark, start);
    if (stop < 0) break;
    let finish = stop;
    if (finish > start && source[finish - 1] === 10) finish -= 1;
    if (finish > start && source[finish - 1] === 13) finish -= 1;
    cursor = stop + endMark.length;
    try {
      const text = inflateSync(source.subarray(start, finish)).toString('latin1');
      for (const match of text.matchAll(/\(((?:\\.|[^\\)])*)\)\s*Tj/g)) {
        runs.push(match[1].replace(/\\([()\\])/g, '$1').replace(/\\n/g, ' ').replace(/\s+/g, ' ').trim());
      }
    } catch {
      // Image streams are not the price table.
    }
  }
  return runs;
}

/** BLS average price series. Values are dollars per pound. Newest month last in the returned list. */
export function parseBls(payload, seriesId) {
  const series = (payload.Results?.series ?? []).find((item) => item.seriesID === seriesId);
  if (!series) return { latest: null, monthly: [] };
  const monthly = series.data
    .map((row) => {
      const month = Number(String(row.period).replace('M', ''));
      const value = Number(row.value);
      if (!month || !Number.isFinite(value)) return null;
      return {
        date: `${row.year}-${String(month).padStart(2, '0')}-01`,
        label: `${row.periodName} ${row.year}`,
        value,
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.date.localeCompare(b.date));
  return { latest: monthly.at(-1) ?? null, monthly };
}

/** ERS food-availability beef, retail weight, pounds per person. */
export function parseBeefAvailability(csvText) {
  const lines = csvText.replace(/^\uFEFF/, '').split(/\r?\n/);
  const points = [];
  for (const line of lines.slice(1)) {
    if (!line.startsWith('Beef:')) continue;
    const cells = splitCsv(line);
    if (cells[2] !== 'Food availability-Per capita availability-Retail-Pounds') continue;
    const year = Number(cells[1]);
    const value = Number(cells[3]);
    if (!year || !Number.isFinite(value)) continue;
    points.push({ year, pounds: Math.round(value * 1000) / 1000 });
  }
  points.sort((a, b) => a.year - b.year);
  return { latest: points.at(-1) ?? null, series: points };
}

function splitCsv(line) {
  const cells = [];
  let current = '';
  let quoted = false;
  for (const char of line) {
    if (char === '"') quoted = !quoted;
    else if (char === ',' && !quoted) {
      cells.push(current);
      current = '';
    } else current += char;
  }
  cells.push(current);
  return cells;
}

/** ERS meat price spreads summary. Retail values are cents per pound. */
export function parseRetailSpreads(csvText) {
  const choice = [];
  const allFresh = [];
  for (const line of csvText.replace(/^\uFEFF/, '').split(/\r?\n/).slice(1)) {
    if (!line) continue;
    const cells = splitCsv(line);
    const item = cells[3] ?? '';
    const year = Number(cells[0]);
    const month = Number(cells[2]);
    const value = Number(cells[4]);
    if (!year || !month || !Number.isFinite(value)) continue;
    const point = { date: `${year}-${String(month).padStart(2, '0')}-01`, cents: value };
    if (item === 'Retail prices or values: Choice beef retail value') choice.push(point);
    if (item === 'Retail prices or values: all-fresh beef retail value') allFresh.push(point);
  }
  choice.sort((a, b) => a.date.localeCompare(b.date));
  allFresh.sort((a, b) => a.date.localeCompare(b.date));
  return { choice, allFresh, choiceLatest: choice.at(-1) ?? null, allFreshLatest: allFresh.at(-1) ?? null };
}

/**
 * Cattle and calves cash receipts from the ERS farm-income release CSV.
 * Amounts in that file are thousands of dollars. State codes are US and TX.
 * Part 2 must be "All" so a specialization row is not treated as receipts.
 */
export function parseErsCattleReceipts(csvText) {
  const lines = csvText.replace(/^\uFEFF/, '').split(/\r?\n/).filter(Boolean);
  if (!lines.length) return [];
  const header = splitCsv(lines[0]).map((cell) => cell.trim());
  const index = (name) => header.findIndex((cell) => cell === name);
  const yearIndex = index('Year');
  const stateIndex = index('State');
  const part1Index = index('VariableDescriptionPart1');
  const part2Index = index('VariableDescriptionPart2');
  const amountIndex = index('Amount');
  const unitIndex = index('unit_desc');
  if ([yearIndex, stateIndex, part1Index, part2Index, amountIndex].some((value) => value < 0)) return [];
  const points = [];
  for (const line of lines.slice(1)) {
    const cells = splitCsv(line);
    if ((cells[part1Index] ?? '').trim() !== 'Cattle and calves') continue;
    if ((cells[part2Index] ?? '').trim() !== 'All') continue;
    const yearToken = String(cells[yearIndex] ?? '').trim();
    const year = Number(yearToken.replace(/f$/i, ''));
    const raw = Number(String(cells[amountIndex]).replace(/,/g, ''));
    if (!year || !Number.isFinite(raw)) continue;
    const unit = (cells[unitIndex] ?? '').replace(/\u00a0/g, ' ').toLowerCase();
    if (unit && !/1,000|thousand/.test(unit)) continue;
    const state = cells[stateIndex].trim().toUpperCase();
    if (state !== 'US' && state !== 'TX') continue;
    points.push({
      year,
      state: state === 'US' ? 'United States' : 'Texas',
      dollars: Math.round(raw * 1000),
      forecast: /f$/i.test(yearToken),
    });
  }
  return points;
}

/**
 * ERS farm-income cash receipts workbook exported as CSV.
 * Accepts the long "Annual cash receipts" file from the data release zip.
 * Returns dollars, not thousands.
 */
export function parseCashReceipts(csvText) {
  const lines = csvText.replace(/^\uFEFF/, '').split(/\r?\n/).filter(Boolean);
  if (!lines.length) return [];
  const header = splitCsv(lines[0]).map((cell) => cell.trim().toLowerCase());
  const index = (...names) => header.findIndex((cell) => names.includes(cell));
  const yearIndex = index('year');
  const stateIndex = index('state', 'state_name', 'state name', 'areaname', 'area');
  const commodityIndex = index('commodity', 'commodityname', 'commodity name', 'variable');
  const valueIndex = index('value', 'amount', 'cash receipts', 'cash_receipts');
  const unitIndex = index('unit', 'units');
  if (yearIndex < 0 || stateIndex < 0 || valueIndex < 0) return [];
  const points = [];
  for (const line of lines.slice(1)) {
    const cells = splitCsv(line);
    const commodity = commodityIndex >= 0 ? cells[commodityIndex] : '';
    if (commodity && !/^cattle and calves$/i.test(commodity.trim())) continue;
    const yearToken = String(cells[yearIndex] ?? '').trim();
    const year = Number(yearToken.replace(/f$/i, ''));
    const raw = Number(String(cells[valueIndex]).replace(/,/g, ''));
    if (!year || !Number.isFinite(raw)) continue;
    const unit = unitIndex >= 0 ? cells[unitIndex].toLowerCase() : '';
    const dollars = /million/.test(unit) ? raw * 1_000_000 : /thousand|\$1,000|1000/.test(unit) ? raw * 1000 : raw;
    const state = cells[stateIndex].trim();
    const forecast = /f$/i.test(yearToken) || /forecast/i.test(cells.join(' '));
    points.push({ year, state, dollars: Math.round(dollars), forecast });
  }
  return points;
}
