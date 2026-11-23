import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  collectHebWeekly,
  formatValidRange,
  hebSearchUrl,
  normalizeProduct,
  parseHebWeekly,
  pickPublication,
  pickStore,
  priceLabel,
  regularLabel,
  trendScore,
  trendingItems,
  type HebItem,
} from './hebWeekly.ts';

function item(partial: Partial<HebItem> & Pick<HebItem, 'id' | 'name'>): HebItem {
  return {
    categories: ['Grocery'],
    price: null,
    regularPrice: null,
    unit: '',
    prePrice: '',
    saleStory: '',
    dollarsOff: null,
    percentOff: null,
    freeDeal: false,
    image: '',
    page: 1,
    top: 0,
    pageHeight: 2560,
    left: 0,
    width: 100,
    height: 100,
    href: hebSearchUrl(partial.name),
    ...partial,
  };
}

test('normalizeProduct keeps the deal, the cutout, and an H-E-B search link', () => {
  const product = normalizeProduct({
    id: 1054016866,
    name: 'H-E-B Prime 1 Boneless Beef Shoulder Roast',
    sale_story: 'SAVE up to $1 per lb.',
    current_price: '6.99',
    original_price: '7.99',
    dollars_off: '1.00',
    percent_off: '13.0',
    post_price_text: 'lb.',
    categories: ['Deli'],
    page: 1,
    top: 1026.77,
    left: 47.9,
    width: 470,
    height: 240,
    page_height: 2560,
    hosted_coupon_image: 'http://f.wishabi.net/page_items/440449637/1794496947/extra_large.jpg',
    image_url: 'https://evil.example/track.jpg',
  });
  assert.ok(product);
  assert.equal(product.price, 6.99);
  assert.equal(product.regularPrice, 7.99);
  assert.equal(product.percentOff, 13);
  assert.equal(product.dollarsOff, 1);
  assert.equal(product.unit, 'lb.');
  assert.deepEqual(product.categories, ['Deli']);
  assert.equal(product.image, 'https://f.wishabi.net/page_items/440449637/1794496947/extra_large.jpg');
  assert.equal(product.href, 'https://www.heb.com/search?q=H-E-B%20Prime%201%20Boneless%20Beef%20Shoulder%20Roast');
  assert.equal(priceLabel(product), '$6.99 lb.');
  assert.equal(regularLabel(product), '$7.99');
});

test('normalizeProduct reads coupon dollars from the sale story', () => {
  const product = normalizeProduct({
    id: '1',
    name: 'our goods Triple Buffet Server',
    sale_story: 'SAVE $12 with yellow coupon in-store or online',
    current_price: '',
    categories: [],
  });
  assert.ok(product);
  assert.equal(product.price, null);
  assert.equal(product.dollarsOff, 12);
  assert.equal(product.categories[0], 'Other');
  assert.equal(priceLabel(product), 'SAVE $12 with yellow coupon in-store or online');
  const basket = normalizeProduct({
    id: 'toys',
    name: 'Toys or Plush Items',
    sale_story: 'SAVE $5 OFF YOUR BASKET with yellow coupon in-store or online WHEN YOU BUY $25',
  });
  const diapers = normalizeProduct({
    id: 'pampers',
    name: 'Pampers Diapers',
    sale_story: 'WHEN YOU BUY $50 OF Pampers Diapers SAVE $10 OFF YOUR BASKET',
  });
  assert.equal(basket?.dollarsOff, 5);
  assert.equal(diapers?.dollarsOff, 10);
});

test('a free-with-purchase story ranks as a free deal, not a 12-pound price', () => {
  const product = normalizeProduct({
    id: 'ham',
    name: 'H-E-B Spiral Sliced Ham',
    sale_story: 'FREE TURKEY with yellow coupon, GET UP TO A 12 LB. RiverSide turkey WHEN YOU BUY a ham',
    page: 1,
    top: 100,
  });
  assert.ok(product);
  assert.equal(product.freeDeal, true);
  assert.equal(product.dollarsOff, null);
  assert.ok(trendScore(product) > 70);
});

test('pickStore uses Bastrop store 582, not the first store in the list', () => {
  const store = pickStore([
    { merchant_store_code: '475', name: 'Elgin H-E-B', address: '1080 HIGHWAY 290 W', city: 'ELGIN', postal_code: '78621' },
    { merchant_store_code: '582', name: 'Bastrop H-E-B Plus!', address: '104 HASLER BLVD', city: 'BASTROP', postal_code: '78602' },
  ]);
  assert.deepEqual(store, {
    code: '582',
    name: 'Bastrop H-E-B Plus!',
    address: '104 Hasler Blvd',
    city: 'Bastrop',
    postalCode: '78602',
  });
});

test('pickPublication keeps the weekly ad that is valid today', () => {
  const now = Date.parse('2026-11-23T18:00:00.000Z');
  const publication = pickPublication(
    [
      { id: 1, name: 'Holiday Book', flyer_type: 'seasonal', valid_from: '2026-11-01T00:00:00-05:00', valid_to: '2026-12-24T00:00:00-05:00', deep_link: 'https://www.heb.com/holiday' },
      { id: 8226929, name: 'Weekly Ad', flyer_type: 'weeklyad', valid_from: '2026-11-18T00:00:00-05:00', valid_to: '2026-11-26T23:59:59-05:00', deep_link: 'https://www.heb.com/weekly-ads/weekly-deals/?store_code=582' },
    ],
    now,
  );
  assert.equal(publication?.id, 8226929);
  assert.match(publication?.adUrl ?? '', /store_code=582/);
});

