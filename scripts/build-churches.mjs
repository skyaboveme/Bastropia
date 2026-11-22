/**
 * Rebuild src/data/churches.ts from the verified congregation CSV.
 *
 *   node scripts/build-churches.mjs
 *   node scripts/build-churches.mjs --check
 *
 * The CSV is the source of truth for names, addresses, websites, and times.
 * A confidence of "times not posted" is written with empty worship and midweek
 * strings. Times are copied, never invented or rewritten.
 *
 * Partner and image flags survive in src/data/church-extras.json, matched by
 * normalized name + city. A home banner whose name matches a congregation is
 * also kept as a partner (Rosanky Baptist Church).
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const csvPath = join(root, 'docs/sources/bcc-churches-2026-11-22.csv');
const previousCsvPath = join(root, 'docs/sources/church-directory.csv');
const extrasPath = join(root, 'src/data/church-extras.json');
const bannersPath = join(root, 'src/data/homeBanners.ts');
const outPath = join(root, 'src/data/churches.ts');
const check = process.argv.includes('--check');

const CONFIDENCE = new Set(['official', 'aggregator', 'times not posted']);
const VERIFIED = 'Nov. 22, 2026';

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = '';
  let i = 0;
  let inQuotes = false;
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);
  while (i < text.length) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          cell += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i += 1;
        continue;
      }
      cell += c;
      i += 1;
      continue;
    }
    if (c === '"') {
      inQuotes = true;
      i += 1;
      continue;
    }
    if (c === ',') {
      row.push(cell);
      cell = '';
      i += 1;
      continue;
    }
    if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i += 1;
      row.push(cell);
      cell = '';
      if (row.some((value) => value.length)) rows.push(row);
      row = [];
      i += 1;
      continue;
    }
    cell += c;
    i += 1;
  }
  if (cell.length || row.length) {
    row.push(cell);
    if (row.some((value) => value.length)) rows.push(row);
  }
  return rows;
}

export function normalizeName(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function clean(value) {
  return String(value ?? '').replace(/\s+/g, ' ').trim();
}

function isFacebook(url) {
  if (!url) return false;
  try {
    const host = new URL(url).hostname.replace(/^www\./i, '').toLowerCase();
    return host === 'facebook.com' || host.endsWith('.facebook.com') || host === 'fb.com' || host === 'fb.me' || host === 'm.facebook.com';
  } catch {
    return false;
  }
}

/** A street cell that is only the town, or an explicit "not listed" note, is not a destination. */
export function usableStreet(street, city, state, zip) {
  const value = clean(street);
  if (!value) return '';
  if (/address not listed/i.test(value)) return '';
  const key = normalizeName(value);
  const cityStateZip = normalizeName([city, state, zip].filter(Boolean).join(' '));
  const cityState = normalizeName([city, state].filter(Boolean).join(' '));
  const cityOnly = normalizeName(city);
  if (key === cityStateZip || key === cityState || key === cityOnly) return '';
  return value;
}

function displayAddress(street, city, state, zip) {
  const place = [city, [state, zip].filter(Boolean).join(' ')].filter(Boolean).join(', ');
  return street ? [street, place].filter(Boolean).join(', ') : place;
}

