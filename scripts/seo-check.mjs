/**
 * Check indexable HTML in the Astro build.
 *
 * Fails on a missing title, description, canonical, og:image, or h1; duplicate
 * titles or descriptions (listing and paginated pages only warn); a story
 * whose NewsArticle is missing headline, datePublished, author, or publisher;
 * a content image with no alt attribute (an empty alt is allowed when the
 * picture repeats a heading, which is how the partner logos are marked);
 * a broken internal link; or a story the sitemap
 * route does not include.
 *
 * Title length and description length are warnings. A text-only story warns
 * instead of failing on image, because many desk notes have no photo and an
 * invented image would be worse.
 *
 * sitemap.xml is rendered by the worker so live directory listings stay
 * current. When the build does not emit the file, this check requires the
 * route to map every news entry and requires each built story to have a
 * content file. A sitemap.xml in dist/ is used directly when it exists.
 */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

const root = process.cwd();
const dist = process.argv[2] ? join(root, process.argv[2]) : join(root, 'dist');
const htmlRoot = existsSync(join(dist, 'client')) ? join(dist, 'client') : dist;
const failures = [];
const warnings = [];

function walk(dir, out = []) {
  if (!existsSync(dir)) return out;
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules' || name.startsWith('.')) continue;
    const file = join(dir, name);
    const stat = statSync(file);
    if (stat.isDirectory()) walk(file, out);
    else out.push(file);
  }
  return out;
}

function attr(tag, name) {
  const match = tag.match(new RegExp(`\\b${name}\\s*=\\s*(?:"([\\s\\S]*?)"|'([\\s\\S]*?)')`, 'i'));
  const value = match?.[1] ?? match?.[2] ?? '';
  if (name === 'content') return decode(value);
  return value.toLowerCase();
}

function decode(value) {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function pagePath(file) {
  let rel = relative(htmlRoot, file).split(sep).join('/');
  if (rel.endsWith('/index.html')) rel = rel.slice(0, -'/index.html'.length);
  else if (rel.endsWith('.html')) rel = rel.slice(0, -'.html'.length);
  if (!rel || rel === 'index') return '/';
  return `/${rel}`;
}

function metas(html) {
  const found = [];
  for (const tag of html.matchAll(/<meta\b[^>]*>/gi)) {
    const chunk = tag[0];
    const name = attr(chunk, 'name') || attr(chunk, 'property');
    const content = attr(chunk, 'content');
    if (name) found.push({ name, content });
  }
  return found;
}

function metaContent(list, name) {
  return list.find((item) => item.name === name)?.content ?? '';
}

function idsIn(dir) {
  const folder = join(root, dir);
  if (!existsSync(folder)) return [];
  return readdirSync(folder)
    .filter((name) => /\.mdx?$/.test(name))
    .map((name) => name.replace(/\.mdx?$/, ''));
}

function quotedSlugs(file, key) {
  if (!existsSync(file)) return [];
  const text = readFileSync(file, 'utf8');
  return [...text.matchAll(new RegExp(`${key}:\\s*['"]([^'"]+)['"]`, 'g'))].map((match) => match[1]);
}

function loadRoutes() {
  const exact = new Set(['/']);
  const patterns = [];
  const pages = join(root, 'src/pages');
  for (const file of walk(pages)) {
    let rel = relative(pages, file).split(sep).join('/');
    if (!/\.(astro|ts|mjs|js)$/.test(rel)) continue;
    rel = rel.replace(/\.(astro|ts|mjs|js)$/, '');
    if (rel.endsWith('/index')) rel = rel.slice(0, -'/index'.length);
    if (rel === 'index') continue;
    const parts = rel.split('/');
    if (parts.some((part) => part.startsWith('['))) {
      const open = parts[0] === 'api' || parts[0] === 'go' || parts[0] === 'ics' || parts[0] === 'ad' || parts[0] === 'ads';
      if (open || parts.includes('[token]') || parts.includes('[slug]') && parts[0] !== 'authors') {
        const pattern = parts.map((part) => (part.startsWith('[') ? '[^/]+' : part)).join('/');
        patterns.push(new RegExp(`^/${pattern}$`));
      }
      continue;
    }
    exact.add(`/${rel}`);
  }
  for (const id of idsIn('src/content/news')) exact.add(`/news/${id}`);
  for (const id of idsIn('src/content/events')) exact.add(`/events/${id}`);
  for (const id of idsIn('src/content/social')) exact.add(`/social/${id}`);
  for (const id of idsIn('src/content/updates')) exact.add(`/government/${id}`);
  for (const slug of quotedSlugs(join(root, 'src/data/authors.ts'), 'slug')) exact.add(`/authors/${slug}`);
  for (const slug of quotedSlugs(join(root, 'src/data/towns.ts'), 'slug')) exact.add(`/${slug}`);
  for (const slug of quotedSlugs(join(root, 'src/data/businesses.ts'), 'slug')) exact.add(`/${slug}`);
  const config = existsSync(join(root, 'astro.config.mjs')) ? readFileSync(join(root, 'astro.config.mjs'), 'utf8') : '';
  const redirectStart = config.indexOf('redirects:');
  if (redirectStart !== -1) {
    const slice = config.slice(redirectStart, redirectStart + 2500);
    for (const match of slice.matchAll(/['"](\/[^'"]+)['"]\s*:/g)) exact.add(match[1]);
  }
  for (const file of walk(join(root, 'public'))) {
    const rel = relative(join(root, 'public'), file).split(sep).join('/');
    exact.add(`/${rel}`);
  }
  return { exact, patterns };
}

function normalizePath(pathname) {
  if (pathname.length > 1 && pathname.endsWith('/')) return pathname.slice(0, -1);
  return pathname || '/';
}

function isListing(pathname) {
  return (
    pathname === '/' ||
    /^\/(news|events|directory|eats|social|groups|churches|videos|government|sitemap)$/.test(pathname) ||
    /\/page\/\d+$/.test(pathname)
  );
}

function jsonNodes(html) {
  const nodes = [];
  for (const match of html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      const data = JSON.parse(match[1]);
      const graph = Array.isArray(data?.['@graph']) ? data['@graph'] : [data];
      for (const node of graph) if (node && typeof node === 'object') nodes.push(node);
    } catch {
      nodes.push(null);
    }
  }
  return nodes;
}

