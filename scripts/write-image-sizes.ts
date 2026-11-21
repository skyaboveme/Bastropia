import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { parseSize } from '../src/lib/imageSize.ts';

const root = process.cwd();
const publicDir = join(root, 'public');
const sizes: Record<string, { width: number; height: number }> = {};

function walk(dir: string) {
  for (const name of readdirSync(dir)) {
    const file = join(dir, name);
    if (statSync(file).isDirectory()) {
      walk(file);
      continue;
    }
    if (!/\.(jpe?g|png|webp|gif)$/i.test(name)) continue;
    const size = parseSize(readFileSync(file));
    if (!size) continue;
    const path = `/${relative(publicDir, file).split('\\').join('/')}`;
    sizes[path] = size;
  }
}

walk(join(publicDir, 'images'));
const brand = join(publicDir, 'brand');
if (existsSync(brand)) walk(brand);

const ordered = Object.fromEntries(Object.entries(sizes).sort(([a], [b]) => a.localeCompare(b)));
writeFileSync(join(root, 'src/data/imageSizes.json'), `${JSON.stringify(ordered, null, 2)}\n`);
console.log(`Wrote ${Object.keys(ordered).length} image sizes`);
