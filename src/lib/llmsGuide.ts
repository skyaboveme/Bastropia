import { getCollection } from 'astro:content';
import { BCC_ORIGIN, eventHref, listEvents } from './eventSource';
import { burnBan } from '../data/burnBan';
import { burnView } from './burnBanView';
import { businesses } from '../data/businesses';
import { aggregatorTimesCount, churchesWithTimes, churchesWithoutTimes, officialTimesCount, officialTimesNote, aggregatorTimesNote } from '../data/churches';
import { eatDayGroups, offerText } from '../data/eatsSpecials';
import { facebookPage, siteDescription, siteUrl, youtubeChannel } from '../data/site';
import { electionDay, voteIsLive, voteSource } from '../data/vote';
import { addDays, chicagoParts, eventKey, formatLong, labelFromKey, whenLabel } from './time';

const pages: { path: string; label: string; note: string }[] = [
  { path: '/', label: 'Front page', note: 'Today’s news, Around the county, and upcoming events.' },
  { path: '/events', label: 'Events', note: 'List and month view. Bastrop County Calendar (https://bastropcountycalendar.com) is the authority for county events. /calendar opens the month view.' },
  { path: '/this-weekend', label: 'This weekend', note: 'Friday, Saturday, and Sunday plans in the same list as the events calendar.' },
  { path: '/news', label: 'News', note: 'Short desk stories with a link to the public source.' },
  { path: '/guides', label: 'County guides', note: 'Evergreen guides to moving, parks and the river, burn bans, county government, and Elgin, Smithville, and Paige.' },
  { path: '/development', label: 'Development tracker', note: 'Data centers, annexations, restaurants, industry, expansions, and new retail under watch in Bastrop County' },
  { path: '/eats', label: 'Eats', note: 'Happy hours and specials for today and tomorrow, posted on each restaurant or bar’s own site. Confirm before you go.' },
  { path: '/heb-specials', label: 'H-E-B Weekly Specials in Bastrop', note: 'This week’s prices from the H-E-B weekly ad for Bastrop H-E-B Plus! store 582 at 104 Hasler Blvd. Bastropia is not affiliated with H-E-B. Confirm the price at the store.' },
  { path: '/churches', label: 'Churches', note: 'Bastrop County church directory. Worship times checked November 22, 2026 are listed first. Congregations with no posted schedule are named at the bottom. Confirm before you go.' },
  { path: '/new-here', label: 'New resident guide', note: 'Utilities, trash day, tax dates, and which commissioner covers your road' },
  { path: '/tips', label: 'Send a tip or photo', note: 'Neighbor tips and photos for the site and the Facebook group' },
  { path: '/newsletter', label: 'Newsletter', note: 'Free weekend email every Thursday at 7 AM, with reasons to subscribe' },
  { path: '/groups', label: 'Social', note: 'Latest public posts from the Bastropia Facebook page, then the directory of county groups and pages. /social opens this page' },
  { path: '/rss.xml', label: 'County RSS', note: 'Bastrop County news from this desk, county papers, and Austin newsrooms that name the county' },
  { path: '/events.xml', label: 'Events RSS', note: 'Feed of upcoming listings' },
  { path: '/burn-ban', label: 'Burn ban', note: 'Whether the county lists an outdoor burn ban' },
  { path: '/weather', label: 'Weather', note: 'Forecast, a live radar map of Bastrop County, and National Weather Service alerts.' },
  { path: '/now', label: 'Right now', note: 'The county numbers from the top of every page: weather, burn ban, river gauge, air, SH 71, US 290, schools, power, the USDA Texas feeder-steer price, and the last seven days of rain. Highway closures are on /roads.' },
  { path: '/metrics', label: 'County metrics', note: 'Sunrise and sunset, Lake Bastrop elevation, Colorado River gauge height at Bastrop, the same gauge as a paddling flow, school homepages, the EIA Texas weekly regular gasoline average, the EIA Gulf Coast on-highway diesel price, Aqua outages and drought stage, trash routes, Bastrop and Buescher park alerts, and a note that cedar season starts in December. The strip readings stay on /now. Lunch menus are links, not copied numbers.' },
  { path: '/cattle', label: 'Beef and cattle', note: 'Cattle inventory, beef cows, milk cows, calf crop, cattle on feed, slaughter, beef production, census herd size and sales, cash receipts, feeder and fed prices, boxed beef, and retail beef for the United States, Texas, and Bastrop County. Each figure is dated and linked. County inventory is the 2022 Census of Agriculture.' },
  { path: '/government', label: 'Government', note: 'Emergency numbers, services, and public notices' },
  { path: '/phone-numbers', label: 'Phone numbers', note: 'Sheriff, tax office, city hall, water, libraries, trash and recycling day, and school districts, with hours and the date each page was checked' },
  { path: '/schools', label: 'School status', note: 'Closed, delayed, or a normal day for Bastrop ISD, Elgin ISD, Smithville ISD, and McDade ISD' },
  { path: '/alerts', label: 'Text alerts', note: 'A text when the burn ban, school status, power, SH 71, US 290, county roads, or a named road changes. Each item is its own list.' },
  { path: '/videos', label: 'Videos', note: 'County live and recorded sources, plus videos about Bastrop from other channels' },
  { path: '/go-vote', label: 'Go Vote', note: 'Election Day is over. This address redirects to /results' },
  { path: '/election-night', label: 'Election night', note: 'Redirects to /results' },
  { path: '/results', label: 'Election results', note: 'Unofficial November 3, 2026 race-by-race totals from https://results.enr.clarityelections.com/TX/Bastrop/, Associated Press calls, vote centers, and the elections office central-count camera' },
  { path: '/scores', label: 'Friday night scores', note: 'Next kickoff and latest finals for Bastrop, Cedar Creek, Elgin, and Smithville, plus latest scores for Texas, Texas A&M, Texas State, Texas Tech, Baylor, Houston, and UTSA.' },
  { path: '/roads', label: 'Highway alerts', note: 'DriveTexas closures and crashes, then construction on SH 71, US 290, and other county roads' },
  { path: '/government/court-decisions', label: 'What the court decided', note: 'Three bullets after each Commissioners Court meeting, once the minutes are posted' },
  { path: '/about', label: 'About', note: 'What Bastropia is and is not' },
  { path: '/staff', label: 'Staff', note: 'Masthead. Stories use the Bastropia desk byline until a reporter is listed by name' },
  { path: '/authors', label: 'Authors', note: 'Byline list. Empty until a reporter is named. Stories stay the Bastropia desk' },
  { path: '/corrections', label: 'Corrections', note: 'Editorial policy and how to ask for a factual correction' },
  { path: '/contact', label: 'Contact', note: 'Tip form, event form, and the public Facebook group. No newsroom phone or street address' },
  { path: '/submit', label: 'Add an event', note: 'Add a county event at https://bastropcountycalendar.com/events/submit' },
  { path: '/llms-full.txt', label: 'Full text for models', note: 'Current listings, stories, and notices in one file' },
];

