import assert from 'node:assert/strict';
import test from 'node:test';
import { HSTS_HEADER, canonicalRedirect, requestIsHttp } from './httpsRedirect.ts';

function redirect(url: string, headers?: HeadersInit) {
  return canonicalRedirect(new Request(url, { headers }));
}

test('plain HTTP on the apex and www goes to the HTTPS apex', () => {
  const home = redirect('http://bastropia.com/');
  assert.equal(home?.status, 301);
  assert.equal(home?.headers.get('location'), 'https://bastropia.com/');
  assert.equal(home?.headers.get('strict-transport-security'), null);

  const www = redirect('http://www.bastropia.com/news');
  assert.equal(www?.status, 301);
  assert.equal(www?.headers.get('location'), 'https://bastropia.com/news');

  const query = redirect('http://bastropia.com/events?x=1');
  assert.equal(query?.headers.get('location'), 'https://bastropia.com/events?x=1');

  const wwwQuery = redirect('http://www.bastropia.com/events?x=1&y=2');
  assert.equal(wwwQuery?.headers.get('location'), 'https://bastropia.com/events?x=1&y=2');
});

test('HTTPS www still folds onto the apex and names HSTS', () => {
  const response = redirect('https://www.bastropia.com/news?x=1');
  assert.equal(response?.status, 301);
  assert.equal(response?.headers.get('location'), 'https://bastropia.com/news?x=1');
  assert.equal(response?.headers.get('strict-transport-security'), HSTS_HEADER);
});

test('the HTTPS apex is left alone', () => {
  assert.equal(redirect('https://bastropia.com/'), null);
  assert.equal(redirect('https://bastropia.com/news?x=1'), null);
});

test('local dev hosts are not sent to production', () => {
  assert.equal(redirect('http://127.0.0.1:4321/'), null);
  assert.equal(redirect('http://localhost:4321/news?x=1'), null);
  assert.equal(redirect('http://[::1]:4321/'), null);
});

test('X-Forwarded-Proto and cf-visitor can mark an https URL as http', () => {
  const forwarded = redirect('https://bastropia.com/news', { 'x-forwarded-proto': 'http' });
  assert.equal(forwarded?.headers.get('location'), 'https://bastropia.com/news');
  assert.equal(forwarded?.headers.get('strict-transport-security'), HSTS_HEADER);
  assert.equal(requestIsHttp(new Request('https://bastropia.com/', { headers: { 'x-forwarded-proto': 'HTTP, https' } })), true);

  const visitor = redirect('https://www.bastropia.com/events?x=1', { 'cf-visitor': '{"scheme":"http"}' });
  assert.equal(visitor?.headers.get('location'), 'https://bastropia.com/events?x=1');

  assert.equal(redirect('https://bastropia.com/', { 'x-forwarded-proto': 'https', 'cf-visitor': '{"scheme":"https"}' }), null);
  assert.equal(redirect('https://bastropia.com/', { 'cf-visitor': 'not-json' }), null);
});
