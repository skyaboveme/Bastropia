import assert from 'node:assert/strict';
import test from 'node:test';
import { existsSync, readFileSync } from 'node:fs';
import synonyms from '../src/data/directorySynonyms.json' with { type: 'json' };
import groups from '../src/data/directoryCategoryGroups.json' with { type: 'json' };
import { buildDirectoryMatcher } from '../src/lib/directoryMatch.ts';
import { categoryMatchesGroup, directoryGridGroups, directoryLabelInfo } from '../src/lib/directoryGroups.ts';
import { directoryOpenPill } from '../src/lib/directoryHours.ts';
import { filterDirectory } from '../src/data/directory.ts';

const matcher = buildDirectoryMatcher();

test('synonym and group files have the shipped shape', () => {
  assert.equal(synonyms.concepts.length, 81);
  assert.equal(groups.groups.length, 13);
  assert.equal(groups.groups.filter((group) => group.grid).length, 12);
  assert.equal(Object.keys(groups.labels).length, 189);
  assert.ok(synonyms.exactWordOnly.includes('vet'));
  assert.ok(synonyms.exactWordOnly.includes('eat'));
  assert.equal(directoryGridGroups().length, 12);
  assert.equal(directoryLabelInfo('Plumbing Services').group, 'home-repair');
  assert.equal(directoryLabelInfo('Not a real label').group, 'business');
});

test('every query word must match, and short words are whole words', () => {
  const rows = [
    { id: '1', n: 'Doug the Plumber', c: 'Plumbing Services', t: 'Bastrop' },
    { id: '2', n: 'Elgin Electric', c: 'Electrical Contractors / Electrician', t: 'Elgin' },
    { id: '3', n: 'Veterans of Bastrop County', c: 'Civic Organizations', t: 'Bastrop' },
    { id: '4', n: 'String Prairie Heating and Air', c: 'Air Conditioning / Heating', t: 'Cedar Creek' },
    { id: '5', n: 'Bastrop Veterinary Hospital', c: 'Veterinarians', t: 'Bastrop' },
    { id: '6', n: 'Airrosti', c: 'Health Care Clinics', t: 'Bastrop' },
    { id: '7', n: "Chuy's", c: 'Restaurants', t: 'Bastrop' },
    { id: '8', n: 'ColorWorks Salon', c: 'Hair Salons / Barber Shops', t: 'Bastrop' },
  ];
  assert.deepEqual(matcher.search(rows, 'plumber electric').map((row) => row.id), []);
  assert.deepEqual(matcher.search(rows, 'plumber').map((row) => row.n), ['Doug the Plumber']);
  assert.deepEqual(matcher.search(rows, 'vet').map((row) => row.n), ['Bastrop Veterinary Hospital']);
  assert.ok(!matcher.search(rows, 'vet').some((row) => /veteran/i.test(row.n)));
  assert.ok(!matcher.search(rows, 'eat').some((row) => /heating/i.test(row.n)));
  assert.ok(matcher.search(rows, 'eat').some((row) => row.n === "Chuy's"));
  assert.ok(!matcher.search(rows, 'church').some((row) => row.n === 'Airrosti'));
  assert.deepEqual(matcher.search(rows, 'hvac').map((row) => row.n), ['String Prairie Heating and Air']);
  assert.deepEqual(matcher.search(rows, 'haircut').map((row) => row.n), ['ColorWorks Salon']);
  assert.ok(matcher.search(rows, 'tacos').some((row) => row.n === "Chuy's"));
});

test('a town in the query is a filter, and no-town matches are a separate group', () => {
  const rows = [
    { id: '1', n: 'Elgin Cafe', c: 'Restaurants', t: 'Elgin' },
    { id: '2', n: 'Bastrop Cafe', c: 'Restaurants', t: 'Bastrop' },
    { id: '3', n: 'County Cafe', c: 'Restaurants', t: '' },
    { id: '4', n: 'Doug the Plumber', c: 'Plumbing Services', t: 'Elgin' },
  ];
  const found = matcher.search(rows, 'cafe elgin');
  assert.equal(found.town, 'Elgin');
  assert.deepEqual(found.map((row) => row.n), ['Elgin Cafe']);
  assert.deepEqual(found.countywide.map((row) => row.n), ['County Cafe']);
  const parsed = matcher.parse('mexican food in bastrop');
  assert.equal(parsed.town, 'Bastrop');
  assert.ok(parsed.units.some((unit) => unit.kind === 'concept'));
});

test('legacy category slugs still match the new groups', () => {
  assert.equal(categoryMatchesGroup('Plumbing Services', 'home-repair'), true);
  assert.equal(categoryMatchesGroup('Plumbing Services', 'home-services'), true);
  assert.equal(categoryMatchesGroup('Restaurants', 'food-drink'), true);
  assert.equal(categoryMatchesGroup('Plumbing Services', 'food-drink'), false);
  const entries = [
    { id: '1', name: 'Elgin Cafe', category: 'Restaurants', place: 'Elgin', town: 'Elgin', href: '/a', summary: '', source: 'listed' as const },
    { id: '2', name: 'County Lunch', category: 'Restaurants', place: 'Bastrop County', town: null, href: '/b', summary: '', source: 'listed' as const },
    { id: '3', name: 'Elgin Plumbing', category: 'Plumbing Services', place: 'Elgin', town: 'Elgin', href: '/c', summary: '', source: 'listed' as const },
  ];
  assert.deepEqual(filterDirectory({ category: 'food-drink', town: 'Elgin' }, entries).map((entry) => entry.name), ['Elgin Cafe']);
  assert.deepEqual(filterDirectory({ category: 'food-drink', town: 'Countywide' }, entries).map((entry) => entry.name), ['County Lunch']);
});

test('open pill reads a weekly schedule and ignores junk', () => {
  const wednesday = new Date('2026-11-18T18:00:00-06:00');
  const monday = new Date('2026-11-16T18:00:00-06:00');
  const hours = 'Tuesday–Wednesday 11:00 am–9:00 pm. Closed Monday.';
  assert.equal(directoryOpenPill(hours, wednesday), 'Open now');
  assert.equal(directoryOpenPill(hours, monday), 'Closed');
  assert.equal(directoryOpenPill('Call for hours', wednesday), null);
});

test('live index counts match the reference matcher', () => {
  const path = '/cursor/stores/bot/directory-mobile/data/live-index.json';
  if (!existsSync(path)) return;
  const rows = JSON.parse(readFileSync(path, 'utf8')).rows as { n: string; c: string; t?: string }[];
  assert.equal(matcher.search(rows, 'tacos').length, 9);
  assert.equal(matcher.search(rows, 'hvac').length, 8);
  assert.equal(matcher.search(rows, 'haircut').length, 10);
  const vet = matcher.search(rows, 'vet');
  assert.equal(vet.length, 2);
  assert.ok(vet.every((row) => !/veteran/i.test(row.n)));
  const eat = matcher.search(rows, 'eat');
  assert.ok(eat.every((row) => !/heating/i.test(`${row.n} ${row.c}`)));
  const elgin = matcher.search(rows, 'plumber elgin');
  assert.equal(elgin.town, 'Elgin');
  assert.equal(elgin.countywide.length, 3);
});
