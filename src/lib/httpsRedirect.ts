export const APEX_HOST = 'bastropia.com';
export const WWW_HOST = `www.${APEX_HOST}`;
export const HSTS_HEADER = 'max-age=31536000; includeSubDomains; preload';

function headerScheme(value: string | null): string {
  if (!value) return '';
  const first = value.split(',')[0]?.trim().toLowerCase() ?? '';
  return first === 'http' || first === 'https' ? first : '';
}

function visitorScheme(value: string | null): string {
  if (!value) return '';
  try {
    const parsed = JSON.parse(value) as { scheme?: unknown };
    if (typeof parsed.scheme !== 'string') return '';
    const scheme = parsed.scheme.toLowerCase();
    return scheme === 'http' || scheme === 'https' ? scheme : '';
  } catch {
    return '';
  }
}

/** True when the client connection, or a proxy scheme header, is plain HTTP. */
export function requestIsHttp(request: Request): boolean {
  let url: URL;
  try {
    url = new URL(request.url);
  } catch {
    return false;
  }
  if (url.protocol === 'http:') return true;
  if (headerScheme(request.headers.get('x-forwarded-proto')) === 'http') return true;
  return visitorScheme(request.headers.get('cf-visitor')) === 'http';
}

/**
 * 301 to https://bastropia.com with the same path and query.
 * HTTP (URL, X-Forwarded-Proto, or cf-visitor) and www both land on the apex.
 * Returns null when the request is already the HTTPS apex.
 * HSTS is added only on a redirect that is itself served over HTTPS.
 */
export function canonicalRedirect(request: Request): Response | null {
  let url: URL;
  try {
    url = new URL(request.url);
  } catch {
    return null;
  }
  const http = requestIsHttp(request);
  if (!http && url.hostname !== WWW_HOST) return null;
  const headers = new Headers({
    Location: `https://${APEX_HOST}${url.pathname}${url.search}`,
  });
  // HSTS is ignored on an HTTP response. A request URL that is already https
  // is served over TLS even when a scheme header says otherwise.
  if (url.protocol === 'https:' && !headers.has('Strict-Transport-Security')) {
    headers.set('Strict-Transport-Security', HSTS_HEADER);
  }
  return new Response(null, { status: 301, headers });
}
