#!/usr/bin/env node
/**
 * Read the Bastrop County outdoor-burning page and the Texas A&M Forest Service
 * burn-ban layer. Rewrite src/data/burnBan.ts only when both say the same thing
 * in an exact, expected sentence. Otherwise leave the files alone so the
 * masthead can age into “not confirmed.”
 *
 *   node scripts/check-burn-ban.mjs          # print the reading
 *   node scripts/check-burn-ban.mjs --write  # update the status files
 */
import { readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  chicagoDate,
  decide,
  noticeMarkdown,
  parseCountyStatus,
  parseForestStatus,
  patchBurnBan,
  sources,
  statusCopy,
} from './burn-ban-parse.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const burnFile = join(root, 'src/data/burnBan.ts');
const noticeFile = join(root, 'src/content/updates/outdoor-burning-status.md');
const write = process.argv.includes('--write');

async function fetchText(url) {
  const response = await fetch(url, {
    headers: { 'user-agent': 'Bastropia burn-ban check (https://bastropia.com)', accept: 'text/html,application/json' },
    redirect: 'follow',
    signal: AbortSignal.timeout(20000),
  });
  if (!response.ok) throw new Error(`${url} returned ${response.status}`);
  return response.text();
}

const [countyHtml, forestText] = await Promise.all([fetchText(sources.COUNTY_URL), fetchText(sources.FOREST_QUERY)]);
let forestJson;
try {
  forestJson = JSON.parse(forestText);
} catch {
  console.error('Forest Service layer was not JSON');
  process.exit(1);
}

const county = parseCountyStatus(countyHtml);
const forest = parseForestStatus(forestJson);
const decision = decide(county, forest);
const checked = chicagoDate();
const report = {
  checked,
  write: decision.write,
  reason: decision.reason ?? null,
  countyText: county.text ?? null,
  forestBan: forest.ban ?? null,
  inEffect: decision.write ? decision.inEffect : null,
  sources: { county: sources.COUNTY_URL, forest: sources.FOREST_PAGE, forestLayer: sources.FOREST_QUERY },
};
console.log(JSON.stringify(report, null, 2));

if (!decision.write) process.exit(1);

const copy = statusCopy(decision.inEffect, checked);
const current = await readFile(burnFile, 'utf8');
const nextBurn = patchBurnBan(current, { ...copy, inEffect: decision.inEffect, checked });
const nextNotice = noticeMarkdown({ inEffect: decision.inEffect, checked });
const currentNotice = await readFile(noticeFile, 'utf8');

if (nextBurn === current && nextNotice === currentNotice) {
  console.log('Status files already match this reading.');
  process.exit(0);
}

if (!write) {
  console.log('Files differ. Re-run with --write to update them.');
  process.exit(0);
}

await writeFile(burnFile, nextBurn);
await writeFile(noticeFile, nextNotice);
console.log('Updated burn ban status files.');