test('formatValidRange uses the calendar dates on the circular', () => {
  assert.equal(
    formatValidRange('2026-11-18T00:00:00-05:00', '2026-11-26T23:59:59-05:00'),
    'Valid Wednesday, November 18 through Thursday, November 26, 2026.',
  );
});

test('trending puts a named featured box first, then the biggest savings', () => {
  const apple = item({ id: 'apple', name: 'Apples', price: 0.97, page: 1, top: 200, categories: ['Fruit and Vegetables'] });
  const roast = item({
    id: 'roast',
    name: 'Beef roast',
    price: 6.99,
    percentOff: 13,
    dollarsOff: 1,
    page: 2,
    top: 400,
    left: 1100,
  });
  const server = item({ id: 'server', name: 'Buffet server', dollarsOff: 12, page: 3, top: 1800, left: 2200 });
  const ranked = trendingItems([apple, roast, server], 3);
  assert.deepEqual(ranked.map((entry) => entry.id), ['server', 'roast', 'apple']);

  const featured = trendingItems([apple, roast, server], 3, [
    { name: 'Top Deals', left: 1000, top: 300, width: 400, height: 300 },
  ]);
  assert.equal(featured[0]?.id, 'roast');
  assert.equal(featured[1]?.id, 'server');
});

test('collectHebWeekly pages the Bastrop circular and ignores a bad image host', async () => {
  const fetchImpl: typeof fetch = async (input) => {
    const url = new URL(String(input));
    if (url.pathname.endsWith('/stores/ffheb')) {
      return Response.json([
        { merchant_store_code: '582', name: 'Bastrop H-E-B Plus!', address: '104 HASLER BLVD', city: 'BASTROP', postal_code: '78602' },
      ]);
    }
    if (url.pathname.endsWith('/publications/ffheb')) {
      assert.equal(url.searchParams.get('store_code'), '582');
      return Response.json([
        {
          id: 8226929,
          name: 'Weekly Ad',
          flyer_type: 'weeklyad',
          valid_from: '2026-11-18T00:00:00-05:00',
          valid_to: '2026-11-26T23:59:59-05:00',
          deep_link: 'https://www.heb.com/weekly-ads/weekly-deals/?store_code=582',
        },
      ]);
    }
    if (url.pathname.endsWith('/highlights')) return Response.json([]);
    if (url.pathname.endsWith('/products')) {
      const page = url.searchParams.get('page');
      if (page === '1') {
        return Response.json([
          {
            id: 1,
            name: 'RiverSide Grade A Young Turkey',
            current_price: '0.77',
            post_price_text: 'lb.',
            categories: ['Meat and Seafood'],
            page: 1,
            top: 200,
            left: 40,
            width: 400,
            height: 300,
            hosted_coupon_image: 'https://f.wishabi.net/turkey.jpg',
          },
          {
            id: 2,
            name: 'Tracked item',
            current_price: '1.00',
            page: 1,
            top: 10,
            hosted_coupon_image: 'https://evil.example/x.jpg',
          },
        ]);
      }
      if (page === '2') {
        return Response.json([
          { id: 2, name: 'Tracked item', current_price: '1.00', page: 1, top: 10 },
          { id: 3, name: 'Red Grapes', current_price: '1.97', categories: ['Fruit and Vegetables'], page: 2, top: 80, left: 1100, width: 400, height: 200 },
        ]);
      }
      return Response.json([]);
    }
    return new Response('missing', { status: 404 });
  };

  const record = await collectHebWeekly({ fetchImpl, now: new Date('2026-11-23T18:00:00.000Z') });
  assert.ok(record);
  assert.equal(record.storeCode, '582');
  assert.equal(record.address, '104 Hasler Blvd');
  assert.equal(record.flyerId, 8226929);
  assert.deepEqual(record.items.map((entry) => entry.id), ['1', '2', '3']);
  assert.equal(record.items[1]?.image, '');
  const stored = parseHebWeekly({ ...record, fetchedAt: '2026-11-23T18:00:00.000Z' });
  assert.equal(stored?.items.length, 3);
  assert.deepEqual(
    trendingItems(stored?.items ?? []).map((entry) => entry.id),
    ['2', '1', '3'],
  );
});

test('collectHebWeekly uses the postal-code flyer when FlyerKit is blocked', async () => {
  const fetchImpl: typeof fetch = async (input) => {
    const url = new URL(String(input));
    if (url.hostname === 'api.flipp.com') return new Response('no', { status: 422 });
    if (url.pathname.endsWith('/flyers') && !url.pathname.includes('/flyers/')) {
      return Response.json({
        flyers: [{ id: 8226929, merchant: 'H-E-B', name: 'Weekly Ad', valid_from: '2026-11-18', valid_to: '2026-11-26' }],
      });
    }
    if (url.pathname.endsWith('/flyers/8226929')) {
      return Response.json({
        items: [{ id: 9, name: 'Sweet Potatoes', price: '1.00', cutout_image_url: 'https://f.wishabi.net/potato.jpg', left: 40, top: -100 }],
      });
    }
    return new Response('missing', { status: 404 });
  };
  const record = await collectHebWeekly({ fetchImpl });
  assert.equal(record?.storeCode, '582');
  assert.equal(record?.items[0]?.name, 'Sweet Potatoes');
  assert.equal(record?.items[0]?.price, 1);
  assert.equal(record?.items[0]?.image, 'https://f.wishabi.net/potato.jpg');
});
