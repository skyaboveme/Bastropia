/**
 * Bastropia event scout.
 *
 * Reads public calendars for Bastrop County, skips anything already on the site,
 * and writes new listings to src/content/events. It never invents a time, price, or address.
 *
 *   node scripts/event-scout.mjs            post new listings
 *   node scripts/event-scout.mjs --dry-run  print what it would post
 *   node scripts/event-scout.mjs --images-only  save posters for listings already on the site
 *
 * A poster is saved only when that event's own page has one. The generic
 * calendar icon is skipped, and so is a photo whose page title is a different event.
 */
import { spawn } from 'node:child_process';
import { mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const eventsDir = path.join(root, 'src', 'content', 'events');
const photoDir = path.join(root, 'public', 'images', 'events');
const logDir = path.join(root, 'data', 'scout');
const dryRun = process.argv.includes('--dry-run');
const horizonDays = 75;
const maxNew = 40;
const agent = 'BastropiaBot/1.0 (+https://bastropia.com)';

const cities = ['Bastrop', 'Elgin', 'Smithville', 'Cedar Creek', 'McDade', 'Paige', 'Countywide'];
const categories = ['music', 'markets', 'outdoors', 'family', 'community', 'arts', 'food', 'government', 'education', 'health'];

const sources = [
  {
    id: 'elgin',
    kind: 'civicengage',
    city: 'Elgin',
    organizer: 'City of Elgin',
    label: 'City of Elgin calendar',
    list: (year, month) => `https://www.elgintexas.gov/calendar.aspx?view=list&month=${month}&year=${year}`,
    eventUrl: (id) => `https://www.elgintexas.gov/Calendar.aspx?EID=${id}`,
  },
  {
    id: 'smithville',
    kind: 'civicengage',
    city: 'Smithville',
    organizer: 'City of Smithville',
    label: 'City of Smithville calendar',
    list: (year, month) => `https://www.ci.smithville.tx.us/calendar.aspx?view=list&month=${month}&year=${year}`,
    eventUrl: (id) => `https://www.ci.smithville.tx.us/Calendar.aspx?EID=${id}`,
  },
  {
    id: 'county',
    kind: 'ics',
    city: 'Bastrop',
    organizer: 'Bastrop County',
    label: 'Bastrop County calendar',
    url: 'https://www.bastropcounty.gov/page/calendar/3596/65/calendar.ics',
    page: 'https://www.bastropcounty.gov/page/calendar',
  },
];

const monthIndex = {
  january: 1, february: 2, march: 3, april: 4, may: 5, june: 6,
  july: 7, august: 8, september: 9, october: 10, november: 11, december: 12,
};

function chicagoParts(date) {
  const bag = {};
  for (const part of new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Chicago',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date)) {
    bag[part.type] = part.value;
  }
  return bag;
}

function todayKey(date = new Date()) {
  const bag = chicagoParts(date);
  return `${bag.year}-${bag.month}-${bag.day}`;
}

function addDays(key, days) {
  const [year, month, day] = key.split('-').map(Number);
  const next = new Date(Date.UTC(year, month - 1, day + days));
  return next.toISOString().slice(0, 10);
}

function nthSunday(year, month, n) {
  const first = new Date(Date.UTC(year, month - 1, 1)).getUTCDay();
  return 1 + ((7 - first) % 7) + (n - 1) * 7;
}

/** Central offset for a calendar date. DST is the second Sunday in March through the day before the first Sunday in November. */
function offset(key) {
  const [year, month, day] = key.split('-').map(Number);
  const start = nthSunday(year, 3, 2);
  const end = nthSunday(year, 11, 1);
  const stamp = month * 100 + day;
  const daylight = stamp >= 300 + start && stamp < 1100 + end;
  return daylight ? '-05:00' : '-06:00';
}

function decode(value) {
  return value
    .replace(/&nbsp;|&#160;|&thinsp;|&#8201;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#039;|&apos;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&#(\d+);/g, (_, num) => String.fromCodePoint(Number(num)))
    .replace(/\s+/g, ' ')
    .trim();
}

function stripTags(value) {
  return decode(value.replace(/<[^>]*>/g, ' '));
}

function slug(title, date) {
  const base = title
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 54)
    .replace(/-+$/g, '');
  return `${base || 'event'}-${date}`;
}

function categoryFor(title, section) {
  const text = `${title} ${section}`.toLowerCase();
  const rules = [
    [/board|commission|council|court|committee|zoning|planning/, 'government'],
    [/market|bazaar|vendor/, 'markets'],
    [/concert|music|band\b|singer|karaoke/, 'music'],
    [/yoga|tai chi|fitness|kickball|zumba|clinic|vaccine|wellness/, 'health'],
    [/story\s*time|kids|children|family|baby|toddler|bilingue|halloween|trunk/, 'family'],
    [/art|craft|fiber|paint|gallery|quilt/, 'arts'],
    [/food|dinner|tasting|brunch|bbq|barbecue/, 'food'],
    [/hike|trail|park run|outdoor/, 'outdoors'],
    [/library|class|workshop|school|reading/, 'education'],
  ];
  for (const [pattern, category] of rules) {
    if (pattern.test(text)) return category;
  }
  if (/park|recreation/i.test(section)) return 'outdoors';
  if (/library/i.test(section)) return 'education';
  return 'community';
}

function venueFor(title, section, organizer) {
  const at = title.match(/\bat\s+(.{3,80})$/i);
  if (at) return at[1].replace(/[.,]$/, '').replace(/^the\s+/i, '').trim();
  return section ? `${organizer} · ${section}` : organizer;
}

function clock(value) {
  const match = value.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return '';
  let hour = Number(match[1]) % 12;
  if (match[3].toUpperCase() === 'PM') hour += 12;
  return `${String(hour).padStart(2, '0')}:${match[2]}`;
}

function parseWhen(text) {
  const match = text.match(/([A-Za-z]+)\s+(\d{1,2}),\s*(\d{4})(?:,\s*(\d{1,2}:\d{2}\s*[AP]M))?(?:\s*[-–]\s*(\d{1,2}:\d{2}\s*[AP]M))?/i);
  if (!match) return null;
  const month = monthIndex[match[1].toLowerCase()];
  if (!month) return null;
  const date = `${match[3]}-${String(month).padStart(2, '0')}-${String(Number(match[2])).padStart(2, '0')}`;
  const startTime = match[4] ? clock(match[4]) : '';
  const endTime = match[5] ? clock(match[5]) : '';
  return { date, startTime, endTime, allDay: !startTime };
}

function skipTitle(title) {
  return /payday|county holiday|offices? closed|city closed|staff (meeting|only)|holiday closure|cancel+ed/i.test(title);
}

/** A title that shows up more than three times is a repeating class. Keep the next date, not every week. */
function collapseRepeats(events) {
  const groups = new Map();
  for (const event of events) {
    const key = `${event.city}|${looseTitle(event.title)}`;
    const list = groups.get(key) ?? [];
    list.push(event);
    groups.set(key, list);
  }
  const kept = [];
  const later = [];
  for (const list of groups.values()) {
    list.sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime));
    const limit = list.length > 3 ? 1 : list.length;
    kept.push(...list.slice(0, limit));
    later.push(...list.slice(limit));
  }
  return { kept, later };
}

