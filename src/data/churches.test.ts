import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import {
  aggregatorTimesCount,
  churchGroupsList,
  churches,
  churchesWithTimesCount,
  churchesWithoutTimesCount,
  churchCount,
  officialTimesCount,
  phoneLinks,
} from './churches.ts';
import { churchDirectory } from '../lib/schema.ts';

test('the directory matches the verified November 22 counts', () => {
  assert.equal(churchCount, 162);
  assert.equal(officialTimesCount, 62);
  assert.equal(aggregatorTimesCount, 8);
  assert.equal(churchesWithTimesCount, 70);
  assert.equal(churchesWithoutTimesCount, 92);
});

test('times not posted never become a schedule', () => {
  for (const church of churches) {
    assert.notEqual(church.worshipTimes.toLowerCase(), 'times not posted');
    assert.notEqual(church.midweekServices.toLowerCase(), 'times not posted');
    assert.notEqual(church.times.toLowerCase(), 'times not posted');
    if (church.confidence === 'times not posted') {
      assert.equal(church.worshipTimes, '', church.name);
      assert.equal(church.midweekServices, '', church.name);
      assert.equal(church.times, '', church.name);
    } else {
      assert.ok(church.worshipTimes || church.midweekServices, church.name);
    }
  }
});

test('official congregations are listed before aggregator times in each town', () => {
  for (const group of churchGroupsList) {
    const ranks = group.churches.map((church) => (church.confidence === 'official' ? 0 : 1));
    const sorted = [...ranks].sort((a, b) => a - b);
    assert.deepEqual(ranks, sorted, group.label);
  }
});

test('partner details from the site banner survive the merge', () => {
  const rosanky = churches.find((church) => church.name === 'Rosanky Baptist Church');
  assert.ok(rosanky);
  assert.equal(rosanky?.partner, true);
  assert.equal(rosanky?.featured, true);
  assert.equal(rosanky?.image, '/images/banners/rosanky-baptist-church.jpg');
  assert.equal(rosanky?.worshipTimes, 'Sunday Bible study 9:00 a.m.; Sunday worship 10:00 a.m');
});

test('a copied street number is not published as a ZIP', () => {
  const elgin = churches.find((church) => church.name === 'First Baptist Church of Elgin');
  const taylorsville = churches.find((church) => church.name === 'Taylorsville Assembly of God');
  assert.equal(elgin?.zip, '78621');
  assert.equal(elgin?.address, '13916 County Line Road, Elgin, TX 78621');
  assert.equal(taylorsville?.zip, '78662');
  assert.equal(taylorsville?.address, '16985 FM 86, Red Rock, TX 78662');
});

test('a placeholder street does not get a directions link', () => {
  const fellowship = churches.find((church) => church.name === 'End Tyme Fellowship');
  assert.equal(fellowship?.streetAddress, '');
  assert.equal(fellowship?.directions, '');
  assert.equal(fellowship?.address, 'Bastrop, TX');
});

test('two published phone numbers stay separate tel links', () => {
  const links = phoneLinks('(512) 321-3384; (512) 303-3221');
  assert.deepEqual(links.map((link) => link.href), ['tel:+15123213384', 'tel:+15123033221']);
});

test('JSON-LD uses Church and PlaceOfWorship with address, url, and telephone', () => {
  const list = churchDirectory(churches);
  assert.equal(list.numberOfItems, 162);
  const episcopal = list.itemListElement.find((item) => item.item.name === 'Calvary Episcopal Church');
  assert.ok(episcopal);
  assert.deepEqual(episcopal?.item['@type'], ['Church', 'PlaceOfWorship']);
  assert.equal(episcopal?.item.url, 'https://cecbastrop.org/sundays-at-calvary/');
  assert.equal(episcopal?.item.telephone, '+15123037515');
  assert.equal(episcopal?.item.address.streetAddress, '603 Spring St. (sanctuary); Parish Hall at 1028 Main St.');
  assert.equal(episcopal?.item.address.addressLocality, 'Bastrop');
  assert.equal(episcopal?.item.address.postalCode, '78602');

  const unposted = list.itemListElement.find((item) => item.item.name === 'End Tyme Fellowship');
  assert.ok(unposted);
  assert.equal(unposted?.item.url, undefined);
  assert.equal(unposted?.item.telephone, undefined);
  assert.equal(unposted?.item.address.streetAddress, undefined);
  assert.equal(String(unposted?.item.description).includes('times not posted'), false);
  assert.equal(String(unposted?.item.description).includes('a.m.'), false);
});

test('the generated file matches the CSV', () => {
  const result = spawnSync(process.execPath, ['scripts/build-churches.mjs', '--check'], { encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr || result.stdout);
});
