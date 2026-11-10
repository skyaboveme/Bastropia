export type EventBanner = {
  id: string;
  name: string;
  src: string;
  alt: string;
  href: string;
};

/**
 * Events-page banner. Same 1200×500 frame as the site banner.
 * One monthly sponsor is typical; multiple entries rotate.
 */
export const eventBanners: EventBanner[] = [
  {
    id: 'community-unity-2026',
    name: 'City of Bastrop Community Unity',
    src: '/images/banners/community-unity-2026.png',
    alt: 'City of Bastrop Community Unity. Sunday, November 15, 2026, 1–5 PM. Free Thanksgiving meal; RSVP required.',
    href: 'https://www.eventbrite.com/e/city-of-bastrop-community-unity-2026-tickets-2003739037400',
  },
];
