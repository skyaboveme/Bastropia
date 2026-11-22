/**
 * Events come from the local Markdown collection, or from Bastrop County Calendar.
 *
 * EVENTS_SOURCE is `local` (default) or `bcc`. The 15-minute cron stores a
 * successful public-feed response in KV under `bcc:events`. A failed fetch
 * leaves that copy in place. When the flag is `bcc` and KV has no usable
 * copy, pages keep the local collection.
 *
 * BCC datetimes are America/Chicago wall times unless they carry an offset.
 * categoryKey uses BCC's normalized vocabulary. Tier mapping:
 * sponsored, premium, the featured flag, or pinned -> featured;
 * a tier named featured with neither flag -> spotlight;
 * free and anything else -> community.
 */
import { AsyncLocalStorage } from 'node:async_hooks';
import { readFileSync } from 'node:fs';
import { categories, cities, type Category, type City, type Tier } from '../data/taxonomy.ts';
import type { ListedEvent } from './events.ts';
import { hasEnded } from './events.ts';
import { eventNode, linkList } from './schema.ts';
import type { SessionKv } from './sessionKv.ts';
import { chicagoParts, eventKey } from './time.ts';

declare const __EVENTS_SOURCE_BUILD__: string;
declare const __BCC_EVENTS_FIXTURE_JSON__: string;

function compileTimeValue(read: () => string): string {
  try {
    return read();
  } catch {
    return '';
  }
}

export type EventsSourceMode = 'local' | 'bcc';
export type EventSourceKind = 'local' | 'bcc';

export const BCC_ORIGIN = 'https://bastropcountycalendar.com';
export const BCC_EVENTS_FEED = `${BCC_ORIGIN}/api/public/events?from=&to=&since=`;
export const BCC_EVENTS_KV_KEY = 'bcc:events';
const SOURCE_LABEL = 'Bastrop County Calendar';

const sourceStore = new AsyncLocalStorage<EventsSourceMode>();

export function runWithEventsSource<T>(mode: EventsSourceMode, fn: () => T): T {
  return sourceStore.run(mode, fn);
}

let fileMode: EventsSourceMode | undefined;

function modeFromValue(value: string | undefined): EventsSourceMode | undefined {
  if (value === 'bcc' || value === 'local') return value;
  return undefined;
}

function modeFromWranglerFile(): EventsSourceMode {
  if (fileMode) return fileMode;
  try {
    const text = readFileSync(`${process.cwd()}/wrangler.jsonc`, 'utf8');
    const match = text.match(/"EVENTS_SOURCE"\s*:\s*"(local|bcc)"/);
    fileMode = match?.[1] === 'bcc' ? 'bcc' : 'local';
  } catch {
    fileMode = 'local';
  }
  return fileMode;
}

/**
 * The request binding wins. Otherwise the shell (so a build can mock the feed),
 * then process.env, then wrangler.jsonc. Anything else is local.
 */
export function eventsSourceMode(): EventsSourceMode {
  const scoped = sourceStore.getStore();
  if (scoped) return scoped;
  return (
    modeFromValue(compileTimeValue(() => __EVENTS_SOURCE_BUILD__)) ??
    modeFromValue(process.env.EVENTS_SOURCE) ??
    modeFromWranglerFile()
  );
}

export interface BccPublicEvent {
  id: string;
  slug: string;
  url: string;
  title: string;
  summary: string;
  description: string;
  start: string;
  end: string | null;
  allDay: boolean;
  recurrence: string;
  venue: string;
  address: string;
  locationUrl: string | null;
  town: string;
  category: string;
  categoryKey: string;
  tags: string[];
  cost: string | null;
  image: string | null;
  eventUrl: string | null;
  tier: string;
  featured: boolean;
  pinned: boolean;
  status: string;
  updatedAt: string | null;
}

export interface BccOmittedEvent {
  id: string;
  reason: string;
}

export interface StoredBccFeed {
  fetchedAt: string;
  events: BccPublicEvent[];
  omitted: BccOmittedEvent[];
}

