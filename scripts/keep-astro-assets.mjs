/**
 * Copy the live site's hashed /_astro files into this build before deploy.
 * Cached HTML can still point at the previous hash for a few minutes.
 * A failed fetch does not fail the deploy.
 */
import { mkdir, writeFile, access } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const origin = process.env.KEEP_ASSETS_ORIGIN || 'https://bastropia.com';
const pages = (process.env.KEEP_ASSETS_PAGES || '/,/directory,/directory/submit,/news,/BarronHomes').split(',').map((item) => item.trim()).filter(Boolean);
const dist = process.env.KEEP_ASSETS_DIST || join(dirname(fileURLToPath(import.meta.url)), '..', 'dist');

async function exists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function assetRoot() {
  if (await exists(join(dist, '_astro'))) return dist;
  if (await exists(join(dist, 'client', '_astro'))) return join(dist, 'client');
  if (await exists(join(dist, 'client'))) return join(dist, 'client');
  return dist;
}

const root = await assetRoot();
const seen = new Set();
let kept = 0;
for (const page of pages) {
  let html = '';
  try {
    const response = await fetch(new URL(page, origin), {
      headers: { 'user-agent': 'Mozilla/5.0', 'cache-control': 'no-cache' },
    });
    if (!response.ok) {
      console.log(`keep-astro-assets: ${page} returned ${response.status}`);
      continue;
    }
    html = await response.text();
  } catch (error) {
    console.log(`keep-astro-assets: could not read ${page} (${error instanceof Error ? error.message : error})`);
    continue;
  }
  const paths = html.match(/\/_astro\/[A-Za-z0-9._-]+\.(?:css|js|mjs|woff2)/g) || html.match(/\/_astro\/[A-Za-z0-9._-]+/g) || [];
  const styles = paths.filter((assetPath) => assetPath.endsWith('.css'));
  const scripts = paths.filter((assetPath) => assetPath.endsWith('.js'));
  if (styles.length || scripts.length) console.log(`keep-astro-assets: ${page} css ${styles.join(' ') || '(none)'} js ${scripts.join(' ') || '(none)'}`);
  for (const assetPath of paths) {
    if (seen.has(assetPath)) continue;
    seen.add(assetPath);
    const dest = join(root, assetPath);
    if (await exists(dest)) continue;
    try {
      const file = await fetch(new URL(assetPath, origin), {
        headers: { 'user-agent': 'Mozilla/5.0', 'cache-control': 'no-cache' },
      });
      if (!file.ok) {
        console.log(`keep-astro-assets: skip ${assetPath} (${file.status})`);
        continue;
      }
      const bytes = Buffer.from(await file.arrayBuffer());
      if (bytes.length < 16) continue;
      await mkdir(dirname(dest), { recursive: true });
      await writeFile(dest, bytes);
      kept += 1;
      console.log(`keep-astro-assets: kept ${assetPath} (${bytes.length} bytes)`);
    } catch (error) {
      console.log(`keep-astro-assets: skip ${assetPath} (${error instanceof Error ? error.message : error})`);
    }
  }
}
console.log(`keep-astro-assets: ${kept} previous file${kept === 1 ? '' : 's'} merged into ${root}`);