const towns = ['Bastrop', 'Elgin', 'Smithville', 'Cedar Creek', 'McDade', 'Paige'];

function link(path: string) {
  return new URL(path, siteUrl).toString();
}

export async function llmsIndex() {
  const guides = (await getCollection('guides')).sort((a, b) => a.data.title.localeCompare(b.data.title));
  const lines = [
    '# Bastropia',
    '',
    `> ${siteDescription} A community site, not Bastrop County government.`,
    '',
    `Bastropia covers Bastrop, Elgin, Smithville, Cedar Creek, McDade, Paige, and the rest of Bastrop County, Texas. Bastrop County Calendar (${BCC_ORIGIN}) is the authority for county events. A time, price, or address should be confirmed there.`,
    '',
    '## How to cite',
    'Name the site Bastropia and link the exact page. News is written by the Bastropia desk unless a story names a reporter on the masthead. Burn bans, court dates, office numbers, and listing times are summaries of public pages. The source linked on that page is the authority. The corrections policy is ' + link('/corrections') + '. Send a correction through ' + link('/tips') + '.',
    '',
    '## Start here',
    ...pages.map((page) => `- [${page.label}](${link(page.path)}): ${page.note}`),
    '',
    '## Guides',
    ...guides.map((guide) => `- [${guide.data.title}](${link(`/guides/${guide.id}`)}): ${guide.data.description}`),
    '',
    '## Towns',
    ...towns.map((town) => `- [This week in ${town}](${link(`/${town.toLowerCase().replace(/ /g, '-')}`)}): Weather, this week’s listings, school dates, and headlines for ${town}`),
    '',
    '## Local businesses',
    `- [Directory](${link('/directory')}): browse by category and town. A live listing is at /directory/l/{slug}`,
    `- [List your business free](${link('/directory/submit')})`,
    ...businesses.map((business) => `- [${business.name}](${link(`/${business.slug}`)}): ${business.summary}`),
    '',
    '## Optional',
    `- [Weather by town](${link('/weather?town=Elgin')}): Replace Elgin with Bastrop, Smithville, or Cedar Creek`,
    `- [Bastropia Facebook page](${facebookPage}): The public page`,
    `- [Facebook group](https://www.facebook.com/groups/bastropia): The community conversation, off this site`,
    `- [YouTube](${youtubeChannel}): County video`,
  ];
  return `${lines.join('\n')}\n`;
}