function inWindow(date, today) {
  return date >= today && date <= addDays(today, horizonDays);
}

async function fetchText(url) {
  const response = await fetch(url, {
    headers: { 'user-agent': agent, accept: 'text/html, text/calendar, application/xml, */*' },
    signal: AbortSignal.timeout(20000),
  });
  if (!response.ok) throw new Error(`${response.status} ${url}`);
  return response.text();
}

function parseCivicEngage(html, source) {
  const found = [];
  const sections = html.split(/<h2 class="title">/i).slice(1);
  for (const sectionHtml of sections) {
    const section = stripTags(sectionHtml.split(/<\/h2>/i)[0] || '');
    // The id on the title link is this event. A later "More Details" link repeats it,
    // and the next title follows that, so a plain EID= search grabs the previous event.
    const items = sectionHtml.matchAll(/id="eventTitle_(\d+)"[^>]*>\s*<span>([\s\S]*?)<\/span>[\s\S]*?<div class="date">([\s\S]*?)<\/div>/gi);
    for (const item of items) {
      const title = stripTags(item[2]);
      const when = parseWhen(stripTags(item[3]));
      if (!title || !when) continue;
      found.push({
        title,
        ...when,
        section,
        city: source.city,
        venue: venueFor(title, section, source.organizer),
        organizer: source.organizer,
        sourceUrl: source.eventUrl(item[1]),
        sourceLabel: source.label,
        category: categoryFor(title, section),
      });
    }
  }
  return found;
}

