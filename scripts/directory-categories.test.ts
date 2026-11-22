import assert from 'node:assert/strict';
import test from 'node:test';
import chamber from '../src/data/chamberDirectory.json' with { type: 'json' };
import { categoryIsMapped, publicCategories, publicCategoryFor } from '../src/data/directoryCategories.ts';
import { compareDirectory, filterDirectory, type DirectoryEntry } from '../src/data/directory.ts';
import { directoryTowns } from '../src/data/taxonomy.ts';
import { mapsSearchUrl, outboundLabel } from '../src/lib/maps.ts';

test('every chamber category maps to a public group', () => {
  const labels = new Set<string>();
  for (const business of chamber.businesses) {
    for (const label of business.categories || []) labels.add(label);
  }
  const missing = [...labels].filter((label) => !categoryIsMapped(label));
  assert.deepEqual(missing, []);
  assert.ok(publicCategories.length >= 12 && publicCategories.length <= 15);
});

test('directory towns include the smaller communities', () => {
  for (const town of ['Red Rock', 'Wyldwood', 'Dale', 'Camp Swift', 'Cedar Creek', 'Paige', 'Rosanky', 'McDade']) {
    assert.ok(directoryTowns.includes(town as (typeof directoryTowns)[number]), town);
  }
});

test('town and category filters stack, and Countywide is listings with no town', () => {
  const entries: DirectoryEntry[] = [
    { id: '1', name: 'Elgin Cafe', category: 'Restaurants', place: 'Elgin', town: 'Elgin', href: '/a', summary: '', source: 'listed' },
    { id: '2', name: 'County Lunch', category: 'Restaurants', place: 'Bastrop County', town: null, href: '/b', summary: '', source: 'listed' },
    { id: '3', name: 'Elgin Plumbing', category: 'Plumbing Services', place: 'Elgin', town: 'Elgin', href: '/c', summary: '', source: 'listed' },
  ];
  const both = filterDirectory({ category: 'food-drink', town: 'Elgin' }, entries);
  assert.deepEqual(both.map((entry) => entry.name), ['Elgin Cafe']);
  const county = filterDirectory({ category: 'food-drink', town: 'Countywide' }, entries);
  assert.deepEqual(county.map((entry) => entry.name), ['County Lunch']);
});

test('featured and spotlight sort ahead of partners', () => {
  const entries: DirectoryEntry[] = [
    { id: 'p', name: 'Partner', category: 'Restaurants', place: 'Bastrop', town: 'Bastrop', href: '/p', summary: '', source: 'partner' },
    { id: 'f', name: 'Featured Cafe', category: 'Restaurants', place: 'Bastrop', town: 'Bastrop', href: '/f', summary: '', source: 'listed', tier: 'featured' },
    { id: 's', name: 'Spotlight Cafe', category: 'Restaurants', place: 'Bastrop', town: 'Bastrop', href: '/s', summary: '', source: 'listed', tier: 'spotlight' },
    { id: 'c', name: 'Cafe', category: 'Restaurants', place: 'Bastrop', town: 'Bastrop', href: '/c', summary: '', source: 'listed' },
  ];
  assert.deepEqual(entries.sort(compareDirectory).map((entry) => entry.tier || entry.source), ['featured', 'spotlight', 'partner', 'listed']);
});

test('maps and facebook labels', () => {
  assert.equal(mapsSearchUrl('Bastrop'), '');
  assert.equal(mapsSearchUrl('Bastrop County'), '');
  assert.match(mapsSearchUrl('400 Old Austin Hwy, Bastrop, TX 78602'), /google\.com\/maps/);
  assert.equal(outboundLabel('https://www.facebook.com/example'), 'Facebook');
  assert.equal(outboundLabel('https://example.com'), 'Website');
  assert.equal(publicCategoryFor('Heating and air').slug, 'home-services');
});
