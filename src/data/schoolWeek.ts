import { townPages } from './towns';

/** Dates and facts copied from district pages on November 3, 2026. */
export const schoolWeekChecked = '2026-11-03';

export type SchoolNote = {
  towns: string[];
  date: string;
  endDate?: string;
  title: string;
  detail: string;
  sourceUrl: string;
  sourceLabel: string;
};

const bisd = ['Bastrop', 'Cedar Creek'];

export const schoolNotes: SchoolNote[] = [
  {
    towns: bisd,
    date: '2026-11-03',
    title: 'Father of Texas Day',
    detail: 'On the Bastrop ISD calendar for today.',
    sourceUrl: 'https://www.bisdtx.org/',
    sourceLabel: 'Bastrop ISD',
  },
  {
    towns: bisd,
    date: '2026-11-03',
    title: 'Third six weeks begins',
    detail: 'Bastrop ISD lists today as the start of the third six weeks for 6th through 12th grade.',
    sourceUrl: 'https://www.bisdtx.org/',
    sourceLabel: 'Bastrop ISD',
  },
  {
    towns: ['Cedar Creek'],
    date: '2026-11-06',
    title: 'Cedar Creek vs. Lockhart',
    detail: 'Varsity football, senior night, Friday at 7 pm at Bastrop ISD Memorial Stadium.',
    sourceUrl: 'https://events.hometownticketing.com/boxoffice/bastropisd',
    sourceLabel: 'Bastrop ISD tickets',
  },
  {
    towns: bisd,
    date: '2026-11-17',
    title: 'School board meeting',
    detail: 'Regular meeting Tuesday at 5:30 pm at the Jerry Fay Wilhelm Center for the Performing Arts, 1401 Cedar Street, unless otherwise posted.',
    sourceUrl: 'https://www.bisdtx.org/about-bisd/board-of-trustees/meeting-dates-times',
    sourceLabel: 'Bastrop ISD board dates',
  },
  {
    towns: bisd,
    date: '2026-11-23',
    endDate: '2026-11-27',
    title: 'Thanksgiving break',
    detail: 'Staff and student holiday. November 23 and 24 are also staff flex professional learning days on the district calendar.',
    sourceUrl: 'https://www.bisdtx.org/calendar',
    sourceLabel: 'Bastrop ISD calendar',
  },
  {
    towns: bisd,
    date: '2026-12-17',
    title: 'Student early release',
    detail: 'The next early release on the 2026-27 calendar. The bell schedule lists elementary dismissal at 11:30 am and secondary at 12:40 pm.',
    sourceUrl: 'https://www.bisdtx.org/calendar',
    sourceLabel: 'Bastrop ISD calendar',
  },
  {
    towns: ['Elgin'],
    date: '2026-11-03',
    title: 'District advisory committee',
    detail: 'Tuesday, 4:30 pm to 5:30 pm, on the Elgin ISD public calendar.',
    sourceUrl: 'https://www.elginisd.net/',
    sourceLabel: 'Elgin ISD',
  },
  {
    towns: ['Elgin'],
    date: '2026-11-04',
    title: 'Neidig public meeting',
    detail: 'Targeted improvement plan meeting, Wednesday, 5:30 pm to 6:30 pm, at Neidig Elementary, 13700 County Line Road.',
    sourceUrl: 'https://www.elginisd.net/calendar',
    sourceLabel: 'Elgin ISD calendar',
  },
  {
    towns: ['Elgin'],
    date: '2026-11-06',
    title: 'Elgin vs. Navarro',
    detail: 'The Elgin Courier’s season schedule says senior night closes the regular season Friday, November 6, at home against Navarro. It does not list a kickoff time.',
    sourceUrl: 'https://www.elgincourier.com/article/4631,wildcats-release-2026-27-football-schedule',
    sourceLabel: 'Elgin Courier',
  },
  {
    towns: ['Elgin'],
    date: '2026-11-16',
    title: 'School board workshop',
    detail: 'Monday, 6:30 pm to 7:30 pm, on the Elgin ISD public calendar.',
    sourceUrl: 'https://www.elginisd.net/',
    sourceLabel: 'Elgin ISD',
  },
  {
    towns: ['Elgin'],
    date: '2026-11-30',
    title: 'Board date',
    detail: 'November 30 is on the 2026-27 board meeting list. That page does not give a time for this date.',
    sourceUrl: 'https://www.elginisd.net/about-elgin-isd/school-board/board-meeting-dates',
    sourceLabel: 'Elgin ISD board dates',
  },
  {
    towns: ['Smithville'],
    date: '2026-11-11',
    title: 'Veterans Day salute',
    detail: 'Smithville ISD’s October newsletter invites veterans, and asks others to line the wave route on Main Street. It does not list a time.',
    sourceUrl: 'https://smithvilleisdtx.edurooms.com/newsletters/smithville-isd/newsletters/sisd-newsletter-october-2026',
    sourceLabel: 'Smithville ISD newsletter',
  },
  {
    towns: ['Smithville'],
    date: '2026-11-12',
    title: 'Thanksgiving lunches at SES',
    detail: 'Listed for November 12 in the district newsletter. No time is given.',
    sourceUrl: 'https://smithvilleisdtx.edurooms.com/newsletters/smithville-isd/newsletters/sisd-newsletter-october-2026',
    sourceLabel: 'Smithville ISD newsletter',
  },
  {
    towns: ['Smithville'],
    date: '2026-11-13',
    title: 'Junior high lunch and dance',
    detail: 'The newsletter lists junior high Thanksgiving lunches and the junior high fall dance on November 13. No times are given.',
    sourceUrl: 'https://smithvilleisdtx.edurooms.com/newsletters/smithville-isd/newsletters/sisd-newsletter-october-2026',
    sourceLabel: 'Smithville ISD newsletter',
  },
  {
    towns: ['Smithville'],
    date: '2026-11-13',
    endDate: '2026-11-14',
    title: 'Theatre: Clue',
    detail: 'Smithville High School theatre, November 13 and 14. The newsletter does not list curtain times.',
    sourceUrl: 'https://smithvilleisdtx.edurooms.com/newsletters/smithville-isd/newsletters/sisd-newsletter-october-2026',
    sourceLabel: 'Smithville ISD newsletter',
  },
  {
    towns: ['Smithville'],
    date: '2026-11-16',
    title: 'School board meeting',
    detail: 'Regular meeting Monday at 6 pm at the Central Administration Building, 901 N.E. 6th Street, unless otherwise posted.',
    sourceUrl: 'https://www.smithvilleisd.org/o/sisd/page/board-meeting-dates-and-times',
    sourceLabel: 'Smithville ISD board dates',
  },
  {
    towns: ['Smithville'],
    date: '2026-11-23',
    endDate: '2026-11-27',
    title: 'Thanksgiving break',
    detail: 'November 23 through 27, in the district newsletter.',
    sourceUrl: 'https://smithvilleisdtx.edurooms.com/newsletters/smithville-isd/newsletters/sisd-newsletter-october-2026',
    sourceLabel: 'Smithville ISD newsletter',
  },
];

