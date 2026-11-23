/**
 * Directory marketing. Prices and live ad slots live here so a rate
 * change does not require a template edit.
 *
 * Slots with no paying advertiser fall back to a house promo.
 * A featured pin can also come from the D1 `tier` column
 * (migrations/0006_directory_tier.sql). See docs/directory-ads.md.
 */

export const directoryFounding = {
  /** First businesses to book Featured or Spotlight. */
  slots: 25,
  /** Months the founding rate stays locked. */
  months: 12,
} as const;

export type DirectoryProduct = {
  id: 'free' | 'featured' | 'spotlight' | 'partner';
  /** Form value on /advertise. Free listings use /directory/submit instead. */
  placement: '' | 'directory-featured' | 'directory-spotlight' | 'directory-partner';
  name: string;
  /** Dollars per month. Null means the desk quotes it. */
  price: number | null;
  /** Founding rate for the first directoryFounding.slots bookings. */
  foundingPrice: number | null;
  summary: string;
};

export const directoryProducts: DirectoryProduct[] = [
  {
    id: 'free',
    placement: '',
    name: 'Free listing',
    price: 0,
    foundingPrice: null,
    summary: 'Name, trade, town, and how to reach you. Reviewed before it is public.',
  },
  {
    id: 'featured',
    placement: 'directory-featured',
    name: 'Featured',
    price: 39,
    foundingPrice: 25,
    summary: 'Pinned at the top of matching town, category, and search results, with a Featured badge and your logo.',
  },
  {
    id: 'spotlight',
    placement: 'directory-spotlight',
    name: 'Spotlight',
    price: 99,
    foundingPrice: 69,
    summary: 'One sponsor tile above results for a category, a town, or both.',
  },
  {
    id: 'partner',
    placement: 'directory-partner',
    name: 'Partner page',
    price: null,
    foundingPrice: null,
    summary: 'A custom branded page. Quoted on request.',
  },
];

export const directoryAdLimits = {
  /** Featured listings pinned above a single result set. */
  featuredPerResults: 3,
  /** A native ad card after this many organic results. */
  infeedEvery: 10,
  /** Unsold house ads start after this many results, never above them. */
  houseAfter: 3,
} as const;

export type DirectoryAdSlot = {
  /** Lowercase letters, numbers, and hyphens. Used as the ad id in stats. */
  id: string;
  kind: 'spotlight' | 'infeed';
  /** Shown after "sponsored by". */
  name: string;
  /** Tile headline, for example "Heating & AC in Elgin". */
  line: string;
  href: string;
  logo?: string;
  /**
   * D1 businesses.id when this advertiser has a listing.
   * Clicks then go through /go/biz/:id so the listing click counter moves.
   */
  businessId?: string;
  label?: 'Sponsored' | 'Partner';
  /** Empty means the slot can run in every town. */
  towns?: string[];
  /** Directory group ids from directoryCategoryGroups.json, such as "home-repair". */
  categories?: string[];
  /** Concept ids from directorySynonyms.json, such as "hvac". */
  concepts?: string[];
  /** Phrases matched against the typed search, towns already removed. */
  keywords?: string[];
  /** Inclusive, America/Chicago, YYYY-MM-DD. */
  start: string;
  end: string;
};

/**
 * Paying spotlight and in-feed creatives.
 * Leave this empty and the directory shows house promos.
 *
 * Example:
 * {
 *   id: 'spotlight-hvac-elgin',
 *   kind: 'spotlight',
 *   name: 'String Prairie Heating & Air',
 *   line: 'Heating & AC in Elgin',
 *   href: '/StringPrairieHeatingandAir',
 *   logo: '/images/businesses/string-prairie/logo.svg',
 *   label: 'Partner',
 *   towns: ['Elgin'],
 *   categories: ['home-repair'],
 *   start: '2026-11-23',
 *   end: '2027-11-23',
 * }
 */
export const directoryAdSlots: DirectoryAdSlot[] = [];

/**
 * Feature a listing that is not flagged in D1 yet (partner pages live in
 * src/data/businesses.ts and have no tier column). `match` is a slug, id, or name.
 */
export const directoryFeatured: { match: string; start: string; end: string }[] = [];
