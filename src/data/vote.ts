import { addDays, eventKey } from '../lib/time';

/** From this date on (America/Chicago) the Go Vote page and its links disappear. */
export const voteLiveUntil = '2026-11-04';
export const electionDay = '2026-11-03';
/** Hours stay on one line: non-breaking spaces. */
const nb = (value: string) => value.replace(/ /g, '\u00a0');

export const electionHours = nb('7 am – 7 pm');

export const voteSource = {
  name: 'Bastrop County Elections',
  url: 'https://www.bastropvotes.org/voting-schedule/',
  home: 'https://www.bastropvotes.org/',
  checked: '2026-10-30',
};

export function voteIsLive(now = new Date()) {
  return eventKey(now) < voteLiveUntil;
}

export function daysUntil(from: string, to: string) {
  let count = 0;
  let cursor = from;
  while (cursor < to && count < 400) {
    cursor = addDays(cursor, 1);
    count += 1;
  }
  return count;
}

export type VoteDay = { date: string; hours: string };

export const earlyVotingDays: VoteDay[] = [
  { date: '2026-10-19', hours: nb('8 am – 5 pm') },
  { date: '2026-10-20', hours: nb('8 am – 5 pm') },
  { date: '2026-10-21', hours: nb('8 am – 5 pm') },
  { date: '2026-10-22', hours: nb('8 am – 5 pm') },
  { date: '2026-10-23', hours: nb('8 am – 5 pm') },
  { date: '2026-10-24', hours: nb('7 am – 7 pm') },
  { date: '2026-10-25', hours: nb('9 am – 3 pm') },
  { date: '2026-10-26', hours: nb('7 am – 7 pm') },
  { date: '2026-10-27', hours: nb('7 am – 7 pm') },
  { date: '2026-10-28', hours: nb('7 am – 7 pm') },
  { date: '2026-10-29', hours: nb('7 am – 7 pm') },
  { date: '2026-10-30', hours: nb('7 am – 7 pm') },
];

export type VoteLocation = {
  name: string;
  street: string;
  city: string;
  zip: string;
  note?: string;
};

export const earlyMain: VoteLocation = {
  name: 'Bastrop County Courthouse Annex',
  street: '804 Pecan St.',
  city: 'Bastrop',
  zip: '78602',
  note: 'Lower level, conference room. Main early voting location.',
};

export const earlyBranches: VoteLocation[] = [
  { name: 'Smithville Recreation Center', street: '106 Royston St.', city: 'Smithville', zip: '78957' },
  { name: 'Bastrop County Cedar Creek Annex', street: '5785 FM 535', city: 'Cedar Creek', zip: '78612' },
  { name: 'North Bastrop County Community Annex', street: '702 Bull Run', city: 'Elgin', zip: '78621' },
];

export const electionDayLocations: VoteLocation[] = [
  { name: 'Aqua Water Supply', street: '401 Old Austin Hwy.', city: 'Bastrop', zip: '78602' },
  { name: 'River Valley Christian Fellowship', street: '1224 W. Hwy 71', city: 'Bastrop', zip: '78602' },
  { name: 'Bastrop County Courthouse Annex', street: '804 Pecan St.', city: 'Bastrop', zip: '78602' },
  { name: 'Bastrop County Community Center', street: '15 American Legion Dr.', city: 'Bastrop', zip: '78602' },
  { name: 'Bastrop County ESD#2 Station 4', street: '1432 N. Hwy 95', city: 'Bastrop', zip: '78602' },
  { name: 'Paige Community Center', street: '107 S. Main St.', city: 'Paige', zip: '78659' },
  { name: 'Smithville Rec Center', street: '106 Royston St.', city: 'Smithville', zip: '78957' },
  { name: 'Rosanky Community Center', street: '135 Main St.', city: 'Rosanky', zip: '78953' },
  { name: 'Bastrop County Cedar Creek Annex', street: '5785 FM 535', city: 'Cedar Creek', zip: '78612' },
  { name: 'Cedar Creek United Methodist Church', street: '5630 FM 535', city: 'Cedar Creek', zip: '78612' },
  { name: 'Red Rock Community Center', street: '114 Red Rock Rd.', city: 'Red Rock', zip: '78662' },
  { name: 'North Bastrop County Community Annex', street: '702 Bull Run', city: 'Elgin', zip: '78621' },
  { name: 'Elgin Recreation Center', street: '361 SH 95', city: 'Elgin', zip: '78621' },
  { name: 'Family Worship Center', street: '2425 FM 1704', city: 'Elgin', zip: '78621' },
  { name: 'Faith Lutheran Church', street: '230 Waco St.', city: 'McDade', zip: '78650' },
];

export const electionOffice = {
  name: 'Bastrop County Elections',
  street: '804 Pecan St.',
  city: 'Bastrop',
  zip: '78602',
  phone: '512-581-7160',
  email: 'elections@co.bastrop.tx.us',
  facebook: 'https://www.facebook.com/pages/Bastrop-County-Elections/585396331481531',
};

export const registeredVoters = { total: '65,751', asOf: 'October 26, 2026' };

export function mapHref(place: VoteLocation) {
  const query = `${place.name}, ${place.street}, ${place.city}, TX ${place.zip}`;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}
