import { handle } from '@astrojs/cloudflare/handler';
import { runAlertWatch } from './lib/alertWatch';
import { refreshDailyVideo } from './lib/dailyVideo';
import { refreshBccEvents, runWithEventsSource, type EventsSourceMode } from './lib/eventSource';
import type { SessionKv } from './lib/sessionKv';
import {
  EVENTS_FRESH_SECONDS,
  EVENTS_STALE_SECONDS,
  HOME_FRESH_SECONDS,
  HOME_STALE_SECONDS,
  cacheControlFor,
  cacheWindowState,
  cookieValue,
  eventCacheUrl,
  homeCacheUrl,
  isEventCachePath,
  isHomePath,
  storeControlFor,
} from './lib/homeCache';
import { readTown, townCookie } from './lib/townChoice';

const APEX_HOST = 'bastropia.com';
const WWW_HOST = `www.${APEX_HOST}`;

const SECURITY_HEADERS: Record<string, string> = {
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'SAMEORIGIN',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
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

type PageCache = {
  fresh: number;
  stale: number;
  key: Request;
  label: string;
};

function townOf(request: Request) {
  return readTown(cookieValue(request.headers.get('cookie'), townCookie));
}

function homePageCache(request: Request): PageCache {
  return {
    fresh: HOME_FRESH_SECONDS,
    stale: HOME_STALE_SECONDS,
    key: new Request(homeCacheUrl(request.url, townOf(request)), { method: 'GET' }),
    label: 'home',
  };
}

function eventPageCache(request: Request): PageCache {
  return {
    fresh: EVENTS_FRESH_SECONDS,
    stale: EVENTS_STALE_SECONDS,
    key: new Request(eventCacheUrl(request.url, townOf(request)), { method: 'GET' }),
    label: 'event',
  };
}

function cacheablePage(response: Response) {
  if (response.status === 301 || response.status === 302 || response.status === 307 || response.status === 308) return true;
  if (response.status !== 200) return false;
  const type = response.headers.get('content-type') ?? '';
  return type.includes('text/html');
}

async function storePage(page: PageCache, response: Response, ctx: ExecutionContext) {
  const setCookies = typeof response.headers.getSetCookie === 'function' ? response.headers.getSetCookie() : [];
  const headers = new Headers(response.headers);
  headers.delete('set-cookie');
  headers.set('Cache-Control', storeControlFor(page.fresh, page.stale));
  headers.set('x-cached-at', String(Date.now()));
  const body = await response.arrayBuffer();
  const stored = new Response(body, { status: response.status, statusText: response.statusText, headers });
  ctx.waitUntil(
    caches.default.put(page.key, stored).catch((error) => {
      console.error(`${page.label} cache store failed`, error);
    }),
  );
  const client = new Headers(headers);
  client.set('Cache-Control', cacheControlFor(page.fresh, page.stale));
  client.set('Vary', 'Cookie');
  client.set('x-edge-cache', 'MISS');
  const out = new Response(body, { status: response.status, statusText: response.statusText, headers: client });
  for (const cookie of setCookies) out.headers.append('set-cookie', cookie);
  return out;
}

function clientCache(response: Response, state: 'fresh' | 'stale', page: PageCache) {
  const headers = new Headers(response.headers);
  headers.set('Cache-Control', cacheControlFor(page.fresh, page.stale));
  headers.set('Vary', 'Cookie');
  headers.set('x-edge-cache', state === 'fresh' ? 'HIT' : 'STALE');
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}

async function fillPage(request: Request, env: Env, ctx: ExecutionContext, page: PageCache) {
  const rendered = withSecurityHeaders(await handle(request, env, ctx));
  if (!cacheablePage(rendered)) return rendered;
  return storePage(page, rendered, ctx);
}

async function cachedPage(request: Request, env: Env, ctx: ExecutionContext, page: PageCache) {
  const bypass = /no-cache|no-store/i.test(request.headers.get('cache-control') ?? '');
  if (!bypass) {
    try {
      const hit = await caches.default.match(page.key);
      const cachedAt = Number(hit?.headers.get('x-cached-at') ?? '');
      const state = hit ? cacheWindowState(cachedAt, Date.now(), page.fresh, page.stale) : 'expired';
      if (hit && (state === 'fresh' || state === 'stale')) {
        if (state === 'stale') {
          const refresh = request.clone();
          ctx.waitUntil(
            fillPage(refresh, env, ctx, page).catch((error) => {
              console.error(`${page.label} cache refresh failed`, error);
            }),
          );
        }
        return clientCache(hit, state, page);
      }
    } catch (error) {
      console.error(`${page.label} cache read failed`, error);
    }
  }
  return fillPage(request, env, ctx, page);
}

async function warmEvents(env: Env, ctx: ExecutionContext) {
  try {
    const request = new Request(`https://${APEX_HOST}/events`, { method: 'GET' });
    await runWithEventsSource(eventsMode(env), () => fillPage(request, env, ctx, eventPageCache(request)));
  } catch (error) {
    console.error('event cache warm failed', error);
  }
}

function eventsMode(env: unknown): EventsSourceMode {
  return (env as { EVENTS_SOURCE?: string }).EVENTS_SOURCE === 'bcc' ? 'bcc' : 'local';
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
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
      (async () => {
        const result = await refreshBccEvents({ kv: (env as { SESSION?: SessionKv }).SESSION });
        if (result.stored) await warmEvents(env, ctx);
      })().catch((error) => {
        console.error('bcc events refresh failed', error);
      }),
    );
  },
};

async function render(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    if (url.hostname === WWW_HOST) {
      url.hostname = APEX_HOST;
      return Response.redirect(url.toString(), 301);
    }

    if (request.method === 'GET' && isHomePath(url.pathname)) {
      return cachedPage(request, env, ctx, homePageCache(request));
    }

    if (request.method === 'GET' && isEventCachePath(url.pathname)) {
      return cachedPage(request, env, ctx, eventPageCache(request));
    }

    const response = await handle(request, env, ctx);
    return withSecurityHeaders(response);
}
