/**
 * H-E-B weekly ad for the Bastrop store.
 *
 * heb.com answers a plain fetch with an Incapsula challenge, so the daily
 * job reads the public Flipp circular H-E-B already publishes for store 582.
 * The FlyerKit token is a public client id, not a secret. The page only
 * reads the KV copy under `heb:weekly`.
 */
import { HEB_WEEKLY_AD } from '../data/heb.ts';

export const HEB_WEEKLY_KEY = 'heb:weekly';
/** 6:20am Central during standard time. Separate from the 15-minute cron. */
export const HEB_CRON = '20 12 * * *';
export const TRENDING_LIMIT = 8;

const FLYERKIT = 'https://api.flipp.com/flyerkit/v4.0';
const MERCHANT = 'ffheb';
const POSTAL_CODE = '78602';
const STORE_CODE = '582';
const ACCESS_TOKEN = '98856c1ed32273db1aac58bfe8c76d90';
const MAX_ITEMS = 200;
const PAGE_WIDTH = 1036;

const headers = {
  accept: 'application/json',
  'user-agent': 'Mozilla/5.0 (compatible; Bastropia/1.0; +https://bastropia.com)',
};

export type HebHighlight = {
  name: string;
  left: number;
  top: number;
  width: number;
  height: number;
};

export type HebItem = {
  id: string;
  name: string;
  categories: string[];
  price: number | null;
  regularPrice: number | null;
  unit: string;
  prePrice: string;
  saleStory: string;
  dollarsOff: number | null;
  percentOff: number | null;
  freeDeal: boolean;
  image: string;
  page: number;
  top: number;
  pageHeight: number;
  left: number;
  width: number;
  height: number;
  href: string;
};

export type HebWeeklyRecord = {
  fetchedAt: string;
  storeCode: string;
  storeName: string;
  address: string;
  city: string;
  postalCode: string;
  flyerId: number;
  validFrom: string;
  validTo: string;
  adUrl: string;
  items: HebItem[];
  highlights: HebHighlight[];
};

export type HebStore = {
  code: string;
  name: string;
  address: string;
  city: string;
  postalCode: string;
};

type PublicationChoice = {
  id: number;
  weekly: boolean;
  validFrom: string;
  validTo: string;
  adUrl: string;
};

function text(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function numberOf(value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value !== 'string' || !value.trim()) return null;
  const parsed = Number(value.replace(/[^0-9.-]/g, ''));
  return Number.isFinite(parsed) ? parsed : null;
}

function moneyOf(value: unknown) {
  const parsed = numberOf(value);
  if (parsed == null || parsed < 0 || parsed > 10000) return null;
  return Math.round(parsed * 100) / 100;
}

function percentOf(value: unknown) {
  const parsed = numberOf(value);
  if (parsed == null || parsed <= 0 || parsed > 100) return null;
  return Math.round(parsed * 10) / 10;
}

/** Dollar savings, not the “when you buy $50” threshold next to them. */
function dollarsInStory(story: string) {
  const amounts = [
    ...story.matchAll(/save(?:\s+up\s+to)?\s+\$\s*(\d{1,4}(?:\.\d{1,2})?)/gi),
    ...story.matchAll(/\$\s*(\d{1,4}(?:\.\d{1,2})?)\s*off/gi),
  ]
    .map((match) => Number(match[1]))
    .filter((amount) => Number.isFinite(amount) && amount > 0 && amount <= 500);
  if (!amounts.length) return null;
  return Math.max(...amounts);
}

function isFreeDeal(story: string) {
  if (!story || /gluten[\s-]*free|free shipping/i.test(story)) return false;
  return /\bFREE\b/i.test(story);
}

export function hebSearchUrl(name: string) {
  const query = name.replace(/[®™]/g, '').replace(/\s+/g, ' ').trim().slice(0, 140);
  return `https://www.heb.com/search?q=${encodeURIComponent(query)}`;
}

function hebUrl(value: string) {
  try {
    const url = new URL(value);
    const host = url.hostname.replace(/^www\./i, '').toLowerCase();
    if (url.protocol === 'https:' && (host === 'heb.com' || host.endsWith('.heb.com'))) return url.toString();
  } catch {
    return '';
  }
  return '';
}

function imageOf(value: unknown) {
  if (typeof value !== 'string' || !value) return '';
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return '';
    const host = url.hostname.toLowerCase();
    const allowed = host.endsWith('.wishabi.net') || host.endsWith('.flipp.com') || host.endsWith('.flippback.com');
    if (!allowed) return '';
    url.protocol = 'https:';
    url.hash = '';
    return url.toString();
  } catch {
    return '';
  }
}

