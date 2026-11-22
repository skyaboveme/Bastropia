/**
 * Hide, restore, or update one directory row in D1 by id.
 *
 *   node scripts/directory-admin.mjs hide bizabc123 --remote
 *   node scripts/directory-admin.mjs show bizabc123 --remote
 *   node scripts/directory-admin.mjs county bizabc123 0 --remote
 *   node scripts/directory-admin.mjs get bizabc123 --remote
 *   node scripts/directory-admin.mjs update bizabc123 --set category="Restaurants" --set hours="Mon–Fri 8–5" --remote
 *   node scripts/directory-admin.mjs update bizabc123 --set status=hidden --dry-run
 *
 * Uses `npx wrangler d1 execute bastropia-businesses`.
 * Omit --remote to use the local database. --dry-run prints the SQL and does not execute it.
 *
 * status=hidden removes the business from the public directory, including the
 * chamberDirectory.json fallback, once D1 can be queried. in_county=0 does the same
 * for a business outside Bastrop County.
 *
 * source, last_verified, socials, and in_county exist only after
 * migrations/0005_directory_meta.sql has been applied.
 */
import { execFileSync } from 'node:child_process';

const database = 'bastropia-businesses';
const columns = new Set([
  'name',
  'category',
  'city',
  'areas',
  'phone',
  'website',
  'email',
  'contact',
  'address',
  'details',
  'hours',
  'daily_special',
  'status',
  'source',
  'last_verified',
  'socials',
  'in_county',
]);

const args = process.argv.slice(2);
const remote = args.includes('--remote');
const dryRun = args.includes('--dry-run');
const positional = args.filter((arg) => !arg.startsWith('--'));
const action = positional[0] || '';
const id = positional[1] || '';

function usage() {
  console.log(`Usage:
  node scripts/directory-admin.mjs hide <id> [--remote]
  node scripts/directory-admin.mjs show <id> [--remote]
  node scripts/directory-admin.mjs county <id> <0|1> [--remote]
  node scripts/directory-admin.mjs get <id> [--remote]
  node scripts/directory-admin.mjs update <id> --set column=value [--remote]
  Add --dry-run to print SQL without executing it.`);
}

function quote(value) {
  return `'${String(value).replace(/'/g, "''")}'`;
}

function setsFromArgs() {
  const sets = [];
  for (let i = 0; i < args.length; i += 1) {
    if (args[i] !== '--set') continue;
    const raw = args[i + 1] || '';
    const eq = raw.indexOf('=');
    if (eq <= 0) throw new Error(`Expected --set column=value, got ${raw || '(missing)'}`);
    const column = raw.slice(0, eq);
    const value = raw.slice(eq + 1);
    if (!columns.has(column)) throw new Error(`Column not allowed: ${column}`);
    sets.push([column, value]);
    i += 1;
  }
  return sets;
}

function checkValue(column, value) {
  if (column === 'status' && !['pending', 'live', 'hidden'].includes(value)) {
    throw new Error('status must be pending, live, or hidden');
  }
  if (column === 'in_county' && value !== '0' && value !== '1') throw new Error('in_county must be 0 or 1');
  if (column === 'last_verified' && value && !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error('last_verified must be YYYY-MM-DD');
  }
  if (column === 'socials' && value) {
    const parsed = JSON.parse(value);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('socials must be a JSON object');
    return JSON.stringify(parsed);
  }
  return value;
}

function sqlValue(column, value) {
  const checked = checkValue(column, value);
  if (column === 'in_county') return checked;
  return quote(checked);
}

function requireId() {
  if (!/^[A-Za-z0-9_-]{1,80}$/.test(id)) throw new Error('id must be letters, numbers, _ or -');
}

function statement() {
  requireId();
  const now = new Date().toISOString();
  if (action === 'hide' || action === 'show') {
    const status = action === 'hide' ? 'hidden' : 'live';
    return `UPDATE businesses SET status = '${status}', updated_at = ${quote(now)} WHERE id = ${quote(id)};`;
  }
  if (action === 'county') {
    const flag = positional[2];
    if (flag !== '0' && flag !== '1') throw new Error('county expects 0 or 1');
    return `UPDATE businesses SET in_county = ${flag}, updated_at = ${quote(now)} WHERE id = ${quote(id)};`;
  }
  if (action === 'get') return `SELECT * FROM businesses WHERE id = ${quote(id)};`;
  if (action === 'update') {
    const sets = setsFromArgs();
    if (!sets.length) throw new Error('update needs at least one --set column=value');
    const assignments = sets.map(([column, value]) => `${column} = ${sqlValue(column, value)}`);
    assignments.push(`updated_at = ${quote(now)}`);
    return `UPDATE businesses SET ${assignments.join(', ')} WHERE id = ${quote(id)};`;
  }
  throw new Error(`Unknown action: ${action || '(missing)'}`);
}

if (!action || action === 'help') {
  usage();
  process.exit(action ? 0 : 1);
}

let sql = '';
try {
  sql = statement();
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  usage();
  process.exit(1);
}

if (dryRun) {
  console.log(sql);
  process.exit(0);
}

const command = ['wrangler', 'd1', 'execute', database, '--json', '--command', sql];
if (remote) command.push('--remote');
else command.push('--local');
const raw = execFileSync('npx', command, { cwd: new URL('..', import.meta.url).pathname, encoding: 'utf8', maxBuffer: 20 * 1024 * 1024 });
const parsed = JSON.parse(raw.slice(raw.indexOf('[')));
console.log(JSON.stringify(parsed, null, 2));
if (action !== 'get') {
  const changes = Number(parsed?.[0]?.meta?.changes ?? 0);
  if (!changes) {
    console.error(`No row updated for ${id}.`);
    process.exit(1);
  }
}