function unfoldIcs(text) {
  return text.replace(/\r\n/g, '\n').replace(/\n[ \t]/g, '');
}

function icsValue(block, name) {
  const match = block.match(new RegExp(`^${name}[^:\\n]*:(.*)$`, 'm'));
  return match ? match[1].trim() : '';
}

function icsText(value) {
  return value.replace(/\\n/g, ' ').replace(/\\,/g, ',').replace(/\\;/g, ';').replace(/\\\\/g, '\\').trim();
}

function fromIcsStamp(value) {
  if (/^\d{8}$/.test(value)) {
    return { date: `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}`, startTime: '', endTime: '', allDay: true };
  }
  const match = value.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z$/);
  if (!match) return null;
  const instant = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]), Number(match[4]), Number(match[5]), Number(match[6])));
  const bag = chicagoParts(instant);
  return { date: `${bag.year}-${bag.month}-${bag.day}`, startTime: `${bag.hour}:${bag.minute}`, endTime: '', allDay: false };
}

function parseIcs(text, source) {
  const found = [];
  for (const match of unfoldIcs(text).matchAll(/BEGIN:VEVENT([\s\S]*?)END:VEVENT/g)) {
    const block = match[1];
    const title = icsText(icsValue(block, 'SUMMARY'));
    const start = fromIcsStamp(icsValue(block, 'DTSTART'));
    if (!title || !start) continue;
    const end = fromIcsStamp(icsValue(block, 'DTEND'));
    const description = icsText(icsValue(block, 'DESCRIPTION')).slice(0, 500);
    const location = icsText(icsValue(block, 'LOCATION'));
    found.push({
      title,
      date: start.date,
      startTime: start.startTime,
      endTime: end && !end.allDay && end.date === start.date ? end.startTime : '',
      allDay: start.allDay,
      section: '',
      city: source.city,
      venue: location || source.organizer,
      address: location,
      organizer: source.organizer,
      sourceUrl: source.page,
      sourceLabel: source.label,
      category: categoryFor(title, ''),
      details: description,
      uid: icsValue(block, 'UID'),
    });
  }
  return found;
}

function unquote(value) {
  const trimmed = value.trim();
  if (trimmed.startsWith('"')) {
    try {
      return JSON.parse(trimmed);
    } catch {
      return trimmed.replace(/^"|"$/g, '');
    }
  }
  return trimmed;
}

async function existingListings() {
  const files = (await readdir(eventsDir)).filter((file) => file.endsWith('.md'));
  const listings = [];
  for (const file of files) {
    const raw = await readFile(path.join(eventsDir, file), 'utf8');
    const title = raw.match(/^title:\s*(.*)$/m);
    const start = raw.match(/^start:\s*(.*)$/m);
    const source = raw.match(/^sourceUrl:\s*(.*)$/m);
    listings.push({
      file,
      title: title ? unquote(title[1]).toLowerCase() : '',
      date: start ? unquote(start[1]).slice(0, 10) : '',
      sourceUrl: source ? unquote(source[1]) : '',
      image: /^image:\s*/m.test(raw),
    });
  }
  return listings;
}

function dayDistance(left, right) {
  const [ay, am, ad] = left.split('-').map(Number);
  const [by, bm, bd] = right.split('-').map(Number);
  return Math.abs(Date.UTC(ay, am - 1, ad) - Date.UTC(by, bm - 1, bd)) / 86400000;
}

function looseTitle(title) {
  return title
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function alreadyListed(event, listings) {
  const title = looseTitle(event.title);
  return listings.some((listing) => {
    if (event.sourceUrl && listing.sourceUrl === event.sourceUrl && !event.sourceUrl.endsWith('/page/calendar')) return true;
    if (!listing.title || !listing.date) return false;
    return looseTitle(listing.title) === title && dayDistance(listing.date, event.date) <= 1;
  });
}

function prettyDate(key) {
  const [year, month, day] = key.split('-').map(Number);
  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'UTC',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(Date.UTC(year, month - 1, day, 12)));
}