function categoriesOf(value: unknown) {
  if (!Array.isArray(value)) return [];
  const names = value
    .filter((category): category is string => typeof category === 'string')
    .map((category) => category.replace(/\s+/g, ' ').trim())
    .filter((category) => category && category.length <= 60);
  return [...new Set(names)].slice(0, 4);
}

function regularPrice(price: number | null, original: number | null) {
  if (original == null) return null;
  if (price == null) return original;
  if (original > price + 0.009) return original;
  return null;
}

/** One circular product, from FlyerKit or the public flyer item list. */
export function normalizeProduct(value: unknown): HebItem | null {
  if (!value || typeof value !== 'object') return null;
  const raw = value as Record<string, unknown>;
  const name = text(raw.name).replace(/\s+/g, ' ');
  const id = text(raw.id) || (typeof raw.id === 'number' && Number.isFinite(raw.id) ? String(raw.id) : '');
  if (!name || !id || name.length > 300) return null;
  const left = numberOf(raw.left) ?? 0;
  const page = Math.max(1, Math.round(numberOf(raw.page) || (left >= PAGE_WIDTH ? Math.floor(left / PAGE_WIDTH) + 1 : 1)));
  const story = text(raw.sale_story).replace(/\s+/g, ' ').slice(0, 400);
  const price = moneyOf(raw.current_price ?? raw.price);
  const dollarsField = moneyOf(raw.dollars_off);
  const categories = categoriesOf(raw.categories);
  const categoryText = text(raw.category);
  return {
    id: id.slice(0, 40),
    name,
    categories: categories.length ? categories : categoryText ? [categoryText.slice(0, 60)] : ['Other'],
    price,
    regularPrice: regularPrice(price, moneyOf(raw.original_price)),
    unit: text(raw.post_price_text).slice(0, 24),
    prePrice: text(raw.pre_price_text).slice(0, 40),
    saleStory: story,
    dollarsOff: dollarsField ?? dollarsInStory(story),
    percentOff: percentOf(raw.percent_off),
    freeDeal: isFreeDeal(story),
    image: imageOf(raw.hosted_coupon_image) || imageOf(raw.cutout_image_url) || imageOf(raw.image_url),
    page,
    top: Math.abs(numberOf(raw.top) ?? 0),
    pageHeight: numberOf(raw.page_height) || 2560,
    left,
    width: Math.max(0, numberOf(raw.width) ?? 0),
    height: Math.max(0, numberOf(raw.height) ?? 0),
    href: hebSearchUrl(name),
  };
}

export function pickStore(value: unknown, preferredCode = STORE_CODE): HebStore | null {
  if (!Array.isArray(value)) return null;
  const stores: HebStore[] = [];
  for (const entry of value) {
    if (!entry || typeof entry !== 'object') continue;
    const store = entry as Record<string, unknown>;
    const code = text(store.merchant_store_code);
    const name = text(store.name);
    if (!code || !name) continue;
    const bastrop = code === STORE_CODE;
    stores.push({
      code,
      name: bastrop ? 'Bastrop H-E-B Plus!' : name,
      address: bastrop ? '104 Hasler Blvd' : text(store.address),
      city: bastrop ? 'Bastrop' : text(store.city),
      postalCode: text(store.postal_code) || POSTAL_CODE,
    });
  }
  if (!stores.length) return null;
  return stores.find((store) => store.code === preferredCode) ?? stores[0];
}

function asPublication(value: unknown): PublicationChoice | null {
  if (!value || typeof value !== 'object') return null;
  const pub = value as Record<string, unknown>;
  const id = numberOf(pub.id);
  if (id == null || id <= 0) return null;
  const name = text(pub.name);
  const flyerType = text(pub.flyer_type);
  return {
    id,
    weekly: /weekly/i.test(name) || /weekly/i.test(flyerType),
    validFrom: text(pub.valid_from),
    validTo: text(pub.valid_to),
    adUrl: hebUrl(text(pub.deep_link)) || HEB_WEEKLY_AD,
  };
}

/** Current weekly ad when one is in its dates. Otherwise the latest weekly ad. */
export function pickPublication(value: unknown, now = Date.now()): PublicationChoice | null {
  if (!Array.isArray(value)) return null;
  const pubs = value.map(asPublication).filter((pub) => pub !== null);
  if (!pubs.length) return null;
  const weekly = pubs.filter((pub) => pub.weekly);
  const pool = weekly.length ? weekly : pubs;
  const current = pool.filter((pub) => {
    const start = Date.parse(pub.validFrom);
    const end = Date.parse(pub.validTo);
    return Number.isFinite(start) && Number.isFinite(end) && start <= now && end >= now;
  });
  const list = current.length ? current : pool;
  list.sort((a, b) => Date.parse(b.validTo) - Date.parse(a.validTo));
  return list[0] ?? null;
}

