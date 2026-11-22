/**
 * Public directory groups. Chamber listings keep their original trade label
 * on the card. Filters use one of these groups.
 *
 * Every chamber label is listed in rawGroups. scripts/directory-categories.test.ts
 * fails if a label in chamberDirectory.json is missing.
 */

export const publicCategories = [
  { slug: 'food-drink', label: 'Food & Drink', icon: 'food' },
  { slug: 'home-services', label: 'Home Services', icon: 'home' },
  { slug: 'health-wellness', label: 'Health & Wellness', icon: 'health' },
  { slug: 'shops-retail', label: 'Shops & Retail', icon: 'store' },
  { slug: 'auto', label: 'Auto', icon: 'auto' },
  { slug: 'professional-services', label: 'Professional Services', icon: 'work' },
  { slug: 'real-estate', label: 'Real Estate', icon: 'realty' },
  { slug: 'beauty-personal-care', label: 'Beauty & Personal Care', icon: 'beauty' },
  { slug: 'recreation-outdoors', label: 'Recreation & Outdoors', icon: 'play' },
  { slug: 'community-nonprofit', label: 'Community & Nonprofit', icon: 'heart' },
  { slug: 'lodging', label: 'Lodging', icon: 'hotel' },
  { slug: 'education-childcare', label: 'Education & Childcare', icon: 'school' },
  { slug: 'agriculture', label: 'Agriculture', icon: 'farm' },
  { slug: 'construction-trades', label: 'Construction & Trades', icon: 'build' },
  { slug: 'industrial-utilities', label: 'Industrial & Utilities', icon: 'factory' },
] as const;

export type PublicCategorySlug = (typeof publicCategories)[number]['slug'];
export type PublicCategory = (typeof publicCategories)[number];

