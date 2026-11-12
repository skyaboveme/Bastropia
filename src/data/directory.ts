/**
 * Combined business directory: paid partner landings + Chamber member listings.
 * Chamber data is a snapshot from business.bastropchamber.com.
 */

import chamberRaw from './chamberDirectory.json';
import { businesses, type Business } from './businesses';

export type DirectorySource = 'partner' | 'chamber' | 'listed';

export type DirectoryEntry = {
  id: string;
  name: string;
  category: string;
  place: string;
  town: string | null;
  phone?: string;
  phoneHref?: string;
  website?: string | null;
  href: string;
  summary: string;
  source: DirectorySource;
  partnerSlug?: string;
  areas?: string;
};

type ChamberRecord = {
  name: string;
  phone?: string | null;
  address?: string | null;
  locality?: string | null;
  region?: string | null;
  postalCode?: string | null;
  street?: string | null;
  website?: string | null;
  categories?: string[];
  detailUrl?: string | null;
  summary?: string | null;
};

const directoryTowns = [
  'Bastrop',
  'Elgin',
  'Smithville',
  'Cedar Creek',
  'McDade',
  'Paige',
  'Rosanky',
] as const;

export type DirectoryTown = (typeof directoryTowns)[number];

const localityAliases: Record<string, DirectoryTown> = {
  bastrop: 'Bastrop',
  batsrop: 'Bastrop',
  elgin: 'Elgin',
  smithville: 'Smithville',
  'cedar creek': 'Cedar Creek',
  mcdade: 'McDade',
  paige: 'Paige',
  rosanky: 'Rosanky',
};

function normalizeName(value: string) {
  return value
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function phoneHref(phone?: string | null) {
  if (!phone) return undefined;
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) return `tel:+1${digits}`;
  if (digits.length === 11 && digits.startsWith('1')) return `tel:+${digits}`;
  return undefined;
}

function townFromLocality(locality?: string | null, place?: string | null): string | null {
  const candidates = [locality, place].filter(Boolean) as string[];
  for (const value of candidates) {
    const key = value.toLowerCase().trim();
    if (localityAliases[key]) return localityAliases[key];
    for (const town of directoryTowns) {
      if (key === town.toLowerCase() || key.includes(town.toLowerCase())) return town;
    }
  }
  return null;
}

function partnerPlace(business: Business) {
  return business.place;
}

function partnerTown(business: Business): string | null {
  const fromAddress = townFromLocality(business.address.locality, business.place);
  if (fromAddress) return fromAddress;
  for (const town of directoryTowns) {
    if (business.areas.some((area) => area.toLowerCase() === town.toLowerCase())) return town;
  }
  return null;
}

function partnerEntry(business: Business): DirectoryEntry {
  return {
    id: `partner:${business.slug}`,
    name: business.name,
    category: business.category,
    place: partnerPlace(business),
    town: partnerTown(business),
    phone: business.phone,
    phoneHref: business.phoneHref,
    website: business.website,
    href: `/${business.slug}`,
    summary: business.summary,
    source: 'partner',
    partnerSlug: business.slug,
  };
}

function chamberCategory(record: ChamberRecord) {
  const categories = (record.categories || []).map((item) => item.trim()).filter(Boolean);
  if (categories.length === 0) return 'Chamber member';
  // Prefer a trade over membership labels when both exist.
  const skip = new Set(['friends of the chamber', 'thoughtleader investor', 'investors', 'investor']);
  const trade = categories.find((item) => !skip.has(item.toLowerCase()));
  return trade || categories[0];
}

function chamberPlace(record: ChamberRecord) {
  if (record.address) return record.address;
  const locality = record.locality?.replace(/batsrop/i, 'Bastrop');
  if (locality && record.region && record.postalCode) {
    return `${locality}, ${record.region} ${record.postalCode}`.replace(/\s+/g, ' ').trim();
  }
  if (locality && record.region) return `${locality}, ${record.region}`;
  if (locality) return locality;
  return 'Bastrop County';
}

