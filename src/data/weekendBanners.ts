export type WeekendBanner = {
  id: string;
  name: string;
  src: string;
  alt: string;
  href: string;
};

/**
 * This-weekend page banner. Same 1200×500 frame as the site and event banners.
 * One monthly sponsor is typical; multiple entries rotate.
 */
export const weekendBanners: WeekendBanner[] = [];
