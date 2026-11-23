import type { DirectoryEntry } from '../data/directory.ts';
import advertiserFile from '../data/advertiserKeywords.json' with { type: 'json' };
import { categoryIcon } from '../data/categoryIcons.ts';
import { directoryAdLimits, directoryAdSlots, type DirectoryAdSlot } from '../data/directoryAds.ts';
import { directoryToday, directoryTrackId, listingIsFeatured, pickDirectorySlot, pinDirectoryFeatured, rotateFair, type DirectoryAdContext } from './directoryAds.ts';
import { outboundLabel } from './maps.ts';
import { directoryLabelInfo, categoryMatchesGroup, groupShort, subgroupsForGroup, directoryGridGroups, directoryMoreGroups } from './directoryGroups.ts';
import { directoryOpenPill } from './directoryHours.ts';
import { directoryTownCenter, nearestPlace } from './directoryPlaces.ts';
import {
  compareDirectoryAz,
  directoryMatcher,
  normalizeDirectoryText,
  rankDirectoryRows,
  suggestDirectoryQuery,
  type MatchRow,
  type QueryUnit,
} from './directoryMatch.ts';

export type DirectoryIndexRow = MatchRow & {
  id: string;
  p?: string;
  h: string;
  ph?: string;
  pt?: string;
  w?: string;
  fb?: string;
  maps?: string;
  hr?: string;
  r?: number;
  b?: string;
  /** 1 when the row is a partner page. */
  k?: number;
  su?: string;
  lg?: string;
  lat?: number;
  lng?: number;
  /** Normalized keyword phrases from advertiserKeywords.json. */
  kw?: string[];
  /** Concept ids this advertiser should win. */
  cc?: string[];
  /** Inclusive contract dates. Blank means the pin stays on. */
  ds?: string;
  de?: string;
};

export type CardAction = {
  label: string;
  href: string;
  variant: 'call' | 'line' | 'icon';
  external: boolean;
  aria: string;
  kind: 'phone' | 'maps' | 'site' | 'facebook' | 'details' | 'share';
};

export type DirectoryCard = {
  id: string;
  name: string;
  href: string;
  external: boolean;
  badges: string[];
  blurb: string;
  /** Set on Featured cards so the impression beacon has an id. */
  track: string;
  icon: string;
  logo: string;
  trade: string;
  placeLabel: string;
  noAddress: boolean;
  address: string;
  open: string | null;
  phone: string;
  actions: CardAction[];
  menu: CardAction[];
};

export type DirectoryQueryState = {
  q: string;
  town: string;
  category: string;
  sub: string;
  sort: '' | 'az' | 'near';
  wide: boolean;
};

export type DirectoryView = {
  heading: string;
  live: string;
  range: string;
  mode: 'browse' | 'results';
  input: string;
  town: string;
  category: string;
  categoryLabel: string;
  matches: DirectoryCard[];
  total: number;
  countywide: DirectoryCard[];
  countywideTotal: number;
  /** Town filter matched nothing, so no-address rows are shown instead. */
  fallback: null | { detail: string; seeAll: string };
  empty: null | {
    query: string;
    town: string;
    countyCount: number;
    suggestion: { term: string; count: number } | null;
    groups: { id: string; label: string; icon: string }[];
  };
};

const PAGE = 24;

type AdvertiserRecord = {
  id: string;
  start?: string;
  end?: string;
  concepts?: string[];
  keywords?: string[];
  serves?: string[];
};

const advertiserById = new Map(
  ((advertiserFile as { advertisers?: AdvertiserRecord[] }).advertisers || []).map((record) => [
    record.id,
    {
      sv: record.serves || [],
      kw: (record.keywords || []).map((keyword) => normalizeDirectoryText(keyword)).filter(Boolean),
      cc: record.concepts || [],
      ds: record.start || '',
      de: record.end || '',
    },
  ]),
);

function rankOf(entry: { tier?: string; source?: string; r?: number }) {
  if (typeof entry.r === 'number') return entry.r;
  if (entry.tier === 'featured') return 0;
  if (entry.tier === 'spotlight') return 1;
  if (entry.source === 'partner') return 2;
  return 3;
}

function clipLine(value: string, max = 90) {
  const text = value.replace(/\s+/g, ' ').trim();
  if (text.length <= max) return text;
  const cut = text.slice(0, max - 1);
  const word = cut.replace(/\s+\S*$/, '');
  return `${word || cut}…`;
}