export function parseHighlights(value: unknown): HebHighlight[] {
  if (!Array.isArray(value)) return [];
  const boxes: HebHighlight[] = [];
  for (const entry of value) {
    if (!entry || typeof entry !== 'object') continue;
    const box = entry as Record<string, unknown>;
    const name = text(box.name);
    const left = numberOf(box.left);
    const top = numberOf(box.top);
    const width = numberOf(box.width);
    const height = numberOf(box.height);
    if (!name || left == null || top == null || width == null || height == null || width <= 0 || height <= 0) continue;
    boxes.push({ name: name.slice(0, 80), left, top, width, height });
  }
  return boxes;
}

function featuredName(name: string) {
  return /trend|featured|top deal|hottest|front page/i.test(name);
}

function overlaps(item: HebItem, box: HebHighlight) {
  if (item.width <= 0 || item.height <= 0) return false;
  const right = item.left + item.width;
  const bottom = item.top + item.height;
  return item.left < box.left + box.width && right > box.left && item.top < box.top + box.height && bottom > box.top;
}

/**
 * Savings first, then where the item sits in the circular.
 * A named trending or featured highlight, when Flipp sends one, leads the row.
 */
export function trendScore(item: HebItem) {
  let save = 0;
  if (item.percentOff != null && item.percentOff > 0) save = Math.min(item.percentOff, 100);
  if (item.dollarsOff != null && item.dollarsOff > 0) save = Math.max(save, Math.min(item.dollarsOff * 5, 90));
  if (item.freeDeal) save = Math.max(save, 70);
  if (save === 0 && item.price != null) save = 4;
  const pageBonus = item.page === 1 ? 8 : item.page === 2 ? 3 : 0;
  const height = item.pageHeight > 0 ? item.pageHeight : 2560;
  const position = Math.max(0, Math.min(1, 1 - item.top / height));
  return save + pageBonus + position * 4;
}

export function trendingItems(items: HebItem[], limit = TRENDING_LIMIT, highlights: HebHighlight[] = []) {
  const boxes = highlights.filter((box) => featuredName(box.name));
  const featured = boxes.length
    ? items
        .filter((item) => boxes.some((box) => overlaps(item, box)))
        .sort((a, b) => a.page - b.page || a.top - b.top || a.left - b.left)
    : [];
  const seen = new Set(featured.map((item) => item.id));
  const ranked = items
    .filter((item) => !seen.has(item.id))
    .slice()
    .sort((a, b) => trendScore(b) - trendScore(a) || a.page - b.page || a.top - b.top || a.name.localeCompare(b.name));
  return [...featured, ...ranked].slice(0, Math.max(0, limit));
}

export function priceLabel(item: HebItem) {
  if (item.price == null) return item.saleStory || 'See the ad';
  const money = `$${item.price.toFixed(2)}`;
  const withUnit = item.unit ? `${money} ${item.unit}` : money;
  return item.prePrice ? `${item.prePrice} ${withUnit}` : withUnit;
}

export function regularLabel(item: HebItem) {
  if (item.regularPrice == null) return '';
  return `$${item.regularPrice.toFixed(2)}`;
}

/** Short end date for the sidebar card, such as "Valid thru Nov 26". */
export function formatValidThru(to: string) {
  const end = calendarDay(to);
  if (!end) return '';
  const format = new Intl.DateTimeFormat('en-US', { timeZone: 'UTC', month: 'short', day: 'numeric' });
  return `Valid thru ${format.format(end)}`;
}

export function formatValidRange(from: string, to: string) {
  const start = calendarDay(from);
  const end = calendarDay(to);
  if (!start || !end) return '';
  const format = new Intl.DateTimeFormat('en-US', {
    timeZone: 'UTC',
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
  const endYear = end.getUTCFullYear();
  if (start.getUTCFullYear() === endYear) return `Valid ${format.format(start)} through ${format.format(end)}, ${endYear}.`;
  return `Valid ${format.format(start)}, ${start.getUTCFullYear()} through ${format.format(end)}, ${endYear}.`;
}

function calendarDay(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day, 12));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return null;
  return date;
}

