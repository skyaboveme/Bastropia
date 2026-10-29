import type { CollectionEntry } from 'astro:content';
import { facebookGroup, siteDescription, siteName, siteUrl } from '../data/site';
import { eventKey, TZ } from './time';

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
    '@type': 'Organization',
    '@id': orgId,
    name: siteName,
    url: `${siteUrl}/`,
    description: siteDescription,
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
    sameAs: [facebookGroup],
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

export function eventNode(event: CollectionEntry<'events'>) {
  const path = `/events/${event.id}`;
  const city = event.data.city === 'Countywide' ? 'Bastrop County' : event.data.city;
  const allDay = event.data.schedule === 'all-day';
  const address: Record<string, string> = {
    '@type': 'PostalAddress',
    addressLocality: city,
    addressRegion: 'TX',
    addressCountry: 'US',
  };
  if (event.data.address) address.streetAddress = event.data.address;
  const node: Record<string, unknown> = {
    '@type': 'Event',
    '@id': `${absolute(path)}#event`,
    name: event.data.title,
    description: event.data.summary,
    startDate: schemaDate(event.data.start, allDay),
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    eventStatus: 'https://schema.org/EventScheduled',
    url: absolute(path),
    location: {
      '@type': 'Place',
      name: event.data.venue,
      address,
    },
    organizer: event.data.organizer
      ? { '@type': 'Organization', name: event.data.organizer }
      : { '@id': orgId },
  };
  if (event.data.end) node.endDate = schemaDate(event.data.end, allDay);
  if (event.data.image) node.image = [absolute(event.data.image)];
  if (/^free\b/i.test(event.data.cost.trim())) {
    node.offers = {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock',
      url: absolute(path),
    };
  }
  return node;
}

export function newsNode(story: CollectionEntry<'news'>) {
  const path = `/news/${story.id}`;
  return {
    '@type': 'NewsArticle',
    '@id': `${absolute(path)}#article`,
    headline: story.data.title,
    description: story.data.description,
    datePublished: schemaDate(story.data.pubDate),
    dateModified: schemaDate(story.data.pubDate),
    articleSection: story.data.place,
    inLanguage: 'en-US',
    isAccessibleForFree: true,
    mainEntityOfPage: absolute(path),
    author: { '@id': orgId },
    publisher: {
      '@type': 'Organization',
      name: siteName,
      logo: { '@type': 'ImageObject', url: absolute('/brand/logo.png') },
    },
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