function chamberEntry(record: ChamberRecord, index: number): DirectoryEntry {
  const locality = record.locality?.replace(/batsrop/i, 'Bastrop') || null;
  const place = chamberPlace({ ...record, locality });
  const town = townFromLocality(locality, place);
  const category = chamberCategory(record);
  const href = record.website || record.detailUrl || 'https://business.bastropchamber.com/list';
  const bits = [category, place, record.phone].filter(Boolean);
  return {
    id: `chamber:${record.detailUrl || normalizeName(record.name) || index}`,
    name: record.name,
    category,
    place,
    town,
    phone: record.phone || undefined,
    phoneHref: phoneHref(record.phone),
    website: record.website,
    href,
    summary: record.summary?.trim() || bits.join(' · '),
    source: 'chamber',
  };
}

const chamberRecords = (chamberRaw as { businesses: ChamberRecord[] }).businesses || [];

const partnerEntries = businesses.map(partnerEntry);
const partnerNames = new Set(partnerEntries.map((entry) => normalizeName(entry.name)));

const chamberEntries = chamberRecords
  .map(chamberEntry)
  .filter((entry) => !partnerNames.has(normalizeName(entry.name)));

/** Partners first, then Chamber members A–Z. */
export const directoryEntries: DirectoryEntry[] = [
  ...partnerEntries,
  ...chamberEntries.sort((a, b) => a.name.localeCompare(b.name)),
];

export function directoryCategories(list = directoryEntries) {
  return [...new Set(list.map((entry) => entry.category))].sort((a, b) => a.localeCompare(b));
}

export function directoryTownOptions(list = directoryEntries): DirectoryTown[] {
  const found = new Set<DirectoryTown>();
  for (const entry of list) {
    for (const town of directoryTowns) {
      if (entryServesTown(entry, town)) found.add(town);
    }
  }
  return directoryTowns.filter((town) => found.has(town));
}

export function entryServesTown(entry: DirectoryEntry, town: string) {
  const needle = town.toLowerCase();
  if (entry.town?.toLowerCase() === needle) return true;
  if (entry.place.toLowerCase().includes(needle)) return true;
  if (entry.source === 'listed') {
    const blob = `${entry.town ?? ''} ${entry.place} ${entry.areas ?? ''}`.toLowerCase();
    return blob.includes(needle);
  }
  if (entry.source === 'partner' && entry.partnerSlug) {
    const business = businesses.find((item) => item.slug === entry.partnerSlug);
    if (!business) return false;
    return business.areas.some((area) => {
      const value = area.toLowerCase();
      return value === needle || value.includes(`${needle} county`) || value === `${needle} county`;
    });
  }
  return false;
}

export function filterDirectory(
  query: {
    category?: string | null;
    town?: string | null;
    q?: string | null;
  },
  entries = directoryEntries,
) {
  const needle = query.q?.trim().toLowerCase();
  return entries.filter((entry) => {
    if (query.category && entry.category !== query.category) return false;
    if (query.town && !entryServesTown(entry, query.town)) return false;
    if (needle) {
      const hay = `${entry.name} ${entry.category} ${entry.place} ${entry.summary}`.toLowerCase();
      if (!hay.includes(needle)) return false;
    }
    return true;
  });
}

export function directoryByCategory(list = directoryEntries) {
  const groups = new Map<string, DirectoryEntry[]>();
  for (const entry of list) {
    const bucket = groups.get(entry.category) ?? [];
    bucket.push(entry);
    groups.set(entry.category, bucket);
  }
  return [...groups.entries()].sort(([a], [b]) => a.localeCompare(b));
}

export function directoryByTown(list = directoryEntries) {
  return directoryTownOptions(list)
    .map((town) => ({
      town,
      businesses: list.filter((entry) => entryServesTown(entry, town)),
    }))
    .filter((group) => group.businesses.length > 0);
}
