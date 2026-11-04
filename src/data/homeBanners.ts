export type HomeBanner = {
  name: string;
  src: string;
  alt: string;
  href: string;
};

/**
 * Front-page banners. Each file is 1200×500.
 * Add one object per advertiser. The spot rotates when there is more than one.
 */
export const homeBanners: HomeBanner[] = [];
