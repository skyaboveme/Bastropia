import type { City } from './taxonomy';
import type { TownName } from '../lib/weather';

export type TownPage = {
  slug: string;
  name: Exclude<City, 'Countywide'>;
  weather: TownName;
  lede: string;
  /** YouTube channel ids from src/data/youtubeChannels.ts. */
  channels: string[];
  /** Football school ids from src/lib/fridayScores.ts. */
  football: string[];
};

export const townPages: TownPage[] = [
  {
    slug: 'bastrop',
    name: 'Bastrop',
    weather: 'Bastrop',
    lede: 'The county seat. Weather, this week’s listings, Bastrop ISD dates, and headlines that name Bastrop.',
    channels: ['bastrop-isd', 'city-bastrop'],
    football: ['bastrop'],
  },
  {
    slug: 'elgin',
    name: 'Elgin',
    weather: 'Elgin',
    lede: 'Weather, this week’s listings, Elgin ISD dates, and headlines that name Elgin.',
    channels: ['elgin-isd'],
    football: ['elgin'],
  },
  {
    slug: 'smithville',
    name: 'Smithville',
    weather: 'Smithville',
    lede: 'Weather, this week’s listings, Smithville ISD dates, and headlines that name Smithville.',
    channels: ['smithville-isd'],
    football: ['smithville'],
  },
  {
    slug: 'cedar-creek',
    name: 'Cedar Creek',
    weather: 'Cedar Creek',
    lede: 'Weather, this week’s listings, and Bastrop ISD dates for Cedar Creek.',
    channels: ['bastrop-isd'],
    football: ['cedar-creek'],
  },
  {
    slug: 'mcdade',
    name: 'McDade',
    weather: 'McDade',
    lede: 'Weather, this week’s listings, and the McDade ISD office.',
    channels: [],
    football: [],
  },
  {
    slug: 'paige',
    name: 'Paige',
    weather: 'Paige',
    lede: 'Weather and this week’s listings. A Paige address can fall in more than one school district.',
    channels: [],
    football: [],
  },
];

export const townBySlug = (slug: string) => townPages.find((town) => town.slug === slug);

export const townByName = (name: string) => townPages.find((town) => town.name === name);

export const townPath = (name: string) => {
  const town = townByName(name);
  return town ? `/${town.slug}` : `/events?city=${encodeURIComponent(name)}`;
};
