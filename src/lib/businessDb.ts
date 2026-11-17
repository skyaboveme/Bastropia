import { env } from 'cloudflare:workers';
import { placements, type PlacementId } from '../data/commerce';
import type { DirectoryEntry } from '../data/directory';
import { eventKey } from './time';
import { hashPassword, passwordMatches } from './passwords';
import { sessionKv } from './sessionKv';

type Statement = {
  bind(...values: unknown[]): Statement;
  first<T>(): Promise<T | null>;
  all<T>(): Promise<{ results?: T[] }>;
  run(): Promise<unknown>;
};

type Database = {
  prepare(sql: string): Statement;
};

export type BizStatus = 'pending' | 'live' | 'hidden';

export type Biz = {
  id: string;
  slug: string;
  name: string;
  category: string;
  city: string;
  areas: string;
  phone: string;
  website: string;
  email: string;
  contact: string;
  address: string;
  details: string;
  hours: string;
  daily_special: string;
  banner_url: string;
  banner_placement: string;
  logo_type: string;
  status: BizStatus;
  created_at: string;
  updated_at: string;
};

export type BizAccount = {
  id: string;
  business_id: string;
  username: string;
};

export type BizSpecial = {
  id: string;
  business_id: string;
  title: string;
  details: string;
  starts: string;
  ends: string;
  created_at: string;
};

export type BizEvent = {
  id: string;
  business_id: string;
  title: string;
  starts: string;
  ends: string;
  venue: string;
  details: string;
  created_at: string;
};

export type DayStat = {
  day: string;
  views: number;
  site_clicks: number;
  phone_clicks: number;
  banner_views: number;
};

const cookieName = 'bastropia_biz';

export function businessCookieName() {
  return cookieName;
}

function database() {
  return (env as { DB?: Database }).DB;
}

export function businessDbReady() {
  return Boolean(database());
}

function id(prefix: string) {
  const bytes = crypto.getRandomValues(new Uint8Array(6));
  return `${prefix}${[...bytes].map((byte) => byte.toString(16).padStart(2, '0')).join('')}`;
}

export function slugify(name: string) {
  const base = name
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
  return base || 'business';
}

function clean(value: unknown, max = 400) {
  return String(value ?? '')
    .replace(/<[^>]*>/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max);
}

function bannerUrl(value: unknown) {
  const raw = clean(value, 500);
  if (!raw) return '';
  try {
    const url = new URL(raw);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return '';
    return url.toString();
  } catch {
    return '';
  }
}

function bannerPlacement(value: unknown) {
  const id = clean(value, 40);
  return placements.some((item) => item.id === id) ? id : '';
}

const reservedSlugs = new Set([
  'bastrop',
  'elgin',
  'smithville',
  'cedar-creek',
  'mcdade',
  'paige',
  'rosanky',
  'directory',
  'eats',
  'government',
  'news',
  'events',
  'weather',
  'scores',
  'videos',
  'groups',
  'development',
  'advertise',
  'search',
  'about',
  'desk',
  'business',
  'businesses',
  'tips',
  'thanks',
  'alerts',
  'now',
  'newsletter',
  'submit',
  'upgrade',
  'phone-numbers',
  'new-here',
  'schools',
  'roads',
  'go-vote',
  'election-night',
  'results',
  'calendar',
  'this-weekend',
  'burn-ban',
  'sitemap',
  'api',
  'go',
  'ics',
  'social',
  'barronhomes',
  'stringprairieheatingandair',
  'barefootflowerfarms',
  'lostpinestoyota',
  'rosatexlandscaping',
  '602brewing',
]);

async function uniqueSlug(name: string, exceptId = '') {
  const db = database();
  if (!db) throw new Error('database unavailable');
  const base = slugify(name);
  let slug = reservedSlugs.has(base) ? `${base}-listing` : base;
  for (let n = 2; n < 50; n += 1) {
    const row = await db.prepare('SELECT id FROM businesses WHERE slug = ?').bind(slug).first<{ id: string }>();
    if (!row || row.id === exceptId) return slug;
    slug = `${base}-${n}`;
  }
  return `${base}-${id('')}`;
}