function prettyTime(value) {
  if (!value) return '';
  const [hourRaw, minuteRaw] = value.split(':').map(Number);
  const suffix = hourRaw >= 12 ? 'pm' : 'am';
  const hour = hourRaw % 12 || 12;
  return minuteRaw ? `${hour}:${String(minuteRaw).padStart(2, '0')} ${suffix}` : `${hour} ${suffix}`;
}

function markdown(event) {
  const zone = offset(event.date);
  const start = event.allDay ? `${event.date}T00:00:00${zone}` : `${event.date}T${event.startTime}:00${zone}`;
  const end = !event.allDay && event.endTime ? `${event.date}T${event.endTime}:00${zone}` : '';
  const when = event.allDay
    ? 'all day'
    : [prettyTime(event.startTime), prettyTime(event.endTime)].filter(Boolean).join('–');
  const dated = prettyDate(event.date);
  const summary = `${event.title} is on the ${event.sourceLabel}${event.section ? ` (${event.section})` : ''} for ${dated}.`;
  const body = event.details
    ? `${event.details}\n\nListed by ${event.organizer}. Confirm the time and place on the source calendar before you go.`
    : `${event.title} is on the ${event.sourceLabel} for ${dated}${when ? `, ${when}` : ''}.${event.section ? ` The city files it under ${event.section}.` : ''} Confirm the place, the cost, and any sign-up on the source calendar before you go.`;
  const lines = [
    '---',
    `title: ${JSON.stringify(event.title)}`,
    `summary: ${JSON.stringify(summary.slice(0, 180))}`,
    `start: ${JSON.stringify(start)}`,
  ];
  if (end) lines.push(`end: ${JSON.stringify(end)}`);
  lines.push(
    `schedule: ${event.allDay ? 'all-day' : 'timed'}`,
    `city: ${JSON.stringify(cities.includes(event.city) ? event.city : 'Countywide')}`,
    `venue: ${JSON.stringify(event.venue)}`,
  );
  if (event.address) lines.push(`address: ${JSON.stringify(event.address)}`);
  lines.push(
    `category: ${categories.includes(event.category) ? event.category : 'community'}`,
    `cost: "See the listing"`,
    'tier: community',
    `organizer: ${JSON.stringify(event.organizer)}`,
    `sourceUrl: ${JSON.stringify(event.sourceUrl)}`,
    `sourceLabel: ${JSON.stringify(event.sourceLabel)}`,
  );
  if (event.image) lines.push(`image: ${JSON.stringify(event.image)}`);
  lines.push(
    '---',
    '',
    body.trim(),
    '',
  );
  return lines.join('\n');
}

function monthsAhead(today, count) {
  let year = Number(today.slice(0, 4));
  let month = Number(today.slice(5, 7));
  const months = [];
  for (let index = 0; index < count; index += 1) {
    months.push({ year, month });
    month += 1;
    if (month === 13) {
      month = 1;
      year += 1;
    }
  }
  return months;
}

async function collect(source, today) {
  if (source.kind === 'ics') {
    return parseIcs(await fetchText(source.url), source);
  }
  const batches = [];
  for (const { year, month } of monthsAhead(today, 3)) {
    batches.push(parseCivicEngage(await fetchText(source.list(year, month)), source));
  }
  return batches.flat();
}

const genericPhoto = /IconModuleCalendar|SocialMedia|favicon|sprite|placeholder|calendarcolor|\/logo/i;
const imagesOnly = process.argv.includes('--images-only');

function runCommand(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args);
    let errorText = '';
    child.stderr.on('data', (chunk) => {
      errorText += chunk;
    });
    child.on('error', reject);
    child.on('close', (code) => (code === 0 ? resolve() : reject(new Error(errorText.trim() || `${command} exited ${code}`))));
  });
}

function pageMeta(html, pageUrl) {
  const imageMatch = html.match(/property="og:image" content="([^"]+)"/i);
  const titleMatch = html.match(/property="og:title" content="([^"]+)"/i);
  const title = titleMatch ? decode(titleMatch[1]) : '';
  if (!imageMatch) return { image: '', title };
  let image;
  let page;
  try {
    image = new URL(imageMatch[1]);
    page = new URL(pageUrl);
  } catch {
    return { image: '', title };
  }
  if (image.protocol !== 'https:' || image.hostname !== page.hostname) return { image: '', title };
  if (genericPhoto.test(image.href)) return { image: '', title };
  return { image: image.href, title };
}

