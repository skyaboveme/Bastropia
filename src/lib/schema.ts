import type { CollectionEntry } from 'astro:content';
import { authorBySlug } from '../data/authors.ts';
import { offerText } from '../data/eatsSpecials.ts';
import { facebookGroup, facebookPage, siteDescription, siteName, siteUrl, tiktokProfile, youtubeChannel } from '../data/site.ts';
import { videoEmbed } from './dailyVideoFeed.ts';
import { mapsSearchUrl } from './maps.ts';
import { eventKey, TZ } from './time.ts';

export const orgId = `${siteUrl}/#organization`;
export const siteId = `${siteUrl}/#website`;

export function absolute(path: string) {
  return new URL(path, siteUrl).toString();
}

export function stringify(data: unknown) {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}

export function graph(nodes: Record<string, unknown>[]) {
  return { '@context': 'https://schema.org', '@graph': nodes };
}

export function organization() {
  return {
    '@type': 'NewsMediaOrganization',
    '@id': orgId,
    name: siteName,
    url: `${siteUrl}/`,
    description: siteDescription,
    publishingPrinciples: absolute('/corrections'),
    ethicsPolicy: absolute('/corrections'),
    correctionsPolicy: absolute('/corrections'),
    actionableFeedbackPolicy: absolute('/contact'),
    masthead: absolute('/staff'),
    logo: {
      '@type': 'ImageObject',
      url: absolute('/brand/logo.png'),
      width: 1024,
      height: 1024,
    },
    areaServed: {
      '@type': 'AdministrativeArea',
      name: 'Bastrop County, Texas',
    },
    sameAs: [facebookPage, facebookGroup, youtubeChannel, tiktokProfile],
    knowsAbout: [
      'Bastrop County events',
      'Bastrop Texas',
      'Elgin Texas',
      'Smithville Texas',
      'Cedar Creek Texas',
      'burn bans',
      'local government meetings',
    ],
  };
}

export function website() {
  return {
    '@type': 'WebSite',
    '@id': siteId,
    name: siteName,
    url: `${siteUrl}/`,
    description: siteDescription,
    inLanguage: 'en-US',
    publisher: { '@id': orgId },
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${siteUrl}/search?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
}

export function webPage(options: {
  path: string;
  name: string;
  description: string;
  type?: string;
  image?: string;
}) {
  return {
    '@type': options.type ?? 'WebPage',
    '@id': `${absolute(options.path)}#webpage`,
    url: absolute(options.path),
    name: options.name,
    description: options.description,
    isPartOf: { '@id': siteId },
    publisher: { '@id': orgId },
    inLanguage: 'en-US',
    ...(options.image ? { primaryImageOfPage: absolute(options.image) } : {}),
  };
}

export function breadcrumb(items: { name: string; path: string }[]) {
  const chain = [{ name: siteName, path: '/' }, ...items];
  return {
    '@type': 'BreadcrumbList',
    itemListElement: chain.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: absolute(item.path),
    })),
  };
}

export function linkList(name: string, items: { name: string; path: string }[]) {
  return {
    '@type': 'ItemList',
    name,
    numberOfItems: items.length,
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      url: absolute(item.path),
    })),
  };
}

function offsetFor(date: Date) {
  const name = new Intl.DateTimeFormat('en-US', { timeZone: TZ, timeZoneName: 'longOffset' })
    .formatToParts(date)
    .find((part) => part.type === 'timeZoneName')?.value ?? 'GMT-06:00';
  const match = name.match(/([+-])(\d{1,2})(?::?(\d{2}))?/);
  if (!match) return '-06:00';
  return `${match[1]}${match[2].padStart(2, '0')}:${(match[3] ?? '00').padStart(2, '0')}`;
}

