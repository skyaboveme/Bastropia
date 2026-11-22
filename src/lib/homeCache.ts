/** Short edge cache. The homepage stays within a few minutes. Event pages can sit a little longer. */

export const HOME_FRESH_SECONDS = 180;
export const HOME_STALE_SECONDS = 600;
export const EVENTS_FRESH_SECONDS = 300;
export const EVENTS_STALE_SECONDS = 600;

export function cacheControlFor(freshSeconds: number, staleSeconds: number) {
  return `public, max-age=${freshSeconds}, stale-while-revalidate=${staleSeconds}`;
}

export function storeControlFor(freshSeconds: number, staleSeconds: number) {
  return `public, max-age=${freshSeconds + staleSeconds}`;
}

export const HOME_CACHE_CONTROL = cacheControlFor(HOME_FRESH_SECONDS, HOME_STALE_SECONDS);
export const HOME_STORE_CONTROL = storeControlFor(HOME_FRESH_SECONDS, HOME_STALE_SECONDS);

export function isHomePath(pathname: string) {
  const path = pathname.replace(/\/index\.html$/, '').replace(/\/+$/, '') || '/';
  return path === '/';
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

export function cacheWindowState(
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
  return cacheWindowState(cachedAt, now, HOME_FRESH_SECONDS, HOME_STALE_SECONDS);
}

const trackingParam = /^(?:utm_[a-z0-9_]+|fbclid|gclid|gbraid|wbraid|mc_cid|mc_eid|igshid|yclid|msclkid)$/i;

function barePath(pathname: string) {
  return pathname.replace(/\/index\.html$/, '').replace(/\/+$/, '') || '/';
}

/** SSR pages whose HTML is the event feed plus a header. */
export function isEventCachePath(pathname: string) {
  const path = barePath(pathname);
  return path === '/events' || path.startsWith('/events/') || path === '/this-weekend' || path === '/calendar' || path === '/now';
}

/** Cache key keeps the filters and the town cookie, and drops tracking params. */
export function eventCacheUrl(requestUrl: string, town: string) {
  const incoming = new URL(requestUrl);
  const url = new URL(barePath(incoming.pathname), incoming.origin);
  const keys = [...new Set(incoming.searchParams.keys())].filter((key) => key !== 'town' && !trackingParam.test(key)).sort();
  for (const key of keys) {
    for (const value of incoming.searchParams.getAll(key)) url.searchParams.append(key, value);
  }
  if (town) url.searchParams.set('town', town);
  return url.toString();
}
