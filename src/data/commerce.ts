export const placements = [
  {
    id: 'weekend-banner',
    name: 'Weekend banner',
    page: 'This weekend',
    where: 'Midway through the Friday–Sunday lineup',
    detail: 'A 1200×500 image. One monthly sponsor on This weekend. The Run of Site Banner does not run there.',
    rate: 250,
    unit: 'month',
  },
  {
    id: 'event-banner',
    name: 'Event banner',
    page: 'Events',
    where: 'Midway through the events list',
    detail: 'A 1200×500 image. One monthly sponsor on the events page. The Run of Site Banner does not run there.',
    rate: 300,
    unit: 'month',
  },
  {
    id: 'home-banner',
    name: 'Run of Site Banner',
    page: 'Every page',
    where: 'Midway down every public page',
    detail: 'A 1200×500 image across the county desk. It rotates with other Run of Site advertisers in this spot.',
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