const categoryFromKey: Record<string, Category> = {
  food: 'food',
  family: 'family',
  outdoors: 'outdoors',
  community: 'community',
  music: 'music',
  markets: 'markets',
  arts: 'arts',
  education: 'education',
  health: 'health',
  civic: 'government',
  government: 'government',
  faith: 'community',
  other: 'community',
};

export function mapCategory(categoryKey: string): Category {
  const key = categoryKey.trim().toLowerCase();
  if (categoryFromKey[key]) return categoryFromKey[key];
  if ((categories as readonly string[]).includes(key)) return key as Category;
  return 'community';
}

export function mapTown(town: string): City {
  const needle = town.trim().toLowerCase();
  return cities.find((city) => city.toLowerCase() === needle) ?? 'Countywide';
}

/** sponsored/premium, or the featured or pinned flag, outrank a tier named featured. */
export function mapTier(event: { tier?: string | null; featured?: boolean; pinned?: boolean }): Tier {
  const tier = (event.tier ?? '').trim().toLowerCase();
  if (tier === 'sponsored' || tier === 'premium' || event.featured || event.pinned) return 'featured';
  if (tier === 'featured') return 'spotlight';
  return 'community';
}

export function isBccEventUrl(value?: string | null): boolean {
  if (!value) return false;
  try {
    const url = new URL(value);
    const host = url.hostname.replace(/^www\./i, '').toLowerCase();
    return url.protocol === 'https:' && host === 'bastropcountycalendar.com' && url.pathname.startsWith('/events/');
  } catch {
    return false;
  }
}

export function eventHref(event: { id: string; data: { sourceUrl?: string | null } }, source: EventSourceKind): string {
  if (source === 'bcc' && isBccEventUrl(event.data.sourceUrl)) return event.data.sourceUrl!.trim();
  return `/events/${event.id}`;
}

export function eventListingNodes(name: string, events: ListedEvent[], source: EventSourceKind) {
  const list = linkList(
    name,
    events.map((event) => ({ name: event.data.title, path: eventHref(event, source) })),
  );
  if (source === 'bcc') return [list];
  return [list, ...events.map((event) => eventNode(event))];
}

export function bccSubmitHref(content: string): string {
  const url = new URL('/events/submit', BCC_ORIGIN);
  url.searchParams.set('utm_source', 'bastropia');
  url.searchParams.set('utm_medium', 'referral');
  url.searchParams.set('utm_campaign', 'add-event');
  url.searchParams.set('utm_content', content);
  return url.toString();
}

/** Local intake while the flag is local. BCC's submit form once the flag is bcc. */
export function addEventHref(content: string): string {
  return eventsSourceMode() === 'bcc' ? bccSubmitHref(content) : '/submit';
}

/** Naive values are America/Chicago wall times. Offset values are real instants. */
export function chicagoWallToDate(value: string): Date | null {
  const raw = value.trim();
  if (!raw) return null;
  if (/[zZ]$/.test(raw) || /[+-]\d{2}:?\d{2}$/.test(raw)) {
    const date = new Date(raw);
    return Number.isNaN(date.getTime()) ? null : date;
  }
  const match = /^(\d{4})-(\d{2})-(\d{2})(?:[T\s](\d{2}):(\d{2})(?::(\d{2}))?)?/.exec(raw);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const hour = match[4] ? Number(match[4]) : 0;
  const minute = match[5] ? Number(match[5]) : 0;
  const second = match[6] ? Number(match[6]) : 0;
  if (month < 1 || month > 12 || day < 1 || day > 31 || hour > 23 || minute > 59 || second > 59) return null;
  const wanted = Date.UTC(year, month - 1, day, hour, minute, second);
  let utc = wanted;
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const parts = chicagoParts(new Date(utc));
    const [shownYear, shownMonth, shownDay] = parts.key.split('-').map(Number);
    const shown = Date.UTC(shownYear, shownMonth - 1, shownDay, parts.hour, parts.minute, second);
    const delta = shown - wanted;
    if (delta === 0) return new Date(utc);
    utc -= delta;
  }
  return new Date(utc);
}