/** Local civil time, so an all-day listing stays on the county's calendar day. */
export function schemaDate(date: Date, allDay = false) {
  if (allDay) return eventKey(date);
  const bag: Record<string, string> = {};
  for (const part of new Intl.DateTimeFormat('en-US', {
    timeZone: TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date)) {
    bag[part.type] = part.value;
  }
  const hour = bag.hour === '24' ? '00' : bag.hour;
  return `${bag.year}-${bag.month}-${bag.day}T${hour}:${bag.minute}:${bag.second}${offsetFor(date)}`;
}

const eventStatusUrl: Record<string, string> = {
  scheduled: 'https://schema.org/EventScheduled',
  cancelled: 'https://schema.org/EventCancelled',
  postponed: 'https://schema.org/EventPostponed',
  rescheduled: 'https://schema.org/EventRescheduled',
  'moved-online': 'https://schema.org/EventMovedOnline',
};

const attendanceUrl: Record<string, string> = {
  offline: 'https://schema.org/OfflineEventAttendanceMode',
  online: 'https://schema.org/OnlineEventAttendanceMode',
  mixed: 'https://schema.org/MixedEventAttendanceMode',
};

/** Price from the cost line. Vague costs such as "See the listing" stay off the schema. */
export function eventOffers(cost: string, url: string) {
  const text = cost.trim();
  if (!text || /^see the listing$/i.test(text) || /^included with\b/i.test(text)) return undefined;
  if (/^free\b/i.test(text)) {
    return {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock',
      url,
      description: text,
    };
  }
  const amounts = [...text.matchAll(/\$(\d+(?:\.\d{1,2})?)/g)].map((match) => match[1]);
  if (!amounts.length) return undefined;
  if (amounts.length === 1) {
    return {
      '@type': 'Offer',
      price: amounts[0],
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock',
      url,
      description: text,
    };
  }
  const numbers = amounts.map(Number);
  return {
    '@type': 'AggregateOffer',
    lowPrice: String(Math.min(...numbers)),
    highPrice: String(Math.max(...numbers)),
    priceCurrency: 'USD',
    offerCount: amounts.length,
    url,
    description: text,
  };
}

function performerNames(value: string | string[] | undefined) {
  if (!value) return [];
  return (Array.isArray(value) ? value : [value]).map((name) => name.trim()).filter(Boolean);
}

export function eventNode(event: CollectionEntry<'events'>) {
  const path = `/events/${event.id}`;
  const page = absolute(path);
  const city = event.data.city === 'Countywide' ? 'Bastrop County' : event.data.city;
  const allDay = event.data.schedule === 'all-day';
  const address: Record<string, string> = {
    '@type': 'PostalAddress',
    addressLocality: city,
    addressRegion: 'TX',
    addressCountry: 'US',
  };
  if (event.data.address) address.streetAddress = event.data.address;
  const status = event.data.eventStatus ?? 'scheduled';
  const attendance = event.data.attendanceMode ?? (event.data.streamUrl ? 'mixed' : 'offline');
  const node: Record<string, unknown> = {
    '@type': 'Event',
    '@id': `${page}#event`,
    name: event.data.title,
    description: event.data.summary,
    startDate: schemaDate(event.data.start, allDay),
    url: page,
    location: {
      '@type': 'Place',
      name: event.data.venue,
      address,
    },
    organizer: event.data.organizer
      ? { '@type': 'Organization', name: event.data.organizer }
      : { '@id': orgId },
  };
  if (eventStatusUrl[status]) node.eventStatus = eventStatusUrl[status];
  if (attendanceUrl[attendance]) node.eventAttendanceMode = attendanceUrl[attendance];
  if (event.data.end) node.endDate = schemaDate(event.data.end, allDay);
  if (event.data.image) node.image = [absolute(event.data.image)];
  const offers = eventOffers(event.data.cost, event.data.sourceUrl || page);
  if (offers) node.offers = offers;
  const performers = performerNames(event.data.performer);
  if (performers.length === 1) node.performer = { '@type': 'Person', name: performers[0] };
  else if (performers.length > 1) node.performer = performers.map((name) => ({ '@type': 'Person', name }));
  return node;
}

export function articleAuthor(slug: string | undefined) {
  const person = authorBySlug(slug);
  if (!person) return { '@type': 'Organization', name: 'Bastropia desk', url: absolute('/staff') };
  return {
    '@type': 'Person',
    name: person.name,
    url: absolute(`/authors/${person.slug}`),
    ...(person.jobTitle ? { jobTitle: person.jobTitle } : {}),
  };
}

export function newsImage(path: string, size?: { width: number; height: number }) {
  return {
    '@type': 'ImageObject',
    url: absolute(path),
    ...(size?.width && size?.height ? { width: size.width, height: size.height } : {}),
  };
}

export function newsNode(story: CollectionEntry<'news'>, size?: { width: number; height: number }) {
  const path = `/news/${story.id}`;
  const modified = story.data.updated ?? story.data.pubDate;
  const facts = story.data.keyFacts?.map((fact) => fact.trim()).filter(Boolean) ?? [];
  return {
    '@type': 'NewsArticle',
    '@id': `${absolute(path)}#article`,
    headline: story.data.title,
    description: story.data.description,
    ...(facts.length ? { abstract: facts.join(' ') } : {}),
    datePublished: schemaDate(story.data.pubDate),
    dateModified: schemaDate(modified),
    articleSection: story.data.place,
    inLanguage: 'en-US',
    isAccessibleForFree: true,
    mainEntityOfPage: absolute(path),
    ...(story.data.image ? { image: [newsImage(story.data.image, size)] } : {}),
    dateline: story.data.place,
    author: articleAuthor(story.data.author),
    publisher: {
      '@type': 'NewsMediaOrganization',
      name: siteName,
      logo: { '@type': 'ImageObject', url: absolute('/brand/logo.png'), width: 1024, height: 1024 },
    },
    speakable: {
      '@type': 'SpeakableSpecification',
      cssSelector: ['.page-head h1', '.page-head .lede'],
    },
    ...(story.data.sourceUrl ? { isBasedOn: story.data.sourceUrl } : {}),
  };
}

export function dailyVideoNode(video: { videoId: string; title: string; published?: string }) {
  const title = video.title.trim();
  if (!title || !/^[\w-]{11}$/.test(video.videoId)) return undefined;
  const published = video.published && !Number.isNaN(Date.parse(video.published)) ? video.published : '';
  return {
    '@type': 'VideoObject',
    name: title,
    description: `${title}. The newest full episode from the Bastropia YouTube channel.`,
    thumbnailUrl: [`https://i.ytimg.com/vi/${video.videoId}/hqdefault.jpg`],
    ...(published ? { uploadDate: published } : {}),
    embedUrl: videoEmbed(video.videoId),
    contentUrl: `https://www.youtube.com/watch?v=${video.videoId}`,
    publisher: { '@id': orgId },
  };
}

function tidy(value: string) {
  return (value || '').replace(/\s+/g, ' ').trim();
}

/** Meta description built only from fields already stored on the listing. */
export function listingSummary(business: {
  category: string;
  city: string;
  details: string;
  phone: string;
  address: string;
  hours: string;
  daily_special: string;
}) {
  const details = tidy(business.details);
  const base = details || `${tidy(business.category)} in ${tidy(business.city)}.`;
  const extras = [business.address, business.phone, business.hours, business.daily_special]
    .map(tidy)
    .filter((value) => value && !base.toLowerCase().includes(value.toLowerCase()));
  let text = base;
  for (const extra of extras) {
    const next = `${text} ${extra}`;
    if (next.length <= 160) text = next;
  }
  if (text.length <= 160) return text;
  const cut = text.slice(0, 157);
  const space = cut.lastIndexOf(' ');
  return `${(space > 100 ? cut.slice(0, space) : cut).trimEnd()}…`;
}

function listingSchemaDescription(business: {
  category: string;
  city: string;
  details: string;
  phone: string;
  address: string;
  hours: string;
  daily_special: string;
}) {
  const details = tidy(business.details);
  if (details.length >= 80) return details;
  return listingSummary(business);
}

export function directoryBusiness(business: {
  slug: string;
  name: string;
  category: string;
  details: string;
  phone: string;
  website: string;
  address: string;
  city: string;
  areas: string;
  hours: string;
  daily_special: string;
}) {
  const path = `/${business.slug}`;
  const digits = business.phone.replace(/\D/g, '');
  const telephone = digits.length === 10 ? `+1${digits}` : digits.length === 11 ? `+${digits}` : '';
  const areas = business.areas.split(',').map((name) => name.trim()).filter(Boolean);
  const hours = tidy(business.hours);
  const map = mapsSearchUrl(business.address);
  return {
    '@type': 'LocalBusiness',
    '@id': `${absolute(path)}#business`,
    name: business.name,
    description: listingSchemaDescription(business),
    url: absolute(path),
    ...(telephone ? { telephone } : {}),
    ...(business.website ? { sameAs: [business.website] } : {}),
    ...(map ? { hasMap: map } : {}),
    ...(hours ? { openingHours: hours } : {}),
    address: {
      '@type': 'PostalAddress',
      ...(business.address ? { streetAddress: business.address } : {}),
      addressLocality: business.city,
      addressRegion: 'TX',
      addressCountry: 'US',
    },
    areaServed: (areas.length ? areas : [business.city]).map((name) => ({ '@type': 'AdministrativeArea', name })),
  };
}

const churchConfirm = 'Confirm these times with the church. They were taken from a directory listing, not the congregation’s own page.';

export function churchDirectory(list: {
  name: string;
  denomination: string;
  city: string;
  address: string;
  times: string;
  website: string;
  confirmWithChurch: boolean;
}[]) {
  return {
    '@type': 'ItemList',
    name: 'Bastrop County churches with posted worship times',
    numberOfItems: list.length,
    itemListElement: list.map((church, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': 'Church',
        name: church.name,
        url: church.website,
        description: [church.denomination, church.times, church.confirmWithChurch ? churchConfirm : ''].filter(Boolean).join(' '),
        address: {
          '@type': 'PostalAddress',
          ...(church.address ? { streetAddress: church.address } : {}),
          addressLocality: church.city,
          addressRegion: 'TX',
          addressCountry: 'US',
        },
      },
    })),
  };
}

