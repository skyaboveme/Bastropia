import { randomBytes } from 'node:crypto';
import { env } from 'cloudflare:workers';
import { placements, type PlacementId } from '../data/commerce';
import { homeBanners } from '../data/homeBanners';
import { httpUrl } from './intake';
import { eventKey } from './time';

type Kv = {
  get(key: string, type: 'json'): Promise<unknown>;
  get(key: string, type: 'arrayBuffer'): Promise<ArrayBuffer | null>;
  get(key: string): Promise<string | null>;
  put(key: string, value: string | ArrayBuffer): Promise<unknown>;
  delete(key: string): Promise<unknown>;
  list(options: { prefix: string; cursor?: string }): Promise<{ keys: { name: string }[]; list_complete?: boolean; cursor?: string }>;
};

const catalogKey = 'ad:catalog';
const holdsKey = 'ad:holds';
const textPlacements = new Set<PlacementId>(['weekend-sponsor', 'calendar-sponsor']);

export type StoredAd = {
  id: string;
  name: string;
  href: string;
  alt: string;
  line: string;
  email: string;
  placements: PlacementId[];
  active: boolean;
  createdAt: string;
  updatedAt: string;
  imageType: string;
};

export type LiveAd = {
  id: string;
  name: string;
  href: string;
  go: string;
  src: string;
  alt: string;
  line: string;
  placement: PlacementId;
};

export type AdDay = {
  date: string;
  placement: PlacementId;
  impressions: number;
  clicks: number;
};

export type AdReport = {
  id: string;
  name: string;
  href: string;
  email: string;
  line: string;
  alt: string;
  placements: PlacementId[];
  active: boolean;
  source: 'file' | 'upload';
  src: string;
  days: AdDay[];
  impressions: number;
  clicks: number;
};

function store(): Kv | undefined {
  return (env as { SESSION?: Kv }).SESSION;
}

function safeId(id: string) {
  return /^[a-z0-9-]{1,40}$/.test(id);
}

export function isFileAd(id: string) {
  return homeBanners.some((banner) => banner.id === id);
}

function isPlacement(value: string): value is PlacementId {
  return placements.some((item) => item.id === value);
}

function isStored(value: unknown): value is StoredAd {
  if (!value || typeof value !== 'object') return false;
  const item = value as StoredAd;
  return typeof item.id === 'string' && typeof item.href === 'string' && Array.isArray(item.placements);
}

async function readCatalog(): Promise<StoredAd[]> {
  const kv = store();
  if (!kv) return [];
  const value = await kv.get(catalogKey, 'json');
  return Array.isArray(value) ? value.filter(isStored) : [];
}

async function writeCatalog(items: StoredAd[]) {
  const kv = store();
  if (!kv) return false;
  await kv.put(catalogKey, JSON.stringify(items));
  return true;
}

async function readHolds() {
  const kv = store();
  if (!kv) return [] as string[];
  const value = await kv.get(holdsKey, 'json');
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
}

function goHref(id: string, placement: PlacementId) {
  return `/go/${id}?from=${placement}`;
}

export async function bannerAds(): Promise<LiveAd[]> {
  try {
  const held = new Set(await readHolds());
  const files: LiveAd[] = homeBanners
    .filter((banner) => banner.id && banner.src && banner.href && !held.has(banner.id))
    .map((banner) => ({
      id: banner.id,
      name: banner.name,
      href: banner.href,
      go: goHref(banner.id, 'home-banner'),
      src: banner.src,
      alt: banner.alt,
      line: '',
      placement: 'home-banner',
    }));
  const uploaded: LiveAd[] = (await readCatalog())
    .filter((item) => item.active && item.imageType && item.placements.includes('home-banner'))
    .map((item) => ({
      id: item.id,
      name: item.name,
      href: item.href,
      go: goHref(item.id, 'home-banner'),
      src: `/ads/image/${item.id}?v=${encodeURIComponent(item.updatedAt)}`,
      alt: item.alt || item.name,
      line: item.line,
      placement: 'home-banner',
    }));
  return [...files, ...uploaded];
  } catch {
    return homeBanners.filter((banner) => banner.id && banner.src && banner.href).map((banner) => ({
      id: banner.id,
      name: banner.name,
      href: banner.href,
      go: goHref(banner.id, 'home-banner'),
      src: banner.src,
      alt: banner.alt,
      line: '',
      placement: 'home-banner' as const,
    }));
  }
}

export async function textAds(placement: PlacementId): Promise<LiveAd[]> {
  if (!textPlacements.has(placement)) return [];
  try {
  return (await readCatalog())
    .filter((item) => item.active && item.line && item.placements.includes(placement))
    .map((item) => ({
      id: item.id,
      name: item.name,
      href: item.href,
      go: goHref(item.id, placement),
      src: '',
      alt: item.alt || item.name,
      line: item.line,
      placement,
    }));
  } catch {
    return [];
  }
}

export async function homeBannerNames() {
  return (await bannerAds()).map((item) => item.name);
}

export function imageKind(bytes: Uint8Array) {
  if (bytes.length < 16 || bytes.length > 1_500_000) return '';
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'image/jpeg';
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return 'image/png';
  if (
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return 'image/webp';
  }
  return '';
}