function asString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function asBool(value: unknown): boolean {
  return value === true || value === 1 || value === '1';
}

function asStringList(value: unknown): string[] {
  if (Array.isArray(value)) return value.map((item) => asString(item)).filter(Boolean);
  if (typeof value !== 'string' || !value.trim()) return [];
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) return parsed.map((item) => asString(item)).filter(Boolean);
  } catch {
    /* comma list */
  }
  return value.split(',').map((item) => item.trim()).filter(Boolean);
}

export function parsePublicEvent(value: unknown): BccPublicEvent | null {
  if (!value || typeof value !== 'object') return null;
  const row = value as Record<string, unknown>;
  const title = asString(row.title);
  const start = asString(row.start);
  const slug = asString(row.slug);
  const id = asString(row.id);
  const url = asString(row.url);
  if (!title || !start || (!slug && !id) || !isBccEventUrl(url)) return null;
  if (!chicagoWallToDate(start)) return null;
  const end = asString(row.end);
  const cost = row.cost;
  return {
    id: id || slug,
    slug: slug || id,
    url,
    title,
    summary: asString(row.summary),
    description: asString(row.description),
    start,
    end: end || null,
    allDay: asBool(row.allDay),
    recurrence: asString(row.recurrence) || 'none',
    venue: asString(row.venue),
    address: asString(row.address),
    locationUrl: asString(row.locationUrl) || null,
    town: asString(row.town),
    category: asString(row.category),
    categoryKey: asString(row.categoryKey) || 'other',
    tags: asStringList(row.tags),
    cost: typeof cost === 'number' && Number.isFinite(cost) ? String(cost) : asString(cost) || null,
    image: asString(row.image) || null,
    eventUrl: asString(row.eventUrl) || null,
    tier: asString(row.tier) || 'free',
    featured: asBool(row.featured),
    pinned: asBool(row.pinned),
    status: (asString(row.status) || 'active').toLowerCase(),
    updatedAt: asString(row.updatedAt) || null,
  };
}

/** A usable feed, or null when the payload must not replace the last good copy. */
export function parsePublicFeed(payload: unknown): { events: BccPublicEvent[]; omitted: BccOmittedEvent[] } | null {
  if (!payload || typeof payload !== 'object') return null;
  const events = (payload as { events?: unknown }).events;
  if (!Array.isArray(events)) return null;
  const parsed = events.map((item) => parsePublicEvent(item)).filter((item): item is BccPublicEvent => item !== null);
  if (events.length > 0 && parsed.length === 0) return null;
  const omittedRaw = (payload as { omitted?: unknown }).omitted;
  const omitted = Array.isArray(omittedRaw)
    ? omittedRaw.flatMap((item) => {
        if (!item || typeof item !== 'object') return [];
        const row = item as { id?: unknown; reason?: unknown };
        const id = asString(row.id);
        const reason = asString(row.reason);
        return id && reason ? [{ id, reason }] : [];
      })
    : [];
  return { events: parsed, omitted };
}

function parseStored(value: unknown): StoredBccFeed | null {
  const feed = parsePublicFeed(value);
  if (!feed) return null;
  const fetchedAt = value && typeof value === 'object' ? asString((value as { fetchedAt?: unknown }).fetchedAt) : '';
  return { fetchedAt, events: feed.events, omitted: feed.omitted };
}

function listingId(event: BccPublicEvent, used: Set<string>): string {
  const base = (event.slug || event.id || 'event')
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '') || 'event';
  let id = base;
  let n = 2;
  while (used.has(id)) id = `${base}-${n++}`;
  used.add(id);
  return id;
}