function typesOf(node) {
  const value = node?.['@type'];
  return (Array.isArray(value) ? value : [value]).filter(Boolean);
}

function hasImage(value) {
  if (!value) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (Array.isArray(value)) return value.some((item) => hasImage(item));
  if (typeof value === 'object') return hasImage(value.url || value.contentUrl);
  return false;
}

function hasParty(value) {
  if (!value) return false;
  if (Array.isArray(value)) return value.some((item) => hasParty(item));
  if (typeof value !== 'object') return false;
  return Boolean(value.name || value['@id'] || value.url);
}

const routes = loadRoutes();

function known(pathname) {
  const path = normalizePath(pathname);
  if (routes.exact.has(path)) return true;
  return routes.patterns.some((pattern) => pattern.test(path));
}

function localTarget(href, page) {
  if (!href) return null;
  const value = href.trim();
  if (!value || value.startsWith('#') || value.startsWith('?')) return null;
  if (/^(mailto|tel|sms|javascript):/i.test(value)) return null;
  let url;
  try {
    url = new URL(value, `https://bastropia.com${page === '/' ? '/' : page}`);
  } catch {
    return { broken: true, href: value };
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
  const host = url.hostname.replace(/^www\./, '');
  if (host !== 'bastropia.com') return null;
  return { path: normalizePath(url.pathname), href: value };
}

function sitemapCoverage(stories) {
  const files = walk(dist).filter((file) => file.endsWith('.xml') || file.endsWith('sitemap.xml'));
  const locs = [];
  for (const file of files) {
    const text = readFileSync(file, 'utf8');
    if (!text.includes('<loc>')) continue;
    for (const match of text.matchAll(/<loc>([^<]+)<\/loc>/g)) locs.push(decode(match[1]));
  }
  if (locs.length) {
    const have = new Set(locs.map((loc) => normalizePath(new URL(loc, 'https://bastropia.com').pathname)));
    for (const story of stories) {
      if (!have.has(story.path)) failures.push(`${story.path} is missing from sitemap.xml`);
    }
    return `sitemap.xml in the build lists ${locs.length} URLs`;
  }
  const sourcePath = join(root, 'src/pages/sitemap.xml.ts');
  const source = existsSync(sourcePath) ? readFileSync(sourcePath, 'utf8') : '';
  if (!source.includes("getCollection('news')") || !source.includes('/news/${story.id}') || !source.includes('...news.map(')) {
    failures.push('sitemap.xml is not in the build, and the sitemap route does not map every news story');
    return 'sitemap route is missing the news map';
  }
  for (const story of stories) {
    const id = story.path.split('/').pop();
    const markdown = existsSync(join(root, 'src/content/news', `${id}.md`));
    const mdx = existsSync(join(root, 'src/content/news', `${id}.mdx`));
    if (!markdown && !mdx) {
      failures.push(`${story.path} is not in sitemap.xml because it has no news content file`);
    }
  }
  return 'sitemap.xml is rendered by the worker; the route maps every news file and each built story has one';
}

function checkPage(file, html) {
  const path = pagePath(file);
  const meta = metas(html);
  const robots = metaContent(meta, 'robots');
  if (/\bnoindex\b/i.test(robots)) return null;
  const title = decode(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? '');
  const description = metaContent(meta, 'description');
  const canonical = html.match(/<link[^>]*rel=["']canonical["'][^>]*>/i)?.[0]?.match(/href=["']([^"']+)["']/i)?.[1] ?? '';
  const image = metaContent(meta, 'og:image');
  const h1s = [...html.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/gi)];
  if (!title) failures.push(`${path} is missing a title`);
  else if (title.length > 65) warnings.push(`${path} title is ${title.length} characters: ${title}`);
  if (!description) failures.push(`${path} is missing a meta description`);
  else if (description.length < 50 || description.length > 160) {
    warnings.push(`${path} description is ${description.length} characters (want 50–160)`);
  }
  if (!canonical) failures.push(`${path} is missing a canonical`);
  if (!image) failures.push(`${path} is missing og:image`);
  if (!h1s.length) failures.push(`${path} is missing an h1`);
  else if (h1s.length > 1) warnings.push(`${path} has ${h1s.length} h1 elements`);

  const main = html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i)?.[1] ?? '';
  for (const tag of main.matchAll(/<img\b[^>]*>/gi)) {
    const chunk = tag[0];
    const quoted = chunk.match(/\balt\s*=\s*(["'])([\s\S]*?)\1/i);
    const present = Boolean(quoted) || /\balt(?=\s|\/|>)/i.test(chunk);
    if (!present) failures.push(`${path} has a content image with no alt attribute`);
  }

  for (const tag of html.matchAll(/<a\b[^>]*href=(["'])([\s\S]*?)\1/gi)) {
    const target = localTarget(tag[2], path);
    if (!target) continue;
    if (target.broken || !known(target.path)) failures.push(`${path} links to ${target.href}, which is not a page or file`);
  }

  if (/^\/news\/[^/]+$/.test(path)) {
    const nodes = jsonNodes(html);
    if (nodes.includes(null)) failures.push(`${path} has NewsArticle JSON-LD that did not parse`);
    const article = nodes.find((node) => node && typesOf(node).includes('NewsArticle'));
    if (!article) failures.push(`${path} is missing NewsArticle JSON-LD`);
    else {
      if (!String(article.headline ?? '').trim()) failures.push(`${path} NewsArticle is missing headline`);
      if (!String(article.datePublished ?? '').trim()) failures.push(`${path} NewsArticle is missing datePublished`);
      if (!hasParty(article.author)) failures.push(`${path} NewsArticle is missing author`);
      if (!hasParty(article.publisher)) failures.push(`${path} NewsArticle is missing publisher`);
      const showsPhoto = /class=["'][^"']*story-photo|class=["'][^"']*event-photo/.test(main);
      if (!hasImage(article.image) && showsPhoto) failures.push(`${path} shows a photo that is missing from NewsArticle image`);
      else if (!hasImage(article.image)) {
        warnings.push(`${path} has no image. Text-only desk notes omit image instead of inventing one.`);
      }
    }
  }

  return { path, title, description };
}

function duplicates(pages, field) {
  const groups = new Map();
  for (const page of pages) {
    const value = page[field];
    if (!value) continue;
    const list = groups.get(value) ?? [];
    list.push(page.path);
    groups.set(value, list);
  }
  for (const [value, paths] of groups) {
    if (paths.length < 2) continue;
    const line = `${field} “${value.slice(0, 80)}” is on ${paths.join(', ')}`;
    if (paths.every((path) => isListing(path))) warnings.push(`listing pages share a ${line}`);
    else failures.push(`duplicate ${line}`);
  }
}

function printList(label, items) {
  if (!items.length) return;
  console.log(`\n${label}`);
  const shown = items.slice(0, 40);
  for (const item of shown) console.log(`- ${item}`);
  if (items.length > shown.length) console.log(`- ${items.length - shown.length} more`);
}

if (!existsSync(dist)) {
  console.error(`SEO check: ${dist} does not exist. Run npm run build first.`);
  process.exit(1);
}

const htmlFiles = walk(htmlRoot).filter((file) => file.endsWith('.html'));
const pages = [];
let skipped = 0;
for (const file of htmlFiles) {
  const html = readFileSync(file, 'utf8');
  if (!/<html[\s>]/i.test(html)) continue;
  const page = checkPage(file, html);
  if (!page) skipped += 1;
  else pages.push(page);
}
duplicates(pages, 'title');
duplicates(pages, 'description');
const stories = pages.filter((page) => /^\/news\/[^/]+$/.test(page.path));
const sitemapNote = sitemapCoverage(stories);

console.log(`SEO check: ${pages.length} indexable pages, ${skipped} noindex pages skipped, ${stories.length} stories`);
console.log(sitemapNote);
printList('Warnings', warnings);
printList('Failures', failures);
if (failures.length) {
  console.error(`\nSEO check failed: ${failures.length} failure${failures.length === 1 ? '' : 's'}, ${warnings.length} warning${warnings.length === 1 ? '' : 's'}.`);
  process.exit(1);
}
console.log(`\nSEO check passed with ${warnings.length} warning${warnings.length === 1 ? '' : 's'}.`);
