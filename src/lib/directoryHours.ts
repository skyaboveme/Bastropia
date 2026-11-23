const DAY_INDEX: Record<string, number> = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
  sun: 0,
  mon: 1,
  tue: 2,
  tues: 2,
  wed: 3,
  thu: 4,
  thur: 4,
  thurs: 4,
  fri: 5,
  sat: 6,
};

function chicago(now: Date) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Chicago',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(now);
  const read = (type: string) => parts.find((part) => part.type === type)?.value || '';
  const weekday = read('weekday').slice(0, 3).toLowerCase();
  return { day: DAY_INDEX[weekday] ?? 0, minutes: Number(read('hour')) * 60 + Number(read('minute')) };
}

function dayToken(value: string) {
  const key = value.toLowerCase().replace(/\./g, '').trim();
  return DAY_INDEX[key];
}

function expandDays(start: string, end?: string) {
  const from = dayToken(start);
  const to = end ? dayToken(end) : from;
  if (from === undefined || to === undefined) return [];
  const days: number[] = [];
  for (let day = from; ; day = (day + 1) % 7) {
    days.push(day);
    if (day === to) break;
    if (days.length > 7) break;
  }
  return days;
}

function clock(value: string) {
  const match = value.trim().toLowerCase().match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)?$/);
  if (!match) return null;
  let hour = Number(match[1]);
  const minute = Number(match[2] || 0);
  const meridiem = match[3];
  if (meridiem === 'pm' && hour < 12) hour += 12;
  if (meridiem === 'am' && hour === 12) hour = 0;
  if (!meridiem && hour <= 7) hour += 12;
  if (hour === 24) return 24 * 60;
  if (hour > 24 || minute > 59) return null;
  return hour * 60 + minute;
}

function formatClock(minutes: number) {
  const wrapped = ((minutes % (24 * 60)) + 24 * 60) % (24 * 60);
  const hour24 = Math.floor(wrapped / 60);
  const minute = wrapped % 60;
  const suffix = hour24 >= 12 ? 'PM' : 'AM';
  const hour = hour24 % 12 || 12;
  if (minute === 0) return `${hour} ${suffix}`;
  return `${hour}:${String(minute).padStart(2, '0')} ${suffix}`;
}

/** "Open now", "Closes 9 PM", or "Closed" when the hours string names today. */
export function directoryOpenPill(hours: string | undefined, now = new Date()) {
  if (!hours || !/\d/.test(hours)) return null;
  const today = chicago(now);
  const closed = new Set<number>();
  const open = new Map<number, { start: number; end: number }>();
  const chunks = hours
    .replace(/\s+[–—-]\s+/g, '–')
    .split(/[.;]+/)
    .map((chunk) => chunk.trim())
    .filter(Boolean);
  let parsed = false;
  for (const chunk of chunks) {
    const closedMatch = chunk.match(/^closed\s+([a-z]+)(?:\s*[–-]\s*([a-z]+))?/i);
    if (closedMatch) {
      for (const day of expandDays(closedMatch[1], closedMatch[2])) closed.add(day);
      parsed = true;
      continue;
    }
    const match = chunk.match(
      /^([a-z]+)\.?(?:\s*[–-]\s*([a-z]+)\.?)?\s+(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)\s*[–-]\s*(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)/i,
    );
    if (!match) continue;
    const start = clock(match[3]);
    const end = clock(match[4]);
    if (start === null || end === null) continue;
    for (const day of expandDays(match[1], match[2])) open.set(day, { start, end });
    parsed = true;
  }
  if (!parsed) return null;
  if (closed.has(today.day) && !open.has(today.day)) return 'Closed';
  const span = open.get(today.day);
  if (!span) return closed.has(today.day) ? 'Closed' : null;
  const end = span.end <= span.start ? span.end + 24 * 60 : span.end;
  const minute = today.minutes;
  if (minute >= span.start && minute < end) {
    const untilClose = end - minute;
    if (untilClose <= 60) return `Closes ${formatClock(span.end)}`;
    return 'Open now';
  }
  return 'Closed';
}