export function entryToIndexRow(entry: DirectoryEntry, today = directoryToday()): DirectoryIndexRow {
  const siteIsFacebook = outboundLabel(entry.website) === 'Facebook';
  const website = !siteIsFacebook ? entry.website || '' : '';
  const facebook = entry.facebook || (siteIsFacebook ? entry.website || '' : '');
  const featured = listingIsFeatured(entry, today);
  const partner = entry.source === 'partner';
  const advertiser = advertiserById.get(entry.id);
  const exact = typeof entry.lat === 'number' && typeof entry.lng === 'number' ? { lat: entry.lat, lng: entry.lng } : null;
  const center = exact || directoryTownCenter(entry.town || '');
  return {
    id: entry.id,
    n: entry.name,
    c: entry.category,
    t: entry.town || '',
    p: entry.place || '',
    h: entry.href,
    ph: entry.phone || '',
    pt: entry.phoneHref || '',
    w: website,
    fb: facebook,
    maps: entry.mapsUrl || '',
    hr: entry.hours || '',
    r: featured ? 0 : rankOf(entry),
    b: featured ? 'Featured' : entry.tier === 'spotlight' ? 'Spotlight' : '',
    k: partner ? 1 : 0,
    su: partner && entry.summary ? clipLine(entry.summary) : '',
    lg: entry.logo || '',
    sv: advertiser?.sv.length ? advertiser.sv : undefined,
    kw: advertiser?.kw.length ? advertiser.kw : undefined,
    cc: advertiser?.cc.length ? advertiser.cc : undefined,
    ds: advertiser?.ds || undefined,
    de: advertiser?.de || undefined,
    lat: center?.lat,
    lng: center?.lng,
  };
}

function addressLine(row: DirectoryIndexRow) {
  const place = (row.p || '').trim();
  const town = row.t || '';
  if (!place) return '';
  if (/^bastrop county$/i.test(place)) return '';
  if (town && place.toLowerCase() === town.toLowerCase()) return '';
  return place;
}

function action(partial: CardAction): CardAction {
  return partial;
}

export function cardActions(row: DirectoryIndexRow): { actions: CardAction[]; menu: CardAction[] } {
  const name = row.n;
  const phone = row.ph || '';
  const phoneHref = row.pt || '';
  const maps = row.maps || '';
  const website = row.w || '';
  const facebook = row.fb || '';
  const details = row.h;
  const external = /^https?:/i.test(details);
  const shareHref = external ? details : details;
  const pool: CardAction[] = [];
  if (phoneHref) {
    pool.push(action({ kind: 'phone', label: 'Call', href: phoneHref, variant: 'call', external: false, aria: `Call ${name}${phone ? `, ${phone}` : ''}` }));
  }
  if (maps) {
    pool.push(action({ kind: 'maps', label: 'Directions', href: maps, variant: 'line', external: true, aria: `Directions to ${name}, opens in a new tab` }));
  }
  if (website) {
    pool.push(action({ kind: 'site', label: 'Website', href: website, variant: 'line', external: true, aria: `Website for ${name}, opens in a new tab` }));
  }
  if (facebook) {
    pool.push(action({ kind: 'facebook', label: 'Facebook', href: facebook, variant: 'line', external: true, aria: `Facebook for ${name}, opens in a new tab` }));
  }
  pool.push(action({ kind: 'details', label: 'Details', href: details, variant: 'line', external, aria: `Details for ${name}` }));
  pool.push(action({ kind: 'share', label: 'Share', href: shareHref, variant: 'icon', external: false, aria: `Share ${name}` }));

  if (!phoneHref && !maps) {
    const text = pool.filter((item) => item.kind !== 'share').slice(0, 3);
    while (text.length < 3 && !text.some((item) => item.kind === 'details')) {
      text.push(pool.find((item) => item.kind === 'details')!);
    }
    return { actions: text.slice(0, 3), menu: [] };
  }

  const primary = pool.filter((item) => item.kind !== 'share');
  const slots = primary.slice(0, 2);
  const rest = [...primary.slice(2), ...pool.filter((item) => item.kind === 'share')];
  if (!rest.length) return { actions: slots, menu: [] };
  return {
    actions: [
      ...slots,
      action({ kind: 'share', label: 'More', href: '#', variant: 'icon', external: false, aria: `More ways to reach ${name}` }),
    ],
    menu: rest,
  };
}