function directionsUrl(street, city, state, zip) {
  if (!street) return '';
  const destination = [street, city, state, zip].filter(Boolean).join(', ');
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}`;
}

function texasZip(value) {
  const zip = clean(value);
  return /^7[5-9]\d{3}(?:-\d{4})?$/.test(zip) ? zip.slice(0, 5) : '';
}

function loadPreviousZips() {
  const table = parseCsv(readFileSync(previousCsvPath, 'utf8'));
  const header = table[0];
  const zips = new Map();
  for (const cells of table.slice(1)) {
    const row = Object.fromEntries(header.map((key, index) => [key, cells[index] ?? '']));
    const found = String(row.address || '').match(/\b(7[5-9]\d{3})\b/);
    if (!found) continue;
    zips.set(`${normalizeName(row.name)}|${normalizeName(row.city)}`, found[1]);
  }
  return zips;
}

function loadExtras() {
  const data = JSON.parse(readFileSync(extrasPath, 'utf8'));
  return data.byNameCity || {};
}

function loadBanners() {
  const text = readFileSync(bannersPath, 'utf8');
  const banners = [];
  for (const block of text.matchAll(/\{[^{}]*id:\s*'([^']+)'[^{}]*\}/g)) {
    const body = block[0];
    const name = body.match(/name:\s*'([^']+)'/)?.[1];
    const src = body.match(/src:\s*'([^']+)'/)?.[1];
    const href = body.match(/href:\s*'([^']+)'/)?.[1];
    if (name && src) banners.push({ name, src, href: href || '' });
  }
  return banners;
}

function bannerMatch(church, banners) {
  const name = normalizeName(church.name);
  return banners.find((banner) => normalizeName(banner.name) === name) || null;
}

export function buildChurches() {
  const table = parseCsv(readFileSync(csvPath, 'utf8'));
  const header = table[0];
  const expected = [
    'name', 'aka', 'denomination', 'street_address', 'city', 'state', 'zip',
    'website', 'facebook', 'phone', 'worship_times', 'midweek_services',
    'source_url', 'confidence', 'confidence_note', 'bcc_events', 'notes',
  ];
  if (header.join('|') !== expected.join('|')) {
    throw new Error(`Unexpected CSV header: ${header.join(', ')}`);
  }
  const extras = loadExtras();
  const banners = loadBanners();
  const previousZips = loadPreviousZips();
  const usedExtras = new Set();
  const warnings = [];
  const seen = new Map();
  const churches = [];

  for (const cells of table.slice(1)) {
    const row = Object.fromEntries(header.map((key, index) => [key, cells[index] ?? '']));
    const confidence = clean(row.confidence);
    if (!CONFIDENCE.has(confidence)) {
      throw new Error(`${row.name}: unknown confidence ${JSON.stringify(confidence)}`);
    }
    const name = clean(row.name);
    const city = clean(row.city);
    const key = `${normalizeName(name)}|${normalizeName(city)}`;
    if (seen.has(key)) throw new Error(`Duplicate name+city: ${name}, ${city}`);
    seen.set(key, true);

    let website = clean(row.website);
    let facebook = clean(row.facebook);
    if (isFacebook(website)) {
      if (!facebook) facebook = website;
      else if (facebook !== website) warnings.push(`${name}: website and Facebook are different Facebook URLs; kept the Facebook column`);
      website = '';
    }

    const posted = confidence !== 'times not posted';
    const worshipRaw = clean(row.worship_times);
    const midweekRaw = clean(row.midweek_services);
    if (!posted && worshipRaw && worshipRaw.toLowerCase() !== 'times not posted') {
      warnings.push(`${name}: confidence is "times not posted" but worship_times is ${JSON.stringify(worshipRaw)}; times were not copied`);
    }
    if (!posted && midweekRaw && midweekRaw.toLowerCase() !== 'times not posted') {
      warnings.push(`${name}: confidence is "times not posted" but midweek_services is ${JSON.stringify(midweekRaw)}; midweek was not copied`);
    }
    const worshipTimes = posted && worshipRaw.toLowerCase() !== 'times not posted' ? worshipRaw : '';
    const midweekServices = posted && midweekRaw.toLowerCase() !== 'times not posted' ? midweekRaw : '';
    if (posted && !worshipTimes && !midweekServices) {
      throw new Error(`${name}: confidence is ${confidence} but no times were posted`);
    }

    let zip = clean(row.zip);
    const state = clean(row.state) || 'TX';
    if (zip && !texasZip(zip)) {
      const previous = previousZips.get(key) || '';
      if (previous) {
        warnings.push(`${name} (${city}): ZIP ${JSON.stringify(zip)} is not a Texas ZIP (it repeats the street number). Kept ${previous} from the previous directory.`);
        zip = previous;
      } else {
        warnings.push(`${name} (${city}): ZIP ${JSON.stringify(zip)} is not a Texas ZIP. Left the ZIP blank.`);
        zip = '';
      }
    }
    const street = usableStreet(row.street_address, city, state, zip);
    if (clean(row.street_address) && !street) {
      warnings.push(`${name} (${city}): street is not a destination (${JSON.stringify(clean(row.street_address))}); no directions link`);
    }

    const church = {
      name,
      aka: clean(row.aka),
      denomination: clean(row.denomination),
      streetAddress: street,
      city,
      state,
      zip,
      address: displayAddress(street, city, state, zip),
      directions: directionsUrl(street, city, state, zip),
      website,
      facebook,
      phone: clean(row.phone),
      worshipTimes,
      midweekServices,
      sourceUrl: clean(row.source_url),
      confidence,
      confidenceNote: clean(row.confidence_note),
      bccEvents: clean(row.bcc_events),
      notes: clean(row.notes),
      times: worshipTimes,
      verified: posted ? VERIFIED : '',
      confirmWithChurch: confidence === 'aggregator',
    };

    const extra = extras[key];
    if (extra) {
      usedExtras.add(key);
      Object.assign(church, extra);
    }
    const banner = bannerMatch(church, banners);
    if (banner) {
      church.partner = true;
      church.featured = true;
      if (!church.image) church.image = banner.src;
      if (!church.imageAlt) church.imageAlt = church.name;
      warnings.push(`${name}: kept partner banner ${banner.src}`);
    }
    churches.push(church);
  }

  for (const key of Object.keys(extras)) {
    if (!usedExtras.has(key)) throw new Error(`church-extras.json key did not match a congregation: ${key}`);
  }

  return { churches, warnings };
}

const helperSource = `
export type ChurchConfidence = 'official' | 'aggregator' | 'times not posted';

