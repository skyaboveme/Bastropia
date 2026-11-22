export type EventBanner = {
  id: string;
  name: string;
  src: string;
  alt: string;
  href: string;
  /** Inclusive last day to show this banner, YYYY-MM-DD in America/Chicago. */
  endDate?: string;
};

/**
 * Events-page banner. Same 1200×500 frame as the site banner.
 * One monthly sponsor is typical; multiple entries rotate.
 * An empty list leaves the spot blank. A banner past endDate is left off at request time.
 */
export const eventBanners: EventBanner[] = [];
