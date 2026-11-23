import type { DirectoryEntry } from '../data/directory.ts';
import { categoryIcon } from '../data/categoryIcons.ts';
import { outboundLabel } from './maps.ts';
import { directoryLabelInfo, categoryMatchesGroup, groupLabel, subgroupsForGroup, directoryGridGroups, directoryMoreGroups } from './directoryGroups.ts';
import { directoryOpenPill } from './directoryHours.ts';
import {
  compareDirectoryAz,
  directoryMatcher,
  rankDirectoryRows,
  suggestDirectoryQuery,
  type MatchRow,
} from './directoryMatch';

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
  lg?: string;
  lat?: number;
  lng?: number;
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
  badge: string;
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
  empty: null | {
    query: string;
    town: string;
    countyCount: number;
    suggestion: { term: string; count: number } | null;
    groups: { id: string; label: string; icon: string }[];
  };
};

const PAGE = 24;

function badgeOf(entry: { tier?: string; source?: string; b?: string }) {
  if (entry.b) return entry.b;
  if (entry.tier === 'featured') return 'Featured';
  if (entry.tier === 'spotlight') return 'Spotlight';
  if (entry.source === 'partner') return 'Partner';
  return '';
}

function rankOf(entry: { tier?: string; source?: string; r?: number }) {
  if (typeof entry.r === 'number') return entry.r;
  if (entry.tier === 'featured') return 0;
  if (entry.tier === 'spotlight') return 1;
  if (entry.source === 'partner') return 2;
  return 3;
}

export function entryToIndexRow(entry: DirectoryEntry): DirectoryIndexRow {
  const siteIsFacebook = outboundLabel(entry.website) === 'Facebook';
  const website = !siteIsFacebook ? entry.website || '' : '';
  const facebook = entry.facebook || (siteIsFacebook ? entry.website || '' : '');
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
    r: rankOf(entry),
    b: badgeOf(entry),
    lg: entry.logo || '',
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

export function toDirectoryCard(row: DirectoryIndexRow, now = new Date()): DirectoryCard {
  const info = directoryLabelInfo(row.c);
  const address = addressLine(row);
  const town = row.t || '';
  const { actions, menu } = cardActions(row);
  return {
    id: row.id,
    name: row.n,
    href: row.h,
    external: /^https?:/i.test(row.h),
    badge: row.b === 'Partner page' ? 'Partner' : row.b || '',
    icon: categoryIcon(row.c),
    logo: row.lg || '',
    trade: info.subgroup || info.display || row.c,
    placeLabel: town || 'Bastrop County',
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
  if (category) return groupLabel(category) || category;
  return '';
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

export function filterDirectoryRows(rows: DirectoryIndexRow[], state: DirectoryQueryState, origin?: { lat: number; lng: number } | null) {
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
  const sortAz = state.sort === 'az' || (!state.q && state.sort !== 'near' && !found.units.length);
  if (state.sort === 'near' && origin) {
    matches.sort((a, b) => miles(a, origin) - miles(b, origin) || compareDirectoryAz(a.n, b.n));
  } else if (sortAz) {
    matches.sort((a, b) => compareDirectoryAz(a.n, b.n));
    countywide.sort((a, b) => compareDirectoryAz(a.n, b.n));
  } else {
    const ranked = rankDirectoryRows(matches, found.units);
    matches.splice(0, matches.length, ...ranked);
    const rankedCounty = rankDirectoryRows(countywide, found.units);
    countywide.splice(0, countywide.length, ...rankedCounty);
  }
  return { matches, countywide, town: found.town || (state.town === 'Countywide' ? '' : state.town), units: found.units, text: found.text };
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
  const categoryName = groupLabel(state.category) || state.category;
  const shown = filtered.matches.slice(0, limit);
  const countyShown = state.wide || filtered.matches.length === 0 ? filtered.countywide.slice(0, PAGE) : [];
  const cards = (list: DirectoryIndexRow[]) => list.map((row) => toDirectoryCard(row, now));
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
      .slice(0, 4);
    empty = { query: state.q, town: state.town, countyCount: dropped, suggestion, groups };
  }
  const total = filtered.matches.length;
  const from = total ? 1 : 0;
  const to = shown.length;
  return {
    heading: active ? heading(total, phrase, filtered.town && state.town !== 'Countywide' ? filtered.town : state.town === 'Countywide' ? '' : '') : 'All businesses',
    live: active
      ? heading(total, phrase, filtered.town && state.town !== 'Countywide' ? filtered.town : '')
      : `${rows.length} businesses in Bastrop County`,
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
    if (row.lg) next.lg = row.lg;
    if (typeof row.lat === 'number') next.lat = row.lat;
    if (typeof row.lng === 'number') next.lng = row.lng;
    return next;
  });
}