export function toDirectoryCard(row: DirectoryIndexRow, now = new Date(), queryTown = ''): DirectoryCard {
  const info = directoryLabelInfo(row.c);
  const address = addressLine(row);
  const town = row.t || '';
  const served = Boolean(queryTown && town !== queryTown && row.sv?.includes(queryTown));
  const { actions, menu } = cardActions(row);
  const badges: string[] = [];
  if (row.b === 'Featured' || row.b === 'Spotlight') badges.push(row.b);
  if (row.k || row.b === 'Partner' || row.b === 'Partner page') badges.push('Partner');
  return {
    id: row.id,
    name: row.n,
    href: row.h,
    external: /^https?:/i.test(row.h),
    badges,
    blurb: row.k && row.su ? row.su : '',
    track: badges.includes('Featured') ? directoryTrackId(row.id) : '',
    icon: categoryIcon(row.c),
    logo: row.lg || '',
    trade: info.subgroup || info.display || row.c,
    placeLabel: served ? `Serves ${queryTown}` : town || 'Bastrop County',
    noAddress: !town,
    address,
    open: directoryOpenPill(row.hr, now),
    phone: row.ph || '',
    actions,
    menu,
  };
}

function headingPhrase(query: string, category: string) {
  const matcher = directoryMatcher();
  const parsed = matcher.parse(query);
  const concept = matcher.conceptLabel(parsed.units);
  if (concept) {
    const phrase = concept.split(' ').length === 1 ? concept.toLowerCase() : concept;
    return phrase;
  }
  if (parsed.text) return parsed.text;
  if (category) return groupShort(category) || category;
  return '';
}

function lowerFirst(value: string) {
  if (!value) return value;
  return value.charAt(0).toLowerCase() + value.slice(1);
}

function heading(count: number, phrase: string, town: string) {
  const place = town ? `in ${town}` : 'in Bastrop County';
  if (!count) return town ? `No matches in ${town}` : 'No matches';
  if (!phrase) return `${count} ${count === 1 ? 'business' : 'businesses'} ${place}`;
  return `${count} ${phrase} ${place}`;
}

function miles(row: DirectoryIndexRow, origin: { lat: number; lng: number }) {
  if (typeof row.lat !== 'number' || typeof row.lng !== 'number') return Number.POSITIVE_INFINITY;
  const toRad = (value: number) => (value * Math.PI) / 180;
  const dLat = toRad(row.lat - origin.lat);
  const dLng = toRad(row.lng - origin.lng);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(origin.lat)) * Math.cos(toRad(row.lat)) * Math.sin(dLng / 2) ** 2;
  return 3958.8 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function compareNearest(a: DirectoryIndexRow, b: DirectoryIndexRow, origin: { lat: number; lng: number }) {
  const left = miles(a, origin);
  const right = miles(b, origin);
  if (left !== right) return left - right;
  return compareDirectoryAz(a.n, b.n);
}

export function directoryAdContext(query: string, town: string, category: string): DirectoryAdContext {
  const parsed = directoryMatcher().parse(query);
  const concepts = parsed.units.filter((unit) => unit.kind === 'concept').flatMap((unit) => unit.ids || []);
  const townName = town && town !== 'Countywide' ? town : parsed.town;
  let group = category || directoryMatcher().conceptGroup(concepts[0] || '');
  if (!group) {
    const text = parsed.text;
    for (const record of advertiserById.values()) {
      const hit = record.kw.some((keyword) => text === keyword || text.startsWith(`${keyword} `));
      if (!hit) continue;
      for (const id of record.cc) {
        group = directoryMatcher().conceptGroup(id);
        if (group) break;
      }
      if (group) break;
    }
  }
  return {
    town: townName,
    category: group,
    concepts,
    text: parsed.text,
  };
}

function contractActive(row: DirectoryIndexRow, today: string) {
  if (row.ds && row.ds > today) return false;
  if (row.de && today > row.de) return false;
  return true;
}

function advertiserEligible(row: DirectoryIndexRow, today: string) {
  if (!contractActive(row, today)) return false;
  return row.k === 1 || row.b === 'Featured' || row.r === 0 || Boolean(row.cc?.length || row.kw?.length);
}

function keywordRelevant(row: DirectoryIndexRow, text: string) {
  return Boolean(
    row.kw?.some((keyword) => keyword === text || text.startsWith(`${keyword} `) || (keyword.startsWith(`${text} `) && text.length >= 4)),
  );
}

function conceptRelevant(row: DirectoryIndexRow, units: QueryUnit[]) {
  return units.some((unit) => unit.kind === 'concept' && unit.ids?.some((id) => row.cc?.includes(id)));
}

function servesQueryTown(row: DirectoryIndexRow, town: string) {
  if (!town) return true;
  return row.t === town || Boolean(row.sv?.includes(town));
}

