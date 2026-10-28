import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { placementById, tierById, type ListingTierId, type PlacementId } from '../data/commerce';
import { addDays } from './time';
import type { Tier } from '../data/taxonomy';

const intakeDir = path.join(process.cwd(), 'data', 'intake');
const sponsorsFile = path.join(process.cwd(), 'data', 'sponsors.json');
const upgradesFile = path.join(process.cwd(), 'data', 'upgrades.json');

export type IntakeType = 'ad' | 'upgrade' | 'event' | 'newsletter';

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

async function readJson<T>(file: string, fallback: T): Promise<T> {
  try {
    return JSON.parse(await readFile(file, 'utf8')) as T;
  } catch {
    return fallback;
  }
}

export async function saveIntake(record: IntakeRecord) {
  await mkdir(intakeDir, { recursive: true });
  await writeFile(path.join(intakeDir, `${record.id}.json`), JSON.stringify(record, null, 2));
  return record;
}

export async function getIntake(id: string) {
  if (!/^BAS-[A-F0-9]{8}$/.test(id)) return null;
  try {
    return JSON.parse(await readFile(path.join(intakeDir, `${id}.json`), 'utf8')) as IntakeRecord;
  } catch {
    return null;
  }
}

export async function listIntake() {
  try {
    const files = (await readdir(intakeDir)).filter((file) => file.endsWith('.json'));
    const records = await Promise.all(
      files.map(async (file) => JSON.parse(await readFile(path.join(intakeDir, file), 'utf8')) as IntakeRecord),
    );
    return records.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  } catch {
    return [];
  }
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
  if (type !== 'ad' && type !== 'upgrade' && type !== 'event' && type !== 'newsletter') {
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

  if (type === 'ad') {
    if (input.terms !== 'yes') return { ok: false as const, error: 'terms' };
    const placement = placementById(clean(input.placement, 40));
    if (!placement) return { ok: false as const, error: 'placement' };
    const weeks = Math.min(12, Math.max(1, Number(input.weeks) || 0));
    if (!weeks) return { ok: false as const, error: 'weeks' };
    const start = clean(input.start, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(start)) return { ok: false as const, error: 'date' };
    const business = clean(input.business, 80);
    const line = clean(input.line, 90);
    const href = httpUrl(clean(input.website, 300));
    if (!business || !line || !href) return { ok: false as const, error: 'details' };
    total = placement.weeklyRate * weeks;
    Object.assign(fields, {
      placement: placement.id,
      placementName: placement.name,
      weeks: String(weeks),
      start,
      until: addDays(start, weeks * 7),
      business,
      line,
      website: href,
      phone: clean(input.phone, 30),
      contact: clean(input.contact, 80),
      notes: clean(input.notes, 1200),
    });
    summary = `${placement.name} for ${weeks} week${weeks === 1 ? '' : 's'}, starting ${start}`;
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
  const sponsors = await readJson<Sponsor[]>(sponsorsFile, []);
  return sponsors.filter((item) => item.until);
}

export async function activeSponsors(todayKey: string) {
  return (await readSponsors()).filter((item) => item.until >= todayKey);
}

export async function activeSponsor(placement: string, todayKey: string) {
  return (await activeSponsors(todayKey)).find((item) => item.placement === placement) ?? null;
}

export async function placeSponsor(sponsor: Sponsor) {
  const sponsors = (await readSponsors()).filter((item) => item.orderId !== sponsor.orderId);
  sponsors.push(sponsor);
  await writeFile(sponsorsFile, JSON.stringify(sponsors, null, 2));
}

export async function readUpgrades() {
  return readJson<Upgrade[]>(upgradesFile, []);
}

export async function activeUpgrades(todayKey: string) {
  return (await readUpgrades()).filter((item) => item.until >= todayKey);
}

export function resolveTier(eventId: string, fallback: Tier, upgrades: Upgrade[]): Tier {
  const match = upgrades.find((item) => item.eventId === eventId);
  return match?.tier ?? fallback;
}

export async function placeUpgrade(upgrade: Upgrade) {
  const upgrades = (await readUpgrades()).filter((item) => item.orderId !== upgrade.orderId);
  upgrades.push(upgrade);
  await writeFile(upgradesFile, JSON.stringify(upgrades, null, 2));
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
