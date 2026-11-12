import { alertTopics } from '../data/alerts';
import { placementById, tierById, type ListingTierId, type PlacementId } from '../data/commerce';
import { sessionKv } from './sessionKv';
import { addDays, addMonths } from './time';
import type { Tier } from '../data/taxonomy';

const sponsorsKey = 'desk:sponsors';
const upgradesKey = 'desk:upgrades';

export type IntakeType = 'ad' | 'upgrade' | 'event' | 'newsletter' | 'alert' | 'tip' | 'business';

export type IntakeRecord = {
  id: string;
  type: IntakeType;
  createdAt: string;
  status: 'pending' | 'scheduled' | 'declined';
  total: number;
  summary: string;
  fields: Record<string, string>;
};

export type Sponsor = {
  orderId: string;
  placement: PlacementId;
  name: string;
  line: string;
  href: string;
  until: string;
};

export type Upgrade = {
  orderId: string;
  eventId: string;
  tier: Exclude<Tier, 'community'>;
  until: string;
};

function clean(value: unknown, max = 400) {
  return String(value ?? '')
    .replace(/<[^>]*>/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max);
}

function emailOk(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function httpUrl(value: string) {
  try {
    const url = new URL(value);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return '';
    return url.toString();
  } catch {
    return '';
  }
}

function isIntake(value: unknown): value is IntakeRecord {
  if (!value || typeof value !== 'object') return false;
  const item = value as IntakeRecord;
  return typeof item.id === 'string' && typeof item.type === 'string' && typeof item.createdAt === 'string';
}

function isSponsor(value: unknown): value is Sponsor {
  if (!value || typeof value !== 'object') return false;
  const item = value as Sponsor;
  return typeof item.orderId === 'string' && typeof item.until === 'string' && typeof item.placement === 'string';
}

function isUpgrade(value: unknown): value is Upgrade {
  if (!value || typeof value !== 'object') return false;
  const item = value as Upgrade;
  return typeof item.orderId === 'string' && typeof item.eventId === 'string' && typeof item.until === 'string';
}

export async function tagAlert(fields: Record<string, string>) {
  const key = process.env.KIT_API_SECRET;
  const email = fields.email;
  if (!key || !email) return;
  const ids = new Set(
    (fields.tagIds ?? '')
      .split(',')
      .map((item) => Number(item))
      .filter((item) => item > 0),
  );
  if (fields.road) ids.add(25416044);
  await Promise.all(
    [...ids].map((id) =>
      fetch(`https://api.kit.com/v4/tags/${id}/subscribers`, {
        method: 'POST',
        headers: { authorization: `Bearer ${key}`, 'content-type': 'application/json', accept: 'application/json' },
        body: JSON.stringify({ email_address: email }),
      }).catch(() => undefined),
    ),
  );
}

export async function saveIntake(record: IntakeRecord) {
  const kv = sessionKv();
  if (!kv) throw new Error('intake store unavailable');
  await kv.put(`intake:${record.id}`, JSON.stringify(record));
  return record;
}

export async function getIntake(id: string) {
  if (!/^BAS-[A-F0-9]{8}$/.test(id)) return null;
  const kv = sessionKv();
  if (!kv) return null;
  const value = await kv.get(`intake:${id}`, 'json');
  return isIntake(value) ? value : null;
}

export async function listIntake() {
  const kv = sessionKv();
  if (!kv) return [];
  const records: IntakeRecord[] = [];
  let cursor: string | undefined;
  do {
    const listed = await kv.list({ prefix: 'intake:', cursor });
    const rows = await Promise.all(listed.keys.map(async (key) => kv.get(key.name, 'json')));
    for (const row of rows) {
      if (isIntake(row)) records.push(row);
    }
    cursor = listed.list_complete === false ? listed.cursor : undefined;
  } while (cursor);
  return records.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function updateIntakeStatus(id: string, status: IntakeRecord['status']) {
  const record = await getIntake(id);
  if (!record) return null;
  record.status = status;
  await saveIntake(record);
  return record;
}

export function buildRecord(input: Record<string, string>, id: string, now = new Date()) {
  const type = input.type;
  const email = clean(input.email, 160).toLowerCase();
  if (
    type !== 'ad' &&
    type !== 'upgrade' &&
    type !== 'event' &&
    type !== 'newsletter' &&
    type !== 'alert' &&
    type !== 'business'
  ) {
    return { ok: false as const, error: 'form' };
  }
  if (!emailOk(email)) return { ok: false as const, error: 'email' };

  const fields: Record<string, string> = { email };
  let total = 0;
  let summary = '';

  if (type === 'newsletter') {
    const cadence = input.cadence === 'daily' ? 'daily' : 'weekly';
    fields.cadence = cadence;
    summary = `${cadence} newsletter for ${email}`;
  }

  if (type === 'alert') {
    const picked = alertTopics.filter((topic) => input[`topic_${topic.id}`] === 'yes');
    const road = clean(input.road, 40);
    if (!picked.length && !road) return { ok: false as const, error: 'topics' };
    const phone = clean(input.phone, 30);
    const digits = phone.replace(/\D/g, '');
    if (phone && digits.length < 10) return { ok: false as const, error: 'phone' };
    fields.topics = picked.map((topic) => topic.label).join(', ');
    fields.topicIds = picked.map((topic) => topic.id).join(',');
    fields.tagIds = picked.map((topic) => String(topic.tagId)).join(',');
    if (road) fields.road = road;
    if (phone) fields.phone = phone;
    const names = [...picked.map((topic) => topic.label), road].filter(Boolean);
    summary = `Alert for ${names.join(', ')} — ${email}`;
  }

  if (type === 'ad') {
    if (input.terms !== 'yes') return { ok: false as const, error: 'terms' };
    const placement = placementById(clean(input.placement, 40));
    if (!placement) return { ok: false as const, error: 'placement' };
    const count = Math.min(12, Math.max(1, Number(input.count) || 0));
    if (!count) return { ok: false as const, error: 'count' };
    const start = clean(input.start, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(start)) return { ok: false as const, error: 'date' };
    const business = clean(input.business, 80);
    const line = clean(input.line, 90);
    const href = httpUrl(clean(input.website, 300));
    if (!business || !line || !href) return { ok: false as const, error: 'details' };
    const unit = placement.unit;
    const unitLabel = count === 1 ? unit : `${unit}s`;
    total = placement.rate * count;
    Object.assign(fields, {
      placement: placement.id,
      placementName: placement.name,
      count: String(count),
      unit,
      start,
      until: unit === 'month' ? addMonths(start, count) : addDays(start, count * 7),
      business,
      line,
      website: href,
      phone: clean(input.phone, 30),
      contact: clean(input.contact, 80),
      notes: clean(input.notes, 1200),
    });
    summary = `${placement.name} for ${count} ${unitLabel}, starting ${start}`;
  }

  if (type === 'upgrade') {
    if (input.terms !== 'yes') return { ok: false as const, error: 'terms' };
    const tier = tierById(clean(input.tier, 40));
    if (!tier || tier.id === 'community') return { ok: false as const, error: 'tier' };
    const rawEvent = clean(input.eventId, 220);
    const [eventId, eventTitle = ''] = rawEvent.split('::');
    if (!eventId) return { ok: false as const, error: 'event' };
    const listingName = clean(eventTitle, 120) || eventId;
    total = tier.price;
    Object.assign(fields, {
      tier: tier.id,
      tierName: tier.name,
      eventId,
      eventTitle: listingName,
      days: String(tier.days),
      phone: clean(input.phone, 30),
      contact: clean(input.contact, 80),
      notes: clean(input.notes, 1200),
    });
    summary = `${tier.name} upgrade for ${listingName}`;
  }

  if (type === 'event') {
    const title = clean(input.title, 120);
    const date = clean(input.date, 10);
    const venue = clean(input.venue, 120);
    const details = clean(input.details, 1500);
    if (!title || !/^\d{4}-\d{2}-\d{2}$/.test(date) || !venue || details.length < 20) {
      return { ok: false as const, error: 'details' };
    }
    Object.assign(fields, {
      title,
      date,
      startTime: clean(input.startTime, 8),
      endTime: clean(input.endTime, 8),
      allDay: input.allDay === 'yes' ? 'yes' : 'no',
      city: clean(input.city, 40),
      venue,
      address: clean(input.address, 160),
      category: clean(input.category, 40),
      cost: clean(input.cost, 40) || 'See details',
      organizer: clean(input.organizer, 80),
      website: httpUrl(clean(input.website, 300)),
      streamUrl: httpUrl(clean(input.streamUrl, 300)),
      details,
      contact: clean(input.contact, 80),
      phone: clean(input.phone, 30),
    });
    summary = `${title} on ${date} in ${fields.city || 'Bastrop County'}`;
  }

  if (type === 'business') {
    const business = clean(input.business, 100);
    const category = clean(input.category, 60);
    const city = clean(input.city, 40);
    const phone = clean(input.phone, 30);
    const contact = clean(input.contact, 80);
    const details = clean(input.details, 1200);
    const digits = phone.replace(/\D/g, '');
    if (!business || !category || !city || digits.length < 10 || !contact || details.length < 20) {
      return { ok: false as const, error: 'details' };
    }
    Object.assign(fields, {
      business,
      category,
      city,
      areas: clean(input.areas, 200),
      phone,
      website: httpUrl(clean(input.website, 300)),
      address: clean(input.address, 160),
      details,
      contact,
    });
    summary = `${business} (${category}) in ${city}`;
  }

  const record: IntakeRecord = {
    id,
    type,
    createdAt: now.toISOString(),
    status: 'pending',
    total,
    summary,
    fields,
  };
  return { ok: true as const, record };
}

export async function readSponsors() {
  const kv = sessionKv();
  if (!kv) return [];
  const value = await kv.get(sponsorsKey, 'json');
  return Array.isArray(value) ? value.filter(isSponsor).filter((item) => item.until) : [];
}

export async function activeSponsors(todayKey: string) {
  return (await readSponsors()).filter((item) => item.until >= todayKey);
}

export async function activeSponsor(placement: string, todayKey: string) {
  return (await activeSponsors(todayKey)).find((item) => item.placement === placement) ?? null;
}

export async function placeSponsor(sponsor: Sponsor) {
  const kv = sessionKv();
  if (!kv) throw new Error('sponsor store unavailable');
  const sponsors = (await readSponsors()).filter((item) => item.orderId !== sponsor.orderId);
  sponsors.push(sponsor);
  await kv.put(sponsorsKey, JSON.stringify(sponsors));
}

export async function readUpgrades() {
  const kv = sessionKv();
  if (!kv) return [];
  const value = await kv.get(upgradesKey, 'json');
  return Array.isArray(value) ? value.filter(isUpgrade) : [];
}

export async function activeUpgrades(todayKey: string) {
  return (await readUpgrades()).filter((item) => item.until >= todayKey);
}

export function resolveTier(eventId: string, fallback: Tier, upgrades: Upgrade[]): Tier {
  const match = upgrades.find((item) => item.eventId === eventId);
  return match?.tier ?? fallback;
}

export async function placeUpgrade(upgrade: Upgrade) {
  const kv = sessionKv();
  if (!kv) throw new Error('upgrade store unavailable');
  const upgrades = (await readUpgrades()).filter((item) => item.orderId !== upgrade.orderId);
  upgrades.push(upgrade);
  await kv.put(upgradesKey, JSON.stringify(upgrades));
}

export function eventMarkdown(fields: Record<string, string>) {
  const schedule = fields.allDay === 'yes' ? 'all-day' : 'timed';
  const start = fields.startTime ? `${fields.date}T${fields.startTime}:00-06:00` : `${fields.date}T12:00:00-06:00`;
  const end = fields.endTime ? `${fields.date}T${fields.endTime}:00-06:00` : '';
  return `---
title: ${JSON.stringify(fields.title)}
summary: ${JSON.stringify(fields.details.slice(0, 180))}
start: ${JSON.stringify(start)}
${end ? `end: ${JSON.stringify(end)}\n` : ''}schedule: ${schedule}
city: ${JSON.stringify(fields.city || 'Bastrop')}
venue: ${JSON.stringify(fields.venue)}
${fields.address ? `address: ${JSON.stringify(fields.address)}\n` : ''}category: ${fields.category || 'community'}
cost: ${JSON.stringify(fields.cost || 'See details')}
tier: community
${fields.organizer ? `organizer: ${JSON.stringify(fields.organizer)}\n` : ''}${fields.website ? `sourceUrl: ${JSON.stringify(fields.website)}\n` : ''}${fields.streamUrl ? `streamUrl: ${JSON.stringify(fields.streamUrl)}\n` : ''}---

${fields.details}
`;
}

export function paidTier(value: string): Upgrade['tier'] | null {
  if (value === 'spotlight' || value === 'featured' || value === 'lost-pines') return value;
  return null;
}

export function placementId(value: string): PlacementId | null {
  return placementById(value)?.id ?? null;
}

export function listingTier(value: string): ListingTierId | null {
  return tierById(value)?.id ?? null;
}
