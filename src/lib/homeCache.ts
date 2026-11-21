/** Short edge cache for the homepage. Live weather, the daily video, and the burn ban stay within a few minutes. */

export const HOME_FRESH_SECONDS = 180;
export const HOME_STALE_SECONDS = 600;

export const HOME_CACHE_CONTROL = `public, max-age=${HOME_FRESH_SECONDS}, stale-while-revalidate=${HOME_STALE_SECONDS}`;
export const HOME_STORE_CONTROL = `public, max-age=${HOME_FRESH_SECONDS + HOME_STALE_SECONDS}`;

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

export function homeCacheState(cachedAt: number, now: number): 'fresh' | 'stale' | 'expired' {
  if (!Number.isFinite(cachedAt) || cachedAt <= 0) return 'expired';
  const age = now - cachedAt;
  if (age < 0) return 'expired';
  if (age < HOME_FRESH_SECONDS * 1000) return 'fresh';
  if (age < (HOME_FRESH_SECONDS + HOME_STALE_SECONDS) * 1000) return 'stale';
  return 'expired';
}
