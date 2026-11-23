import { handle } from '@astrojs/cloudflare/handler';
import { runAlertWatch } from './lib/alertWatch';
import { refreshDailyVideo } from './lib/dailyVideo';
import { refreshBccEvents, runWithEventsSource, type EventsSourceMode } from './lib/eventSource';
import { refreshSocialFeed } from './lib/socialFeed';
import type { SessionKv } from './lib/sessionKv';
import {
  HOME_FRESH_SECONDS,
  HOME_STALE_SECONDS,
  PAGE_FRESH_SECONDS,
  PAGE_STALE_SECONDS,
  cacheAgeState,
  cacheControl,
  cacheKind,
  cookieValue,
  eventCacheUrl,
  homeCacheUrl,
  storeControl,
  variesByTown,
} from './lib/homeCache';
import { APEX_HOST, HSTS_HEADER, canonicalRedirect } from './lib/httpsRedirect';
import { readTown, townCookie } from './lib/townChoice';

const SECURITY_HEADERS: Record<string, string> = {
  'Strict-Transport-Security': HSTS_HEADER,
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'SAMEORIGIN',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(self)',
  'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
};

function withSecurityHeaders(response: Response): Response {
  const headers = new Headers(response.headers);
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    if (!headers.has(key)) headers.set(key, value);
  }
  const type = headers.get('content-type') ?? '';
  if (type.includes('text/html')) {
    headers.append('Link', `<https://${APEX_HOST}/llms.txt>; rel="describedby"; type="text/plain"`);
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

type CachePolicy = {
  fresh: number;
  stale: number;
  varyCookie: boolean;
  key: Request;
};

function policyFor(request: Request): CachePolicy | null {
  if (request.method !== 'GET') return null;
  const url = new URL(request.url);
  const kind = cacheKind(url.pathname);
  if (!kind) return null;
  const varyCookie = kind === 'home' || variesByTown(url.pathname);
  const town = varyCookie ? readTown(cookieValue(request.headers.get('cookie'), townCookie)) : '';
  const href = kind === 'home' ? homeCacheUrl(request.url, town) : eventCacheUrl(request.url, town);
  const fresh = kind === 'home' ? HOME_FRESH_SECONDS : PAGE_FRESH_SECONDS;
  const stale = kind === 'home' ? HOME_STALE_SECONDS : PAGE_STALE_SECONDS;
  return { fresh, stale, varyCookie, key: new Request(href, { method: 'GET' }) };
}

function cacheableHtml(response: Response) {
  if (response.status !== 200) return false;
  const type = response.headers.get('content-type') ?? '';
  return type.includes('text/html');
}

async function storeCached(policy: CachePolicy, response: Response, ctx: ExecutionContext) {
  const setCookies = typeof response.headers.getSetCookie === 'function' ? response.headers.getSetCookie() : [];
  const headers = new Headers(response.headers);
  headers.delete('set-cookie');
  headers.set('Cache-Control', storeControl(policy.fresh, policy.stale));
  headers.set('x-cached-at', String(Date.now()));
  const body = await response.arrayBuffer();
  const stored = new Response(body, { status: 200, headers });
  ctx.waitUntil(
    caches.default.put(policy.key, stored).catch((error) => {
      console.error('page cache store failed', error);
    }),
  );
  const client = new Headers(headers);
  client.set('Cache-Control', cacheControl(policy.fresh, policy.stale));
  if (policy.varyCookie) client.set('Vary', 'Cookie');
  client.set('x-edge-cache', 'MISS');
  const out = new Response(body, { status: 200, headers: client });
  for (const cookie of setCookies) out.headers.append('set-cookie', cookie);
  return out;
}

function clientCache(response: Response, policy: CachePolicy, state: 'fresh' | 'stale') {
  const headers = new Headers(response.headers);
  headers.set('Cache-Control', cacheControl(policy.fresh, policy.stale));
  if (policy.varyCookie) headers.set('Vary', 'Cookie');
  else headers.delete('Vary');
  headers.set('x-edge-cache', state === 'fresh' ? 'HIT' : 'STALE');
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}

async function fillCached(request: Request, env: Env, ctx: ExecutionContext, policy: CachePolicy) {
  const rendered = withSecurityHeaders(await handle(request, env, ctx));
  if (!cacheableHtml(rendered)) return rendered;
  return storeCached(policy, rendered, ctx);
}

async function cachedPage(request: Request, env: Env, ctx: ExecutionContext, policy: CachePolicy) {
  const bypass = /no-cache|no-store/i.test(request.headers.get('cache-control') ?? '');
  if (!bypass) {
    try {
      const hit = await caches.default.match(policy.key);
      const cachedAt = Number(hit?.headers.get('x-cached-at') ?? '');
      const state = hit ? cacheAgeState(cachedAt, Date.now(), policy.fresh, policy.stale) : 'expired';
      if (hit && (state === 'fresh' || state === 'stale')) {
        if (state === 'stale') {
          const refresh = request.clone();
          ctx.waitUntil(
            fillCached(refresh, env, ctx, policy).catch((error) => {
              console.error('page cache refresh failed', error);
            }),
          );
        }
        return clientCache(hit, policy, state);
      }
    } catch (error) {
      console.error('page cache read failed', error);
    }
  }
  return fillCached(request, env, ctx, policy);
}

const WARM_PATHS = ['/', '/events', '/this-weekend', '/now'];

async function warmCachedPages(env: Env, ctx: ExecutionContext) {
  const origin = `https://${APEX_HOST}`;
  for (const path of WARM_PATHS) {
    try {
      const request = new Request(`${origin}${path}`, { method: 'GET' });
      const policy = policyFor(request);
      if (!policy) continue;
      await fillCached(request, env, ctx, policy);
    } catch (error) {
      console.error('page warm failed', path, error);
    }
  }
}

function eventsMode(env: unknown): EventsSourceMode {
  return (env as { EVENTS_SOURCE?: string }).EVENTS_SOURCE === 'bcc' ? 'bcc' : 'local';
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const redirect = canonicalRedirect(request);
    if (redirect) return redirect;
    return runWithEventsSource(eventsMode(env), () => render(request, env, ctx));
  },

  async scheduled(_controller: ScheduledController, env: Env, ctx: ExecutionContext): Promise<void> {
    ctx.waitUntil(
      runAlertWatch().catch((error) => {
        console.error('alert watch failed', error);
      }),
    );
    ctx.waitUntil(
      refreshDailyVideo().catch((error) => {
        console.error('daily video refresh failed', error);
      }),
    );
    ctx.waitUntil(
      refreshSocialFeed().catch((error) => {
        console.error('social feed refresh failed', error);
      }),
    );
    ctx.waitUntil(
      (async () => {
        try {
          await refreshBccEvents({ kv: (env as { SESSION?: SessionKv }).SESSION });
        } catch (error) {
          console.error('bcc events refresh failed', error);
        }
        try {
          await runWithEventsSource(eventsMode(env), () => warmCachedPages(env, ctx));
        } catch (error) {
          console.error('page warm failed', error);
        }
      })(),
    );
  },
};

async function render(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
  if (request.method === 'GET') {
    const policy = policyFor(request);
    if (policy) return cachedPage(request, env, ctx, policy);
  }

  const response = await handle(request, env, ctx);
  return withSecurityHeaders(response);
}