function clean(value: string, max: number) {
  return value.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim().slice(0, max);
}

export function readAdForm(form: FormData) {
  const name = clean(String(form.get('name') || ''), 80);
  const href = httpUrl(clean(String(form.get('website') || ''), 300));
  const line = clean(String(form.get('line') || ''), 90);
  const alt = clean(String(form.get('alt') || ''), 180) || name;
  const email = clean(String(form.get('email') || ''), 120);
  const picked = form.getAll('placement').map(String).filter(isPlacement);
  const active = form.get('active') === 'yes';
  if (!name) return { ok: false as const, error: 'name' };
  if (!href) return { ok: false as const, error: 'url' };
  if (email && !email.includes('@')) return { ok: false as const, error: 'email' };
  if (!picked.length) return { ok: false as const, error: 'pages' };
  if (picked.some((item) => textPlacements.has(item)) && !line) return { ok: false as const, error: 'line' };
  return { ok: true as const, value: { name, href, line, alt, email, placements: picked, active } };
}

async function reportToken(id: string) {
  const kv = store();
  if (!kv || !safeId(id)) return '';
  const existing = await kv.get(`ad:report:${id}`);
  if (existing) return existing;
  const token = randomBytes(18).toString('hex');
  await kv.put(`ad:report:${id}`, token);
  await kv.put(`ad:token:${token}`, id);
  return token;
}

export async function createAdvertiser(form: FormData) {
  const parsed = readAdForm(form);
  if (!parsed.ok) return parsed;
  const file = form.get('image');
  const wantsBanner = parsed.value.placements.includes('home-banner');
  let imageType = '';
  let bytes: ArrayBuffer | null = null;
  if (file instanceof File && file.size > 0) {
    bytes = await file.arrayBuffer();
    imageType = imageKind(new Uint8Array(bytes));
    if (!imageType) return { ok: false as const, error: 'image' };
  } else if (wantsBanner) {
    return { ok: false as const, error: 'image' };
  }
  const kv = store();
  if (!kv) return { ok: false as const, error: 'save' };
  const now = new Date().toISOString();
  const item: StoredAd = {
    id: `ad-${randomBytes(4).toString('hex')}`,
    ...parsed.value,
    createdAt: now,
    updatedAt: now,
    imageType,
  };
  const items = await readCatalog();
  items.unshift(item);
  if (!(await writeCatalog(items))) return { ok: false as const, error: 'save' };
  if (bytes) await kv.put(`ad:image:${item.id}`, bytes);
  await reportToken(item.id);
  return { ok: true as const, id: item.id };
}

export async function updateAdvertiser(id: string, form: FormData) {
  if (!safeId(id) || isFileAd(id)) return { ok: false as const, error: 'save' };
  const parsed = readAdForm(form);
  if (!parsed.ok) return parsed;
  const items = await readCatalog();
  const current = items.find((item) => item.id === id);
  if (!current) return { ok: false as const, error: 'save' };
  const file = form.get('image');
  let imageType = current.imageType;
  let bytes: ArrayBuffer | null = null;
  if (file instanceof File && file.size > 0) {
    bytes = await file.arrayBuffer();
    imageType = imageKind(new Uint8Array(bytes));
    if (!imageType) return { ok: false as const, error: 'image' };
  }
  if (parsed.value.placements.includes('home-banner') && !imageType) return { ok: false as const, error: 'image' };
  const kv = store();
  if (!kv) return { ok: false as const, error: 'save' };
  const next: StoredAd = {
    ...current,
    ...parsed.value,
    imageType,
    updatedAt: new Date().toISOString(),
  };
  if (!(await writeCatalog(items.map((item) => (item.id === id ? next : item))))) return { ok: false as const, error: 'save' };
  if (bytes) await kv.put(`ad:image:${id}`, bytes);
  return { ok: true as const, id };
}

export async function setShowing(id: string, showing: boolean) {
  if (!safeId(id)) return false;
  if (isFileAd(id)) {
    const holds = new Set(await readHolds());
    if (showing) holds.delete(id);
    else holds.add(id);
    const kv = store();
    if (!kv) return false;
    await kv.put(holdsKey, JSON.stringify([...holds]));
    return true;
  }
  const items = await readCatalog();
  const current = items.find((item) => item.id === id);
  if (!current) return false;
  current.active = showing;
  current.updatedAt = new Date().toISOString();
  return writeCatalog(items);
}

export async function deleteAdvertiser(id: string) {
  if (!safeId(id) || isFileAd(id)) return false;
  const kv = store();
  if (!kv) return false;
  const items = await readCatalog();
  if (!(await writeCatalog(items.filter((item) => item.id !== id)))) return false;
  const token = await kv.get(`ad:report:${id}`);
  await kv.delete(`ad:image:${id}`);
  await kv.delete(`ad:report:${id}`);
  if (token) await kv.delete(`ad:token:${token}`);
  const keys = await listKeys(`ad:stat:${id}:`);
  await Promise.all(keys.map((key) => kv.delete(key)));
  return true;
}