/** Save the city's event poster, resized. Returns a site path, or '' when the calendar has no photo. */
async function saveEventPhoto(pageUrl, name, expectedTitle) {
  if (!pageUrl.includes('EID=')) return '';
  const publicPath = `/images/events/${name}.jpg`;
  const dest = path.join(photoDir, `${name}.jpg`);
  try {
    await readFile(dest);
    return publicPath;
  } catch {
    // Not saved yet.
  }
  const html = await fetchText(pageUrl);
  const meta = pageMeta(html, pageUrl);
  if (expectedTitle && looseTitle(meta.title) !== looseTitle(expectedTitle)) {
    console.log(`photo skipped  ${name}  page is "${meta.title || 'untitled'}"`);
    return '';
  }
  const remote = meta.image;
  if (!remote) return '';
  const response = await fetch(remote, {
    headers: { 'user-agent': agent, accept: 'image/*' },
    signal: AbortSignal.timeout(20000),
  });
  if (!response.ok) return '';
  if (!(response.headers.get('content-type') || '').startsWith('image/')) return '';
  const bytes = Buffer.from(await response.arrayBuffer());
  if (bytes.length < 8000 || bytes.length > 12_000_000) return '';
  await mkdir(photoDir, { recursive: true });
  const raw = path.join(photoDir, `${name}.src`);
  await writeFile(raw, bytes);
  try {
    await runCommand('/usr/bin/sips', ['-s', 'format', 'jpeg', '-s', 'formatOptions', '65', '-Z', '1200', raw, '--out', dest]);
  } finally {
    await rm(raw, { force: true });
  }
  return publicPath;
}

function withImage(raw, imagePath) {
  if (/^image:/m.test(raw)) return raw;
  const close = raw.indexOf('\n---', 4);
  if (close === -1) return raw;
  return `${raw.slice(0, close)}\nimage: ${JSON.stringify(imagePath)}${raw.slice(close)}`;
}

async function attachMissingPhotos(listings) {
  const pending = listings.filter((listing) => listing.sourceUrl.includes('EID=') && !listing.image).slice(0, 60);
  let saved = 0;
  for (const listing of pending) {
    const name = listing.file.replace(/\.md$/, '');
    try {
      const image = dryRun ? '' : await saveEventPhoto(listing.sourceUrl, name, listing.title);
      if (!image) {
        console.log(`no photo  ${listing.title}`);
        continue;
      }
      const full = path.join(eventsDir, listing.file);
      const raw = await readFile(full, 'utf8');
      if (!dryRun) await writeFile(full, withImage(raw, image));
      listing.image = true;
      saved += 1;
      console.log(`photo  ${image}`);
    } catch (error) {
      console.error(`photo failed for ${listing.file}: ${error instanceof Error ? error.message : error}`);
    }
  }
  return saved;
}

/** The first pass stored the previous event's link. Point each listing at its own page before downloading a poster. */
async function alignSourceUrls(listings, catalog) {
  let fixed = 0;
  for (const listing of listings) {
    if (!listing.sourceUrl.includes('EID=')) continue;
    const title = looseTitle(listing.title);
    const matches = catalog.filter((event) => looseTitle(event.title) === title && event.date === listing.date);
    const same = matches.find((event) => event.sourceUrl === listing.sourceUrl);
    const urls = [...new Set(matches.map((event) => event.sourceUrl))];
    const correct = same ?? (urls.length === 1 ? matches[0] : null);
    if (!correct || correct.sourceUrl === listing.sourceUrl) continue;
    const full = path.join(eventsDir, listing.file);
    const raw = await readFile(full, 'utf8');
    const next = raw
      .replace(/^sourceUrl:.*$/m, `sourceUrl: ${JSON.stringify(correct.sourceUrl)}`)
      .replace(/^image:.*\n/m, '');
    if (!dryRun) {
      await writeFile(full, next);
      await rm(path.join(photoDir, listing.file.replace(/\.md$/, '.jpg')), { force: true });
    }
    listing.sourceUrl = correct.sourceUrl;
    listing.image = false;
    fixed += 1;
    console.log(`relink  ${listing.title}  ${correct.sourceUrl}`);
  }
  return fixed;
}

