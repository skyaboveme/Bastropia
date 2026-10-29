/**
 * Local business landing pages.
 * Add an object here and it is published at /{slug}, for example /BarronHomes.
 * Keep the slug exactly as it should appear in the address.
 * Facts should come from the business's own site. Confirm a phone before publishing it.
 */

export type BusinessImage = {
  src: string;
  alt: string;
  width: number;
  height: number;
  objectPosition?: string;
};

export type Business = {
  slug: string;
  name: string;
  category: string;
  tagline: string;
  summary: string;
  about: string;
  phone?: string;
  phoneHref?: string;
  email?: string;
  place: string;
  hours: string;
  website: string;
  websiteLabel: string;
  bookUrl?: string;
  bookLabel?: string;
  mapsUrl?: string;
  facebook?: string;
  accent: string;
  accent2: string;
  radius: string;
  displayFont: string;
  textFont: string;
  fontHref?: string;
  logo: BusinessImage;
  shareImage: string;
  shareAlt: string;
  hero: BusinessImage;
  portrait?: BusinessImage;
  points: string[];
  services: { title: string; items: string[] }[];
  areas: string[];
  areaNote: string;
  gallery: BusinessImage[];
  quotes: { quote: string; name: string }[];
  reviewsUrl: string;
  facts: { label: string; value: string }[];
  stepsTitle?: string;
  steps?: { title: string; text: string }[];
  partner?: { label: string; href: string; note: string };
  schemaType: string;
  sameAs: string[];
  address: {
    locality: string;
    region: string;
    postalCode?: string;
  };
  geo?: { latitude: number; longitude: number };
  openingHours?: { days: string[]; opens: string; closes: string };
};

const lora = 'https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,500;0,700;1,500&display=swap';
const barefootFonts =
  'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;0,700;1,500&family=Lato:ital,wght@0,300;0,400;0,700;1,400&display=swap';
const rosaFonts =
  'https://fonts.googleapis.com/css2?family=Domine:wght@500;600;700&family=Inter:wght@400;500;600&display=swap';

