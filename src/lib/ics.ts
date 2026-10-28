import type { ListedEvent } from './events';
import { addDays, eventKey } from './time';

function stamp(date: Date) {
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

function icsEscape(value: string) {
  return value.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;');
}

export function googleCalendarUrl(event: ListedEvent, pageUrl: string) {
  const key = eventKey(event.data.start);
  const dates =
    event.data.schedule === 'all-day' || event.data.schedule === 'agenda'
      ? `${key.replace(/-/g, '')}/${addDays(key, 1).replace(/-/g, '')}`
      : `${stamp(event.data.start)}/${stamp(event.data.end ?? new Date(event.data.start.getTime() + 2 * 60 * 60 * 1000))}`;
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.data.title,
    dates,
    ctz: 'America/Chicago',
    details: `${event.data.summary}\n\n${pageUrl}`,
    location: [event.data.venue, event.data.address].filter(Boolean).join(', '),
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export function buildIcs(event: ListedEvent, pageUrl: string) {
  const key = eventKey(event.data.start);
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Bastropia//Calendar//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${event.id}@bastropia`,
    `DTSTAMP:${stamp(new Date())}`,
    `SUMMARY:${icsEscape(event.data.title)}`,
    `DESCRIPTION:${icsEscape(`${event.data.summary} ${pageUrl}`)}`,
    `LOCATION:${icsEscape([event.data.venue, event.data.address].filter(Boolean).join(', '))}`,
    `URL:${pageUrl}`,
  ];
  if (event.data.schedule === 'timed') {
    lines.push(`DTSTART:${stamp(event.data.start)}`);
    lines.push(`DTEND:${stamp(event.data.end ?? new Date(event.data.start.getTime() + 2 * 60 * 60 * 1000))}`);
  } else {
    lines.push(`DTSTART;VALUE=DATE:${key.replace(/-/g, '')}`);
    lines.push(`DTEND;VALUE=DATE:${addDays(key, 1).replace(/-/g, '')}`);
  }
  lines.push('END:VEVENT', 'END:VCALENDAR');
  return lines.join('\r\n');
}