export type Church = {
  name: string;
  aka: string;
  denomination: string;
  /** Street line only when it is a real destination. Placeholder town-only cells are blank. */
  streetAddress: string;
  city: string;
  state: string;
  zip: string;
  /** Display address. Placeholder streets are omitted. */
  address: string;
  /** Google Maps directions URL, or blank when there is no street destination. */
  directions: string;
  website: string;
  facebook: string;
  phone: string;
  /** Weekend or weekly worship. Empty when the church has not posted times. */
  worshipTimes: string;
  midweekServices: string;
  sourceUrl: string;
  confidence: ChurchConfidence;
  confidenceNote: string;
  bccEvents: string;
  notes: string;
  /** Same as worshipTimes. Empty when times are not posted. */
  times: string;
  verified: string;
  confirmWithChurch: boolean;
  image?: string;
  imageAlt?: string;
  featured?: boolean;
  partner?: boolean;
};

export type ChurchGroup = {
  id: string;
  label: string;
  churches: Church[];
};

export const churchTimesChecked = 'Nov. 22, 2026';
export const officialTimesNote = 'Times verified on church website Nov 22, 2026';
export const aggregatorTimesNote = 'Times from a third-party listing; confirm with the church';

/** Towns that lead the directory. Every other city still gets its own group. */
export const primaryTowns = ['Bastrop', 'Elgin', 'Smithville', 'Cedar Creek', 'Paige', 'Red Rock', 'McDade', 'Rosanky'] as const;

export function hasPostedTimes(church: Church): boolean {
  return church.confidence !== 'times not posted' && Boolean(church.worshipTimes.trim() || church.midweekServices.trim());
}

