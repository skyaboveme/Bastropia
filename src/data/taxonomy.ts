export const cities = [
  'Bastrop',
  'Elgin',
  'Smithville',
  'Cedar Creek',
  'McDade',
  'Paige',
  'Countywide',
] as const;

export type City = (typeof cities)[number];

export const categories = [
  'music',
  'markets',
  'outdoors',
  'family',
  'community',
  'arts',
  'food',
  'government',
  'education',
  'health',
] as const;

export type Category = (typeof categories)[number];

export const categoryMeta: Record<Category, { label: string; mark: string }> = {
  music: { label: 'Music', mark: 'Music' },
  markets: { label: 'Markets', mark: 'Markets' },
  outdoors: { label: 'Outdoors', mark: 'Outdoors' },
  family: { label: 'Family', mark: 'Family' },
  community: { label: 'Community', mark: 'Community' },
  arts: { label: 'Arts', mark: 'Arts' },
  food: { label: 'Food', mark: 'Food' },
  government: { label: 'Government', mark: 'Civic' },
  education: { label: 'Education', mark: 'Learn' },
  health: { label: 'Health', mark: 'Health' },
};

export const tiers = ['community', 'spotlight', 'featured', 'lost-pines'] as const;
export type Tier = (typeof tiers)[number];

export const tierRank: Record<Tier, number> = {
  community: 0,
  spotlight: 1,
  featured: 2,
  'lost-pines': 3,
};