const rawGroups: Record<string, PublicCategorySlug> = {
  'non-profits': 'community-nonprofit',
  'friends of the chamber': 'community-nonprofit',
  restaurants: 'food-drink',
  realtors: 'real-estate',
  'home building / remodeling / design': 'construction-trades',
  'family entertainment / recreation': 'recreation-outdoors',
  'retail / specialty shops / antiques': 'shops-retail',
  'churches / support groups': 'community-nonprofit',
  'construction / contractors': 'construction-trades',
  'health / wellness': 'health-wellness',
  'business services / assistance / consulting': 'professional-services',
  'insurance services': 'professional-services',
  'civic organizations': 'community-nonprofit',
  government: 'community-nonprofit',
  'hotels / motels / resorts': 'lodging',
  'attorneys / lawyers': 'professional-services',
  'computer services / it / web design': 'professional-services',
  'health care clinics': 'health-wellness',
  'manufacturing / industrial': 'industrial-utilities',
  banks: 'professional-services',
  'roofing contractors / solar': 'construction-trades',
  'fitness / training centers': 'recreation-outdoors',
  'plumbing services': 'home-services',
  utilities: 'industrial-utilities',
  'construction management': 'construction-trades',
  'dental care': 'health-wellness',
  'landscape / irrigation / sprinkler systems': 'home-services',
  'transportation services / charter bus': 'professional-services',
  chiropractors: 'health-wellness',
  engineering: 'construction-trades',
  'financial services': 'professional-services',
  'printing services / promotional items': 'professional-services',
  'vacation rentals / meeting space': 'lodging',
  'accountants / certified public accountants': 'professional-services',
  'advertising / marketing': 'professional-services',
  'air conditioning / heating': 'home-services',
  apartments: 'real-estate',
  'real estate development': 'real-estate',
  'rv parks': 'lodging',
  catering: 'food-drink',
  'electrical contractors / electrician': 'home-services',
  'mortgage / loan companies': 'real-estate',
  'nursing homes / assisted living / memory care': 'health-wellness',
  'pet services': 'health-wellness',
  'real estate brokers': 'real-estate',
  'real estate investment / management': 'real-estate',
  'storage facilities / storage solutions': 'industrial-utilities',
  'automobile dealerships': 'auto',
  'bakeries / baked goods': 'food-drink',
  'building supplies / sales / installation': 'construction-trades',
  'chamber of commerce': 'community-nonprofit',
  'cleaning services / restoration services': 'home-services',
  'economic development': 'community-nonprofit',
  'emergency centers': 'health-wellness',
  'florist / nurseries': 'shops-retail',
  'food trucks': 'food-drink',
  'hair salons / barber shops': 'beauty-personal-care',
  hospitals: 'health-wellness',
  'marketing / video production': 'professional-services',
  'media / advertising': 'professional-services',
  painters: 'home-services',
  'pest / termite services': 'home-services',
  'tax preparation': 'professional-services',
  'title companies': 'real-estate',
  'architectural firms / design': 'construction-trades',
  'art galleries': 'recreation-outdoors',
  'art education': 'education-childcare',
  'bookkeeping services / tax services': 'professional-services',
  'car washes': 'auto',
  'coffee / beverage shops': 'food-drink',
  'conference / event services / meeting facilities': 'lodging',
  'counseling services': 'health-wellness',
  'credit unions': 'professional-services',
  'education / private / pre-schools': 'education-childcare',
  'employment services': 'professional-services',
  'farm equipment / supplies': 'agriculture',
  'golf courses': 'recreation-outdoors',
  'hospice services': 'health-wellness',
  photographers: 'professional-services',
  'physical therapy / rehabilitation': 'health-wellness',
  'portable toilets': 'construction-trades',
  'publishers / publications': 'professional-services',
  'spa services': 'beauty-personal-care',
  'towing companies': 'auto',
  'waste / management': 'industrial-utilities',
  'wineries / wine shops / breweries': 'food-drink',
  'ambulance service': 'health-wellness',
  'apparel / screen printing': 'shops-retail',
  'auto repairs / service': 'auto',
  'cancer oncology / services / research': 'health-wellness',
  'cbd products': 'shops-retail',
  'concrete construction / products': 'construction-trades',
  'dirt work / excavation / demolition': 'construction-trades',
  'education / certifications': 'education-childcare',
  'education / colleges': 'education-childcare',
  'education / public school districts': 'education-childcare',
  'floor coverings / tile': 'home-services',
  'food service / support services': 'food-drink',
  'funeral homes': 'community-nonprofit',
  'handyman services': 'home-services',
  'hearing aids / hearing care': 'health-wellness',
  'interior design / staging': 'home-services',
  'liquor stores / distributors': 'food-drink',
  'loan companies': 'professional-services',
  'lumber / building supplies': 'construction-trades',
  'moving companies': 'professional-services',
  'notary services': 'professional-services',
  'office supplies / office equipment': 'shops-retail',
  'pain management': 'health-wellness',
  'party rentals / supplies': 'recreation-outdoors',
  'physicians / surgeons': 'health-wellness',
  'portable buildings': 'construction-trades',
  'pressure washing': 'home-services',
  'recreational equipment / golf cart sales / rentals': 'recreation-outdoors',
  'security / investigations / safety education': 'professional-services',
  surveyors: 'construction-trades',
  'swimming pool installation / maintenance': 'home-services',
  'travel agencies': 'professional-services',
  'vision care': 'health-wellness',
  'water treatment': 'home-services',
  'welding & repair': 'construction-trades',
  'youth / education services organization': 'education-childcare',
  alterations: 'beauty-personal-care',
  'appliance repairs': 'home-services',
  'cigar lounges': 'food-drink',
  'commercial rentals / offices / warehouses': 'real-estate',
  'data centers': 'industrial-utilities',
  'day cares': 'education-childcare',
  dermatology: 'health-wellness',
  distilleries: 'food-drink',
  'drone service': 'professional-services',
  'education / charter-schools': 'education-childcare',
  'education / pre-schools': 'education-childcare',
  'event / wedding facility': 'recreation-outdoors',
  'event tickets': 'recreation-outdoors',
  "farmer's market / produce": 'agriculture',
  'fencing companies': 'construction-trades',
  'firearms / optics / ammo': 'shops-retail',
  'glass repair / service': 'home-services',
  'gold / silver': 'shops-retail',
  'gymnastics / dance centers': 'recreation-outdoors',
  'home health care providers': 'health-wellness',
  'homeowner / property owner assn.': 'real-estate',
  'internet services': 'professional-services',
  'jewelry / repair': 'shops-retail',
  libraries: 'education-childcare',
  locksmiths: 'home-services',
  'lounges / bar': 'food-drink',
  'mailing / shipping services': 'professional-services',
  'med spa': 'beauty-personal-care',
  'medical equipment / supplies / service': 'health-wellness',
  'mobile home sales': 'shops-retail',
  museums: 'recreation-outdoors',
  'oil change / lube': 'auto',
  'payroll services': 'professional-services',
  pharmacies: 'health-wellness',
  'pipeline construction': 'construction-trades',
  'propane sales / supplies': 'industrial-utilities',
  'property management / leasing': 'real-estate',
  psychiatrist: 'health-wellness',
  'rain water harvesting': 'home-services',
  'rendering company': 'agriculture',
  'rv parts / mobile home parts': 'auto',
  'senior living': 'health-wellness',
  'social media management': 'professional-services',
  'tires & wheels': 'auto',
  tourism: 'recreation-outdoors',
  'tree service / stump removal': 'home-services',
  veterinarians: 'health-wellness',
  'western wear': 'shops-retail',
  'window cleaning': 'home-services',
  'yoga studios': 'recreation-outdoors',
  'heating and air': 'home-services',
  'custom home builder': 'construction-trades',
  'flower farm': 'agriculture',
  'toyota dealer': 'auto',
  landscaping: 'home-services',
  'brewery and restaurant': 'food-drink',
  plumbing: 'home-services',
  electrical: 'home-services',
  roofing: 'construction-trades',
  restaurant: 'food-drink',
  retail: 'shops-retail',
  'professional services': 'professional-services',
  other: 'professional-services',
  'chamber member': 'community-nonprofit',
};

