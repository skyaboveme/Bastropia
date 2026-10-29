export const TZ = 'America/Chicago';

export function chicagoParts(date: Date) {
  const bag: Record<string, string> = {};
  for (const part of new Intl.DateTimeFormat('en-US', {
    timeZone: TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date)) {
    bag[part.type] = part.value;
  }
  return {
    key: `${bag.year}-${bag.month}-${bag.day}`,
    weekday: bag.weekday ?? '',
    hour: Number(bag.hour),
    minute: Number(bag.minute),
  };
}

export function eventKey(date: Date) {
  return chicagoParts(date).key;
}

export function addDays(key: string, days: number) {
  const [year, month, day] = key.split('-').map(Number);
  const next = new Date(Date.UTC(year, month - 1, day + days));
  return next.toISOString().slice(0, 10);
}

export function addMonths(key: string, months: number) {
  const [year, month, day] = key.split('-').map(Number);
  const next = new Date(Date.UTC(year, month - 1 + months, day));
  return next.toISOString().slice(0, 10);
}

const weekdayIndex: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

/** Friday, Saturday, and Sunday for the weekend underway or next up. */
export function thisWeekendKeys(now = new Date()) {
  const { key, weekday } = chicagoParts(now);
  const day = weekdayIndex[weekday] ?? 0;
  const fridayOffset = day === 0 ? -2 : 5 - day;
  const friday = addDays(key, fridayOffset);
  return [friday, addDays(friday, 1), addDays(friday, 2)];
}

export function formatTime(date: Date) {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: TZ,
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}

export function formatLong(date: Date) {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: TZ,
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

export function formatMedium(date: Date) {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: TZ,
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

export function stampParts(date: Date) {
  return {
    month: new Intl.DateTimeFormat('en-US', { timeZone: TZ, month: 'short' }).format(date),
    day: new Intl.DateTimeFormat('en-US', { timeZone: TZ, day: 'numeric' }).format(date),
    weekday: new Intl.DateTimeFormat('en-US', { timeZone: TZ, weekday: 'short' }).format(date),
  };
}

export function labelFromKey(key: string) {
  const [year, month, day] = key.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day, 12));
  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'UTC',
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  }).format(date);
}

export function monthTitle(year: number, month: number) {
  const date = new Date(Date.UTC(year, month - 1, 1, 12));
  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'UTC',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

export function monthGrid(year: number, month: number) {
  const startWeekday = new Date(Date.UTC(year, month - 1, 1)).getUTCDay();
  const days = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const cells: (string | null)[] = [];
  for (let index = 0; index < startWeekday; index += 1) cells.push(null);
  for (let day = 1; day <= days; day += 1) {
    cells.push(`${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`);
  }
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

export function whenLabel(schedule: string, start: Date, end?: Date) {
  if (schedule === 'all-day') return 'All day';
  if (schedule === 'agenda') return 'Time is on the agenda';
  const open = formatTime(start);
  if (!end) return open;
  return `${open} – ${formatTime(end)}`;
}
