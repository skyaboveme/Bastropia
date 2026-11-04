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
export const homeBanners: HomeBanner[] = [
  {
    name: 'Barron Homes',
    src: '/images/banners/barron-homes.jpg',
    alt: 'Barron Homes. Your land. Your design. Your home. Custom homes in Bastrop County. Call or text (512) 750-7625.',
    href: 'https://barronhomesinc.com/',
  },
  {
    name: 'Barefoot Flower Farms',
    src: '/images/banners/barefoot-flower-farms.png',
    alt: 'Barefoot Flower Farms. Fresh blooms, straight from our fields. Grown in Bastrop County.',
    href: 'https://barefootflowerfarms.com/',
  },
  {
    name: 'String Prairie Heating & Air',
    src: '/images/banners/string-prairie-heating.png',
    alt: 'String Prairie Heating & Air. Cool air. Warm homes. Real neighbors. Call or book online at (512) 924-9744.',
    href: 'https://stringprairieheatingandair.com/',
  },
];
