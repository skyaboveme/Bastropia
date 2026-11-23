export const prerender = false;

import type { APIRoute } from 'astro';
import { loadDirectoryEntries } from '../../lib/directoryFeed.ts';
import { entryToIndexRow, indexPayload } from '../../lib/directoryView.ts';

export const GET: APIRoute = async ({ request }) => {
  const rows = indexPayload((await loadDirectoryEntries()).map(entryToIndexRow));
  const body = JSON.stringify({ rows });
  const digest = await crypto.subtle.digest('SHA-1', new TextEncoder().encode(body));
  const etag = `"${[...new Uint8Array(digest)].slice(0, 8).map((byte) => byte.toString(16).padStart(2, '0')).join('')}"`;
  const headers = {
    'content-type': 'application/json; charset=utf-8',
    etag,
    'cache-control': 'public, max-age=300, s-maxage=300',
  };
  if (request.headers.get('if-none-match') === etag) return new Response(null, { status: 304, headers });
  return new Response(body, { headers });
};
