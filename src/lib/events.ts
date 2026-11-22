import type { CollectionEntry } from 'astro:content';
import { tierRank, type Tier } from '../data/taxonomy.ts';
import { addDays, chicagoParts, eventKey, thisWeekendKeys } from './time.ts';

export type ListedEvent = CollectionEntry<'events'>;

export type EventQuery = {
  when?: string | null;
  category?: string | null;
  city?: string | null;
  q?: string | null;
  date?: string | null;
  /** Rec-center fitness and wellness series. Hidden from the main calendar unless this is set. */
  classes?: string | null;
};

const classTitle =
  /yoga|tai chi|fitness|zumba|kickball|stretch|slow flow|fit and strong|core body|mind.?body|restorative|pilates|meditation|strength and condition|workout/;

/** Recurring indoor rec-center classes that bury one-off events if left in the main list. */
export function isClassListing(event: ListedEvent) {
  const venue = event.data.venue.toLowerCase();
  const title = event.data.title.toLowerCase();
  if (!/recreation center|rec center/.test(venue)) return false;
  return classTitle.test(title);
}

/** An event is over once its end has passed. All-day and agenda listings last through that Chicago date. */
export function hasEnded(event: ListedEvent, now = new Date()) {
  const today = eventKey(now);
  if (event.data.schedule === 'all-day' || event.data.schedule === 'agenda') {
    return eventKey(event.data.end ?? event.data.start) < today;
  }
  return (event.data.end ?? event.data.start).getTime() <= now.getTime();
}

function plainTitle(title: string) {
  return title
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\b(the|a|an|and)\b/g, ' ')
    .replace(/\b20\d{2}\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const venueSkip = new Set(['bastrop', 'texas', 'county', 'the', 'and', 'center', 'park', 'library', 'hall', 'church', 'school', 'street']);

function venueWords(venue: string) {
  return venue
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .split(/\s+/)
    .filter((word) => word.length > 3 && !venueSkip.has(word));
}

function samePlace(a: string, b: string) {
  const left = venueWords(a);
  const right = new Set(venueWords(b));
  if (left.some((word) => right.has(word))) return true;
  const compact = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, '');
  const leftCompact = compact(a);
  const rightCompact = compact(b);
  return Boolean(leftCompact && rightCompact && (leftCompact.includes(rightCompact) || rightCompact.includes(leftCompact)));
}

function listingScore(event: ListedEvent) {
  const summary = event.data.summary;
  const boilerplate = /is on the .+ calendar/i.test(summary) ? 0 : 4;
  return boilerplate + Math.min(summary.length, 500) / 100 + (event.data.image ? 0.5 : 0);
}

/** Drop a second listing of the same gathering when two calendars posted it. */
export function dedupeListings(events: ListedEvent[]) {
  const kept: ListedEvent[] = [];
  const buckets = new Map<string, number[]>();
  for (const event of events) {
    const parts = chicagoParts(event.data.start);
    const key = `${event.data.city}|${parts.key}|${parts.hour}|${parts.minute}|${plainTitle(event.data.title)}`;
    const indexes = buckets.get(key);
    if (!indexes) {
      buckets.set(key, [kept.length]);
      kept.push(event);
      continue;
    }
    const match = indexes.find((index) => samePlace(kept[index].data.venue, event.data.venue));
    if (match === undefined) {
      indexes.push(kept.length);
      kept.push(event);
      continue;
    }
    if (listingScore(event) > listingScore(kept[match])) kept[match] = event;
  }
  return kept;
}

/** Keep the first listings from each organizer so one calendar cannot fill the page. */
export function capOrganizer(events: ListedEvent[], max = 2) {
  const counts = new Map<string, number>();
  return events.filter((event) => {
    const key = (event.data.organizer || event.id).trim().toLowerCase();
    const seen = counts.get(key) ?? 0;
    if (seen >= max) return false;
    counts.set(key, seen + 1);
    return true;
  });
}

export function filterEvents(events: ListedEvent[], query: EventQuery, now = new Date()) {
  const today = chicagoParts(now).key;
  const weekend = new Set(thisWeekendKeys(now));
  const needle = query.q?.trim().toLowerCase() ?? '';
  const classesOnly = query.classes === '1' || query.classes === 'classes';
  const includeClasses = query.classes === 'include';

  const matched = events.filter((event) => {
      const parts = chicagoParts(event.data.start);
      const key = parts.key;
      const hour = parts.hour;
      const classListing = isClassListing(event);
      if (!includeClasses && (classesOnly ? !classListing : classListing)) return false;

      if (query.city && event.data.city !== query.city) return false;
      if (query.category && event.data.category !== query.category) return false;
      if (needle) {
        const haystack = [
          event.data.title,
          event.data.summary,
          event.data.venue,
          event.data.city,
          event.data.organizer ?? '',
        ]
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(needle)) return false;
      }
      if (query.when !== 'all' && hasEnded(event, now)) return false;
      if (query.date) return key === query.date;
      if (query.when === 'today') return key === today;
      if (query.when === 'tonight') {
        return key === today && event.data.schedule === 'timed' && hour >= 17;
      }
      if (query.when === 'weekend') return weekend.has(key);
      if (query.when === 'all') return true;
      return key >= today;
    });

  return dedupeListings(matched).sort((a, b) => a.data.start.getTime() - b.data.start.getTime());
}

export function sortByTier(events: ListedEvent[], tierOf: (event: ListedEvent) => Tier) {
  return [...events].sort((a, b) => {
    const rank = tierRank[tierOf(b)] - tierRank[tierOf(a)];
    if (rank !== 0) return rank;
    return a.data.start.getTime() - b.data.start.getTime();
  });
}

/** Keep calendar order, but pin Spotlight / Featured / Lost Pines to the top of each day. */
export function sortByDayThenTier(events: ListedEvent[], tierOf: (event: ListedEvent) => Tier) {
  return [...events].sort((a, b) => {
    const day = eventKey(a.data.start).localeCompare(eventKey(b.data.start));
    if (day !== 0) return day;
    const rank = tierRank[tierOf(b)] - tierRank[tierOf(a)];
    if (rank !== 0) return rank;
    return a.data.start.getTime() - b.data.start.getTime();
  });
}

/** How many days of upcoming plans the events list prints before "show later". */
export const EVENT_WINDOW_DAYS = 45;

/**
 * A day-sized page of a long list. `startKey` is inclusive. The next page
 * begins on `moreAfter`, the earliest later day, so a gap does not print an empty page.
 */
export function sliceEventWindow<T>(
  events: readonly T[],
  startKey: string,
  keyOf: (event: T) => string,
  days = EVENT_WINDOW_DAYS,
): { shown: T[]; moreAfter: string | null } {
  const end = addDays(startKey, days);
  const shown: T[] = [];
  let moreAfter: string | null = null;
  for (const event of events) {
    const key = keyOf(event);
    if (key < startKey) continue;
    if (key >= end) {
      if (!moreAfter || key < moreAfter) moreAfter = key;
      continue;
    }
    shown.push(event);
  }
  return { shown, moreAfter };
}
