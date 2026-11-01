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
};

/** An event is over once its end has passed. All-day and agenda listings last through that Chicago date. */
export function hasEnded(event: ListedEvent, now = new Date()) {
  const today = eventKey(now);
  if (event.data.schedule === 'all-day' || event.data.schedule === 'agenda') {
    return eventKey(event.data.end ?? event.data.start) < today;
  }
  return (event.data.end ?? event.data.start).getTime() <= now.getTime();
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

  return events
    .filter((event) => {
      const key = eventKey(event.data.start);
      const hour = chicagoParts(event.data.start).hour;
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
    })
    .sort((a, b) => a.data.start.getTime() - b.data.start.getTime());
}

export function sortByTier(events: ListedEvent[], tierOf: (event: ListedEvent) => Tier) {
  return [...events].sort((a, b) => {
    const rank = tierRank[tierOf(b)] - tierRank[tierOf(a)];
    if (rank !== 0) return rank;
    return a.data.start.getTime() - b.data.start.getTime();
  });
}
