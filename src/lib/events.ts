import type { CollectionEntry } from 'astro:content';
import { tierRank, type Tier } from '../data/taxonomy';
import { chicagoParts, eventKey, thisWeekendKeys } from './time';

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

function sameListing(a: ListedEvent, b: ListedEvent) {
  if (a.data.city !== b.data.city) return false;
  if (eventKey(a.data.start) !== eventKey(b.data.start)) return false;
  const left = chicagoParts(a.data.start);
  const right = chicagoParts(b.data.start);
  if (left.hour !== right.hour || left.minute !== right.minute) return false;
  if (plainTitle(a.data.title) !== plainTitle(b.data.title)) return false;
  return samePlace(a.data.venue, b.data.venue);
}

function listingScore(event: ListedEvent) {
  const summary = event.data.summary;
  const boilerplate = /is on the .+ calendar/i.test(summary) ? 0 : 4;
  return boilerplate + Math.min(summary.length, 500) / 100 + (event.data.image ? 0.5 : 0);
}

/** Drop a second listing of the same gathering when two calendars posted it. */
export function dedupeListings(events: ListedEvent[]) {
  const kept: ListedEvent[] = [];
  for (const event of events) {
    const match = kept.findIndex((item) => sameListing(item, event));
    if (match === -1) {
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
      const key = eventKey(event.data.start);
      const hour = chicagoParts(event.data.start).hour;
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
