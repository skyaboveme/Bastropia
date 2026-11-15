import { facebookGroup } from '../data/site';

export type GroupPost = {
  id: string;
  author: string;
  text: string;
  url: string;
  published: Date;
};

const cache: { at: number; value: GroupPost[] } = { at: 0, value: [] };
let guestCookie = '';
let guestCookieAt = 0;

const headers = {
  'user-agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
  'accept-language': 'en-US,en;q=0.9',
  'sec-fetch-dest': 'document',
  'sec-fetch-mode': 'navigate',
  'sec-fetch-site': 'none',
  'sec-fetch-user': '?1',
  'upgrade-insecure-requests': '1',
};

function readJsonString(source: string, quoteAt: number) {
  if (source[quoteAt] !== '"') return '';
  let out = '';
  for (let i = quoteAt + 1; i < source.length; i++) {
    const ch = source[i];
    if (ch === '\\') {
      const next = source[i + 1] ?? '';
      if (next === 'u') {
        const hex = source.slice(i + 2, i + 6);
        out += String.fromCharCode(Number.parseInt(hex, 16));
        i += 5;
        continue;
      }
      const mapped: Record<string, string> = { n: '\n', r: '\r', t: '\t', '"': '"', '\\': '\\', '/': '/' };
      out += mapped[next] ?? next;
      i += 1;
      continue;
    }
    if (ch === '"') return out;
    out += ch;
  }
  return '';
}

function authorBefore(html: string) {
  const matches = [...html.matchAll(/"owning_profile":\{"__typename":"User","name":"((?:\\.|[^"\\])*)"/g)];
  const last = matches.at(-1);
  if (!last) return 'Bastropia';
  return readJsonString(`"${last[1]}"`, 0) || 'Bastropia';
}

/** Posts Facebook includes on the public group page. Logged-out HTML usually has the latest few. */
export function parseGroupPosts(html: string): GroupPost[] {
  const posts: GroupPost[] = [];
  const seen = new Set<string>();
  for (const match of html.matchAll(/"post_id":"(\d+)"/g)) {
    const id = match[1];
    if (seen.has(id)) continue;
    const at = match.index ?? 0;
    const before = html.slice(Math.max(0, at - 2500), at);
    const after = html.slice(at, Math.min(html.length, at + 80000));
    const messageAt = after.indexOf('"message":{"text":"');
    if (messageAt < 0) continue;
    const text = readJsonString(after, messageAt + '"message":{"text":'.length).trim();
    if (!text) continue;
    const time = after.match(/"creation_time":(\d+)/);
    const published = time ? new Date(Number(time[1]) * 1000) : new Date(0);
    seen.add(id);
    posts.push({
      id,
      author: authorBefore(before),
      text,
      url: `${facebookGroup}/posts/${id}/`,
      published,
    });
  }
  return posts.sort((a, b) => b.published.getTime() - a.published.getTime()).slice(0, 8);
}

function cookiePairs(lines: string[]) {
  return lines
    .map((line) => line.split(';')[0]?.trim() ?? '')
    .filter((pair) => /^(datr|sb|fr)=/.test(pair))
    .join('; ');
}

/** Facebook sends the public group only after it has set a datr cookie. Fetch hides that header; undici does not. */
async function freshGuestCookie() {
  try {
    const undici = await import(/* @vite-ignore */ 'undici');
    const { headers: responseHeaders } = await undici.request(facebookGroup, {
      method: 'GET',
      maxRedirections: 0,
      headers,
      headersTimeout: 8000,
      bodyTimeout: 8000,
    });
    const set = responseHeaders['set-cookie'];
    const lines = Array.isArray(set) ? set : set ? [String(set)] : [];
    const pairs = cookiePairs(lines);
    if (pairs) return pairs;
  } catch {
    // Workers have no undici. The fetch below can still see set-cookie there.
  }
  const response = await fetch(facebookGroup, { headers, redirect: 'manual', signal: AbortSignal.timeout(8000) });
  return cookiePairs(response.headers.getSetCookie?.() ?? []);
}

async function guestCookieHeader() {
  if (guestCookie && Date.now() - guestCookieAt < 6 * 60 * 60 * 1000) return guestCookie;
  const pairs = await freshGuestCookie();
  if (pairs) {
    guestCookie = pairs;
    guestCookieAt = Date.now();
  }
  return pairs;
}

async function groupHtml(cookie: string) {
  const response = await fetch(facebookGroup, {
    headers: cookie ? { ...headers, cookie } : headers,
    redirect: 'manual',
    signal: AbortSignal.timeout(8000),
  });
  if (response.status !== 200) return '';
  return response.text();
}

export async function getBastropiaGroupPosts(): Promise<GroupPost[]> {
  if (cache.value.length && Date.now() - cache.at < 10 * 60 * 1000) return cache.value;
  try {
    let posts = parseGroupPosts(await groupHtml(await guestCookieHeader()));
    if (!posts.length) {
      guestCookie = '';
      guestCookieAt = 0;
      posts = parseGroupPosts(await groupHtml(await guestCookieHeader()));
    }
    if (posts.length) {
      cache.at = Date.now();
      cache.value = posts;
    }
    return posts.length ? posts : cache.value;
  } catch {
    return cache.value;
  }
}
