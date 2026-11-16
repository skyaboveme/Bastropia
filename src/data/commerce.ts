export const placements = [
  {
    id: 'front-banner',
    name: 'Front page sponsor',
    page: 'Front page',
    where: 'After the daily video',
    detail: 'Shown large, before the lead story. One sponsor for the month, or a short rotation if two reserve it.',
    rate: 150,
    unit: 'month',
  },
  {
    id: 'news-banner',
    name: 'News sponsor',
    page: 'News',
    where: 'After the daily video, before the headlines',
    detail: 'Shown large. One sponsor for the month, or a short rotation if two reserve it.',
    rate: 150,
    unit: 'month',
  },
  {
    id: 'scores-banner',
    name: 'Scores sponsor',
    page: 'Scores',
    where: 'After the local scoreboard, before the college scores',
    detail: 'Shown large on the Friday night scoreboard. One sponsor for the month, or a short rotation if two reserve it.',
    rate: 175,
    unit: 'month',
  },
  {
    id: 'event-banner',
    name: 'Events sponsor',
    page: 'Events',
    where: 'After the first five listings',
    detail: 'Shown large. One sponsor for the month, or a short rotation if two reserve it.',
    rate: 150,
    unit: 'month',
  },
  {
    id: 'weather-banner',
    name: 'Weather sponsor',
    page: 'Weather',
    where: 'After the current conditions, before the seven-day forecast',
    detail: 'Shown large. One sponsor for the month, or a short rotation if two reserve it.',
    rate: 200,
    unit: 'month',
  },
  {
    id: 'weekend-banner',
    name: 'Weekend sponsor',
    page: 'This weekend',
    where: 'After the first five weekend listings',
    detail: 'Shown large. One sponsor for the month, or a short rotation if two reserve it.',
    rate: 150,
    unit: 'month',
  },
  {
    id: 'home-banner',
    name: 'Run of Site banner',
    page: 'Every page',
    where: 'A short strip on public pages',
    detail: 'On most pages it sits under the title. On the front page it sits above the daily video. On Government it sits below the emergency numbers and public notices. It rotates, and it stays off the burn ban, thanks, and the forms.',
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
