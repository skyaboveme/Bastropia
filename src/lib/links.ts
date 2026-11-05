import { siteUrl } from '../data/site';

/** True when the href leaves bastropia.com (absolute http(s) to another host). */
export function isOffsite(href: string | undefined | null): boolean {
  if (!href) return false;
  const value = href.trim();
  if (!value) return false;
  if (value.startsWith('#') || value.startsWith('?')) return false;
  if (value.startsWith('/') && !value.startsWith('//')) return false;
  if (/^(mailto|tel|sms|javascript):/i.test(value)) return false;
  try {
    const url = new URL(value, siteUrl);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return false;
    const host = url.hostname.replace(/^www\./i, '').toLowerCase();
    return host !== 'bastropia.com';
  } catch {
    return false;
  }
}

/** Spread onto an <a> when the link should leave the site in a new tab. */
export function offsiteAttrs(href: string | undefined | null): { target?: '_blank'; rel?: string } {
  if (!isOffsite(href)) return {};
  return { target: '_blank', rel: 'noopener noreferrer' };
}