export function hebCategories(items: HebItem[]) {
  const names = new Set<string>();
  for (const item of items) {
    for (const category of item.categories) names.add(category);
  }
  return [...names].sort((a, b) => a.localeCompare(b));
}

function asStoredItem(value: unknown): HebItem | null {
  if (!value || typeof value !== 'object') return null;
  const item = value as Partial<HebItem>;
  if (!item.id || !item.name || !item.href) return null;
  const href = hebUrl(item.href);
  if (!href) return null;
  const categories = categoriesOf(item.categories);
  return {
    id: String(item.id).slice(0, 40),
    name: String(item.name).slice(0, 300),
    categories: categories.length ? categories : ['Other'],
    price: moneyOf(item.price),
    regularPrice: moneyOf(item.regularPrice),
    unit: text(item.unit).slice(0, 24),
    prePrice: text(item.prePrice).slice(0, 40),
    saleStory: text(item.saleStory).slice(0, 400),
    dollarsOff: moneyOf(item.dollarsOff),
    percentOff: percentOf(item.percentOff),
    freeDeal: item.freeDeal === true,
    image: imageOf(item.image),
    page: Math.max(1, Math.round(numberOf(item.page) || 1)),
    top: Math.abs(numberOf(item.top) ?? 0),
    pageHeight: numberOf(item.pageHeight) || 2560,
    left: numberOf(item.left) ?? 0,
    width: Math.max(0, numberOf(item.width) ?? 0),
    height: Math.max(0, numberOf(item.height) ?? 0),
    href,
  };
}

export function parseHebWeekly(value: unknown): HebWeeklyRecord | null {
  if (!value || typeof value !== 'object') return null;
  const record = value as Partial<HebWeeklyRecord>;
  if (!text(record.fetchedAt) || !Number.isFinite(Date.parse(record.fetchedAt ?? ''))) return null;
  if (!text(record.storeCode) || !text(record.storeName)) return null;
  const items = Array.isArray(record.items) ? record.items.map(asStoredItem).filter((item) => item !== null) : [];
  if (!items.length) return null;
  return {
    fetchedAt: record.fetchedAt ?? '',
    storeCode: text(record.storeCode),
    storeName: text(record.storeName),
    address: text(record.address),
    city: text(record.city),
    postalCode: text(record.postalCode) || POSTAL_CODE,
    flyerId: numberOf(record.flyerId) ?? 0,
    validFrom: text(record.validFrom),
    validTo: text(record.validTo),
    adUrl: hebUrl(text(record.adUrl)) || HEB_WEEKLY_AD,
    items: items.slice(0, MAX_ITEMS),
    highlights: parseHighlights(record.highlights),
  };
}

async function readJson(url: string, fetchImpl: typeof fetch) {
  const response = await fetchImpl(url, { headers, signal: AbortSignal.timeout(12000) });
  if (!response.ok) return null;
  return response.json() as Promise<unknown>;
}

function flyerUrl(path: string, params: Record<string, string>) {
  const url = new URL(`${FLYERKIT}/${path}`);
  url.searchParams.set('access_token', ACCESS_TOKEN);
  url.searchParams.set('locale', 'en-US');
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
  return url.toString();
}

async function fetchProducts(publicationId: number, fetchImpl: typeof fetch) {
  const items: HebItem[] = [];
  const seen = new Set<string>();
  for (let page = 1; page <= 8; page += 1) {
    const payload = await readJson(flyerUrl(`publication/${publicationId}/products`, { page: String(page) }), fetchImpl);
    const batch = Array.isArray(payload) ? payload : [];
    if (!batch.length) break;
    let added = 0;
    for (const entry of batch) {
      const item = normalizeProduct(entry);
      if (!item || seen.has(item.id)) continue;
      seen.add(item.id);
      items.push(item);
      added += 1;
      if (items.length >= MAX_ITEMS) return items;
    }
    if (added === 0) break;
  }
  return items;
}