export function toListedEvent(event: BccPublicEvent, id: string): ListedEvent | null {
  if (event.status === 'cancelled' || event.status === 'canceled') return null;
  const start = chicagoWallToDate(event.start);
  if (!start) return null;
  const endRaw = event.end ? chicagoWallToDate(event.end) : null;
  const city = mapTown(event.town);
  const venue = event.venue || (city === 'Countywide' ? 'Bastrop County' : city);
  const summary = event.summary || event.description.slice(0, 240) || event.title;
  const image = event.image && /^https?:\/\//i.test(event.image) ? event.image : undefined;
  const data: ListedEvent['data'] = {
    title: event.title,
    summary,
    start,
    schedule: event.allDay ? 'all-day' : 'timed',
    city,
    venue,
    category: mapCategory(event.categoryKey),
    cost: event.cost?.trim() || 'See the listing',
    tier: mapTier(event),
    sourceUrl: event.url,
    sourceLabel: SOURCE_LABEL,
    ...(endRaw ? { end: endRaw } : {}),
    ...(event.address ? { address: event.address } : {}),
    ...(image ? { image } : {}),
  };
  return { id, collection: 'events', data } as ListedEvent;
}

export function toListedEvents(events: BccPublicEvent[]): ListedEvent[] {
  const used = new Set<string>();
  const listed: ListedEvent[] = [];
  for (const event of events) {
    const item = toListedEvent(event, listingId(event, used));
    if (item) listed.push(item);
  }
  return listed;
}

function plainTitle(title: string) {
  return title
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\b20\d{2}\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function sameUrl(left?: string | null, right?: string | null) {
  if (!left || !right) return false;
  try {
    const a = new URL(left);
    const b = new URL(right);
    const path = (value: URL) => (value.pathname.length > 1 && value.pathname.endsWith('/') ? value.pathname.slice(0, -1) : value.pathname);
    return a.protocol === b.protocol && a.host === b.host && path(a) === path(b);
  } catch {
    return left.trim() === right.trim();
  }
}

function slugMatches(localId: string, slug: string) {
  if (!slug) return false;
  if (localId === slug) return true;
  const escaped = slug.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`^${escaped}-\\d{4}-\\d{2}-\\d{2}$`).test(localId);
}

function findBccMatch(local: ListedEvent, events: BccPublicEvent[]): BccPublicEvent | undefined {
  const bySource = events.find((event) => sameUrl(local.data.sourceUrl, event.url));
  if (bySource) return bySource;
  const bySlug = events.find((event) => slugMatches(local.id, event.slug) || local.id === event.id);
  if (bySlug) return bySlug;
  const title = plainTitle(local.data.title);
  const day = eventKey(local.data.start);
  const titled = events.filter((event) => {
    const start = chicagoWallToDate(event.start);
    return Boolean(title) && plainTitle(event.title) === title && start && eventKey(start) === day;
  });
  if (!titled.length) return undefined;
  return titled.find((event) => mapTown(event.town) === local.data.city) ?? titled[0];
}

/**
 * Where an old /events/[id] or /ics/[id] address goes once BCC is the source.
 * Unmatched upcoming listings land on that date. Unmatched past listings land
 * on the calendar. Unknown ids return null so the page can 404.
 */
export function redirectForLegacyEvent(
  id: string,
  local: ListedEvent | undefined,
  events: BccPublicEvent[],
  now = new Date(),
): string | null {
  if (local) {
    const match = findBccMatch(local, events);
    if (match?.url) return match.url;
    if (!hasEnded(local, now)) return `/events?date=${eventKey(local.data.start)}`;
    return '/events';
  }
  const direct = events.find((event) => event.slug === id || event.id === id);
  return direct?.url || null;
}

async function fetchPublicFeed(fetchImpl: typeof fetch): Promise<{ events: BccPublicEvent[]; omitted: BccOmittedEvent[] } | null> {
  const response = await fetchImpl(BCC_EVENTS_FEED, {
    headers: {
      accept: 'application/json',
      'user-agent': 'Bastropia/events (https://bastropia.com)',
    },
    signal: AbortSignal.timeout(12_000),
  });
  if (!response.ok) {
    console.error('bcc events fetch failed', response.status);
    return null;
  }
  try {
    return parsePublicFeed(await response.json());
  } catch (error) {
    console.error('bcc events fetch was not json', error);
    return null;
  }
}

