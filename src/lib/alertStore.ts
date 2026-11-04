import { env } from 'cloudflare:workers';

type AlertKv = {
  put: (key: string, value: string) => Promise<unknown>;
  get: (key: string) => Promise<string | null>;
  list: (options?: { prefix?: string }) => Promise<{ keys: { name: string }[] }>;
};

export type AlertSubscription = {
  email: string;
  phone: string;
  topic: string;
  road: string;
  at: string;
};

function kvFrom(): AlertKv | undefined {
  return (env as { SESSION?: AlertKv }).SESSION;
}

export async function saveAlertSubscriptions(fields: Record<string, string>) {
  const kv = kvFrom();
  if (!kv) return false;
  const email = fields.email;
  if (!email) return false;
  const at = new Date().toISOString();
  const phone = fields.phone ?? '';
  const topics = (fields.topicIds ?? '').split(',').filter(Boolean);
  const writes: Promise<unknown>[] = topics.map((topic) =>
    kv.put(
      `alert:${topic}:${encodeURIComponent(email)}`,
      JSON.stringify({ email, phone, topic, road: '', at } satisfies AlertSubscription),
    ),
  );
  if (fields.road) {
    writes.push(
      kv.put(
        `alert:road:${encodeURIComponent(fields.road.toLowerCase())}:${encodeURIComponent(email)}`,
        JSON.stringify({ email, phone, topic: 'road', road: fields.road, at } satisfies AlertSubscription),
      ),
    );
  }
  if (!writes.length) return false;
  await Promise.all(writes);
  return true;
}

export async function listAlertSubscriptions(): Promise<AlertSubscription[]> {
  const kv = kvFrom();
  if (!kv) return [];
  const listed = await kv.list({ prefix: 'alert:' });
  const rows = await Promise.all(listed.keys.map(async (key) => kv.get(key.name)));
  return rows
    .filter((row): row is string => Boolean(row))
    .map((row) => JSON.parse(row) as AlertSubscription)
    .sort((a, b) => b.at.localeCompare(a.at));
}
