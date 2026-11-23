export type SocialLane = 'government' | 'safety' | 'news' | 'community';

export type SocialSource = {
  id: string;
  name: string;
  href: string;
  lane: SocialLane;
};

/**
 * Public Facebook pages that returned a post in a logged-out fetch.
 * Private groups are not listed here. A page that starts answering with a
 * login wall is skipped for that run; the last good post stays in KV.
 */
export const socialSources: SocialSource[] = [
  { id: 'bastropia', name: 'Bastropia', href: 'https://www.facebook.com/bastropia', lane: 'news' },
  { id: 'city-bastrop', name: 'City of Bastrop', href: 'https://www.facebook.com/bastroptx', lane: 'government' },
  { id: 'county-oem', name: 'Bastrop County OEM', href: 'https://www.facebook.com/BastropCountyOEM', lane: 'safety' },
  { id: 'library', name: 'Bastrop Public Library', href: 'https://www.facebook.com/BastropPublicLibrary', lane: 'community' },
  { id: 'advertiser', name: 'The Bastrop Advertiser', href: 'https://www.facebook.com/bastropadvertiser', lane: 'news' },
  { id: 'city-elgin', name: 'City of Elgin', href: 'https://www.facebook.com/CityofElginTX', lane: 'government' },
  { id: 'sheriff', name: "Bastrop County Sheriff's Office", href: 'https://www.facebook.com/BastropCountySheriffsOffice', lane: 'safety' },
  { id: 'chamber', name: 'Bastrop Regional Chamber', href: 'https://www.facebook.com/BastropChamber', lane: 'community' },
  { id: 'city-smithville', name: 'City of Smithville', href: 'https://www.facebook.com/smithvilletx', lane: 'government' },
  { id: 'esd2', name: 'Bastrop County ESD 2', href: 'https://www.facebook.com/BastropESD2', lane: 'safety' },
  { id: 'parks', name: 'Bastrop Parks & Recreation', href: 'https://www.facebook.com/parksandrecbastroptx', lane: 'community' },
  { id: 'county-elections', name: 'Bastrop County Elections', href: 'https://www.facebook.com/BastropCountyElections', lane: 'government' },
  { id: 'police', name: 'Bastrop Police Department', href: 'https://www.facebook.com/bastroppd', lane: 'safety' },
  { id: 'bastrop-isd', name: 'Bastrop ISD', href: 'https://www.facebook.com/bastropisdtx', lane: 'community' },
  { id: 'bastrop-edc', name: 'Bastrop EDC', href: 'https://www.facebook.com/BastropTXEDC', lane: 'government' },
  { id: 'explore', name: 'Explore Bastrop County', href: 'https://www.facebook.com/ExploreBastropCounty', lane: 'community' },
];

export type SocialChannel = {
  id: string;
  name: string;
  channelId: string;
};

/** YouTube channels with a public RSS feed. Newest upload from each one. */
export const socialChannels: SocialChannel[] = [
  { id: 'bastropia', name: 'Bastropia', channelId: 'UCdxOffp6asSKV6aPNT1vkdA' },
  { id: 'city-bastrop', name: 'City of Bastrop', channelId: 'UCeI3MYcqXy8CPUt5UhA7bpw' },
  { id: 'bastrop-isd', name: 'Bastrop ISD', channelId: 'UCt_oytyw2_mYeH2D-aK7Sgg' },
  { id: 'elgin-isd', name: 'Elgin ISD', channelId: 'UCAhnregqlkNFKkhZAjirEFA' },
  { id: 'smithville-isd', name: 'Smithville ISD', channelId: 'UCBOeqJpncmFLwpZe80lSZNA' },
];

export const laneFilters = [
  { id: 'all', label: 'All' },
  { id: 'government', label: 'Government' },
  { id: 'safety', label: 'Public safety' },
  { id: 'news', label: 'News' },
  { id: 'community', label: 'Community' },
] as const;

/**
 * Page Plugin timelines that actually paint posts.
 * facebook.com/bastropia and facebook.com/bastroptx return a header and an
 * empty body (the timeline call 404s, and a tall logo is cropped by
 * small_header). These three return the timeline in a logged-out embed.
 */
export const pluginPages = [
  { name: 'City of Elgin', href: 'https://www.facebook.com/CityofElginTX', sourceId: 'city-elgin' },
  { name: 'City of Smithville', href: 'https://www.facebook.com/smithvilletx', sourceId: 'city-smithville' },
  { name: 'Bastrop County OEM', href: 'https://www.facebook.com/BastropCountyOEM', sourceId: 'county-oem' },
];

export function pluginSrc(href: string) {
  const url = new URL('https://www.facebook.com/plugins/page.php');
  url.searchParams.set('href', href);
  url.searchParams.set('tabs', 'timeline');
  url.searchParams.set('width', '500');
  url.searchParams.set('height', '560');
  url.searchParams.set('small_header', 'false');
  url.searchParams.set('adapt_container_width', 'true');
  url.searchParams.set('hide_cover', 'false');
  url.searchParams.set('show_facepile', 'false');
  return url.toString();
}

export function sourceInitial(name: string) {
  const letter = name.trim().charAt(0).toUpperCase();
  return /[A-Z0-9]/.test(letter) ? letter : 'B';
}