async function loadKv(): Promise<SessionKv | undefined> {
  try {
    const { sessionKv } = await import('./sessionKv.ts');
    return sessionKv();
  } catch (error) {
    console.error('bcc events kv unavailable', error);
    return undefined;
  }
}

async function readStored(kv: SessionKv): Promise<StoredBccFeed | null> {
  try {
    return parseStored(await kv.get(BCC_EVENTS_KV_KEY, 'json'));
  } catch (error) {
    console.error('bcc events read failed', error);
    return null;
  }
}

async function readFixture(): Promise<BccPublicEvent[] | null | undefined> {
  const inline = compileTimeValue(() => __BCC_EVENTS_FIXTURE_JSON__);
  if (inline) {
    try {
      const feed = parsePublicFeed(JSON.parse(inline));
      return feed ? feed.events : null;
    } catch (error) {
      console.error('bcc events fixture unreadable', error);
      return null;
    }
  }
  const path = process.env.BCC_EVENTS_FIXTURE;
  if (!path) return undefined;
  try {
    const { readFileSync } = await import('node:fs');
    const feed = parsePublicFeed(JSON.parse(readFileSync(path, 'utf8')));
    return feed ? feed.events : null;
  } catch (error) {
    console.error('bcc events fixture unreadable', error);
    return null;
  }
}

/** Fetch the public feed. A failure does not write, so the last good copy stays. */
export async function refreshBccEvents(options?: {
  kv?: SessionKv;
  fetchImpl?: typeof fetch;
  now?: Date;
}): Promise<{ stored: boolean; count: number }> {
  const kv = options?.kv ?? (await loadKv());
  const previous = kv ? await readStored(kv) : null;
  try {
    const fetched = await fetchPublicFeed(options?.fetchImpl ?? fetch);
    if (!fetched) return { stored: false, count: previous?.events.length ?? 0 };
    const stored: StoredBccFeed = {
      fetchedAt: (options?.now ?? new Date()).toISOString(),
      events: fetched.events,
      omitted: fetched.omitted,
    };
    if (kv) await kv.put(BCC_EVENTS_KV_KEY, JSON.stringify(stored));
    return { stored: Boolean(kv), count: stored.events.length };
  } catch (error) {
    console.error('bcc events refresh failed', error);
    return { stored: false, count: previous?.events.length ?? 0 };
  }
}

async function localEvents(): Promise<ListedEvent[]> {
  const { getCollection } = await import('astro:content');
  return getCollection('events');
}

let buildFeed: Promise<BccPublicEvent[] | null> | undefined;

/** Static prerender has no request binding and an empty KV. Fetch once so those pages match the flag. */
function fetchForBuild(): Promise<BccPublicEvent[] | null> {
  if (sourceStore.getStore()) return Promise.resolve(null);
  if (!buildFeed) {
    buildFeed = fetchPublicFeed(fetch)
      .then((feed) => feed?.events ?? null)
      .catch((error) => {
        console.error('bcc events build fetch failed', error);
        return null;
      });
  }
  return buildFeed;
}

async function bccEventsFromStore(): Promise<BccPublicEvent[] | null> {
  const fixture = await readFixture();
  if (fixture) return fixture;
  if (fixture === null) return null;
  const kv = await loadKv();
  if (kv) {
    const stored = await readStored(kv);
    if (stored) return stored.events;
  }
  return fetchForBuild();
}

export async function listEvents(): Promise<{ events: ListedEvent[]; source: EventSourceKind }> {
  if (eventsSourceMode() === 'bcc') {
    const stored = await bccEventsFromStore();
    if (stored) return { events: toListedEvents(stored), source: 'bcc' };
  }
  return { events: await localEvents(), source: 'local' };
}

/** 301 target for /events/[id] and /ics/[id] while BCC is actually being served. */
export async function legacyEventRedirect(id: string, now = new Date()): Promise<string | null> {
  if (eventsSourceMode() !== 'bcc' || !id) return null;
  const stored = await bccEventsFromStore();
  if (!stored) return null;
  const locals = await localEvents();
  const local = locals.find((event) => event.id === id);
  return redirectForLegacyEvent(id, local, stored, now);
}