const today = todayKey();
const listings = await existingListings();
const report = { ranAt: new Date().toISOString(), dryRun, today, added: [], skipped: [], outsideWindow: 0, errors: [] };
const seen = new Set();
const fresh = [];
const catalog = [];

if (!imagesOnly) for (const source of sources) {
  try {
    const events = await collect(source, today);
    catalog.push(...events);
    let kept = 0;
    for (const event of events) {
      const key = event.sourceUrl.includes('EID=') ? event.sourceUrl : `${looseTitle(event.title)}|${event.date}`;
      if (seen.has(key)) continue;
      seen.add(key);
      if (!inWindow(event.date, today)) {
        report.outsideWindow += 1;
        continue;
      }
      if (skipTitle(event.title)) {
        report.skipped.push({ title: event.title, date: event.date, reason: 'not a public event' });
        continue;
      }
      if (alreadyListed(event, listings) || listings.some((item) => item.file === `${slug(event.title, event.date)}.md`)) {
        report.skipped.push({ title: event.title, date: event.date, reason: 'already on the calendar' });
        continue;
      }
      fresh.push(event);
      kept += 1;
    }
    console.log(`${source.label}: ${events.length} read, ${kept} new candidates`);
  } catch (error) {
    report.errors.push({ source: source.id, message: error instanceof Error ? error.message : String(error) });
    console.error(`${source.label} failed: ${error instanceof Error ? error.message : error}`);
  }
}

const collapsed = collapseRepeats(fresh);
for (const event of collapsed.later) {
  report.skipped.push({ title: event.title, date: event.date, reason: 'later date of a repeating listing' });
}
const ready = collapsed.kept.sort((a, b) => a.date.localeCompare(b.date) || a.title.localeCompare(b.title));
const posting = ready.slice(0, maxNew);
for (const event of ready.slice(maxNew)) {
  report.skipped.push({ title: event.title, date: event.date, reason: `over the ${maxNew} listing cap for this run` });
}

if (!imagesOnly) for (const event of posting) {
  let file = `${slug(event.title, event.date)}.md`;
  if (listings.some((item) => item.file === file)) file = file.replace(/\.md$/, '-2.md');
  const full = path.join(eventsDir, file);
  if (!dryRun && event.sourceUrl.includes('EID=')) {
    try {
      event.image = await saveEventPhoto(event.sourceUrl, file.replace(/\.md$/, ''), event.title);
    } catch (error) {
      console.error(`photo failed for ${event.title}: ${error instanceof Error ? error.message : error}`);
    }
  }
  if (!dryRun) await writeFile(full, markdown(event));
  listings.push({ file, title: event.title.toLowerCase(), date: event.date, sourceUrl: event.sourceUrl, image: Boolean(event.image) });
  report.added.push({ file, title: event.title, date: event.date, city: event.city, source: event.sourceLabel, image: event.image || '' });
  console.log(`${dryRun ? 'would post' : 'posted'}  ${event.date}  ${event.city}  ${event.title}${event.image ? '  (photo)' : ''}`);
}

if (imagesOnly) {
  for (const source of sources) {
    if (source.kind !== 'civicengage') continue;
    try {
      const events = await collect(source, today);
      catalog.push(...events);
      console.log(`${source.label}: ${events.length} read for photos`);
    } catch (error) {
      report.errors.push({ source: source.id, message: error instanceof Error ? error.message : String(error) });
      console.error(`${source.label} failed: ${error instanceof Error ? error.message : error}`);
    }
  }
}

const relinked = await alignSourceUrls(listings, catalog);
const photos = imagesOnly || !dryRun ? await attachMissingPhotos(listings) : 0;

if (!dryRun) {
  await mkdir(logDir, { recursive: true });
  await writeFile(path.join(logDir, 'last-run.json'), JSON.stringify(report, null, 2));
}

console.log(`\n${report.added.length} posted, ${relinked} links corrected, ${photos} photos saved, ${report.skipped.length} skipped, ${report.outsideWindow} outside the next ${horizonDays} days, ${report.errors.length} source errors${dryRun ? ' (dry run)' : ''}.`);
