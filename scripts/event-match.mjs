/**
 * Shared event identity checks for the scout and the rolling inbox.
 * A listing is a duplicate when the slug matches, or when the normalized
 * title, calendar date, and venue all match.
 */
import path from 'node:path';

export const EVENT_MD = /^src\/content\/events\/[^/]+\.md$/;
export const EVENT_POSTER = /^public\/images\/events\/[^/]+\.jpg$/;

export function isInboxPath(file) {
  return EVENT_MD.test(file) || EVENT_POSTER.test(file);
}

export function unquote(value) {
  const trimmed = String(value ?? '').trim();
  if (trimmed.startsWith('"')) {
    try {
      return JSON.parse(trimmed);
    } catch {
      return trimmed.replace(/^"|"$/g, '');
    }
  }
  return trimmed;
}

export function looseTitle(title) {
  return String(title || '')
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/\s*[-|]\s*explore bastrop county\s*$/i, '')
    .replace(/\s*\|\s*bastrop(?:\s*,?\s*tx)?\s*$/i, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalized(value) {
  return looseTitle(String(value || '').replace(/&/g, ' and '));
}

export function slug(title, date) {
  const base = String(title || '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 54)
    .replace(/-+$/g, '');
  return `${base || 'event'}-${date}`;
}

export function identityKey(title, date, venue) {
  return `${normalized(title)}|${String(date || '').slice(0, 10)}|${normalized(venue)}`;
}

export function parseListing(file, raw) {
  const text = String(raw);
  const grab = (name) => {
    const match = text.match(new RegExp(`^${name}:\\s*(.*)$`, 'm'));
    return match ? unquote(match[1]) : '';
  };
  const date = grab('start').slice(0, 10);
  const endDate = grab('end').slice(0, 10) || date;
  return {
    file: path.posix.basename(file),
    title: grab('title'),
    date,
    endDate,
    venue: grab('venue'),
    sourceUrl: grab('sourceUrl'),
    image: /^image:\s*/m.test(text),
  };
}

export function hasPassed(item, today) {
  const last = String(item?.endDate || item?.date || '').slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(last) || !/^\d{4}-\d{2}-\d{2}$/.test(today)) return false;
  return last < today;
}

export function alreadyListed(event, listings) {
  const expected = `${slug(event.title, event.date)}.md`;
  const key = identityKey(event.title, event.date, event.venue);
  return listings.some((listing) => {
    // Same slug file, whatever the frontmatter says.
    if (event.file && listing.file === event.file) return true;
    if (!event.file && listing.file === expected && identityKey(listing.title, listing.date, listing.venue) === key) {
      return true;
    }
    if (
      event.sourceUrl
      && listing.sourceUrl === event.sourceUrl
      && !event.sourceUrl.endsWith('/page/calendar')
    ) return true;
    if (!listing.title || !listing.date || !event.title || !event.date) return false;
    return identityKey(listing.title, listing.date, listing.venue) === key;
  });
}

/** Stable filename. A different venue does not overwrite the first listing's slug. */
export function filenameFor(event, listings) {
  const primary = `${slug(event.title, event.date)}.md`;
  const key = identityKey(event.title, event.date, event.venue);
  const occupant = listings.find((listing) => listing.file === primary);
  if (!occupant || identityKey(occupant.title, occupant.date, occupant.venue) === key) return primary;
  const withVenue = `${slug(`${event.title} at ${event.venue || 'tba'}`, event.date)}.md`;
  return withVenue === primary ? primary.replace(/\.md$/, '-venue.md') : withVenue;
}

/** Local listings win when the same filename exists in more than one place. */
export function mergeListings(remote, local) {
  const map = new Map();
  for (const listing of remote) map.set(listing.file, listing);
  for (const listing of local) map.set(listing.file, listing);
  return [...map.values()];
}

/**
 * Choose the add-only set for the rolling inbox.
 * Inbox files are considered first so a later run does not rewrite them.
 */
export function planInboxChanges({ today, mainEvents, mainPaths, inboxAdditions, fresh }) {
  const onMain = mainPaths instanceof Set ? mainPaths : new Set(mainPaths);
  const taken = mainEvents.map((file) => parseListing(file.path, file.raw));
  const files = [];
  const skipped = [];

  const consider = (entry, source) => {
    if (!isInboxPath(entry.path)) {
      skipped.push({ path: entry.path, reason: 'outside the events inbox' });
      return;
    }
    if (!EVENT_MD.test(entry.path)) return;
    if (onMain.has(entry.path)) {
      skipped.push({ path: entry.path, reason: 'already on main' });
      return;
    }
    const listing = parseListing(entry.path, entry.raw);
    if (!listing.date || hasPassed(listing, today)) {
      skipped.push({ path: entry.path, reason: 'already passed' });
      return;
    }
    if (alreadyListed({ ...listing, file: listing.file }, taken)) {
      skipped.push({ path: entry.path, reason: 'duplicate' });
      return;
    }
    taken.push(listing);
    files.push({ path: entry.path, source, kind: 'event' });
  };

  for (const entry of inboxAdditions) consider(entry, 'inbox');
  for (const entry of fresh) consider(entry, 'fresh');

  const posters = new Map();
  for (const entry of inboxAdditions) {
    if (EVENT_POSTER.test(entry.path)) posters.set(entry.path, 'inbox');
  }
  for (const entry of fresh) {
    if (entry.posterPath && EVENT_POSTER.test(entry.posterPath)) posters.set(entry.posterPath, 'fresh');
  }
  for (const eventFile of files.filter((file) => file.kind === 'event')) {
    const poster = `public/images/events/${path.posix.basename(eventFile.path, '.md')}.jpg`;
    if (!posters.has(poster) || onMain.has(poster)) continue;
    files.push({ path: poster, source: posters.get(poster), kind: 'poster' });
  }

  return { files, skipped };
}

/**
 * What to do with the rolling pull request after a run.
 * `skip` opens nothing. `close` drops an inbox that no longer has listings.
 */
export function decidePublish({ fileCount, treeMatchesRemote, openPr }) {
  if (fileCount === 0) return openPr ? 'close' : 'skip';
  if (treeMatchesRemote && openPr) return 'skip';
  return openPr ? 'update' : 'open';
}
