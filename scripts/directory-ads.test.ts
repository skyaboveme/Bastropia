import assert from 'node:assert/strict';
import test from 'node:test';
import { directoryFounding, directoryProducts, type DirectoryAdSlot } from '../src/data/directoryAds.ts';
import { directoryEntries } from '../src/data/directory.ts';
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
import { directoryAdContext, directoryAdvertiserPins, entryToIndexRow, filterDirectoryRows, toDirectoryCard } from '../src/lib/directoryView.ts';

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
  assert.equal(house, null);
  const placeholder = houseDirectoryPromo('spotlight', { town: 'Paige' });
  assert.equal(placeholder.id, 'house-spotlight');
  assert.equal(placeholder.label, 'Advertise');
  assert.match(placeholder.line, /\$99/);
});

test('in-feed follows every ten results and a short list still gets one', () => {
  const cards = (count: number) => Array.from({ length: count }, (_, index) => ({ id: String(index), badges: index === 0 ? ['Featured'] : [] }));
  const full = composeDirectoryFeed(cards(24), { category: 'food-drink' }, '2026-11-23', slots);
  const ads = full.filter((item) => item.kind === 'ad');
  assert.equal(ads.length, 3);
  assert.equal(full[3].kind, 'ad');
  if (full[3].kind === 'ad') assert.equal(full[3].ad.id, 'house-spotlight');
  assert.equal(full[11].kind, 'ad');
  if (full[11].kind === 'ad') assert.equal(full[11].ad.id, 'infeed-food');
  const short = composeDirectoryFeed(cards(4).map((card) => ({ ...card, badges: [] })), {}, '2026-11-23', []);
  assert.equal(short[0].kind, 'card');
  assert.equal(short[3].kind, 'ad');
  if (short[3].kind === 'ad') assert.match(short[3].ad.line, /Spotlight/);
  assert.equal(short[4].kind, 'ad');
  if (short[4].kind === 'ad') assert.equal(short[4].ad.title, 'Your business here');
  assert.equal(short.at(-1)?.kind, 'ad');
  if (short.at(-1)?.kind === 'ad') assert.match(short.at(-1)!.ad.title, /Advertise on Bastropia/);
  const house = houseDirectoryPromo('infeed', {});
  assert.equal(house.placement, 'directory-infeed');
});

test('unsold ads stay after the third result and a paid spotlight stays above', () => {
  const paid = resolveDirectorySpotlight({ town: 'Elgin', category: 'home-repair' }, '2026-11-23', slots);
  assert.equal(paid?.id, 'spotlight-hvac-elgin');
  const cards = Array.from({ length: 4 }, (_, index) => ({ id: String(index), badges: [] as string[] }));
  const withPaid = composeDirectoryFeed(cards, { town: 'Elgin', category: 'home-repair' }, '2026-11-23', slots);
  assert.ok(withPaid.slice(0, 3).every((item) => item.kind === 'card'));
  assert.ok(withPaid.every((item) => item.kind === 'card' || item.ad.id !== 'house-spotlight'));
  const featured = composeDirectoryFeed([{ id: 'pin', badges: ['Featured'] }, ...cards.slice(1)], {}, '2026-11-23', []);
  assert.equal(featured[0].kind, 'card');
  if (featured[0].kind === 'card') assert.deepEqual(featured[0].card.badges, ['Featured']);
  assert.ok(featured.every((item) => item.kind === 'card' || item.ad.id !== 'house-featured'));
});

const keywordCases: [string, string][] = [
  ['String Prairie Heating & Air', 'hvac'],
  ['String Prairie Heating & Air', 'ac repair'],
  ['String Prairie Heating & Air', 'heating'],
  ['String Prairie Heating & Air', 'furnace'],
  ['String Prairie Heating & Air', 'hvac smithville'],
  ['Barron Homes', 'home builder'],
  ['Barron Homes', 'custom homes'],
  ['Barron Homes', 'builder'],
  ['Barron Homes', 'contractor'],
  ['Barron Homes', 'home builder bastrop'],
  ['Barefoot Flower Farms', 'florist'],
  ['Barefoot Flower Farms', 'flowers'],
  ['Barefoot Flower Farms', 'nursery'],
  ['Barefoot Flower Farms', 'wedding flowers'],
  ['Barefoot Flower Farms', 'florist bastrop'],
  ['Lost Pines Toyota', 'car dealer'],
  ['Lost Pines Toyota', 'toyota'],
  ['Lost Pines Toyota', 'used cars'],
  ['Lost Pines Toyota', 'auto repair'],
  ['Lost Pines Toyota', 'car dealer elgin'],
  ['RosaTex Landscaping', 'landscaping'],
  ['RosaTex Landscaping', 'lawn care'],
  ['RosaTex Landscaping', 'mowing'],
  ['RosaTex Landscaping', 'tree trimming'],
  ['RosaTex Landscaping', 'landscaping bastrop'],
  ['602 Brewing Company', 'brewery'],
  ['602 Brewing Company', 'burgers'],
  ['602 Brewing Company', 'restaurant'],
  ['602 Brewing Company', 'beer'],
  ['602 Brewing Company', 'restaurants bastrop'],
];

