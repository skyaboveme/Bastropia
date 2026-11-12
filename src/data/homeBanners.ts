export type HomeBanner = {
  id: string;
  name: string;
  src: string;
  alt: string;
  href: string;
};

/**
 * Sitewide rotating banners. Each file is 1200×500.
 * Add one object per advertiser. The spot rotates when there is more than one.
 */
export const homeBanners: HomeBanner[] = [
  {
    id: 'barron-homes',
    name: 'Barron Homes',
    src: '/images/banners/barron-homes.jpg',
    alt: 'Barron Homes. Your land. Your design. Your home. Custom homes in Bastrop County. Call or text (512) 750-7625.',
    href: 'https://barronhomesinc.com/',
  },
  {
    id: 'barefoot-flower-farms',
    name: 'Barefoot Flower Farms',
    src: '/images/banners/barefoot-flower-farms.png',
    alt: 'Barefoot Flower Farms. Fresh blooms, straight from our fields. Grown in Bastrop County.',
    href: 'https://barefootflowerfarms.com/',
  },
  {
    id: 'string-prairie-heating',
    name: 'String Prairie Heating & Air',
    src: '/images/banners/string-prairie-heating.jpg',
    alt: 'String Prairie Heating & Air. Cool air. Warm homes. Family-owned AC and heating for Bastrop County. Call (512) 924-9744.',
    href: 'https://stringprairieheatingandair.com/',
  },
  {
    id: 'rosatex-landscaping',
    name: 'RosaTex Landscaping',
    src: '/images/banners/rosatex-landscaping.jpg',
    alt: 'RosaTex Landscaping. Keep your property looking its best. Lawn mowing, tree trimming, junk removal, and mushroom compost. Call or text (512) 798-2569.',
    href: 'https://rosatexlandscaping.com/',
  },
  {
    id: 'rosanky-baptist-church',
    name: 'Rosanky Baptist Church',
    src: '/images/banners/rosanky-baptist-church.jpg',
    alt: 'Rosanky Baptist Church. A place for faith, family, and community in Bastrop County. Bible study 9:00 AM, worship 10:00 AM every Sunday. 2160 FM 535, Rosanky. Call (512) 360-3968.',
    href: 'https://www.rosankybc.org/',
  },
  {
    id: 'highline',
    name: 'Highline',
    src: '/images/banners/highline.jpg',
    alt: 'Highline. Now serving Bastrop County. Rural internet. City-speed fiber. Fast, reliable fiber for rural homes. Check availability at highlinefast.com.',
    href: 'https://refer.highlinefast.com/stevegibson2',
  },
];
