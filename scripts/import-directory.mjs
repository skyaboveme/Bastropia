/**
 * Load the chamber directory snapshot into the businesses database.
 * Hours and daily specials stay blank. Partner landings are skipped.
 *
 *   node scripts/import-directory.mjs
 *   node scripts/import-directory.mjs --remote
 */
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const remote = process.argv.includes('--remote');
const root = new URL('..', import.meta.url).pathname;
const snapshot = JSON.parse(readFileSync(join(root, 'src/data/chamberDirectory.json'), 'utf8'));
const records = snapshot.businesses || [];
const partnerNames = new Set(
  ['String Prairie Heating & Air', 'Barron Homes', 'Barefoot Flower Farms', 'Lost Pines Toyota', 'RosaTex Landscaping'].map(normalize),
);
const reserved = new Set([
  'bastrop', 'elgin', 'smithville', 'cedar-creek', 'mcdade', 'paige', 'rosanky',
  'directory', 'eats', 'government', 'news', 'events', 'weather', 'scores', 'videos',
  'groups', 'development', 'advertise', 'search', 'about', 'desk', 'business', 'businesses',
  'tips', 'thanks', 'alerts', 'now', 'newsletter', 'submit', 'upgrade', 'phone-numbers',
  'new-here', 'schools', 'roads', 'go-vote', 'election-night', 'results', 'calendar',
  'this-weekend', 'burn-ban', 'sitemap', 'api', 'go', 'ics', 'social',
  'barronhomes', 'stringprairieheatingandair', 'barefootflowerfarms', 'lostpinestoyota', 'rosatexlandscaping',
]);
const towns = {
  bastrop: 'Bastrop',
  batsrop: 'Bastrop',
  elgin: 'Elgin',
  smithville: 'Smithville',
  'cedar creek': 'Cedar Creek',
  mcdade: 'McDade',
  paige: 'Paige',
  rosanky: 'Rosanky',
};

function normalize(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function slugify(name) {
  const base = name
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48) || 'business';
  return reserved.has(base) ? `${base}-listing` : base;
}

function sql(value, max) {
  return `'${String(value ?? '').replace(/\s+/g, ' ').trim().slice(0, max).replace(/'/g, "''")}'`;
}

function townOf(record) {
  const locality = String(record.locality || '').replace(/batsrop/i, 'Bastrop');
  const key = locality.toLowerCase().trim();
  if (towns[key]) return towns[key];
  for (const [alias, town] of Object.entries(towns)) {
    if (key.includes(alias)) return town;
  }
  return 'Bastrop County';
}

function placeOf(record) {
  if (record.address) return record.address;
  const locality = String(record.locality || '').replace(/batsrop/i, 'Bastrop');
  if (locality && record.region && record.postalCode) return `${locality}, ${record.region} ${record.postalCode}`;
  if (locality && record.region) return `${locality}, ${record.region}`;
  return locality || '';
}

function categoryOf(record) {
  const categories = (record.categories || []).map((item) => String(item).trim()).filter(Boolean);
  const skip = new Set(['friends of the chamber', 'thoughtleader investor', 'investors', 'investor']);
  return categories.find((item) => !skip.has(item.toLowerCase())) || categories[0] || 'Chamber member';
}

function existingNames() {
  const args = ['wrangler', 'd1', 'execute', 'bastropia-businesses', '--json', '--command', 'SELECT name FROM businesses'];
  if (remote) args.push('--remote');
  else args.push('--local');
  const raw = execFileSync('npx', args, { cwd: root, encoding: 'utf8', maxBuffer: 20 * 1024 * 1024 });
  const parsed = JSON.parse(raw.slice(raw.indexOf('[')));
  const rows = parsed[0]?.results || [];
  return new Set(rows.map((row) => normalize(row.name)));
}

const taken = existingNames();
const usedSlugs = new Set();
const now = new Date().toISOString();
const statements = [];

for (const record of records) {
  const name = String(record.name || '').trim();
  const key = normalize(name);
  if (!key || partnerNames.has(key) || taken.has(key)) continue;
  let slug = slugify(name);
  let n = 2;
  while (usedSlugs.has(slug)) {
    slug = `${slugify(name).slice(0, 44)}-${n}`;
    n += 1;
  }
  usedSlugs.add(slug);
  taken.add(key);
  const id = `biz${createHash('sha256').update(key).digest('hex').slice(0, 12)}`;
  const category = categoryOf(record);
  const details = String(record.summary || '').trim();
  statements.push(
    `INSERT OR IGNORE INTO businesses (id, slug, name, category, city, areas, phone, website, email, contact, address, details, hours, daily_special, status, created_at, updated_at) VALUES (${sql(id, 20)}, ${sql(slug, 60)}, ${sql(name, 100)}, ${sql(category, 60)}, ${sql(townOf(record), 40)}, '', ${sql(record.phone, 30)}, ${sql(record.website, 300)}, '', '', ${sql(placeOf(record), 200)}, ${sql(details, 1200)}, '', '', 'live', ${sql(now, 40)}, ${sql(now, 40)});`,
  );
}

const dir = mkdtempSync(join(tmpdir(), 'bastropia-directory-'));
const files = [];
for (let i = 0; i < statements.length; i += 150) {
  const file = join(dir, `batch-${files.length}.sql`);
  writeFileSync(file, statements.slice(i, i + 150).join('\n'));
  files.push(file);
}

for (const file of files) {
  const args = ['wrangler', 'd1', 'execute', 'bastropia-businesses', '--file', file];
  if (remote) args.push('--remote');
  else args.push('--local');
  execFileSync('npx', args, { cwd: root, stdio: 'inherit' });
}

console.log(`Imported ${statements.length} listings (${remote ? 'remote' : 'local'}).`);
