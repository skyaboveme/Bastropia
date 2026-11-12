import { sessionKv } from './sessionKv';

export type AlertSubscription = {
  email: string;
  phone: string;
  topic: string;
  road: string;
  at: string;
};

function isSubscription(value: unknown): value is AlertSubscription {
  if (!value || typeof value !== 'object') return false;
  const item = value as AlertSubscription;
  return typeof item.email === 'string' && typeof item.topic === 'string';
}

export async function saveAlertSubscriptions(fields: Record<string, string>) {
  const kv = sessionKv();
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
  const kv = sessionKv();
  if (!kv) return [];
  const people: AlertSubscription[] = [];
  let cursor: string | undefined;
  do {
    const listed = await kv.list({ prefix: 'alert:', cursor });
    const rows = await Promise.all(
      listed.keys
        .filter((key) => !key.name.startsWith('alertwatch:'))
        .map(async (key) => {
          try {
            return JSON.parse((await kv.get(key.name)) ?? '') as unknown;
          } catch {
            return null;
          }
        }),
    );
    for (const row of rows) {
      if (isSubscription(row)) people.push(row);
    }
    cursor = listed.list_complete === false ? listed.cursor : undefined;
  } while (cursor);
  return people.sort((a, b) => b.at.localeCompare(a.at));
}
