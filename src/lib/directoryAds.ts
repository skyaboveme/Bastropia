import {
  directoryAdLimits,
  directoryAdSlots,
  directoryFeatured,
  directoryFounding,
  directoryProducts,
  type DirectoryAdSlot,
  type DirectoryProduct,
} from '../data/directoryAds.ts';
import { groupLabel } from './directoryGroups.ts';
import { money } from './format.ts';
import { eventKey } from './time.ts';

export type DirectoryAdContext = {
  town?: string;
  category?: string;
};

export type DirectoryPromo = {
  id: string;
  placement: 'directory-featured' | 'directory-spotlight' | 'directory-infeed';
  label: 'Sponsored' | 'Partner' | 'Advertise';
  title: string;
  line: string;
  href: string;
  logo: string;
  cta: string;
};

export type DirectoryFeedItem<T> = { kind: 'card'; card: T } | { kind: 'ad'; ad: DirectoryPromo };

const dateOk = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value);

export function directoryToday(now = new Date()) {
  return eventKey(now);
}

export function directoryProductById(id: string) {
  return directoryProducts.find((item) => item.id === id);
}

export function directoryProductByPlacement(placement: string) {
  return directoryProducts.find((item) => item.placement && item.placement === placement);
}

export function directoryInquireHref(productId = '', business = '') {
  const params = new URLSearchParams();
  const product = directoryProductById(productId);
  if (product?.placement) params.set('product', product.id);
  const name = business.trim();
  if (name) params.set('business', name);
  const query = params.toString();
  return `/advertise${query ? `?${query}` : ''}#directory`;
}

export function directoryFoundingNote(product: DirectoryProduct) {
  if (product.foundingPrice == null) return '';
  return `Founding offer: ${money(product.foundingPrice)}/mo for the first ${directoryFounding.slots} businesses, locked ${directoryFounding.months} months.`;
}

/** Stable id for /api/ad-stat. */
export function directoryTrackId(id: string) {
  const raw = id.trim();
  if (/^biz[a-z0-9]+$/i.test(raw)) return raw.toLowerCase();
  const body = raw.replace(/^partner:/i, 'partner-');
  return body
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
}

