import { getCollection } from 'astro:content';
import { burnBan } from '../data/burnBan';
import { businesses } from '../data/businesses';
import { siteDescription, siteUrl } from '../data/site';
import { electionDay, voteIsLive, voteSource } from '../data/vote';
import { eventKey, formatLong, labelFromKey, whenLabel } from './time';

const pages: { path: string; label: string; note: string }[] = [
  { path: '/', label: 'Front page', note: 'Today’s news, Around the county, a rotating sponsor banner, and upcoming events' },
  { path: '/events', label: 'Events', note: 'List and month view of Bastrop County listings. /calendar opens the month view' },
  { path: '/this-weekend', label: 'This weekend', note: 'Friday, Saturday, and Sunday plans' },
  { path: '/news', label: 'News', note: 'Short desk stories with a link to the public source' },
  { path: '/groups', label: 'Social', note: 'Public-group highlights, then the directory of Facebook groups and pages. /social opens the highlights' },
  { path: '/rss.xml', label: 'County RSS', note: 'Bastrop County news from this desk, county papers, and Austin newsrooms that name the county' },
  { path: '/events.xml', label: 'Events RSS', note: 'Feed of upcoming listings' },
  { path: '/burn-ban', label: 'Burn ban', note: 'Whether the county lists an outdoor burn ban' },
  { path: '/weather', label: 'Weather', note: 'Forecast and National Weather Service alerts' },
  { path: '/government', label: 'Government', note: 'Emergency numbers, services, and public notices' },
  { path: '/phone-numbers', label: 'Phone numbers', note: 'Sheriff, tax office, city hall, water, libraries, trash and recycling day, and school districts, with hours and the date each page was checked' },
  { path: '/schools', label: 'School status', note: 'Closed, delayed, or a normal day for Bastrop ISD, Elgin ISD, Smithville ISD, and McDade ISD' },
  { path: '/alerts', label: 'Status alerts', note: 'One email or text list per item: burn ban, school status, power, SH 71, US 290, county roads, or a named road' },
  { path: '/videos', label: 'Videos', note: 'County live and recorded sources, plus videos about Bastrop from other channels' },
  { path: '/go-vote', label: 'Go Vote', note: 'Election Day is over. This address redirects to /results' },
  { path: '/election-night', label: 'Election night', note: 'Redirects to /results' },
  { path: '/results', label: 'Election results', note: 'Unofficial November 3, 2026 race-by-race totals from https://results.enr.clarityelections.com/TX/Bastrop/, Associated Press calls, vote centers, and the elections office central-count camera' },
  { path: '/scores', label: 'Friday night scores', note: 'Latest finals for Bastrop, Cedar Creek, Elgin, and Smithville football' },
  { path: '/roads', label: 'Highway alerts', note: 'DriveTexas closures and crashes, then construction on SH 71, US 290, and other county roads' },
  { path: '/government/court-decisions', label: 'What the court decided', note: 'Three bullets after each Commissioners Court meeting, once the minutes are posted' },
  { path: '/about', label: 'About', note: 'What Bastropia is and is not' },
  { path: '/submit', label: 'Add an event', note: 'How a neighbor submits a listing' },
  { path: '/llms-full.txt', label: 'Full text for models', note: 'Current listings, stories, and notices in one file' },
];

const towns = ['Bastrop', 'Elgin', 'Smithville', 'Cedar Creek', 'McDade', 'Paige'];

function link(path: string) {
  return new URL(path, siteUrl).toString();
}