export async function imageFor(id: string) {
  if (!safeId(id)) return null;
  const kv = store();
  if (!kv) return null;
  const item = (await readCatalog()).find((ad) => ad.id === id);
  if (!item?.imageType) return null;
  const bytes = await kv.get(`ad:image:${id}`, 'arrayBuffer');
  if (!bytes) return null;
  return { bytes, type: item.imageType };
}

async function listKeys(prefix: string) {
  const kv = store();
  if (!kv) return [] as string[];
  const names: string[] = [];
  let cursor: string | undefined;
  for (let page = 0; page < 20; page += 1) {
    const listed = await kv.list(cursor ? { prefix, cursor } : { prefix });
    names.push(...listed.keys.map((key) => key.name));
    if (listed.list_complete !== false || !listed.cursor) break;
    cursor = listed.cursor;
  }
  return names;
}

async function knownAd(id: string) {
  if (!safeId(id)) return null;
  const file = homeBanners.find((banner) => banner.id === id);
  if (file) {
    const held = (await readHolds()).includes(id);
    return {
      id,
      name: file.name,
      href: file.href,
      placements: ['home-banner'] as PlacementId[],
      active: !held,
    };
  }
  const item = (await readCatalog()).find((ad) => ad.id === id);
  if (!item) return null;
  return { id, name: item.name, href: item.href, placements: item.placements, active: item.active };
}

export async function recordStat(id: string, placement: string, kind: 'impressions' | 'clicks') {
  if (!isPlacement(placement)) return false;
  const ad = await knownAd(id);
  if (!ad?.active || !ad.placements.includes(placement)) return false;
  const kv = store();
  if (!kv) return false;
  const key = `ad:stat:${id}:${placement}:${eventKey(new Date())}`;
  const current = (await kv.get(key, 'json')) as { impressions?: number; clicks?: number } | null;
  const next = {
    impressions: Number(current?.impressions) || 0,
    clicks: Number(current?.clicks) || 0,
  };
  next[kind] += 1;
  await kv.put(key, JSON.stringify(next));
  return true;
}

export async function destinationFor(id: string, placement: string) {
  const ad = await knownAd(id);
  if (!ad) return '';
  if (!isPlacement(placement) || !ad.placements.includes(placement)) return ad.href;
  return ad.href;
}

export async function statsFor(id: string): Promise<AdDay[]> {
  if (!safeId(id)) return [];
  const kv = store();
  if (!kv) return [];
  const keys = await listKeys(`ad:stat:${id}:`);
  const rows = await Promise.all(
    keys.map(async (key) => {
      const tail = key.slice(`ad:stat:${id}:`.length);
      const split = tail.lastIndexOf(':');
      const placement = tail.slice(0, split);
      const date = tail.slice(split + 1);
      if (!isPlacement(placement) || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
      const value = (await kv.get(key, 'json')) as { impressions?: number; clicks?: number } | null;
      return {
        date,
        placement,
        impressions: Number(value?.impressions) || 0,
        clicks: Number(value?.clicks) || 0,
      } satisfies AdDay;
    }),
  );
  return rows.filter((row): row is AdDay => Boolean(row)).sort((a, b) => b.date.localeCompare(a.date) || a.placement.localeCompare(b.placement));
}

async function reportFromId(id: string): Promise<AdReport | null> {
  const file = homeBanners.find((banner) => banner.id === id);
  const uploaded = (await readCatalog()).find((item) => item.id === id);
  if (!file && !uploaded) return null;
  const held = file ? (await readHolds()).includes(id) : false;
  const days = await statsFor(id);
  return {
    id,
    name: file?.name || uploaded?.name || 'Advertiser',
    href: file?.href || uploaded?.href || '',
    email: uploaded?.email || '',
    line: uploaded?.line || '',
    alt: file?.alt || uploaded?.alt || '',
    placements: file ? ['home-banner'] : uploaded?.placements || [],
    active: file ? !held : Boolean(uploaded?.active),
    source: file ? 'file' : 'upload',
    src: file?.src || (uploaded?.imageType ? `/ads/image/${id}?v=${encodeURIComponent(uploaded.updatedAt)}` : ''),
    days,
    impressions: days.reduce((sum, day) => sum + day.impressions, 0),
    clicks: days.reduce((sum, day) => sum + day.clicks, 0),
  };
}

export async function reportFor(token: string): Promise<AdReport | null> {
  if (!/^[a-f0-9]{36}$/.test(token)) return null;
  const kv = store();
  if (!kv) return null;
  const id = await kv.get(`ad:token:${token}`);
  if (!id || !safeId(id)) return null;
  return reportFromId(id);
}

export type DeskAd = AdReport & { token: string };

export async function deskAds(): Promise<DeskAd[]> {
  const uploaded = await readCatalog();
  const ids = [...homeBanners.map((banner) => banner.id), ...uploaded.map((item) => item.id)];
  const cards = await Promise.all(
    ids.map(async (id) => {
      const [token, report] = await Promise.all([reportToken(id), reportFromId(id)]);
      if (!token || !report) return null;
      return { ...report, token };
    }),
  );
  return cards.filter((item): item is DeskAd => Boolean(item));
}