export function townSlug(city: string): string {
  return city
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

const townRank = new Map<string, number>(primaryTowns.map((town, index) => [town, index]));

export function compareTowns(a: string, b: string): number {
  const left = townRank.get(a) ?? 1000;
  const right = townRank.get(b) ?? 1000;
  if (left !== right) return left - right;
  return a.localeCompare(b, 'en');
}

function confidenceRank(church: Church): number {
  if (church.confidence === 'official') return 0;
  if (church.confidence === 'aggregator') return 1;
  return 2;
}

export function compareChurches(a: Church, b: Church): number {
  const byTown = compareTowns(a.city, b.city);
  if (byTown !== 0) return byTown;
  const byConfidence = confidenceRank(a) - confidenceRank(b);
  if (byConfidence !== 0) return byConfidence;
  const featured = Number(Boolean(b.featured || b.partner)) - Number(Boolean(a.featured || a.partner));
  if (featured !== 0) return featured;
  return a.name.localeCompare(b.name, 'en');
}

export function churchGroups(list: Church[]): ChurchGroup[] {
  const towns = [...new Set(list.map((church) => church.city))].sort(compareTowns);
  return towns.map((town) => ({
    id: townSlug(town),
    label: town,
    churches: list.filter((church) => church.city === town).sort(compareChurches),
  }));
}

export function websiteLabel(url: string): string {
  try {
    const host = new URL(url).hostname.replace(/^www\\./, '');
    if (host === 'facebook.com' || host.endsWith('.facebook.com')) return 'Facebook page';
    return host;
  } catch {
    return 'Church website';
  }
}

export function phoneLinks(phone: string): { href: string; label: string }[] {
  return phone
    .split(/;|\\band\\b/i)
    .map((part) => part.trim())
    .filter((part) => /\\d/.test(part))
    .map((label) => {
      const digits = label.replace(/\\D/g, '');
      const href = digits.length === 10
        ? \`tel:+1\${digits}\`
        : digits.length === 11 && digits.startsWith('1')
          ? \`tel:+\${digits}\`
          : \`tel:\${digits}\`;
      return { href, label };
    });
}

export function churchSearchText(church: Church): string {
  const digits = church.phone.replace(/\\D/g, '');
  return [church.name, church.aka, church.denomination, church.city, church.address, church.phone, digits]
    .join(' ')
    .toLowerCase();
}

export const churchesWithTimes = churches.filter(hasPostedTimes).sort(compareChurches);
export const churchesWithoutTimes = churches.filter((church) => !hasPostedTimes(church)).sort(compareChurches);
export const churchGroupsList = churchGroups(churchesWithTimes);
export const churchMoreGroups = churchGroups(churchesWithoutTimes);
export const churchTowns = [...new Set(churches.map((church) => church.city))].sort(compareTowns);
export const churchDenominations = [...new Set(churches.map((church) => church.denomination).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'en'));
export const churchCount = churches.length;
export const churchesWithTimesCount = churchesWithTimes.length;
export const churchesWithoutTimesCount = churchesWithoutTimes.length;
export const officialTimesCount = churches.filter((church) => church.confidence === 'official').length;
export const aggregatorTimesCount = churches.filter((church) => church.confidence === 'aggregator').length;
`;

function render(churches) {
  const body = JSON.stringify(churches, null, 2);
  const marker = 'export const churchTimesChecked';
  const markerAt = helperSource.indexOf(marker);
  const types = helperSource.slice(0, markerAt);
  const after = helperSource.slice(markerAt);
  return `/**
 * Bastrop County church directory for /churches.
 * Generated by scripts/build-churches.mjs from docs/sources/bcc-churches-2026-11-22.csv.
 * Do not edit times, names, addresses, or websites by hand.
 * Confidence "times not posted" is stored with empty worshipTimes and midweekServices.
 * Partner images and flags come from src/data/church-extras.json and matching home banners.
 */
${types}
export const churches: Church[] = ${body};

${after}`;
}

const isDirect = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (!isDirect) {
  // Importers can call buildChurches() without writing the file.
} else {
const { churches, warnings } = buildChurches();
const official = churches.filter((church) => church.confidence === 'official').length;
const aggregator = churches.filter((church) => church.confidence === 'aggregator').length;
const unposted = churches.filter((church) => church.confidence === 'times not posted').length;
const rendered = render(churches);

if (check) {
  const current = readFileSync(outPath, 'utf8');
  if (current !== rendered) {
    console.error('src/data/churches.ts is out of date. Run node scripts/build-churches.mjs');
    process.exit(1);
  }
  console.log(`churches.ts matches the CSV (${churches.length} congregations).`);
} else {
  writeFileSync(outPath, rendered);
  console.log(`Wrote ${churches.length} congregations (${official} official, ${aggregator} aggregator, ${unposted} times not posted).`);
}

for (const warning of warnings) console.log(`note: ${warning}`);
}
