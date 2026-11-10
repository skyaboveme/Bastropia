export const placements = [
  {
    id: 'weekend-sponsor',
    name: 'Weekend sponsor',
    page: 'This weekend',
    where: 'Above the Friday–Sunday lineup',
    detail: 'Friday, Saturday, and Sunday. For restaurants, markets, and anything that belongs on a Saturday.',
    rate: 75,
    unit: 'weekend',
  },
  {
    id: 'calendar-sponsor',
    name: 'Calendar sponsor',
    page: 'Calendar',
    where: 'Under the month grid',
    detail: 'Seen by people already planning a day in the county.',
    rate: 200,
    unit: 'month',
  },
  {
    id: 'home-banner',
    name: 'Site banner',
    page: 'Every page',
    where: 'Near the bottom of every public page',
    detail: 'A 1200×500 image. It runs the full width about midway down every public page and rotates with the other banners in this spot.',
    rate: 400,
    unit: 'month',
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
