/**
 * Tell IndexNow about URLs that changed in this deploy.
 * A failed ping must not fail the deploy. This file always exits 0.
 */
import { execSync } from 'node:child_process';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const HOST = 'bastropia.com';
const ORIGIN = `https://${HOST}`;

function git(command) {
  return execSync(command, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
}

function indexNowKey() {
  for (const name of readdirSync('public')) {
    if (!/^[a-f0-9]{16,128}\.txt$/.test(name)) continue;
    const value = name.slice(0, -4);
    if (readFileSync(join('public', name), 'utf8').trim() === value) return value;
  }
  return '';
}

function changedFiles() {
  let head = '';
  try {
    head = git('git rev-parse HEAD');
  } catch {
    return [];
  }
  const before = (process.env.INDEXNOW_BEFORE || '').trim().toLowerCase();
  if (/^[0-9a-f]{40}$/.test(before) && !/^0+$/.test(before)) {
    try {
      git(`git fetch --depth=1 origin ${before}`);
    } catch {
      /* already local, or the remote does not have it */
    }
    try {
      return git(`git diff --name-only ${before} ${head}`).split('\n').filter(Boolean);
    } catch {
      /* fall through to the parent commit */
    }
  }
  try {
    return git('git diff --name-only HEAD^ HEAD').split('\n').filter(Boolean);
  } catch {
    return [];
  }
}

function urlsFor(file) {
  if (file.startsWith('src/content/news/')) {
    const name = (file.split('/').pop() ?? '').replace(/\.mdx?$/, '');
    return name ? [`${ORIGIN}/news/${name}`] : [];
  }
  if (file.startsWith('src/content/guides/')) {
    const name = (file.split('/').pop() ?? '').replace(/\.mdx?$/, '');
    return name ? [`${ORIGIN}/guides/${name}`, `${ORIGIN}/guides`] : [];
  }
  if (!file.startsWith('src/pages/') || file.includes('/api/')) return [];
  let route = file.slice('src/pages/'.length).replace(/\.(astro|ts|mjs|js|md|mdx)$/, '');
  if (route.endsWith('/index')) route = route.slice(0, -'/index'.length);
  if (route === 'index') return [`${ORIGIN}/`];
  if (route.startsWith('desk')) return [];
  if (route.includes('[')) {
    const section = route.split('[')[0].replace(/\/$/, '');
    return [section ? `${ORIGIN}/${section}` : `${ORIGIN}/`];
  }
  return [`${ORIGIN}/${route}`];
}

async function main() {
  const key = indexNowKey();
  if (!key) {
    console.log('IndexNow skipped: no key file in public/.');
    return;
  }
  const urls = new Set([
    `${ORIGIN}/`,
    `${ORIGIN}/sitemap.xml`,
    `${ORIGIN}/sitemap-index.xml`,
    `${ORIGIN}/news-sitemap.xml`,
  ]);
  for (const file of changedFiles()) {
    for (const url of urlsFor(file)) urls.add(url);
  }
  const urlList = [...urls].slice(0, 10000);
  console.log(`IndexNow: ${urlList.length} URL${urlList.length === 1 ? '' : 's'}`);
  for (const url of urlList) console.log(`  ${url}`);
  const response = await fetch('https://api.indexnow.org/indexnow', {
    method: 'POST',
    headers: { 'content-type': 'application/json; charset=utf-8' },
    body: JSON.stringify({
      host: HOST,
      key,
      keyLocation: `${ORIGIN}/${key}.txt`,
      urlList,
    }),
    signal: AbortSignal.timeout(15000),
  });
  console.log(`IndexNow response: ${response.status}`);
}

main()
  .catch((error) => {
    const message = error instanceof Error ? error.message : 'request failed';
    console.log(`IndexNow skipped: ${message}`);
  })
  .finally(() => {
    process.exit(0);
  });