export function listingIsFeatured(
  entry: { id: string; name: string; href: string; tier?: string },
  today = directoryToday(),
  overrides: { match: string; start: string; end: string }[] = directoryFeatured,
) {
  if (entry.tier === 'featured') return true;
  const slug = entry.href.replace(/^\//, '').toLowerCase();
  const name = entry.name.toLowerCase();
  const id = entry.id.toLowerCase();
  return overrides.some((item) => {
    if (!dateOk(item.start) || !dateOk(item.end) || item.start > today || today > item.end) return false;
    const match = item.match.trim().toLowerCase();
    return match === id || match === slug || match === name || id === `partner:${match}`;
  });
}

/** Day-based rotation so each advertiser leads equally often. */
export function rotateFair<T>(items: T[], isoDate: string, max: number) {
  if (!items.length || max <= 0) return [];
  const [year, month, day] = isoDate.split('-').map(Number);
  const index = Number.isFinite(year) ? Math.floor(Date.UTC(year, (month || 1) - 1, day || 1) / 86400000) : 0;
  const start = index % items.length;
  const rotated = items.slice(start).concat(items.slice(0, start));
  return rotated.slice(0, max);
}

export function pinDirectoryFeatured<T extends { r?: number; b?: string }>(
  rows: T[],
  today: string,
  max = directoryAdLimits.featuredPerResults,
) {
  const featured = rows.filter((row) => row.b === 'Featured' || row.r === 0);
  if (!featured.length) return rows;
  const pinned = rotateFair(featured, today, max);
  const pinnedSet = new Set<T>(pinned);
  return [...pinned, ...rows.filter((row) => !pinnedSet.has(row))];
}

function townOf(ctx: DirectoryAdContext) {
  return ctx.town && ctx.town !== 'Countywide' ? ctx.town : '';
}

function specificity(slot: DirectoryAdSlot, ctx: DirectoryAdContext) {
  const town = townOf(ctx);
  const category = ctx.category || '';
  if (slot.towns?.length && !slot.towns.includes(town)) return 0;
  if (slot.categories?.length && !slot.categories.includes(category)) return 0;
  return 1 + (slot.towns?.length ? 2 : 0) + (slot.categories?.length ? 1 : 0);
}

export function pickDirectorySlot(
  kind: DirectoryAdSlot['kind'],
  ctx: DirectoryAdContext,
  today: string,
  slots: DirectoryAdSlot[] = directoryAdSlots,
) {
  const matched = slots.filter((slot) => {
    if (slot.kind !== kind) return false;
    if (!dateOk(slot.start) || !dateOk(slot.end) || slot.start > today || today > slot.end) return false;
    return specificity(slot, ctx) > 0;
  });
  if (!matched.length) return null;
  const best = Math.max(...matched.map((slot) => specificity(slot, ctx)));
  const top = matched.filter((slot) => specificity(slot, ctx) === best);
  return rotateFair(top, today, 1)[0] ?? null;
}

export function promoFromSlot(slot: DirectoryAdSlot): DirectoryPromo {
  return {
    id: directoryTrackId(slot.id),
    placement: slot.kind === 'spotlight' ? 'directory-spotlight' : 'directory-infeed',
    label: slot.label || 'Sponsored',
    title: slot.line,
    line: `sponsored by ${slot.name}`,
    href: slot.businessId ? `/go/biz/${slot.businessId}?to=site` : slot.href,
    logo: slot.logo || '',
    cta: 'Visit',
  };
}

export function houseDirectoryPromo(kind: 'featured' | 'spotlight' | 'infeed', ctx: DirectoryAdContext): DirectoryPromo {
  const place = townOf(ctx) ? ` in ${townOf(ctx)}` : '';
  const group = ctx.category ? groupLabel(ctx.category) : '';
  if (kind === 'spotlight') {
    const price = directoryProductById('spotlight');
    return {
      id: 'house-spotlight',
      placement: 'directory-spotlight',
      label: 'Advertise',
      title: group ? `${group}${place}` : `Local businesses${place}`,
      line: `Your business here · Spotlight ${money(price?.price || 0)}/mo`,
      href: directoryInquireHref('spotlight'),
      logo: '',
      cta: 'Advertise',
    };
  }
  if (kind === 'featured') {
    const price = directoryProductById('featured');
    return {
      id: 'house-featured',
      placement: 'directory-featured',
      label: 'Advertise',
      title: 'Your business here',
      line: `Get Featured · ${money(price?.price || 0)}/mo`,
      href: directoryInquireHref('featured'),
      logo: '',
      cta: 'Get Featured',
    };
  }
  return {
    id: 'house-infeed',
    placement: 'directory-infeed',
    label: 'Advertise',
    title: 'Advertise on Bastropia',
    line: 'Featured listings, a Spotlight, or a partner page',
    href: directoryInquireHref(),
    logo: '',
    cta: 'See rates',
  };
}

/** A paying spotlight tile, or nothing. House placeholders stay in the result list. */
export function resolveDirectorySpotlight(ctx: DirectoryAdContext, today: string, slots?: DirectoryAdSlot[]) {
  const slot = pickDirectorySlot('spotlight', ctx, today, slots);
  return slot ? promoFromSlot(slot) : null;
}

export function composeDirectoryFeed<T extends { badges: string[] }>(
  cards: T[],
  ctx: DirectoryAdContext,
  today: string,
  slots?: DirectoryAdSlot[],
): DirectoryFeedItem<T>[] {
  const houses: DirectoryPromo[] = [];
  if (!pickDirectorySlot('spotlight', ctx, today, slots)) houses.push(houseDirectoryPromo('spotlight', ctx));
  if (cards.length && !cards.some((card) => card.badges.includes('Featured'))) houses.push(houseDirectoryPromo('featured', ctx));
  const slot = pickDirectorySlot('infeed', ctx, today, slots);
  const infeed = slot ? promoFromSlot(slot) : houseDirectoryPromo('infeed', ctx);
  const items: DirectoryFeedItem<T>[] = [];
  let organic = 0;
  let placed = false;
  const placeHouses = () => {
    if (placed || !houses.length) return;
    placed = true;
    for (const ad of houses) items.push({ kind: 'ad', ad });
  };
  for (const card of cards) {
    items.push({ kind: 'card', card });
    organic += 1;
    if (organic === directoryAdLimits.houseAfter) placeHouses();
    if (organic % directoryAdLimits.infeedEvery === 0) items.push({ kind: 'ad', ad: infeed });
  }
  if (organic > 0 && organic < directoryAdLimits.houseAfter) placeHouses();
  if (organic > 0 && organic < directoryAdLimits.infeedEvery) items.push({ kind: 'ad', ad: infeed });
  return items;
}