export async function insertBusiness(input: {
  name: string;
  slug?: string;
  category: string;
  city: string;
  areas?: string;
  phone?: string;
  website?: string;
  email?: string;
  contact?: string;
  address?: string;
  details?: string;
  hours?: string;
  daily_special?: string;
  banner_url?: string;
  banner_placement?: string;
  status?: BizStatus;
}) {
  const db = database();
  if (!db) throw new Error('database unavailable');
  const name = clean(input.name, 100);
  const category = clean(input.category, 60);
  const city = clean(input.city, 40);
  if (!name || !category || !city) throw new Error('Name, category, and town are required.');
  const now = new Date().toISOString();
  const row: Biz = {
    id: id('biz'),
    slug: await uniqueSlug(input.slug || name),
    name,
    category,
    city,
    areas: clean(input.areas, 200),
    phone: clean(input.phone, 30),
    website: clean(input.website, 300),
    email: clean(input.email, 160).toLowerCase(),
    contact: clean(input.contact, 80),
    address: clean(input.address, 200),
    details: clean(input.details, 1200),
    hours: clean(input.hours, 400),
    daily_special: clean(input.daily_special, 400),
    banner_url: bannerUrl(input.banner_url),
    banner_placement: bannerPlacement(input.banner_placement),
    logo_type: '',
    status: input.status ?? 'pending',
    created_at: now,
    updated_at: now,
  };
  await db
    .prepare(
      `INSERT INTO businesses (id, slug, name, category, city, areas, phone, website, email, contact, address, details, hours, daily_special, banner_url, banner_placement, logo_type, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      row.id,
      row.slug,
      row.name,
      row.category,
      row.city,
      row.areas,
      row.phone,
      row.website,
      row.email,
      row.contact,
      row.address,
      row.details,
      row.hours,
      row.daily_special,
      row.banner_url,
      row.banner_placement,
      row.logo_type,
      row.status,
      row.created_at,
      row.updated_at,
    )
    .run();
  return row;
}

export async function updateBusiness(
  businessId: string,
  input: Partial<Pick<Biz, 'slug' | 'name' | 'category' | 'city' | 'areas' | 'phone' | 'website' | 'email' | 'contact' | 'address' | 'details' | 'hours' | 'daily_special' | 'banner_url' | 'banner_placement' | 'logo_type' | 'status'>>,
) {
  const current = await getBusiness(businessId);
  const db = database();
  if (!current || !db) return null;
  const name = input.name !== undefined ? clean(input.name, 100) || current.name : current.name;
  const requested = input.slug !== undefined ? slugify(input.slug) : '';
  const slug = requested && requested !== current.slug ? await uniqueSlug(requested, current.id) : current.slug;
  const next: Biz = {
    ...current,
    name,
    slug,
    category: input.category !== undefined ? clean(input.category, 60) || current.category : current.category,
    city: input.city !== undefined ? clean(input.city, 40) || current.city : current.city,
    areas: input.areas !== undefined ? clean(input.areas, 200) : current.areas,
    phone: input.phone !== undefined ? clean(input.phone, 30) : current.phone,
    website: input.website !== undefined ? clean(input.website, 300) : current.website,
    email: input.email !== undefined ? clean(input.email, 160).toLowerCase() : current.email,
    contact: input.contact !== undefined ? clean(input.contact, 80) : current.contact,
    address: input.address !== undefined ? clean(input.address, 200) : current.address,
    details: input.details !== undefined ? clean(input.details, 1200) : current.details,
    hours: input.hours !== undefined ? clean(input.hours, 400) : current.hours || '',
    daily_special: input.daily_special !== undefined ? clean(input.daily_special, 400) : current.daily_special || '',
    banner_url: input.banner_url !== undefined ? bannerUrl(input.banner_url) : current.banner_url || '',
    banner_placement: input.banner_placement !== undefined ? bannerPlacement(input.banner_placement) : current.banner_placement || '',
    logo_type: input.logo_type !== undefined ? logoType(input.logo_type) : current.logo_type || '',
    status: input.status ?? current.status,
    updated_at: new Date().toISOString(),
  };
  await db
    .prepare(
      `UPDATE businesses SET slug = ?, name = ?, category = ?, city = ?, areas = ?, phone = ?, website = ?, email = ?, contact = ?, address = ?, details = ?, hours = ?, daily_special = ?, banner_url = ?, banner_placement = ?, logo_type = ?, status = ?, updated_at = ? WHERE id = ?`,
    )
    .bind(
      next.slug,
      next.name,
      next.category,
      next.city,
      next.areas,
      next.phone,
      next.website,
      next.email,
      next.contact,
      next.address,
      next.details,
      next.hours,
      next.daily_special,
      next.banner_url,
      next.banner_placement,
      next.logo_type,
      next.status,
      next.updated_at,
      next.id,
    )
    .run();
  return next;
}

export async function getBusiness(idOrSlug: string) {
  const db = database();
  if (!db) return null;
  return db.prepare('SELECT * FROM businesses WHERE id = ? OR slug = ?').bind(idOrSlug, idOrSlug).first<Biz>();
}

export async function listBusinesses() {
  const db = database();
  if (!db) return [];
  const rows = await db.prepare('SELECT * FROM businesses ORDER BY created_at DESC').all<Biz>();
  return rows.results ?? [];
}

export async function listLiveBusinesses() {
  const db = database();
  if (!db) return [];
  const rows = await db.prepare(`SELECT * FROM businesses WHERE status = 'live' ORDER BY name`).all<Biz>();
  return rows.results ?? [];
}

const directoryTowns = new Set(['Bastrop', 'Elgin', 'Smithville', 'Cedar Creek', 'McDade', 'Paige', 'Rosanky']);

export function toDirectoryEntry(biz: Biz): DirectoryEntry {
  const digits = biz.phone.replace(/\D/g, '');
  const phoneHref = digits.length === 10 ? `tel:+1${digits}` : digits.length === 11 && digits.startsWith('1') ? `tel:+${digits}` : undefined;
  return {
    id: biz.id,
    name: biz.name,
    category: biz.category,
    place: biz.address || biz.city,
    town: directoryTowns.has(biz.city) ? biz.city : null,
    phone: biz.phone || undefined,
    phoneHref,
    website: biz.website || null,
    href: `/${biz.slug}`,
    summary: biz.details,
    source: 'listed',
    areas: `${biz.city} ${biz.areas}`,
    hours: biz.hours || undefined,
    dailySpecial: biz.daily_special || undefined,
    logo: logoSrc(biz),
  };
}

function logoType(value: unknown) {
  const type = String(value ?? '');
  return type === 'image/jpeg' || type === 'image/png' || type === 'image/webp' ? type : '';
}

function logoKind(bytes: Uint8Array) {
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

export function logoSrc(biz: Pick<Biz, 'id' | 'logo_type' | 'updated_at'>) {
  if (!biz.logo_type) return '';
  return `/directory/logo/${biz.id}?v=${encodeURIComponent(biz.updated_at)}`;
}

export async function readLogoFile(value: FormDataEntryValue | null) {
  if (!value || typeof value === 'string' || !('arrayBuffer' in value) || value.size === 0) return null;
  const bytes = await value.arrayBuffer();
  const type = logoKind(new Uint8Array(bytes));
  if (!type) throw new Error('image');
  return { bytes, type };
}

export async function storeLogo(businessId: string, logo: { bytes: ArrayBuffer; type: string } | null, remove = false) {
  const current = await getBusiness(businessId);
  if (!current) return null;
  const kv = sessionKv();
  const key = `biz:logo:${businessId}`;
  if (logo) {
    if (!kv) throw new Error('save');
    await kv.put(key, logo.bytes);
    return updateBusiness(businessId, { logo_type: logo.type });
  }
  if (remove) {
    if (kv) await kv.delete(key);
    return updateBusiness(businessId, { logo_type: '' });
  }
  return current;
}

export async function setAccount(businessId: string, username: string, password: string) {
  const db = database();
  if (!db) throw new Error('database unavailable');
  const name = username.toLowerCase().replace(/[^a-z0-9._-]/g, '').slice(0, 32);
  if (name.length < 3) throw new Error('username');
  if (password.length < 8) throw new Error('password');
  const hash = await hashPassword(password);
  const existing = await db.prepare('SELECT id FROM accounts WHERE business_id = ?').bind(businessId).first<{ id: string }>();
  if (existing) {
    await db.prepare('UPDATE accounts SET username = ?, password_hash = ? WHERE id = ?').bind(name, hash, existing.id).run();
    return existing.id;
  }
  const accountId = id('acct');
  await db
    .prepare('INSERT INTO accounts (id, business_id, username, password_hash, created_at) VALUES (?, ?, ?, ?, ?)')
    .bind(accountId, businessId, name, hash, new Date().toISOString())
    .run();
  return accountId;
}

export async function loginAccount(username: string, password: string) {
  const db = database();
  if (!db) return null;
  const name = username.toLowerCase().trim();
  const row = await db
    .prepare('SELECT id, business_id, username, password_hash FROM accounts WHERE username = ?')
    .bind(name)
    .first<{ id: string; business_id: string; username: string; password_hash: string }>();
  if (!row || !(await passwordMatches(password, row.password_hash))) return null;
  const token = id('sess');
  const expires = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();
  await db.prepare('INSERT INTO sessions (token, account_id, expires_at) VALUES (?, ?, ?)').bind(token, row.id, expires).run();
  return { token, accountId: row.id, businessId: row.business_id };
}

export async function accountFromToken(token: string | undefined) {
  const db = database();
  if (!db || !token) return null;
  const row = await db
    .prepare(
      `SELECT accounts.id, accounts.business_id, accounts.username, sessions.expires_at
       FROM sessions JOIN accounts ON accounts.id = sessions.account_id
       WHERE sessions.token = ?`,
    )
    .bind(token)
    .first<{ id: string; business_id: string; username: string; expires_at: string }>();
  if (!row || row.expires_at < new Date().toISOString()) return null;
  const business = await getBusiness(row.business_id);
  if (!business) return null;
  return { account: { id: row.id, business_id: row.business_id, username: row.username } satisfies BizAccount, business };
}

export async function logoutToken(token: string | undefined) {
  const db = database();
  if (!db || !token) return;
  await db.prepare('DELETE FROM sessions WHERE token = ?').bind(token).run();
}

export async function accountForBusiness(businessId: string) {
  const db = database();
  if (!db) return null;
  return db.prepare('SELECT id, business_id, username FROM accounts WHERE business_id = ?').bind(businessId).first<BizAccount>();
}

export async function listSpecials(businessId: string) {
  const db = database();
  if (!db) return [];
  const rows = await db.prepare('SELECT * FROM specials WHERE business_id = ? ORDER BY created_at DESC').bind(businessId).all<BizSpecial>();
  return rows.results ?? [];
}

export async function addSpecial(businessId: string, title: string, details: string, starts = '', ends = '') {
  const db = database();
  if (!db) throw new Error('database unavailable');
  const row: BizSpecial = {
    id: id('sp'),
    business_id: businessId,
    title: clean(title, 120),
    details: clean(details, 600),
    starts: clean(starts, 10),
    ends: clean(ends, 10),
    created_at: new Date().toISOString(),
  };
  await db
    .prepare('INSERT INTO specials (id, business_id, title, details, starts, ends, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
    .bind(row.id, row.business_id, row.title, row.details, row.starts, row.ends, row.created_at)
    .run();
  return row;
}

export async function deleteSpecial(businessId: string, specialId: string) {
  const db = database();
  if (!db) return;
  await db.prepare('DELETE FROM specials WHERE id = ? AND business_id = ?').bind(specialId, businessId).run();
}

export async function listBizEvents(businessId: string) {
  const db = database();
  if (!db) return [];
  const rows = await db.prepare('SELECT * FROM biz_events WHERE business_id = ? ORDER BY starts').bind(businessId).all<BizEvent>();
  return rows.results ?? [];
}

export async function addBizEvent(businessId: string, input: { title: string; starts: string; ends?: string; venue?: string; details?: string }) {
  const db = database();
  if (!db) throw new Error('database unavailable');
  const row: BizEvent = {
    id: id('ev'),
    business_id: businessId,
    title: clean(input.title, 120),
    starts: clean(input.starts, 16),
    ends: clean(input.ends, 16),
    venue: clean(input.venue, 120),
    details: clean(input.details, 600),
    created_at: new Date().toISOString(),
  };
  await db
    .prepare('INSERT INTO biz_events (id, business_id, title, starts, ends, venue, details, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
    .bind(row.id, row.business_id, row.title, row.starts, row.ends, row.venue, row.details, row.created_at)
    .run();
  return row;
}

export async function deleteBizEvent(businessId: string, eventId: string) {
  const db = database();
  if (!db) return;
  await db.prepare('DELETE FROM biz_events WHERE id = ? AND business_id = ?').bind(eventId, businessId).run();
}

export async function bumpStat(businessId: string, field: 'views' | 'site_clicks' | 'phone_clicks' | 'banner_views') {
  const db = database();
  if (!db) return;
  const day = eventKey(new Date());
  const views = field === 'views' ? 1 : 0;
  const site = field === 'site_clicks' ? 1 : 0;
  const phone = field === 'phone_clicks' ? 1 : 0;
  const banner = field === 'banner_views' ? 1 : 0;
  await db
    .prepare(
      `INSERT INTO listing_stats (business_id, day, views, site_clicks, phone_clicks, banner_views)
       VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT(business_id, day) DO UPDATE SET
         views = views + excluded.views,
         site_clicks = site_clicks + excluded.site_clicks,
         phone_clicks = phone_clicks + excluded.phone_clicks,
         banner_views = banner_views + excluded.banner_views`,
    )
    .bind(businessId, day, views, site, phone, banner)
    .run();
}

export type ListingDeskBanner = {
  id: string;
  name: string;
  slug: string;
  status: string;
  banner_placement: string;
  banner_views: number;
  views: number;
};

export async function listingDeskStats(days = 30) {
  const empty = { views: 0, site_clicks: 0, phone_clicks: 0, banner_views: 0, banners: [] as ListingDeskBanner[] };
  const db = database();
  if (!db) return empty;
  const start = eventKey(new Date(Date.now() - (days - 1) * 24 * 60 * 60 * 1000));
  const totals = await db
    .prepare(
      `SELECT COALESCE(SUM(views), 0) AS views,
              COALESCE(SUM(site_clicks), 0) AS site_clicks,
              COALESCE(SUM(phone_clicks), 0) AS phone_clicks,
              COALESCE(SUM(banner_views), 0) AS banner_views
       FROM listing_stats WHERE day >= ?`,
    )
    .bind(start)
    .first<{ views: number; site_clicks: number; phone_clicks: number; banner_views: number }>();
  const banners = await db
    .prepare(
      `SELECT b.id, b.name, b.slug, b.status, b.banner_placement,
              COALESCE(SUM(s.banner_views), 0) AS banner_views,
              COALESCE(SUM(s.views), 0) AS views
       FROM businesses b
       LEFT JOIN listing_stats s ON s.business_id = b.id AND s.day >= ?
       WHERE b.banner_url != ''
       GROUP BY b.id, b.name, b.slug, b.status, b.banner_placement
       ORDER BY banner_views DESC, b.name`,
    )
    .bind(start)
    .all<ListingDeskBanner>();
  const num = (value: unknown) => Number(value) || 0;
  return {
    views: num(totals?.views),
    site_clicks: num(totals?.site_clicks),
    phone_clicks: num(totals?.phone_clicks),
    banner_views: num(totals?.banner_views),
    banners: (banners.results ?? []).map((row) => ({
      ...row,
      banner_views: num(row.banner_views),
      views: num(row.views),
    })),
  };
}

export async function statsFor(businessId: string, days = 30) {
  const db = database();
  if (!db) return [];
  const start = eventKey(new Date(Date.now() - (days - 1) * 24 * 60 * 60 * 1000));
  const rows = await db
    .prepare('SELECT day, views, site_clicks, phone_clicks, banner_views FROM listing_stats WHERE business_id = ? AND day >= ? ORDER BY day')
    .bind(businessId, start)
    .all<DayStat>();
  return rows.results ?? [];
}

export type ListingBanner = {
  id: string;
  name: string;
  slug: string;
  website: string;
  banner_url: string;
  banner_placement: PlacementId;
};

export async function bannersForPlacement(placement: string): Promise<ListingBanner[]> {
  const db = database();
  if (!db || !bannerPlacement(placement)) return [];
  const rows = await db
    .prepare(
      `SELECT id, name, slug, website, banner_url, banner_placement FROM businesses
       WHERE status = 'live' AND banner_placement = ? AND banner_url != ''
       ORDER BY name`,
    )
    .bind(placement)
    .all<ListingBanner>();
  return rows.results ?? [];
}

export async function recordBannerView(businessId: string, placement: string) {
  const db = database();
  if (!db) return false;
  const row = await db
    .prepare(`SELECT id, banner_url, banner_placement FROM businesses WHERE id = ? AND status = 'live'`)
    .bind(businessId)
    .first<{ id: string; banner_url: string; banner_placement: string }>();
  if (!row?.banner_url) return false;
  if (placement !== 'listing' && placement !== row.banner_placement) return false;
  await bumpStat(row.id, 'banner_views');
  return true;
}
