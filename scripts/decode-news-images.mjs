/**
 * Decode text-safe image payloads into public/.
 *
 * The GitHub file connector used for some Bastropia commits can only write
 * text, not JPEG bytes. Images for those commits live in
 * scripts/image-payloads/ as base64 text and are written into public/ before
 * dev, build, and deploy.
 *
 * If you later commit the real JPEGs under public/, you can remove the
 * matching .b64 payload.
 */
import fs from "node:fs";
import path from "node:path";

const payloadRoot = path.resolve("scripts/image-payloads");
const publicRoot = path.resolve("public");

function walk(dir, files = []) {
  if (!fs.existsSync(dir)) return files;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, files);
    else if (entry.name.endsWith(".b64")) files.push(full);
  }
  return files;
}

const payloads = walk(payloadRoot);
for (const file of payloads) {
  const rel = path.relative(payloadRoot, file).replace(/\.b64$/i, "");
  const out = path.join(publicRoot, rel);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  const text = fs.readFileSync(file, "utf8").replace(/\s+/g, "");
  fs.writeFileSync(out, Buffer.from(text, "base64"));
  console.log(`wrote ${path.relative(process.cwd(), out)}`);
}