test('advertiser keywords pin the partner and guards pin nobody', () => {
  const rows = directoryEntries.map((entry) => entryToIndexRow(entry, '2026-11-23'));
  const blank = { town: '', category: '', sub: '', sort: '' as const, wide: false };
  for (const [name, query] of keywordCases) {
    const found = filterDirectoryRows(rows, { ...blank, q: query });
    const pins = directoryAdvertiserPins(rows, found.matches, found.units, found.text, found.town, '2026-11-23');
    assert.ok(pins.some((row) => row.n === name), `${query} should pin ${name}`);
    assert.ok(found.matches.slice(0, pins.length).some((row) => row.n === name), `${query} should lead with ${name}`);
  }
  for (const query of ['plumber', 'dentist', 'tacos', 'vet', 'church', 'bank', 'pizza', 'coffee']) {
    const found = filterDirectoryRows(rows, { ...blank, q: query });
    const pins = directoryAdvertiserPins(rows, found.matches, found.units, found.text, found.town, '2026-11-23');
    assert.equal(pins.length, 0, `${query} pinned ${pins.map((row) => row.n).join(', ')}`);
  }
  const smithville = filterDirectoryRows(rows, { ...blank, q: 'hvac smithville' });
  assert.equal(smithville.matches[0]?.n, 'String Prairie Heating & Air');
  assert.equal(toDirectoryCard(smithville.matches[0], new Date('2026-11-23T18:00:00Z'), smithville.town).placeLabel, 'Serves Smithville');
  const hvacSlot = {
    id: 'hvac-elgin',
    kind: 'spotlight' as const,
    name: 'String Prairie Heating & Air',
    line: 'Heating & AC in Elgin',
    href: '/StringPrairieHeatingandAir',
    concepts: ['hvac'],
    towns: ['Elgin'],
    start: '2026-11-01',
    end: '2026-12-31',
  };
  assert.equal(pickDirectorySlot('spotlight', directoryAdContext('ac repair elgin', '', ''), '2026-11-23', [hvacSlot])?.id, 'hvac-elgin');
  assert.equal(pickDirectorySlot('spotlight', directoryAdContext('plumber elgin', '', ''), '2026-11-23', [hvacSlot]), null);
  const elgin = filterDirectoryRows(rows, { ...blank, q: 'ac repair elgin' });
  const dropped = directoryAdvertiserPins(rows, elgin.matches, elgin.units, elgin.text, elgin.town, '2026-11-23', { slots: [hvacSlot] });
  assert.ok(dropped.every((row) => row.n !== 'String Prairie Heating & Air'));
});

test('nearest sorts by distance and does not pin', () => {
  const rows = directoryEntries.map((entry) => entryToIndexRow(entry, '2026-11-23'));
  rows.push({
    id: 'elgin-air',
    n: 'Elgin Air',
    c: 'Heating and air',
    t: 'Elgin',
    h: '/elgin-air',
    lat: 30.3499,
    lng: -97.3705,
    r: 3,
  });
  const blank = { q: 'hvac', town: '', category: '', sub: '', sort: 'near' as const, wide: false };
  const bastrop = filterDirectoryRows(rows, blank, { lat: 30.1105, lng: -97.3153 });
  const elgin = filterDirectoryRows(rows, blank, { lat: 30.3499, lng: -97.3705 });
  assert.notEqual(bastrop.matches[0]?.n, 'String Prairie Heating & Air');
  assert.notEqual(bastrop.matches[0]?.n, 'Elgin Air');
  assert.equal(elgin.matches[0]?.n, 'Elgin Air');
  const ordered = bastrop.matches;
  const firstMissing = ordered.findIndex((row) => typeof row.lat !== 'number');
  if (firstMissing >= 0) assert.ok(ordered.slice(firstMissing).every((row) => typeof row.lat !== 'number'));
  assert.equal(directoryAdvertiserPins(rows, bastrop.matches, bastrop.units, bastrop.text, bastrop.town, '2026-11-23', { sort: 'near' }).length, 0);
  const untitled = directoryAdContext('custom homes', '', '');
  assert.equal(untitled.category, 'builders');
  assert.equal(houseDirectoryPromo('spotlight', untitled).title, 'Builders');
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
