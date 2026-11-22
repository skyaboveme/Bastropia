import { handle } from '@astrojs/cloudflare/handler';
import { runAlertWatch } from './lib/alertWatch';
import { refreshDailyVideo } from './lib/dailyVideo';
import { refreshBccEvents, runWithEventsSource, type EventsSourceMode } from './lib/eventSource';
import type { SessionKv } from './lib/sessionKv';
import {
  HOME_CACHE_CONTROL,
  HOME_STORE_CONTROL,
  cookieValue,
  homeCacheState,
  homeCacheUrl,
  isHomePath,
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

function cacheableHome(response: Response) {
  if (response.status !== 200) return false;
  const type = response.headers.get('content-type') ?? '';
  return type.includes('text/html');
}

async function storeHome(key: Request, response: Response, ctx: ExecutionContext) {
  const setCookies = typeof response.headers.getSetCookie === 'function' ? response.headers.getSetCookie() : [];
  const headers = new Headers(response.headers);
  headers.delete('set-cookie');
  headers.set('Cache-Control', HOME_STORE_CONTROL);
  headers.set('x-cached-at', String(Date.now()));
  const body = await response.arrayBuffer();
  const stored = new Response(body, { status: 200, headers });
  ctx.waitUntil(
    caches.default.put(key, stored).catch((error) => {
      console.error('home cache store failed', error);
    }),
  );
  const client = new Headers(headers);
  client.set('Cache-Control', HOME_CACHE_CONTROL);
  client.set('Vary', 'Cookie');
  client.set('x-edge-cache', 'MISS');
  const out = new Response(body, { status: 200, headers: client });
  for (const cookie of setCookies) out.headers.append('set-cookie', cookie);
  return out;
}

function clientCache(response: Response, state: 'fresh' | 'stale') {
  const headers = new Headers(response.headers);
  headers.set('Cache-Control', HOME_CACHE_CONTROL);
  headers.set('Vary', 'Cookie');
  headers.set('x-edge-cache', state === 'fresh' ? 'HIT' : 'STALE');
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}

async function fillHome(request: Request, env: Env, ctx: ExecutionContext, key: Request) {
  const rendered = withSecurityHeaders(await handle(request, env, ctx));
  if (!cacheableHome(rendered)) return rendered;
  return storeHome(key, rendered, ctx);
}

async function homepage(request: Request, env: Env, ctx: ExecutionContext) {
  const bypass = /no-cache|no-store/i.test(request.headers.get('cache-control') ?? '');
  const town = readTown(cookieValue(request.headers.get('cookie'), townCookie));
  const key = new Request(homeCacheUrl(request.url, town), { method: 'GET' });
  if (!bypass) {
    try {
      const hit = await caches.default.match(key);
      const cachedAt = Number(hit?.headers.get('x-cached-at') ?? '');
      const state = hit ? homeCacheState(cachedAt, Date.now()) : 'expired';
      if (hit && (state === 'fresh' || state === 'stale')) {
        if (state === 'stale') {
          const refresh = request.clone();
          ctx.waitUntil(
            fillHome(refresh, env, ctx, key).catch((error) => {
              console.error('home cache refresh failed', error);
            }),
          );
        }
        return clientCache(hit, state);
      }
    } catch (error) {
      console.error('home cache read failed', error);
    }
  }
  return fillHome(request, env, ctx, key);
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
      refreshBccEvents({ kv: (env as { SESSION?: SessionKv }).SESSION }).catch((error) => {
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
      const response = await homepage(request, env, ctx);
      return response;
    }

    const response = await handle(request, env, ctx);
    return withSecurityHeaders(response);
}