export const businesses: Business[] = [
  {
    slug: 'StringPrairieHeatingandAir',
    name: 'String Prairie Heating & Air',
    category: 'Heating and air',
    tagline: 'Family-owned heating and air, based in Rosanky.',
    summary:
      'Residential and commercial heating and air for Bastrop County. Based in Rosanky, open Monday through Friday, 8 am to 5 pm. Call (512) 924-9744.',
    about:
      'Ron M. Hammons grew up in Rosanky, graduated from Smithville High School in 2006, and opened the company in 2014 with his father. The work covers houses and businesses: air conditioning, furnaces and heat pumps, ductwork, thermostats, and indoor air quality. Prices are quoted up front, and financing is available.',
    phone: '(512) 924-9744',
    phoneHref: 'tel:+15129249744',
    place: 'Rosanky, TX 78953',
    hours: 'Monday–Friday, 8:00 am–5:00 pm',
    website: 'https://stringprairieheatingandair.com/',
    websiteLabel: 'stringprairieheatingandair.com',
    bookUrl: 'https://book.housecallpro.com/book/String-Prairie-Heating--Air/df82ded280ce43f4a9ee6ee6d36aef76?v2=true',
    bookLabel: 'Book online',
    mapsUrl: 'https://www.google.com/maps/place/String+Prairie+Heating+%26+Air/@29.8918229,-97.3320232,17z',
    facebook: 'https://www.facebook.com/profile.php?id=100082664987868',
    accent: '#0b3a69',
    accent2: '#6caedf',
    radius: '999px',
    displayFont: 'var(--sans)',
    textFont: 'var(--sans)',
    logo: {
      src: '/images/businesses/string-prairie/logo.svg',
      alt: '',
      width: 425,
      height: 142,
    },
    shareImage: '/images/businesses/string-prairie/og.jpg',
    shareAlt: 'String Prairie Heating & Air logo over a green field, with the phone number 512-924-9744',
    hero: {
      src: '/images/businesses/string-prairie/team.jpg',
      alt: 'A String Prairie Heating & Air technician beside the company service truck in a pasture',
      width: 1200,
      height: 1600,
    },
    portrait: {
      src: '/images/businesses/string-prairie/repair.jpg',
      alt: 'Ron Hammons servicing an outdoor air conditioner at a house',
      width: 1200,
      height: 1600,
    },
    points: [
      'Family-owned in Rosanky since 2014',
      'Houses and businesses',
      'Price quoted before the work',
      'Financing available',
      'Weekday response, Monday–Friday',
      'License TACLA89153C',
    ],
    services: [
      {
        title: 'Air conditioning',
        items: ['Installation', 'Repair and maintenance', 'System replacement', 'Energy-efficiency upgrades'],
      },
      {
        title: 'Heating',
        items: ['Furnace installation', 'Heat pumps', 'Heating repair', 'Annual maintenance'],
      },
      {
        title: 'The rest of the system',
        items: ['Ductwork', 'Indoor air quality', 'Thermostats', 'Emergency service'],
      },
    ],
    areas: [
      'Bastrop',
      'Rosanky',
      'Smithville',
      'Paige',
      'String Prairie',
      'Red Rock',
      'Cedar Creek',
      'McDade',
      'Circle D-KC Estates',
      'Camp Swift',
      'Wyldwood',
    ],
    areaNote: 'Bastrop County, including Highway 71 and acreage off FM 20.',
    gallery: [
      {
        src: '/images/businesses/string-prairie/van.jpg',
        alt: 'White String Prairie Heating & Air service truck parked in a field',
        width: 1200,
        height: 1600,
      },
      {
        src: '/images/businesses/string-prairie/attic.jpg',
        alt: 'Technician beside an air handler and ductwork in an attic',
        width: 1200,
        height: 1600,
      },
    ],
    quotes: [
      {
        quote: 'They were prompt, professional, and fixed our AC issue quickly.',
        name: 'John D.',
      },
      {
        quote: 'They installed our new heating system and did an amazing job. Fair pricing and quality work.',
        name: 'Sarah M.',
      },
      {
        quote: 'They explained everything clearly and got our air conditioning working perfectly.',
        name: 'Mike R.',
      },
    ],
    reviewsUrl: 'https://www.google.com/maps/place/String+Prairie+Heating+%26+Air/@29.8918229,-97.3320232,17z',
    facts: [
      { label: 'Phone', value: '(512) 924-9744' },
      { label: 'Hours', value: 'Monday–Friday, 8 am–5 pm' },
      { label: 'Based in', value: 'Rosanky, TX 78953' },
      { label: 'Opened', value: '2014' },
      { label: 'License', value: 'TACLA89153C' },
    ],
    schemaType: 'HVACBusiness',
    sameAs: [
      'https://stringprairieheatingandair.com/',
      'https://www.facebook.com/profile.php?id=100082664987868',
      'https://www.google.com/maps/place/String+Prairie+Heating+%26+Air/@29.8918229,-97.3320232,17z',
      'https://book.housecallpro.com/book/String-Prairie-Heating--Air/df82ded280ce43f4a9ee6ee6d36aef76?v2=true',
    ],
    address: { locality: 'Rosanky', region: 'TX', postalCode: '78953' },
    geo: { latitude: 29.8918229, longitude: -97.3320232 },
    openingHours: {
      days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      opens: '08:00',
      closes: '17:00',
    },
  },
  {
    slug: 'BarronHomes',
    name: 'Barron Homes',
    category: 'Custom home builder',
    tagline: 'Our business is building.',
    summary:
      'Custom home building and design in Bastrop, Lee, and Fayette counties. Family-owned, locally owned, insured, and bonded. Call (737) 530-3298.',
    about:
      'Barron Homes designs and builds custom houses, including the interior and the exterior. The company is family-owned and locally owned, and it is insured and bonded. A quote starts with a text, then a phone call, then a written number. Remodeling is handled by their partner, Custom Pro Remodeling.',
    phone: '(737) 530-3298',
    phoneHref: 'tel:+17375303298',
    email: 'dane@barronhomesinc.com',
    place: 'Bastrop County, Texas',
    hours: 'Monday–Friday, 9:00 am–5:00 pm. Closed Saturday and Sunday.',
    website: 'https://barronhomesinc.com/',
    websiteLabel: 'barronhomesinc.com',
    mapsUrl: 'https://maps.google.com/maps?cid=11021688572023191596',
    facebook: 'https://www.facebook.com/159010817286318',
    accent: '#2041ae',
    accent2: '#e3271e',
    radius: '8px',
    displayFont: '"Lora", Georgia, serif',
    textFont: '"Lora", Georgia, serif',
    fontHref: lora,
    logo: {
      src: '/images/businesses/barron/logo.png',
      alt: '',
      width: 622,
      height: 148,
    },
    shareImage: '/images/businesses/barron/house.jpg',
    shareAlt: 'A light-colored Barron Homes house with a dark shingle roof, set in a field',
    hero: {
      src: '/images/businesses/barron/house.jpg',
      alt: 'A single-story custom house with a timber entry, photographed across a field of dry grass',
      width: 1600,
      height: 1066,
    },
    portrait: {
      src: '/images/businesses/barron/hero.jpg',
      alt: 'Two men from Barron Homes standing in a grassy field',
      width: 1200,
      height: 1573,
    },
    points: ['Insured', 'Bonded', 'Family owned', 'Locally owned'],
    services: [
      {
        title: 'Custom home building',
        items: ['A house planned around how you live', 'Construction from the design through the finished build'],
      },
      {
        title: 'Custom home design',
        items: ['Plans drawn for the lot and the household', 'Details decided before the build starts'],
      },
      {
        title: 'Interior and exterior design',
        items: ['Rooms, finishes, and how the house sits on the land', 'Curb appeal along with the inside'],
      },
    ],
    areas: ['Bastrop County', 'Lee County', 'Fayette County'],
    areaNote: 'Custom homes in Bastrop, Lee, and Fayette counties.',
    gallery: [
      {
        src: '/images/businesses/barron/build.jpg',
        alt: 'Covered porch with a stone fireplace, wood ceiling, and dark metal roof',
        width: 1200,
        height: 800,
      },
      {
        src: '/images/businesses/barron/kitchen.jpg',
        alt: 'Kitchen with a marble island, white cabinets, and a stainless range',
        width: 1600,
        height: 1044,
      },
      {
        src: '/images/businesses/barron/pool.jpg',
        alt: 'Wood house with a covered outdoor room and a freeform swimming pool',
        width: 1600,
        height: 1069,
      },
    ],
    quotes: [
      {
        quote: 'I had an amazing experience. The service was exceptional, and I always felt valued as a client.',
        name: 'Google review',
      },
      {
        quote: 'Dane and Cameron are attentive, detail oriented, and fair in their work and their pricing.',
        name: 'Google review',
      },
    ],
    reviewsUrl: 'https://barronhomesinc.com/reviews/',
    facts: [
      { label: 'Phone', value: '(737) 530-3298' },
      { label: 'Email', value: 'dane@barronhomesinc.com' },
      { label: 'Hours', value: 'Monday–Friday, 9 am–5 pm' },
      { label: 'Closed', value: 'Saturday and Sunday' },
      { label: 'Based in', value: 'Bastrop County' },
    ],
    steps: [
      { title: 'Send a text', text: 'They write back to find a time to talk.' },
      { title: 'Talk it through', text: 'A phone call covers the house, the lot, and what you want.' },
      { title: 'Get a quote', text: 'The number comes after that conversation.' },
    ],
    partner: {
      label: 'Custom Pro Remodeling',
      href: 'https://customproremodeling.com',
      note: 'Remodeling partner',
    },
    schemaType: 'HomeAndConstructionBusiness',
    sameAs: [
      'https://barronhomesinc.com/',
      'https://www.facebook.com/159010817286318',
      'https://maps.google.com/maps?cid=11021688572023191596',
    ],
    address: { locality: 'Bastrop County', region: 'TX' },
    openingHours: {
      days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      opens: '09:00',
      closes: '17:00',
    },
  },
  {
    slug: 'BarefootFlowerFarms',
    name: 'Barefoot Flower Farms',
    category: 'Flower farm',
    tagline: 'Where nature blooms beautifully.',
    summary:
      'Fresh-cut flowers, plants, and wedding flowers in Rosanky. A market shop on TX-304, and a nursery and event venue on McReynolds Road.',
    about:
      'String Prairie Gardens & Barefoot Flower Farm grows flowers in Rosanky. It started as a small plot and now grows heirloom varieties without synthetic pesticides or fertilizers, using companion planting, compost, and natural pest control. The market shop is at Wagon Wheel Gas N Go. The greenhouse, outdoor nursery, and event home are a short drive down McReynolds Road, marked by blue arrows on the pavement. They take a limited number of weddings each season.',
    place: 'Rosanky, TX 78953',
    hours: 'Ask for current hours and availability.',
    website: 'https://barefootflowerfarms.com/',
    websiteLabel: 'barefootflowerfarms.com',
    bookUrl: 'https://barefootflowerfarms.com/contact',
    bookLabel: 'Send a message',
    mapsUrl: 'https://www.google.com/maps/place/String+Prairie+Gardens+%26+Barefoot+Flower+Farm/@29.921331,-97.358209,15z',
    facebook: 'https://www.facebook.com/profile.php?id=61565878812536',
    accent: '#3e5340',
    accent2: '#e8d5d0',
    radius: '30px',
    displayFont: '"Cormorant Garamond", Georgia, serif',
    textFont: 'Lato, sans-serif',
    fontHref: barefootFonts,
    logo: {
      src: '/images/businesses/barefoot/logo.png',
      alt: '',
      width: 800,
      height: 360,
    },
    shareImage: '/images/businesses/barefoot/og.jpg',
    shareAlt: 'Flower market shop at Barefoot Flower Farms, with a red door, a welcome sign, and potted flowers',
    hero: {
      src: '/images/businesses/barefoot/shop.jpg',
      alt: 'Flower market shop with a red door, a wooden welcome sign, and potted flowers out front',
      width: 1200,
      height: 1600,
    },
    portrait: {
      src: '/images/businesses/barefoot/rows.jpg',
      alt: 'Rows of potted flowers and seedlings in the outdoor nursery',
      width: 1000,
      height: 1249,
    },
    points: [
      'Grown on the farm in Rosanky',
      'No synthetic pesticides or fertilizers',
      'Market shop at Wagon Wheel on TX-304',
      'Nursery and venue on McReynolds Road',
      'Local delivery within 15 miles',
      'Monthly bouquet subscription',
    ],
    services: [
      {
        title: 'Flower market',
        items: [
          'Fresh-cut flowers',
          'Potted plants and succulents',
          'Seasonal specialties',
          'Roadside shop at Wagon Wheel Gas N Go',
        ],
      },
      {
        title: 'Nursery',
        items: [
          'Annuals, perennials, and native plants',
          'Ornamental shrubs',
          'Outdoor nursery and greenhouse',
          'Houseplants and garden gifts',
        ],
      },
      {
        title: 'Weddings and events',
        items: [
          'Full floral design, starting at $2,500',
          'A la carte flowers, starting at $500',
          'DIY buckets, $85 for 50–60 stems',
          'Event home with a valley view',
        ],
      },
    ],
    areas: ['Rosanky', 'String Prairie'],
    areaNote: 'Two stops in Rosanky. Local delivery runs within 15 miles of the farm, on orders over $50.',
    gallery: [
      {
        src: '/images/businesses/barefoot/bouquet.jpg',
        alt: 'Yellow ranunculus bouquet wrapped with a Barefoot Flower Farm card',
        width: 1200,
        height: 1600,
      },
      {
        src: '/images/businesses/barefoot/nursery.jpg',
        alt: 'Trays of pink, purple, and orange petunias at the outdoor nursery',
        width: 1600,
        height: 1200,
      },
      {
        src: '/images/businesses/barefoot/wedding.jpg',
        alt: 'Garden-style bridal bouquets with roses, baby’s breath, and wildflowers',
        width: 1080,
        height: 1350,
      },
    ],
    quotes: [
      {
        quote: 'Give yourself plenty of time to explore. Anna is a wealth of gardening knowledge.',
        name: 'Happy Visitor',
      },
      {
        quote: "You won't find a kinder, more caring florist than this.",
        name: 'Jill Schaben',
      },
    ],
    reviewsUrl: 'https://barefootflowerfarms.com/',
    facts: [
      { label: 'Market shop', value: '2989 TX-304, Rosanky, at Wagon Wheel Gas N Go' },
      { label: 'Nursery', value: '440 McReynolds Rd, Rosanky' },
      { label: 'Hours', value: 'Ask for current hours' },
      { label: 'Delivery', value: 'Within 15 miles, orders over $50. $10 under $100, free over $100.' },
      { label: 'Growing', value: 'No synthetic pesticides or fertilizers' },
    ],
    stepsTitle: 'How to find them',
    steps: [
      {
        title: 'Start at the market',
        text: 'The flower shop is at Wagon Wheel Gas N Go, 2989 TX-304.',
      },
      {
        title: 'Take McReynolds Road',
        text: 'Turn onto McReynolds and follow the blue arrows painted on the road.',
      },
      {
        title: 'Nursery and venue',
        text: 'About five minutes on, the greenhouse, outdoor nursery, and event home.',
      },
    ],
    partner: {
      label: 'Rock Hill Ranch',
      href: 'https://www.facebook.com/visitrockhillranch',
      note: 'Wedding venue partner',
    },
    schemaType: 'Florist',
    sameAs: [
      'https://barefootflowerfarms.com/',
      'https://www.facebook.com/profile.php?id=61565878812536',
      'https://www.google.com/maps/place/String+Prairie+Gardens+%26+Barefoot+Flower+Farm/@29.921331,-97.358209,15z',
    ],
    address: { locality: 'Rosanky', region: 'TX', postalCode: '78953' },
    geo: { latitude: 29.921331, longitude: -97.358209 },
  },
  {
    slug: 'LostPinesToyota',
    name: 'Lost Pines Toyota',
    category: 'Toyota dealer',
    tagline: 'New and used Toyotas on Highway 71 in Bastrop.',
    summary:
      'A family-owned Toyota dealer at 806 TX-71 in Bastrop. New Toyotas, used vehicles, and a service department. Call (512) 303-1200.',
    about:
      'Lost Pines Toyota opened in 2012. The dealership is family-owned and minority-owned. It sells new Toyotas and used vehicles, and the service department uses factory-trained technicians and genuine parts. The store works with the Bastrop Community Center, the Bastrop Evening Lions Club, and the Bastrop County Hispanic Chamber of Commerce.',
    phone: '(512) 303-1200',
    phoneHref: 'tel:+15123031200',
    place: '806 TX-71, Bastrop, TX 78602',
    hours:
      'Sales Monday–Friday 8:30 am–8 pm, Saturday 8:30 am–7 pm, Sunday closed. Service Monday–Friday 7 am–6 pm, Saturday 8 am–4 pm.',
    website: 'https://www.lostpinestoyota.com/',
    websiteLabel: 'lostpinestoyota.com',
    bookUrl: 'https://www.lostpinestoyota.com/new-vehicles/',
    bookLabel: 'Shop inventory',
    mapsUrl:
      'https://www.google.com/maps/place/Lost+Pines+Toyota/@30.1097023,-97.3578172,16z',
    facebook: 'https://www.facebook.com/lostpinestoyota',
    accent: '#141414',
    accent2: '#eb0a1e',
    radius: '100px',
    displayFont: 'var(--sans)',
    textFont: 'var(--sans)',
    logo: {
      src: '/images/businesses/lost-pines/logo.png',
      alt: '',
      width: 588,
      height: 200,
    },
    shareImage: '/images/businesses/lost-pines/og.jpg',
    shareAlt: 'Showroom at Lost Pines Toyota, with a white Toyota and the dealership sign',
    hero: {
      src: '/images/businesses/lost-pines/showroom.jpg',
      alt: 'Lost Pines Toyota showroom, with a white Toyota in front of the dealership sign',
      width: 1600,
      height: 512,
      objectPosition: '75% center',
    },
    points: [
      'Family-owned and minority-owned',
      'Open in Bastrop since 2012',
      'New, used, and certified pre-owned',
      'Sales, service, and parts on Highway 71',
      "Toyota President's Award",
      'Named best car dealership in the Bastrop County Best contest',
    ],
    services: [
      {
        title: 'New Toyotas',
        items: ['Cars, trucks, and SUVs', 'Hybrids and plug-in models', 'Inventory on Highway 71'],
      },
      {
        title: 'Pre-owned',
        items: ['Used vehicles', 'Toyota certified pre-owned', 'Lost Pines certified vehicles'],
      },
      {
        title: 'Service and parts',
        items: ['Factory-trained technicians', 'Genuine Toyota parts', 'Express service and mobile service vans'],
      },
    ],
    areas: ['Bastrop', 'Elgin', 'Austin'],
    areaNote: 'The store is at 806 Highway 71 in Bastrop. The dealership names Bastrop, Austin, and Elgin.',
    gallery: [],
    quotes: [],
    reviewsUrl: 'https://www.google.com/maps/place/Lost+Pines+Toyota/@30.1097023,-97.3578172,16z',
    facts: [
      { label: 'Phone', value: '(512) 303-1200' },
      { label: 'Address', value: '806 TX-71, Bastrop, TX 78602' },
      { label: 'Sales', value: 'Mon–Fri 8:30 am–8 pm, Sat 8:30 am–7 pm, Sun closed' },
      { label: 'Service', value: 'Mon–Fri 7 am–6 pm, Sat 8 am–4 pm' },
      { label: 'Parts', value: 'Mon–Fri 7:30 am–6 pm, Sat 7:30 am–4 pm' },
      { label: 'Rental', value: '(512) 870-9777' },
      { label: 'Opened', value: '2012' },
    ],
    schemaType: 'AutoDealer',
    sameAs: [
      'https://www.lostpinestoyota.com/',
      'https://www.facebook.com/lostpinestoyota',
      'https://www.instagram.com/lostpinestoyota',
      'https://www.google.com/maps/place/Lost+Pines+Toyota/@30.1097023,-97.3578172,16z',
    ],
    address: { locality: 'Bastrop', region: 'TX', postalCode: '78602' },
    geo: { latitude: 30.1097023, longitude: -97.3578172 },
  },
  {
    slug: 'RosaTexLandscaping',
    name: 'RosaTex Landscaping',
    category: 'Landscaping',
    tagline: 'Lawn care and property maintenance, based in Rosanky.',
    summary:
      'Residential and rural lawn care within about 30 miles of Rosanky. Mowing, trees, cleanup, and compost delivery. Call or text (512) 798-2569.',
    about:
      'RosaTex Landscaping is based in Rosanky and describes itself as locally owned and faith-driven. The work covers houses and rural acreage: mowing, trimming, tree work, debris and junk hauling, power washing, gutter cleaning, and bulk mushroom compost. Estimates are free. The price depends on the size and condition of the property.',
    phone: '(512) 798-2569',
    phoneHref: 'tel:+15127982569',
    email: 'info@rosatexlandscaping.com',
    place: 'Rosanky, TX 78953',
    hours: 'Monday–Friday 7 am–6 pm, Saturday 8 am–2 pm, Sunday closed',
    website: 'https://rosatexlandscaping.com/',
    websiteLabel: 'rosatexlandscaping.com',
    bookUrl: 'https://rosatexlandscaping.com/contact/',
    bookLabel: 'Request a quote',
    mapsUrl: 'https://www.google.com/maps/search/?api=1&query=RosaTex+Landscaping+Rosanky+TX+78953',
    facebook: 'https://www.facebook.com/RosaTexLandscaping',
    accent: '#0d4a28',
    accent2: '#3cba4a',
    radius: '12px',
    displayFont: 'Domine, Georgia, serif',
    textFont: 'Inter, var(--sans)',
    fontHref: rosaFonts,
    logo: {
      src: '/images/businesses/rosa-tex/logo.png',
      alt: '',
      width: 459,
      height: 285,
    },
    shareImage: '/images/businesses/rosa-tex/og.jpg',
    shareAlt: 'A person in a RosaTex Landscaping shirt mowing a striped lawn',
    hero: {
      src: '/images/businesses/rosa-tex/mower.jpg',
      alt: 'A person in a RosaTex Landscaping shirt mowing a striped lawn',
      width: 1536,
      height: 1024,
    },
    portrait: {
      src: '/images/businesses/rosa-tex/lawn.jpg',
      alt: 'A striped lawn beside a metal-roof house, trees, and a fence',
      width: 640,
      height: 640,
    },
    points: [
      'Locally owned in Rosanky',
      'Houses and rural acreage',
      'Free estimates',
      'Call or text (512) 798-2569',
    ],
    services: [
      {
        title: 'Lawn care',
        items: [
          'Mowing, string trimming, and edging',
          'Debris blowing',
          'Weekly, bi-weekly, or one-time',
          'From $65 a visit',
        ],
      },
      {
        title: 'Trees',
        items: [
          'Trimming, pruning, and removal',
          'Canopy lifting and dead limbs',
          'Yaupon holly clearing',
          'From $199',
        ],
      },
      {
        title: 'Cleanup',
        items: [
          'Storm debris, brush, and yard waste',
          'Junk hauling and property cleanouts',
          'From $249',
        ],
      },
      {
        title: 'Property care',
        items: [
          'Power washing driveways, patios, siding, and fences',
          'Gutter cleaning',
          'From $129',
        ],
      },
      {
        title: 'Mushroom compost',
        items: ['6-yard load for $350', 'Delivered around Rosanky', 'Larger orders may travel farther'],
      },
    ],
    areas: [
      'Rosanky',
      'Bastrop',
      'Smithville',
      'Red Rock',
      'Dale',
      'Lockhart',
      'Luling',
      'Cedar Creek',
      'Paige',
      'McDade',
      'Elgin',
      'Flatonia',
      'Gonzales',
      'Del Valle',
    ],
    areaNote:
      'Based in Rosanky. Houses and rural properties within about 30 miles, in Bastrop, Caldwell, and Fayette counties, and parts of Travis, Hays, and Gonzales counties.',
    gallery: [],
    quotes: [],
    reviewsUrl: 'https://www.facebook.com/RosaTexLandscaping/reviews',
    facts: [
      { label: 'Phone', value: '(512) 798-2569, call or text' },
      { label: 'Email', value: 'info@rosatexlandscaping.com' },
      { label: 'Base', value: 'Rosanky, TX 78953' },
      { label: 'Hours', value: 'Mon–Fri 7 am–6 pm, Sat 8 am–2 pm, Sun closed' },
      { label: 'Lawn care', value: 'From $65 a visit. Price depends on lot size and condition.' },
      { label: 'Compost', value: '$350 for a 6-yard load' },
    ],
    stepsTitle: 'How a quote works',
    steps: [
      {
        title: 'Call or text',
        text: 'Use (512) 798-2569, or send the form on their site. Email works too.',
      },
      {
        title: 'Free estimate',
        text: 'They look at the lot, the terrain, and what needs to be hauled.',
      },
      {
        title: 'Then the work',
        text: 'Mowing can be on a schedule or a one-time cut. Compost is delivered by the load.',
      },
    ],
    schemaType: 'LandscapingBusiness',
    sameAs: [
      'https://rosatexlandscaping.com/',
      'https://www.facebook.com/RosaTexLandscaping',
    ],
    address: { locality: 'Rosanky', region: 'TX', postalCode: '78953' },
  },
];

export function businessBySlug(slug: string) {
  return businesses.find((business) => business.slug === slug);
}