const keywordGroups: Array<[RegExp, PublicCategorySlug]> = [
  [/flower farm|farm equipment|farmer|produce|nursery|agricultur/i, 'agriculture'],
  [/brewery|restaurant|food|coffee|bakery|cater|winery|distill|liquor|\bbar\b|lounge/i, 'food-drink'],
  [/toyota|dealership|\bdealer\b|auto|tire|towing|car wash|oil change/i, 'auto'],
  [/landscap|plumb|electric|hvac|heating|air condition|cleaning|pest|locksmith|handyman|pool|painter/i, 'home-services'],
  [/builder|remodel|construction|contractor|roof/i, 'construction-trades'],
  [/real estate|realtor|mortgage|property management/i, 'real-estate'],
  [/salon|barber|spa\b|beauty/i, 'beauty-personal-care'],
  [/hotel|motel|lodg|vacation rental|rv park/i, 'lodging'],
  [/school|day care|child care|education/i, 'education-childcare'],
  [/church|nonprofit|non-profit|civic|government/i, 'community-nonprofit'],
  [/dental|clinic|hospital|health|wellness|veterinar|pharmac/i, 'health-wellness'],
  [/fitness|golf|recreation|museum/i, 'recreation-outdoors'],
  [/manufactur|utilit|storage|propane|waste/i, 'industrial-utilities'],
  [/retail|shop|store/i, 'shops-retail'],
];

export function normalizeCategoryLabel(value: string) {
  return value.toLowerCase().replace(/\s+/g, ' ').trim();
}

export function categoryIsMapped(label: string) {
  return Object.prototype.hasOwnProperty.call(rawGroups, normalizeCategoryLabel(label));
}

const bySlug = new Map(publicCategories.map((category) => [category.slug, category]));

export function publicCategoryBySlug(slug: string | null | undefined) {
  if (!slug) return undefined;
  return bySlug.get(slug as PublicCategorySlug);
}

export function publicCategoryFor(raw: string): PublicCategory {
  const label = normalizeCategoryLabel(raw);
  const named = publicCategories.find((category) => category.label.toLowerCase() === label || category.slug === label);
  if (named) return named;
  const slug = rawGroups[label];
  if (slug) return bySlug.get(slug)!;
  for (const [pattern, group] of keywordGroups) {
    if (pattern.test(raw)) return bySlug.get(group)!;
  }
  return bySlug.get('professional-services')!;
}

/** Free-listing form: public groups first, partner-only trades last. */
export function submitCategoryOptions(partnerOnly: string[]) {
  const partners = new Set(partnerOnly.map((item) => item.toLowerCase()));
  const general = [...publicCategories.map((category) => category.label), 'Plumbing', 'Electrical', 'Roofing', 'Restaurant', 'Retail', 'Other'];
  const head = general.filter((item) => !partners.has(item.toLowerCase()));
  const tail = [...partnerOnly].filter((item) => !head.some((name) => name.toLowerCase() === item.toLowerCase())).sort((a, b) => a.localeCompare(b));
  const seen = new Set<string>();
  const options: string[] = [];
  for (const name of [...head, ...tail]) {
    const key = name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    options.push(name);
  }
  return options;
}
