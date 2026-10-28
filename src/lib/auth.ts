import { timingSafeEqual } from 'node:crypto';

export function isLocalHost(hostname: string) {
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]';
}

export function deskAuthorized(hostname: string, cookie: string | undefined) {
  const key = process.env.BASTROPIA_DESK_KEY;
  if (!key) return isLocalHost(hostname);
  if (!cookie || cookie.length !== key.length) return false;
  return timingSafeEqual(Buffer.from(cookie), Buffer.from(key));
}

export function deskKeyConfigured() {
  return Boolean(process.env.BASTROPIA_DESK_KEY);
}