function sameAdvertiser(row: DirectoryIndexRow, slot: DirectoryAdSlot) {
  const href = (row.h || '').replace(/^\//, '').toLowerCase();
  const slotHref = (slot.href || '').replace(/^\//, '').toLowerCase();
  if (slot.businessId && (row.id === slot.businessId || row.id.toLowerCase() === `partner:${slot.businessId.toLowerCase()}`)) return true;
  if (slotHref && (href === slotHref || row.id.toLowerCase() === `partner:${slotHref}`)) return true;
  return Boolean(slot.name && row.n.toLowerCase() === slot.name.toLowerCase());
}

/** Partner and featured rows that should lead this search, before the spotlight tile is removed. */
export function directoryAdvertiserPins(
  pool: DirectoryIndexRow[],
  matches: DirectoryIndexRow[],
  units: QueryUnit[],
  text: string,
  town: string,
  today: string,
  options: { sort?: string; slots?: DirectoryAdSlot[] } = {},
) {
  if (!units.length || options.sort === 'az' || options.sort === 'near') return [];
  const organic = new Set(matches.map((row) => row.id));
  const pins = pool.filter((row) => {
    if (!advertiserEligible(row, today)) return false;
    if (!servesQueryTown(row, town)) return false;
    return organic.has(row.id) || conceptRelevant(row, units) || keywordRelevant(row, text);
  });
  const order = new Map(matches.map((row, index) => [row.id, index]));
  pins.sort((a, b) => (order.get(a.id) ?? 9999) - (order.get(b.id) ?? 9999) || compareDirectoryAz(a.n, b.n));
  const ctx = { town, concepts: units.filter((unit) => unit.kind === 'concept').flatMap((unit) => unit.ids || []), text };
  const spotlight = pickDirectorySlot('spotlight', ctx, today, options.slots);
  const candidates = spotlight ? pins.filter((row) => !sameAdvertiser(row, spotlight)) : pins;
  return rotateFair(candidates, today, directoryAdLimits.featuredPerResults);
}

export function filterDirectoryRows(rows: DirectoryIndexRow[], state: DirectoryQueryState, origin?: { lat: number; lng: number } | null, slots?: DirectoryAdSlot[]) {
  const scoped = rows.filter((row) => categoryMatchesGroup(row.c, state.category, state.sub));
  const town = state.town === 'Countywide' ? '' : state.town;
  const found = directoryMatcher().search(scoped, state.q, { town: state.town === 'Countywide' ? '' : town });
  let matches = state.town === 'Countywide' ? found.countywide.concat(found.filter((row) => !row.t)) : [...found];
  if (state.town === 'Countywide') {
    const seen = new Set<string>();
    matches = matches.filter((row) => {
      if (row.t) return false;
      if (seen.has(row.id)) return false;
      seen.add(row.id);
      return true;
    });
  }
  const countywide = state.town && state.town !== 'Countywide' ? found.countywide : [];
  const today = directoryToday();
  const sortAz = state.sort === 'az' || (!state.q && state.sort !== 'near' && !found.units.length);
  const pinTown = state.town === 'Countywide' ? '' : found.town || state.town;
  if (state.sort === 'near') {
    const place = nearestPlace(pinTown, origin);
    matches.sort((a, b) => compareNearest(a, b, place));
    countywide.sort((a, b) => compareNearest(a, b, place));
  } else if (sortAz) {
    matches.sort((a, b) => compareDirectoryAz(a.n, b.n));
    countywide.sort((a, b) => compareDirectoryAz(a.n, b.n));
  } else {
    const ranked = rankDirectoryRows(matches, found.units);
    matches.splice(0, matches.length, ...ranked);
    const rankedCounty = rankDirectoryRows(countywide, found.units);
    countywide.splice(0, countywide.length, ...rankedCounty);
  }
  const featured = state.sort === 'near' ? matches : pinDirectoryFeatured(matches, today);
  const advertiserPins = directoryAdvertiserPins(scoped, featured, found.units, found.text, pinTown, today, { sort: state.sort, slots: slots || directoryAdSlots });
  const pinIds = new Set(advertiserPins.map((row) => row.id));
  const pinned = [...advertiserPins, ...featured.filter((row) => !pinIds.has(row.id))];
  const pinnedCounty = state.sort === 'near' ? countywide : pinDirectoryFeatured(countywide, today);
  return {
    matches: pinned,
    countywide: pinnedCounty,
    town: found.town || (state.town === 'Countywide' ? '' : state.town),
    units: found.units,
    text: found.text,
  };
}

export function buildDirectoryView(
  rows: DirectoryIndexRow[],
  state: DirectoryQueryState,
  options: { page?: number; limit?: number; now?: Date; origin?: { lat: number; lng: number } | null } = {},
): DirectoryView {
  const now = options.now || new Date();
  const filtered = filterDirectoryRows(rows, state, options.origin);
  const active = Boolean(state.q || state.town || state.category || state.sub);
  const limit = options.limit || Math.max(1, options.page || 1) * PAGE;
  const phrase = headingPhrase(filtered.text || state.q, state.category);
  const categoryName = groupShort(state.category) || state.category;
  const shown = filtered.matches.slice(0, limit);
  const countyShown = state.wide || filtered.matches.length === 0 ? filtered.countywide.slice(0, PAGE) : [];
  const townName = state.town === 'Countywide' ? '' : filtered.town || state.town;
  const cards = (list: DirectoryIndexRow[]) => list.map((row) => toDirectoryCard(row, now, townName));
  const fellBack = active && filtered.matches.length === 0 && filtered.countywide.length > 0 && Boolean(townName);
  const noun = phrase || 'businesses';
  const allCount = fellBack ? filterDirectoryRows(rows, { ...state, town: '' }, options.origin).matches.length : 0;
  const fallback = fellBack
    ? {
        detail: `${filtered.countywide.length} ${filtered.countywide.length === 1 ? 'works' : 'work'} countywide (no street address on file)`,
        seeAll: `See all ${allCount} ${lowerFirst(noun)} in Bastrop County`,
      }
    : null;
  let empty: DirectoryView['empty'] = null;
  if (active && filtered.matches.length === 0 && filtered.countywide.length === 0) {
    const dropped = state.town ? filterDirectoryRows(rows, { ...state, town: '' }).matches.length : 0;
    const suggestion = state.q
      ? suggestDirectoryQuery(state.q, (next) => filterDirectoryRows(rows, { ...state, q: next, town: '' }).matches.length)
      : null;
    const groups = directoryGridGroups()
      .map((group) => ({
        id: group.id,
        label: group.short || group.label,
        icon: group.icon,
        count: rows.filter((row) => categoryMatchesGroup(row.c, group.id)).length,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);
    empty = { query: state.q, town: state.town, countyCount: dropped, suggestion, groups };
  }
  const total = filtered.matches.length;
  const from = total ? 1 : 0;
  const to = shown.length;
  const headingText = !active
    ? 'All businesses'
    : fellBack
      ? phrase
        ? `No ${lowerFirst(noun)} listed in ${townName} yet`
        : `No matches for “${state.q}” in ${townName} yet`
      : heading(total, phrase, townName);
  return {
    heading: headingText,
    live: active ? headingText : `${rows.length} businesses in Bastrop County`,
    range: total > to ? `Showing ${from}–${to} of ${total}` : '',
    mode: active ? 'results' : 'browse',
    input: filtered.text || '',
    town: state.town === 'Countywide' ? 'Countywide' : filtered.town || state.town,
    category: state.category,
    categoryLabel: categoryName,
    matches: cards(shown),
    total,
    countywide: cards(countyShown),
    countywideTotal: filtered.countywide.length,
    fallback,
    empty,
  };
}

export function directoryPageSize() {
  return PAGE;
}

export function subgroupChoices(groupId: string) {
  return subgroupsForGroup(groupId);
}

export function moreGroupIds() {
  return directoryMoreGroups().map((group) => group.id);
}

export function indexPayload(rows: DirectoryIndexRow[]) {
  return rows.map((row) => {
    const next: Record<string, unknown> = { id: row.id, n: row.n, c: row.c, h: row.h, r: row.r ?? 3 };
    if (row.t) next.t = row.t;
    if (row.p) next.p = row.p;
    if (row.ph) next.ph = row.ph;
    if (row.pt) next.pt = row.pt;
    if (row.w) next.w = row.w;
    if (row.fb) next.fb = row.fb;
    if (row.maps) next.maps = row.maps;
    if (row.hr) next.hr = row.hr;
    if (row.b) next.b = row.b;
    if (row.k) next.k = row.k;
    if (row.su) next.su = row.su;
    if (row.lg) next.lg = row.lg;
    if (row.sv?.length) next.sv = row.sv;
    if (row.kw?.length) next.kw = row.kw;
    if (row.cc?.length) next.cc = row.cc;
    if (row.ds) next.ds = row.ds;
    if (row.de) next.de = row.de;
    if (typeof row.lat === 'number') next.lat = row.lat;
    if (typeof row.lng === 'number') next.lng = row.lng;
    return next;
  });
}
