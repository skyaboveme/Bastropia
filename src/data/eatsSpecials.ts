/** Posted happy hours and specials, copied from each restaurant’s own site. */

export type Offer = {
  what: string;
  time?: string;
  span?: string;
  discount?: string[];
  note?: string;
  days: number[];
  from?: string;
  until?: string;
};

export type EatPlace = {
  name: string;
  city: string;
  where?: string;
  phone?: string;
  href: string;
  hrefLabel: string;
  offers: Offer[];
};

const week = { from: '2026-11-16', until: '2026-11-22' };

export const eatPlaces: EatPlace[] = [
  {
    name: 'Bastrop Beer Company',
    city: 'Bastrop',
    where: '1008 Main Street, Bastrop, TX 78602',
    phone: '512-549-3722',
    href: 'https://bastropbeerco.com/',
    hrefLabel: 'bastropbeerco.com',
    offers: [
      {
        what: 'Happy hour',
        span: 'Tuesday–Friday',
        time: '3:00–6:00 p.m.',
        discount: ['$1 off pints, domestic beer, and wines', '10% off all to-go craft beer'],
        days: [2, 3, 4, 5],
      },
    ],
  },
  {
    name: 'Casa Chapala',
    city: 'Bastrop',
    where: '1800 Walnut Street, Bastrop',
    href: 'https://bastrop.casachapala.com/food-menu',
    hrefLabel: 'Casa Chapala Bastrop menu',
    offers: [
      {
        what: 'Happy hour',
        span: 'Monday–Thursday',
        time: '11:00 a.m.–7:00 p.m.',
        discount: ['$4 draft pints', '$6 Casa Rita', '$3.50 cantina tacos', '$6 shareable plates'],
        days: [1, 2, 3, 4],
      },
      {
        what: 'Kids eat free',
        span: 'Monday',
        time: 'All day',
        note: 'Conditions were not posted.',
        days: [1],
      },
      {
        what: 'Lunch buffet',
        span: 'Monday',
        time: '11:00 a.m.–2:00 p.m.',
        discount: ['$15.99, includes a drink'],
        days: [1],
      },
      {
        what: 'Patio Rita, any flavor',
        time: 'All day',
        days: [0, 1, 2, 3, 4, 5, 6],
      },
      {
        what: 'Sunday brunch buffet',
        span: 'Sunday',
        time: '9:00 a.m.–3:00 p.m.',
        days: [0],
      },
    ],
  },
  {
    name: 'Chapala Fiestas & Grill',
    city: 'Bastrop',
    href: 'https://chapalafiestas.com/bastrop-chapala-fiestas-and-grill-happy-hours-specials',
    hrefLabel: 'Chapala Fiestas specials',
    offers: [
      { what: 'Happy hour', span: 'Monday, Nov. 16', time: '11:00 a.m.–10:00 p.m.', days: [1], ...week },
      { what: 'Happy hour', span: 'Tuesday, Nov. 17', time: '11:00 p.m.–10:00 p.m.', note: 'The site lists the start as 11:00 p.m. Call before you plan on it.', days: [2], ...week },
      { what: 'Happy hour', span: 'Wednesday, Nov. 18', time: '11:00 a.m.–10:00 p.m.', discount: ['Margaritas, food, wine, and beer'], days: [3], ...week },
      { what: 'Happy hour', span: 'Thursday, Nov. 19', time: '11:00 a.m.–10:00 p.m.', days: [4], ...week },
      { what: 'Happy hour', span: 'Friday, Nov. 20', time: '11:00 a.m.–11:00 p.m.', days: [5], ...week },
      { what: 'Happy hour', span: 'Saturday, Nov. 21', time: '10:00 a.m.–11:00 p.m.', days: [6], ...week },
      { what: 'Happy hour', span: 'Sunday, Nov. 22', time: '10:00 a.m.–9:00 p.m.', days: [0], ...week },
    ],
  },
  {
    name: "Chili's Grill & Bar",
    city: 'Bastrop',
    where: '734 Highway 71, Bastrop, TX 78602',
    phone: '(512) 332-2644',
    href: 'https://www.chilis.com/locations/us/texas/bastrop/bastrop',
    hrefLabel: "Chili's Bastrop",
    offers: [
      {
        what: 'Happy hour',
        span: 'Monday–Friday',
        time: '3:00–6:00 p.m.',
        discount: [
          '$3 Bud Light, Miller Lite, or Coors Light, 16 oz',
          '$4 Bud Light 22 oz, Modelo 16 oz, Miller Lite 22 oz, Coors Light 22 oz, or Michelob Ultra 16 oz',
          '$5 Modelo 22 oz, house red or white wine, or Michelob Ultra 22 oz',
          '$6 margarita of the month',
          '$7 tequila classic margarita',
        ],
        days: [1, 2, 3, 4, 5],
      },
    ],
  },
  {
    name: 'Film Alley Bastrop',
    city: 'Bastrop',
    where: '1600 Chestnut Street, Bastrop, TX 78602',
    href: 'https://filmalley.com/events/71116-happy-hour/',
    hrefLabel: 'Film Alley happy hour',
    offers: [
      {
        what: 'Happy hour',
        span: 'Thursday',
        time: '12:00–7:00 p.m.',
        discount: ['Half-price arcade', 'Half-price bowling', 'Half-price domestic pints'],
        days: [4],
      },
    ],
  },
  {
    name: "Maxine's Cafe & Bakery",
    city: 'Bastrop',
    phone: '512-303-0919',
    href: 'https://maxinescafe.com/specials',
    hrefLabel: "Maxine's specials",
    offers: [
      { what: 'Loaded potato soup', span: 'Tuesday, Nov. 17', time: '11:00 a.m.–3:00 p.m.', days: [2], ...week },
      { what: 'Homestyle chili and cornbread', span: 'Wednesday, Nov. 18', time: '11:00 a.m.–3:00 p.m.', days: [3], ...week },
      { what: 'Personal chicken pot pie', span: 'Thursday, Nov. 19', time: '11:00 a.m.–3:00 p.m.', days: [4], ...week },
      { what: 'Broccoli cheese soup', span: 'Friday, Nov. 20', time: '11:00 a.m.–3:00 p.m.', discount: ['Served over rice'], days: [5], ...week },
      { what: 'Breakfast', span: 'Friday, Nov. 20', time: 'Until 5:00 p.m.', days: [5], ...week },
      { what: 'Breakfast', span: 'Saturday, Nov. 21', time: '7:00 a.m.–5:00 p.m.', days: [6], ...week },
      { what: 'Breakfast all day', span: 'Sunday, Nov. 22', time: '7:00 a.m.–3:00 p.m.', days: [0], ...week },
    ],
  },
  {
    name: 'Old Town Restaurant & Bar',
    city: 'Bastrop',
    where: '931 Main Street, Bastrop',
    phone: '(512) 321-1171',
    href: 'https://oldtownbastroptx.com/bastrop-old-town-restaurant-and-bar-happy-hours-specials',
    hrefLabel: 'Old Town specials',
    offers: [
      { what: 'Catfish basket', span: 'Monday, Nov. 16', time: '11:00 a.m.–10:00 p.m.', days: [1], ...week },
      { what: 'Happy hour', span: 'Monday, Nov. 16', time: '3:00–7:00 p.m.', discount: ['$1 off all drinks'], days: [1], ...week },
      { what: 'Chicken parmesan', span: 'Tuesday, Nov. 17', time: '11:00 a.m.–10:00 p.m.', days: [2], ...week },
      { what: 'Happy hour', span: 'Tuesday, Nov. 17', time: '3:00–7:00 p.m.', discount: ['$3 Bud Light and Ziegenbock drafts', '$1 off all drinks'], days: [2], ...week },
      { what: 'Chicken fried steak and $1 wings', span: 'Wednesday, Nov. 18', time: '11:00 a.m.–10:00 p.m.', days: [3], ...week },
      { what: 'Happy hour', span: 'Wednesday, Nov. 18', time: '3:00–7:00 p.m.', discount: ['$4.50 well drinks', '$1 off all'], days: [3], ...week },
      { what: 'Meatloaf dinner', span: 'Thursday, Nov. 19', time: '11:00 a.m.–10:00 p.m.', days: [4], ...week },
      { what: 'New York strip', span: 'Friday, Nov. 20', time: '11:00 a.m.–10:00 p.m.', days: [5], ...week },
    ],
  },
  {
    name: 'Piney Creek Chop House',
    city: 'Bastrop',
    where: '703 Chestnut Street, Bastrop',
    phone: '(512) 321-2135',
    href: 'https://pineycreektx.com/bastrop-downtown-bastrop-piney-creek-chop-house-happy-hours-specials',
    hrefLabel: 'Piney Creek specials',
    offers: [
      {
        what: 'Happy hour',
        span: 'Monday–Thursday',
        time: '5:00–7:00 p.m.',
        discount: ['$7 martinis', 'Discounted appetizers'],
        days: [1, 2, 3, 4],
      },
    ],
  },
  {
    name: "Lightnin' Bar",
    city: 'Elgin',
    where: '109 Central Ave. Unit B, Elgin, TX 78621',
    href: 'https://www.lightninbartexas.com/',
    hrefLabel: 'lightninbartexas.com',
    offers: [
      {
        what: 'Happy hour',
        span: 'Tuesday–Friday',
        time: '2:00–6:00 p.m.',
        days: [2, 3, 4, 5],
      },
    ],
  },
  {
    name: 'Smithville Brewing Company',
    city: 'Smithville',
    href: 'https://www.smithvillebrewing.com/',
    hrefLabel: 'smithvillebrewing.com',
    offers: [
      {
        what: '55 and older',
        span: 'Wednesday',
        discount: ['50% off an entree with a beverage'],
        days: [3],
      },
      {
        what: 'Pints and pizza',
        span: 'Thursday',
        discount: ['$5 pints', '$2 off pizzas'],
        days: [4],
      },
      {
        what: 'Happy hour',
        span: 'Sunday',
        time: 'All day',
        discount: ['$2 off appetizers', '$1 off bottles and cans'],
        note: 'Exclusions apply.',
        days: [0],
      },
      {
        what: 'Live music',
        span: 'Sunday',
        time: '4:00–6:00 p.m.',
        days: [0],
      },
    ],
  },
];

export function weekdayOf(key: string) {
  const [year, month, day] = key.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day, 18)).getUTCDay();
}

export function offerOnDay(offer: Offer, key: string) {
  return offer.days.includes(weekdayOf(key)) && (!offer.from || key >= offer.from) && (!offer.until || key <= offer.until);
}

export function offerText(offer: Offer) {
  return [offer.what, offer.span, offer.time, offer.note, ...(offer.discount || [])].filter(Boolean).join(' ');
}

export function eatDayGroups(key: string, town?: string | null) {
  return eatPlaces
    .filter((place) => !town || place.city === town)
    .map((place) => ({ place, offers: place.offers.filter((offer) => offerOnDay(offer, key)) }))
    .filter((group) => group.offers.length > 0);
}