export async function llmsFull() {
  const today = eventKey(new Date());
  const [{ events, source }, news, notices, guides] = await Promise.all([
    listEvents(),
    getCollection('news'),
    getCollection('updates'),
    getCollection('guides'),
  ]);
  const upcoming = events
    .filter((event) => eventKey(event.data.start) >= today)
    .sort((a, b) => a.data.start.getTime() - b.data.start.getTime())
    .slice(0, 80);
  const stories = news.sort((a, b) => b.data.pubDate.getTime() - a.data.pubDate.getTime());
  const updates = notices.sort((a, b) => b.data.pubDate.getTime() - a.data.pubDate.getTime());

  const burn = burnView();
  const burnLine = burn.stale
    ? `Burn ban: status not confirmed since ${burn.checkedLong}. Last reading: ${burnBan.headline}. ${burnBan.summary} Source: ${burnBan.sourceUrl}`
    : `Burn ban: ${burnBan.headline}. ${burnBan.summary} Checked ${burnBan.checked}. Source: ${burnBan.sourceUrl}. Forest Service map: ${burnBan.forestUrl}`;
  const lines = [
    '# Bastropia',
    '',
    siteDescription,
    '',
    'Bastropia is a community site for Bastrop County, Texas. It is not the county, a city, or an emergency service. Burn bans, court dates, polling places, and office numbers are summaries of public pages. The linked official page is the authority.',
    '',
    burnLine,
    '',
  ];

  if (voteIsLive()) {
    lines.push(
      `Election Day is ${labelFromKey(electionDay)}. Polls are open 7 am to 7 pm. Hours and polling places: ${link('/go-vote')}. Source: ${voteSource.url}`,
      '',
    );
  }

  lines.push(
    '## Churches',
    '',
    `${churchesWithTimes.length + churchesWithoutTimes.length} congregations. ${churchesWithTimes.length} have posted worship times (${officialTimesCount} verified on the church’s own website on Nov. 22, 2026; ${aggregatorTimesCount} from a third-party listing). ${churchesWithoutTimes.length} have no times posted. Confirm before you go.`,
    link('/churches'),
    '',
  );
  for (const church of churchesWithTimes) {
    lines.push(`### ${church.name}`);
    lines.push(`${[church.denomination, church.city, church.address].filter(Boolean).join('. ')}.`);
    if (church.worshipTimes) lines.push(church.worshipTimes);
    if (church.midweekServices) lines.push(`Midweek: ${church.midweekServices}`);
    if (church.website) lines.push(church.website);
    if (church.facebook) lines.push(church.facebook);
    if (church.phone) lines.push(church.phone);
    lines.push(church.confirmWithChurch ? aggregatorTimesNote : officialTimesNote);
    lines.push('');
  }
  lines.push('### More churches in Bastrop County', '', 'No weekly schedule was posted for these congregations.', '');
  for (const church of churchesWithoutTimes) {
    const links = [church.website, church.facebook].filter(Boolean).join(' ');
    lines.push(`- ${church.name} (${[church.city, church.denomination].filter(Boolean).join(', ')})${church.address ? `. ${church.address}` : ''}${church.phone ? `. ${church.phone}` : ''}${links ? `. ${links}` : ''}`);
  }
  lines.push('');

  const todayKey = chicagoParts(new Date()).key;
  const tomorrowKey = addDays(todayKey, 1);
  lines.push(
    '## Happy hours and specials',
    '',
    'Posted on each restaurant or bar’s own site. Today and tomorrow are listed here. Some dated specials run November 16 through November 22, 2026. Confirm before you go.',
    link('/eats'),
    '',
  );
  for (const day of [
    { key: todayKey, label: 'Today' },
    { key: tomorrowKey, label: 'Tomorrow' },
  ]) {
    lines.push(`### ${day.label}, ${labelFromKey(day.key)}`, '');
    const groups = eatDayGroups(day.key);
    if (groups.length === 0) {
      lines.push('None posted.', '');
      continue;
    }
    for (const group of groups) {
      lines.push(`#### ${group.place.name}, ${group.place.city}`);
      for (const offer of group.offers) lines.push(`- ${offerText(offer)}`);
      if (group.place.where) lines.push(group.place.where);
      lines.push(group.place.href);
      lines.push('');
    }
  }

  lines.push('## Upcoming events', '', `Bastrop County Calendar is the authority for county events: ${BCC_ORIGIN}`, '');
  if (upcoming.length === 0) lines.push('No upcoming listings are on the calendar.', '');
  for (const event of upcoming) {
    const when = `${formatLong(event.data.start)}, ${whenLabel(event.data.schedule, event.data.start, event.data.end)}`;
    lines.push(`### ${event.data.title}`);
    lines.push(`${when}. ${event.data.city}. ${event.data.venue}.`);
    lines.push(event.data.summary);
    const href = eventHref(event, source);
    lines.push(href.startsWith('http') ? href : link(href));
    if (event.data.sourceUrl) lines.push(`Source: ${event.data.sourceUrl}`);
    lines.push('');
  }

  lines.push('## Guides', '');
  const guideList = guides.slice().sort((a, b) => a.data.title.localeCompare(b.data.title));
  for (const guide of guideList) {
    lines.push(`### ${guide.data.title}`);
    lines.push(`Updated ${formatLong(guide.data.updated)}.`);
    lines.push(guide.data.answer);
    lines.push(link(`/guides/${guide.id}`));
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
