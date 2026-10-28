export const placements = [
  {
    id: 'river-banner',
    name: 'River banner',
    page: 'Home',
    where: 'Under the weekend plans on the homepage',
    detail: 'One advertiser. The first thing people see after today’s events.',
    weeklyRate: 420,
  },
  {
    id: 'weekend-sponsor',
    name: 'Weekend sponsor',
    page: 'This weekend',
    where: 'Above the Friday–Sunday lineup',
    detail: 'For restaurants, markets, and anything that belongs on a Saturday.',
    weeklyRate: 180,
  },
  {
    id: 'news-rail',
    name: 'News rail',
    page: 'News',
    where: 'Beside the county news list',
    detail: 'A quiet placement for shops, clinics, and services people look up on purpose.',
    weeklyRate: 240,
  },
  {
    id: 'live-companion',
    name: 'Live companion',
    page: 'Live',
    where: 'Below the public-meeting streams',
    detail: 'Labeled as an ad. It cannot be designed to look like a county notice.',
    weeklyRate: 160,
  },
  {
    id: 'calendar-sponsor',
    name: 'Calendar sponsor',
    page: 'Calendar',
    where: 'Under the month grid',
    detail: 'Seen by people already planning a day in the county.',
    weeklyRate: 200,
  },
] as const;

export type PlacementId = (typeof placements)[number]['id'];

export const listingTiers = [
  {
    id: 'community',
    name: 'Community',
    price: 0,
    days: 0,
    summary: 'Free for gatherings, nonprofits, churches, schools, and civic groups.',
    perks: [
      'Title, time, place, and a description',
      'Reviewed before it is published',
      'Shows on the day it happens and in search',
    ],
  },
  {
    id: 'spotlight',
    name: 'Spotlight',
    price: 35,
    days: 7,
    summary: 'A stronger card when the usual listing is too easy to miss.',
    perks: [
      'Highlighted card for 7 days',
      'Sorts above community listings',
      'Included on This Weekend when the date falls there',
    ],
  },
  {
    id: 'featured',
    name: 'Featured',
    price: 89,
    days: 14,
    summary: 'Homepage space for fundraisers, festivals, and ticketed nights.',
    perks: [
      'Featured on the homepage for 14 days',
      'Pinned near the top of its day',
      'Included in the weekend roundup',
    ],
  },
  {
    id: 'lost-pines',
    name: 'Lost Pines',
    price: 189,
    days: 30,
    summary: 'The county-wide push for events that fill a street or a park.',
    perks: [
      'Hero treatment on the homepage for 30 days',
      'Pinned to the top of its day',
      'A share in the Bastropia Facebook group',
      'Weekend sponsor treatment while it is coming up',
    ],
  },
] as const;

export type ListingTierId = (typeof listingTiers)[number]['id'];

export function placementById(id: string) {
  return placements.find((item) => item.id === id);
}

export function tierById(id: string) {
  return listingTiers.find((item) => item.id === id);
}
