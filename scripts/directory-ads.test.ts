import assert from 'node:assert/strict';
import test from 'node:test';
import { directoryFounding, directoryProducts, type DirectoryAdSlot } from '../src/data/directoryAds.ts';
import {
  composeDirectoryFeed,
  directoryInquireHref,
  houseDirectoryPromo,
  listingIsFeatured,
  pickDirectorySlot,
  pinDirectoryFeatured,
  promoFromSlot,
  resolveDirectorySpotlight,
  rotateFair,
} from '../src/lib/directoryAds.ts';

const slots: DirectoryAdSlot[] = [
  {
    id: 'spotlight-hvac-elgin',
    kind: 'spotlight',
    name: 'String Prairie Heating & Air',
    line: 'Heating & AC in Elgin',
    href: '/StringPrairieHeatingandAir',
    towns: ['Elgin'],
    categories: ['home-repair'],
    start: '2026-11-01',
    end: '2026-12-31',
  },
  {
    id: 'spotlight-elgin',
    kind: 'spotlight',
    name: 'Elgin Sponsor',
    line: 'Businesses in Elgin',
    href: '/elgin',
    towns: ['Elgin'],
    start: '2026-11-01',
    end: '2026-12-31',
  },
  {
    id: 'spotlight-old',
    kind: 'spotlight',
    name: 'Old',
    line: 'Old',
    href: '/old',
    start: '2026-01-01',
    end: '2026-02-01',
  },
  {
    id: 'infeed-food',
    kind: 'infeed',
    name: 'Cafe',
    line: 'Lunch in Bastrop',
    href: '/cafe',
    categories: ['food-drink'],
    start: '2026-11-01',
    end: '2026-12-31',
  },
];

test('directory prices stay in one list', () => {
  const price = (id: string) => directoryProducts.find((item) => item.id === id);
  assert.equal(price('free')?.price, 0);
  assert.equal(price('featured')?.price, 39);
  assert.equal(price('featured')?.foundingPrice, 25);
  assert.equal(price('spotlight')?.price, 99);
  assert.equal(price('spotlight')?.foundingPrice, 69);
  assert.equal(price('partner')?.price, null);
  assert.equal(directoryFounding.slots, 25);
  assert.equal(directoryFounding.months, 12);
  assert.match(directoryInquireHref('featured', 'Ada Plumbing'), /product=featured/);
  assert.match(directoryInquireHref('featured', 'Ada Plumbing'), /business=Ada(\+|%20)Plumbing/);
  assert.equal(directoryInquireHref(), '/advertise#directory');
});

test('featured pins rotate and stay inside the matches', () => {
  const rows = [
    { id: 'a', n: 'Alpha', r: 3, b: '' },
    { id: 'b', n: 'Beta', r: 0, b: 'Featured' },
    { id: 'c', n: 'Gamma', r: 0, b: 'Featured' },
    { id: 'd', n: 'Delta', r: 0, b: 'Featured' },
    { id: 'e', n: 'Echo', r: 0, b: 'Featured' },
    { id: 'f', n: 'Fox', r: 2, b: '' },
  ];
  const pinned = pinDirectoryFeatured(rows, '2026-11-23', 3);
  assert.equal(pinned.length, rows.length);
  assert.deepEqual(pinned.slice(0, 3).map((row) => row.b), ['Featured', 'Featured', 'Featured']);
  assert.equal(pinned.filter((row) => row.b === 'Featured').length, 4);
  const leads = new Set<string>();
  for (let day = 1; day <= 4; day += 1) {
    const next = pinDirectoryFeatured(rows, `2026-11-${String(day).padStart(2, '0')}`, 3);
    leads.add(next[0].id);
    assert.equal(next.slice(0, 3).filter((row) => row.b === 'Featured').length, 3);
    assert.equal(next.filter((row) => row.b === 'Featured').length, 4);
  }
  assert.ok(leads.size > 1);
  const only = rotateFair([{ id: 'solo' }], '2026-11-23', 3);
  assert.deepEqual(only, [{ id: 'solo' }]);
});

test('spotlight prefers the town and category, and expired slots stay off', () => {
  const specific = pickDirectorySlot('spotlight', { town: 'Elgin', category: 'home-repair' }, '2026-11-23', slots);
  assert.equal(specific?.id, 'spotlight-hvac-elgin');
  const townOnly = pickDirectorySlot('spotlight', { town: 'Elgin', category: 'food-drink' }, '2026-11-23', slots);
  assert.equal(townOnly?.id, 'spotlight-elgin');
  const none = pickDirectorySlot('spotlight', { town: 'Bastrop', category: 'food-drink' }, '2026-11-23', slots);
  assert.equal(none, null);
  const expired = pickDirectorySlot('spotlight', { town: 'Elgin', category: 'home-repair' }, '2026-01-15', slots);
  assert.equal(expired?.id, 'spotlight-old');
  const promo = promoFromSlot(specific!);
  assert.equal(promo.label, 'Sponsored');
  assert.match(promo.line, /String Prairie/);
  assert.equal(promo.title, 'Heating & AC in Elgin');
  const house = resolveDirectorySpotlight({ town: 'Paige' }, '2026-11-23', []);
  assert.equal(house.id, 'house-spotlight');
  assert.equal(house.label, 'Advertise');
  assert.match(house.line, /\$99/);
});

test('in-feed follows every ten results and a short list still gets one', () => {
  const cards = (count: number) => Array.from({ length: count }, (_, index) => ({ id: String(index), badges: index === 0 ? ['Featured'] : [] }));
  const full = composeDirectoryFeed(cards(24), { category: 'food-drink' }, '2026-11-23', slots);
  const ads = full.filter((item) => item.kind === 'ad');
  assert.equal(ads.length, 2);
  assert.equal(full[10].kind, 'ad');
  assert.equal(full[21].kind, 'ad');
  if (full[10].kind === 'ad') assert.equal(full[10].ad.id, 'infeed-food');
  const short = composeDirectoryFeed(cards(4).map((card) => ({ ...card, badges: [] })), {}, '2026-11-23', []);
  assert.equal(short[0].kind, 'ad');
  if (short[0].kind === 'ad') assert.equal(short[0].ad.title, 'Your business here');
  assert.equal(short.at(-1)?.kind, 'ad');
  if (short.at(-1)?.kind === 'ad') assert.match(short.at(-1)!.ad.title, /Advertise on Bastropia/);
  const house = houseDirectoryPromo('infeed', {});
  assert.equal(house.placement, 'directory-infeed');
});

test('a file match can feature a partner before the D1 column exists', () => {
  const entry = { id: 'partner:StringPrairieHeatingandAir', name: 'String Prairie Heating & Air', href: '/StringPrairieHeatingandAir', tier: '' };
  assert.equal(listingIsFeatured(entry, '2026-11-23'), false);
  assert.equal(listingIsFeatured({ ...entry, tier: 'featured' }, '2026-11-23'), true);
  assert.equal(
    listingIsFeatured(entry, '2026-11-23', [{ match: 'StringPrairieHeatingandAir', start: '2026-11-01', end: '2026-12-31' }]),
    true,
  );
  assert.equal(
    listingIsFeatured(entry, '2026-01-01', [{ match: 'StringPrairieHeatingandAir', start: '2026-11-01', end: '2026-12-31' }]),
    false,
  );
});