function plusDays(key: string, days: number) {
  const date = new Date(`${key}T12:00:00-06:00`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function notesForTown(town: string, today: string) {
  const horizon = plusDays(today, 50);
  return schoolNotes
    .filter((note) => note.towns.includes(town) && (note.endDate ?? note.date) >= today && note.date <= horizon)
    .sort((a, b) => a.date.localeCompare(b.date) || a.title.localeCompare(b.title));
}

export const districtLinks = [
  { name: 'Bastrop ISD', phone: '(512) 772-7100', href: 'https://www.bisdtx.org/calendar', towns: ['Bastrop', 'Cedar Creek'] },
  { name: 'Elgin ISD', phone: '(512) 281-3434', href: 'https://www.elginisd.net/calendar', towns: ['Elgin'] },
  { name: 'Smithville ISD', phone: '(512) 237-2487', href: 'https://www.smithvilleisd.org/page/sisd-academic-calendar/', towns: ['Smithville'] },
  { name: 'McDade ISD', phone: '(512) 273-2522', href: 'https://www.mcdadeisd.com/', towns: ['McDade'] },
] as const;

export function districtsFor(town: string) {
  if (town === 'Paige') return districtLinks.filter((district) => district.name !== 'Elgin ISD');
  return districtLinks.filter((district) => (district.towns as readonly string[]).includes(town));
}

export const townNames = townPages.map((town) => town.name);
