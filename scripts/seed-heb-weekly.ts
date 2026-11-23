/**
 * Fetch the Bastrop H-E-B circular and write JSON for `wrangler kv key put`.
 * A failed read does not replace the KV copy. The daily cron is the steady refresh.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { collectHebWeekly } from '../src/lib/hebWeekly.ts';

const out = process.env.HEB_WEEKLY_OUT || 'tmp/heb-weekly.json';
const fresh = await collectHebWeekly();
if (!fresh?.items.length) {
  console.error('heb weekly seed failed, KV unchanged');
  process.exit(1);
}
const record = { ...fresh, fetchedAt: new Date().toISOString() };
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, JSON.stringify(record));
console.log(`heb weekly seed: store ${record.storeCode}, flyer ${record.flyerId}, ${record.items.length} items, ${record.validFrom} to ${record.validTo}`);