async function collectBackflipp(fetchImpl: typeof fetch, postalCode: string): Promise<Omit<HebWeeklyRecord, 'fetchedAt'> | null> {
  const listed = await readJson(`https://backflipp.wishabi.com/flipp/flyers?locale=en-us&postal_code=${encodeURIComponent(postalCode)}`, fetchImpl);
  const flyers = listed && typeof listed === 'object' && Array.isArray((listed as { flyers?: unknown }).flyers)
    ? (listed as { flyers: Record<string, unknown>[] }).flyers
    : [];
  const heb = flyers.filter((flyer) => text(flyer.merchant) === 'H-E-B');
  const weekly = heb.find((flyer) => /weekly/i.test(text(flyer.name))) ?? heb[0];
  const flyerId = numberOf(weekly?.id);
  if (!weekly || flyerId == null) return null;
  const detail = await readJson(`https://backflipp.wishabi.com/flipp/flyers/${flyerId}?locale=en-us`, fetchImpl);
  const rawItems = detail && typeof detail === 'object' && Array.isArray((detail as { items?: unknown }).items)
    ? (detail as { items: unknown[] }).items
    : [];
  const items = rawItems.map(normalizeProduct).filter((item) => item !== null).slice(0, MAX_ITEMS);
  if (!items.length) return null;
  return {
    storeCode: STORE_CODE,
    storeName: 'Bastrop H-E-B Plus!',
    address: '104 Hasler Blvd',
    city: 'Bastrop',
    postalCode,
    flyerId,
    validFrom: text(weekly.valid_from),
    validTo: text(weekly.valid_to),
    adUrl: HEB_WEEKLY_AD,
    items,
    highlights: [],
  };
}

export async function collectHebWeekly(options?: {
  fetchImpl?: typeof fetch;
  now?: Date;
  postalCode?: string;
}): Promise<Omit<HebWeeklyRecord, 'fetchedAt'> | null> {
  const fetchImpl = options?.fetchImpl ?? fetch;
  const now = options?.now ?? new Date();
  const postalCode = options?.postalCode ?? POSTAL_CODE;
  try {
    const stores = await readJson(flyerUrl(`stores/${MERCHANT}`, { postal_code: postalCode }), fetchImpl);
    const store = pickStore(stores);
    const publications = store
      ? await readJson(flyerUrl(`publications/${MERCHANT}`, { store_code: store.code }), fetchImpl)
      : null;
    const publication = pickPublication(publications, now.getTime());
    if (!store || !publication) return collectBackflipp(fetchImpl, postalCode);
    const [items, highlightPayload] = await Promise.all([
      fetchProducts(publication.id, fetchImpl),
      readJson(flyerUrl(`publication/${publication.id}/highlights`, {}), fetchImpl),
    ]);
    if (!items.length) return collectBackflipp(fetchImpl, postalCode);
    return {
      storeCode: store.code,
      storeName: store.name,
      address: store.address,
      city: store.city,
      postalCode: store.postalCode,
      flyerId: publication.id,
      validFrom: publication.validFrom,
      validTo: publication.validTo,
      adUrl: publication.adUrl,
      items,
      highlights: parseHighlights(highlightPayload),
    };
  } catch (error) {
    console.error('heb weekly fetch failed', error);
    try {
      return await collectBackflipp(fetchImpl, postalCode);
    } catch (fallbackError) {
      console.error('heb weekly fallback failed', fallbackError);
      return null;
    }
  }
}

type SessionKvLike = {
  get(key: string, type: 'json'): Promise<unknown>;
  put(key: string, value: string): Promise<unknown>;
};

async function kvStore(): Promise<SessionKvLike | undefined> {
  try {
    const { sessionKv } = await import('./sessionKv');
    return sessionKv();
  } catch (error) {
    console.error('heb weekly kv unavailable', error);
    return undefined;
  }
}

export async function readHebWeekly(): Promise<HebWeeklyRecord | null> {
  try {
    const kv = await kvStore();
    if (!kv) return null;
    return parseHebWeekly(await kv.get(HEB_WEEKLY_KEY, 'json'));
  } catch (error) {
    console.error('heb weekly read failed', error);
    return null;
  }
}

/** Daily cron. A failed read leaves the last good circular in place. */
export async function refreshHebWeekly(): Promise<HebWeeklyRecord | null> {
  const kv = await kvStore();
  let previous: HebWeeklyRecord | null = null;
  if (kv) {
    try {
      previous = parseHebWeekly(await kv.get(HEB_WEEKLY_KEY, 'json'));
    } catch (error) {
      console.error('heb weekly previous read failed', error);
    }
  }
  try {
    const fresh = await collectHebWeekly();
    if (!fresh?.items.length) {
      console.error('heb weekly refresh kept the previous copy');
      return previous;
    }
    const record: HebWeeklyRecord = { ...fresh, fetchedAt: new Date().toISOString() };
    console.log(`heb weekly stored ${record.items.length} items for store ${record.storeCode}, flyer ${record.flyerId}`);
    if (kv) {
      try {
        await kv.put(HEB_WEEKLY_KEY, JSON.stringify(record));
      } catch (error) {
        console.error('heb weekly store failed', error);
      }
    }
    return record;
  } catch (error) {
    console.error('heb weekly refresh failed', error);
    return previous;
  }
}
