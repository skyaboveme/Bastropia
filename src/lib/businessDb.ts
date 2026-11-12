import { env } from 'cloudflare:workers';
import type { DirectoryEntry } from '../data/directory';
import { eventKey } from './time';
import { hashPassword, passwordMatches } from './passwords';

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

async function uniqueSlug(name: string, exceptId = '') {
  const db = database();
  if (!db) throw new Error('database unavailable');
  const base = slugify(name);
  let slug = base;
  for (let n = 2; n < 50; n += 1) {
    const row = await db.prepare('SELECT id FROM businesses WHERE slug = ?').bind(slug).first<{ id: string }>();
    if (!row || row.id === exceptId) return slug;
    slug = `${base}-${n}`;
  }
  return `${base}-${id('')}`;
}

export async function insertBusiness(input: {
  name: string;
  category: string;
  city: string;
  areas?: string;
  phone: string;
  website?: string;
  email: string;
  contact?: string;
  address?: string;
  details: string;
  status?: BizStatus;
}) {
  const db = database();
  if (!db) throw new Error('database unavailable');
  const now = new Date().toISOString();
  const row: Biz = {
    id: id('biz'),
    slug: await uniqueSlug(input.name),
    name: clean(input.name, 100),
    category: clean(input.category, 60),
    city: clean(input.city, 40),
    areas: clean(input.areas, 200),
    phone: clean(input.phone, 30),
    website: clean(input.website, 300),
    email: clean(input.email, 160).toLowerCase(),
    contact: clean(input.contact, 80),
    address: clean(input.address, 160),
    details: clean(input.details, 1200),
    status: input.status ?? 'pending',
    created_at: now,
    updated_at: now,
  };
  await db
    .prepare(
      `INSERT INTO businesses (id, slug, name, category, city, areas, phone, website, email, contact, address, details, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
      row.status,
      row.created_at,
      row.updated_at,
    )
    .run();
  return row;
}

export async function updateBusiness(
  businessId: string,
  input: Partial<Pick<Biz, 'name' | 'category' | 'city' | 'areas' | 'phone' | 'website' | 'email' | 'contact' | 'address' | 'details' | 'status'>>,
) {
  const current = await getBusiness(businessId);
  const db = database();
  if (!current || !db) return null;
  const name = input.name ? clean(input.name, 100) : current.name;
  const next: Biz = {
    ...current,
    name,
    slug: name === current.name ? current.slug : await uniqueSlug(name, current.id),
    category: input.category ? clean(input.category, 60) : current.category,
    city: input.city ? clean(input.city, 40) : current.city,
    areas: input.areas !== undefined ? clean(input.areas, 200) : current.areas,
    phone: input.phone ? clean(input.phone, 30) : current.phone,
    website: input.website !== undefined ? clean(input.website, 300) : current.website,
    email: input.email ? clean(input.email, 160).toLowerCase() : current.email,
    contact: input.contact !== undefined ? clean(input.contact, 80) : current.contact,
    address: input.address !== undefined ? clean(input.address, 160) : current.address,
    details: input.details ? clean(input.details, 1200) : current.details,
    status: input.status ?? current.status,
    updated_at: new Date().toISOString(),
  };
  await db
    .prepare(
      `UPDATE businesses SET slug = ?, name = ?, category = ?, city = ?, areas = ?, phone = ?, website = ?, email = ?, contact = ?, address = ?, details = ?, status = ?, updated_at = ? WHERE id = ?`,
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

export function toDirectoryEntry(biz: Biz): DirectoryEntry {
  const digits = biz.phone.replace(/\D/g, '');
  const phoneHref = digits.length === 10 ? `tel:+1${digits}` : digits.length === 11 ? `tel:+${digits}` : undefined;
  return {
    id: biz.id,
    name: biz.name,
    category: biz.category,
    place: biz.city,
    town: biz.city,
    phone: biz.phone,
    phoneHref,
    website: biz.website || null,
    href: `/businesses/l/${biz.slug}`,
    summary: biz.details,
    source: 'listed',
    areas: `${biz.city} ${biz.areas}`,
  };
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

export async function bumpStat(businessId: string, field: 'views' | 'site_clicks' | 'phone_clicks') {
  const db = database();
  if (!db) return;
  const day = eventKey(new Date());
  const views = field === 'views' ? 1 : 0;
  const site = field === 'site_clicks' ? 1 : 0;
  const phone = field === 'phone_clicks' ? 1 : 0;
  await db
    .prepare(
      `INSERT INTO listing_stats (business_id, day, views, site_clicks, phone_clicks)
       VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(business_id, day) DO UPDATE SET
         views = views + excluded.views,
         site_clicks = site_clicks + excluded.site_clicks,
         phone_clicks = phone_clicks + excluded.phone_clicks`,
    )
    .bind(businessId, day, views, site, phone)
    .run();
}

export async function statsFor(businessId: string, days = 30) {
  const db = database();
  if (!db) return [];
  const start = eventKey(new Date(Date.now() - (days - 1) * 24 * 60 * 60 * 1000));
  const rows = await db
    .prepare('SELECT day, views, site_clicks, phone_clicks FROM listing_stats WHERE business_id = ? AND day >= ? ORDER BY day')
    .bind(businessId, start)
    .all<DayStat>();
  return rows.results ?? [];
}
