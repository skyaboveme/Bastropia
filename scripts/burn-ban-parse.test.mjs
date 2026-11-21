import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  decide,
  noticeMarkdown,
  parseCountyStatus,
  parseForestStatus,
  patchBurnBan,
  statusCopy,
} from './burn-ban-parse.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

const clearHtml = `<h2>Burn Ban Status</h2>
<p><span style="font-size: 20px;">There is no burn ban in effect.</span></p>`;

function forest(ban) {
  return { features: [{ attributes: { County: 'Bastrop', BurnBan: ban, StartDate: null } }] };
}

test('county clear sentence and a No layer agree', () => {
  const county = parseCountyStatus(clearHtml);
  const decision = decide(county, parseForestStatus(forest('No')));
  assert.equal(decision.write, true);
  assert.equal(decision.inEffect, false);
});

test('a ban sentence requires the Forest Service to say Yes', () => {
  const html = '<h2>Burn Ban Status</h2><p>A burn ban is in effect.</p>';
  const county = parseCountyStatus(html);
  assert.equal(decide(county, parseForestStatus(forest('Yes'))).inEffect, true);
  assert.equal(decide(county, parseForestStatus(forest('No'))).write, false);
});

test('a nearby paragraph is not the status', () => {
  const html = `<h2>Burn Ban Status</h2><p>There is no burn ban in effect. Check again this afternoon.</p>
    <p>The TCEQ Outdoor Burning Rule first prohibits outdoor burning.</p>`;
  const county = parseCountyStatus(html);
  assert.equal(county.ok, false);
  assert.equal(decide(county, parseForestStatus(forest('No'))).write, false);
});

test('accepted ban sentences stay short and exact', () => {
  for (const sentence of ['Burn ban is in effect.', 'There is a burn ban in effect', 'A burn ban is currently in effect.']) {
    const county = parseCountyStatus(`<h2>Burn Ban Status</h2><p>${sentence}</p>`);
    assert.equal(county.ok, true, sentence);
    assert.equal(county.inEffect, true);
  }
});

test('patch keeps the rest of burnBan.ts', async () => {
  const source = await readFile(join(root, 'src/data/burnBan.ts'), 'utf8');
  const copy = statusCopy(false, '2026-11-21');
  const next = patchBurnBan(source, { ...copy, inEffect: false, checked: '2026-11-21' });
  assert.match(next, /sourceUrl: 'https:\/\/www\.bastropcounty\.gov\/page\/em\.outdoor_burning'/);
  assert.match(next, /inEffect: false/);
  assert.match(next, /checked: '2026-11-21'/);
  assert.match(next, /recentOrders:/);
});

test('notice for the November 21 clear reading matches the file', async () => {
  const expected = await readFile(join(root, 'src/content/updates/outdoor-burning-status.md'), 'utf8');
  assert.equal(noticeMarkdown({ inEffect: false, checked: '2026-11-21' }), expected);
});