export function eatDealList(
  name: string,
  groups: { place: { name: string; city: string; href: string }; offers: Parameters<typeof offerText>[0][] }[],
) {
  return {
    '@type': 'ItemList',
    name,
    numberOfItems: groups.length,
    itemListElement: groups.map((group, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: `${group.place.name}, ${group.place.city}`,
      description: group.offers.map((offer) => offerText(offer)).join(' '),
      url: group.place.href,
    })),
  };
}

export function localBusiness(business: {
  slug: string;
  name: string;
  summary: string;
  phoneHref?: string;
  email?: string;
  shareImage: string;
  website: string;
  schemaType: string;
  sameAs: string[];
  areas: string[];
  address: { locality: string; region: string; postalCode?: string };
  geo?: { latitude: number; longitude: number };
  openingHours?: { days: string[]; opens: string; closes: string };
}) {
  const path = `/${business.slug}`;
  return {
    '@type': business.schemaType,
    '@id': `${absolute(path)}#business`,
    name: business.name,
    description: business.summary,
    url: absolute(path),
    ...(business.phoneHref ? { telephone: business.phoneHref.replace('tel:', '') } : {}),
    email: business.email,
    image: absolute(business.shareImage),
    address: {
      '@type': 'PostalAddress',
      addressLocality: business.address.locality,
      addressRegion: business.address.region,
      postalCode: business.address.postalCode,
      addressCountry: 'US',
    },
    ...(business.geo
      ? { geo: { '@type': 'GeoCoordinates', latitude: business.geo.latitude, longitude: business.geo.longitude } }
      : {}),
    areaServed: business.areas.map((name) => ({ '@type': 'AdministrativeArea', name })),
    ...(business.openingHours
      ? {
          openingHoursSpecification: {
            '@type': 'OpeningHoursSpecification',
            dayOfWeek: business.openingHours.days,
            opens: business.openingHours.opens,
            closes: business.openingHours.closes,
          },
        }
      : {}),
    sameAs: [business.website, ...business.sameAs.filter((url) => url !== business.website)],
  };
}

export function noticeNode(update: CollectionEntry<'updates'>) {
  const path = `/government/${update.id}`;
  return {
    '@type': 'Article',
    '@id': `${absolute(path)}#article`,
    headline: update.data.title,
    description: update.data.description,
    datePublished: schemaDate(update.data.pubDate),
    inLanguage: 'en-US',
    mainEntityOfPage: absolute(path),
    author: { '@type': 'Organization', name: update.data.agency },
    publisher: { '@id': orgId },
    isBasedOn: update.data.sourceUrl,
  };
}
