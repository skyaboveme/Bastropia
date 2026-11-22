/**
 * Edge HTML cache. The homepage stays fresh for a few minutes because weather
 * and the burn ban move. Event pages stay fresh for five minutes. Either way
 * a visitor can be handed the previous copy while a refresh runs, long enough
 * to cover the 15-minute cron, so a full render is not what they wait on.
 */
import { townPages } from '../data/towns.ts';

export const HOME_FRESH_SECONDS = 180;
export const HOME_STALE_SECONDS = 1200;
export const PAGE_FRESH_SECONDS = 300;
export const PAGE_STALE_SECONDS = 1800;

export const HOME_CACHE_CONTROL = `public, max-age=${HOME_FRESH_SECONDS}, stale-while-revalidate=${HOME_STALE_SECONDS}`;
export const HOME_STORE_CONTROL = `public, max-age=${HOME_FRESH_SECONDS + HOME_STALE_SECONDS}`;

const townPaths = new Set(townPages.map((town) => `/${town.slug}`));
const EVENT_QUERY = ['view', 'month', 'when', 'category', 'city', 'q', 'date', 'classes', 'page'];

export function normalizePath(pathname: string) {
  return pathname.replace(/\/index\.html$/, '').replace(/\/+$/, '') || '/';
}

export function isHomePath(pathname: string) {
  return normalizePath(pathname) === '/';
}

export type CacheKind = 'home' | 'event';

export function cacheKind(pathname: string): CacheKind | null {
  const path = normalizePath(pathname);
  if (path === '/') return 'home';
  if (path === '/events' || path === '/this-weekend' || path === '/calendar' || path === '/now') return 'event';
  if (townPaths.has(path)) return 'event';
  return null;
}

/** /now follows the town cookie. Event lists do not. */
export function variesByTown(pathname: string) {
  return normalizePath(pathname) === '/now';
}

export function cacheControl(freshSeconds: number, staleSeconds: number) {
  return `public, max-age=${freshSeconds}, stale-while-revalidate=${staleSeconds}`;
}

export function storeControl(freshSeconds: number, staleSeconds: number) {
  return `public, max-age=${freshSeconds + staleSeconds}`;
}

export function cookieValue(header: string | null, name: string) {
  if (!header) return '';
  for (const part of header.split(';')) {
    const trimmed = part.trim();
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    if (trimmed.slice(0, eq) !== name) continue;
    const raw = trimmed.slice(eq + 1);
    try {
      return decodeURIComponent(raw.replace(/\+/g, ' '));
    } catch {
      return raw;
    }
  }
  return '';
}

/** Cache key ignores tracking query params. The town cookie is the only variant. */
export function homeCacheUrl(origin: string, town: string) {
  const url = new URL('/', origin);
  if (town) url.searchParams.set('town', town);
  return url.toString();
}

/** Event-page key. Keeps the filters that change the HTML and drops the rest. */
export function eventCacheUrl(resource: string, town: string) {
  const url = new URL(resource);
  const path = normalizePath(url.pathname);
  const key = new URL(url.origin);
  key.pathname = path;
  if (path === '/events') {
    for (const name of EVENT_QUERY) {
      const value = url.searchParams.get(name);
      if (value) key.searchParams.set(name, value);
    }
  }
  if (variesByTown(path) && town) key.searchParams.set('town', town);
  return key.toString();
}

export function cacheAgeState(
  cachedAt: number,
  now: number,
  freshSeconds: number,
  staleSeconds: number,
): 'fresh' | 'stale' | 'expired' {
  if (!Number.isFinite(cachedAt) || cachedAt <= 0) return 'expired';
  const age = now - cachedAt;
  if (age < 0) return 'expired';
  if (age < freshSeconds * 1000) return 'fresh';
  if (age < (freshSeconds + staleSeconds) * 1000) return 'stale';
  return 'expired';
}

export function homeCacheState(cachedAt: number, now: number): 'fresh' | 'stale' | 'expired' {
  return cacheAgeState(cachedAt, now, HOME_FRESH_SECONDS, HOME_STALE_SECONDS);
}

export function pageCacheState(cachedAt: number, now: number): 'fresh' | 'stale' | 'expired' {
  return cacheAgeState(cachedAt, now, PAGE_FRESH_SECONDS, PAGE_STALE_SECONDS);
}