export async function llmsIndex() {
  const lines = [
    '# Bastropia',
    '',
    `> ${siteDescription} A community site, not Bastrop County government.`,
    '',
    'Bastropia covers Bastrop, Elgin, Smithville, Cedar Creek, McDade, Paige, and the rest of Bastrop County, Texas. Event listings come from public city and county calendars and from neighbors. A time, price, or address on a listing should be confirmed on the source linked from that page.',
    '',
    '## Start here',
    ...pages.map((page) => `- [${page.label}](${link(page.path)}): ${page.note}`),
    '',
    '## Towns',
    ...towns.map((town) => `- [This week in ${town}](${link(`/${town.toLowerCase().replace(/ /g, '-')}`)}): Weather, this week’s listings, school dates, and headlines for ${town}`),
    '',
    '## Local businesses',
    ...businesses.map((business) => `- [${business.name}](${link(`/${business.slug}`)}): ${business.summary}`),
    '',
    '## Optional',
    `- [Weather by town](${link('/weather?town=Elgin')}): Replace Elgin with Bastrop, Smithville, or Cedar Creek`,
    `- [Facebook group](https://www.facebook.com/groups/bastropia): The community conversation, off this site`,
  ];
  return `${lines.join('\n')}\n`;
}

export async function llmsFull() {
  const today = eventKey(new Date());
  const [events, news, notices] = await Promise.all([
    getCollection('events'),
    getCollection('news'),
    getCollection('updates'),
  ]);
  const upcoming = events
    .filter((event) => eventKey(event.data.start) >= today)
    .sort((a, b) => a.data.start.getTime() - b.data.start.getTime())
    .slice(0, 80);
  const stories = news.sort((a, b) => b.data.pubDate.getTime() - a.data.pubDate.getTime());
  const updates = notices.sort((a, b) => b.data.pubDate.getTime() - a.data.pubDate.getTime());

  const lines = [
    '# Bastropia',
    '',
    siteDescription,
    '',
    'Bastropia is a community site for Bastrop County, Texas. It is not the county, a city, or an emergency service. Burn bans, court dates, polling places, and office numbers are summaries of public pages. The linked official page is the authority.',
    '',
    `Burn ban: ${burnBan.headline}. ${burnBan.summary} Checked ${burnBan.checked}. Source: ${burnBan.sourceUrl}`,
    '',
  ];

  if (voteIsLive()) {
    lines.push(
      `Election Day is ${labelFromKey(electionDay)}. Polls are open 7 am to 7 pm. Hours and polling places: ${link('/go-vote')}. Source: ${voteSource.url}`,
      '',
    );
  }

  lines.push('## Upcoming events', '');
  if (upcoming.length === 0) lines.push('No upcoming listings are on the calendar.', '');
  for (const event of upcoming) {
    const when = `${formatLong(event.data.start)}, ${whenLabel(event.data.schedule, event.data.start, event.data.end)}`;
    lines.push(`### ${event.data.title}`);
    lines.push(`${when}. ${event.data.city}. ${event.data.venue}.`);
    lines.push(event.data.summary);
    lines.push(link(`/events/${event.id}`));
    if (event.data.sourceUrl) lines.push(`Source: ${event.data.sourceUrl}`);
    lines.push('');
  }

  lines.push('## News', '');
  for (const story of stories) {
    lines.push(`### ${story.data.title}`);
    lines.push(`${formatLong(story.data.pubDate)}. ${story.data.place}.`);
    lines.push(story.data.description);
    lines.push(link(`/news/${story.id}`));
    if (story.data.sourceUrl) lines.push(`Source: ${story.data.sourceUrl}`);
    lines.push('');
  }

  lines.push('## Local businesses', '');
  for (const business of businesses) {
    lines.push(`### ${business.name}`);
    lines.push(business.summary);
    lines.push(`${[business.phone, business.place, business.hours].filter(Boolean).join('. ')}.`);
    lines.push(link(`/${business.slug}`));
    lines.push(`Source: ${business.website}`);
    lines.push('');
  }

  lines.push('## Public notices', '');
  for (const update of updates) {
    lines.push(`### ${update.data.title}`);
    lines.push(`${formatLong(update.data.pubDate)}. ${update.data.agency}.`);
    lines.push(update.data.description);
    lines.push(link(`/government/${update.id}`));
    lines.push(`Source: ${update.data.sourceUrl}`);
    lines.push('');
  }

  return `${lines.join('\n')}\n`;
}
