export type DevelopmentKind = 'data-center' | 'annexation' | 'retail' | 'other';

export type DevelopmentProject = {
  id: string;
  title: string;
  kind: DevelopmentKind;
  status: string;
  place: string;
  summary: string;
  updated: string;
  sourceUrl: string;
  sourceLabel: string;
  newsPath?: string;
};

export const developmentKinds: { id: DevelopmentKind | 'all'; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'data-center', label: 'Data centers' },
  { id: 'annexation', label: 'Annexations' },
  { id: 'retail', label: 'Retail' },
  { id: 'other', label: 'Other' },
];

export const developmentKindLabel: Record<DevelopmentKind, string> = {
  'data-center': 'Data center',
  annexation: 'Annexation',
  retail: 'Retail',
  other: 'Other',
};

/** Curated tracker. Prefer linking a Bastropia news story when one exists. */
export const developmentProjects: DevelopmentProject[] = [
  {
    id: 'pacifico-cedar-creek',
    title: 'Pacifico / BlackChamber data-center campus and gas plant',
    kind: 'data-center',
    status: 'Under review',
    place: 'Cedar Creek',
    summary:
      'A proposed data-center campus near Cedar Creek tied to a Pacifico gas plant permit. City Council asked TCEQ for a public meeting; Anthropic has been named in public records as a planned tenant. A second reading of city data-center rules is on the calendar.',
    updated: '2026-11-04',
    sourceUrl: 'https://www.kxan.com/news/local/bastrop/bastrop-gas-plant-data-center-tceq/',
    sourceLabel: 'KXAN',
    newsPath: '/news/bastrop-gas-plant-tceq-meeting',
  },
  {
    id: 'bastrop-west-annexation',
    title: 'Bastrop West hospital annexation',
    kind: 'annexation',
    status: 'Annexed',
    place: 'Bastrop',
    summary:
      'City Council annexed about 222 acres east of FM 20 for the Bastrop West mixed-use plan, including a hospital campus, hotel, housing, and related uses.',
    updated: '2025-11-05',
    sourceUrl: 'https://www.statesman.com/business/real-estate/article/bastrop-hospital-222-acre-annexation-22512206.php',
    sourceLabel: 'Austin American-Statesman',
    newsPath: '/news/bastrop-west-hospital-annexation',
  },
  {
    id: 'burlington-burleson',
    title: 'Burlington at Burleson Crossing East',
    kind: 'retail',
    status: 'Plans filed',
    place: 'Bastrop',
    summary:
      'Burlington filed state plans for a roughly 22,500-square-foot store at Burleson Crossing East on SH 71, with construction aimed through 2027.',
    updated: '2026-10-26',
    sourceUrl: 'https://communityimpact.com/austin/bastrop-cedar-creek/',
    sourceLabel: 'Community Impact',
    newsPath: '/news/burlington-burleson-crossing',
  },
  {
    id: 'burleson-crossing-east',
    title: 'Burleson Crossing East Phase 2',
    kind: 'retail',
    status: 'Underway',
    place: 'Bastrop',
    summary: 'The next phase of the Burleson Crossing East retail pad continues along SH 71 west of downtown.',
    updated: '2026-10-01',
    sourceUrl: 'https://communityimpact.com/austin/bastrop-cedar-creek/',
    sourceLabel: 'Community Impact',
    newsPath: '/news/burleson-crossing-east-phase-2',
  },
  {
    id: 'bww-sendero',
    title: 'Buffalo Wild Wings at Sendero',
    kind: 'retail',
    status: 'Plans filed',
    place: 'Bastrop',
    summary: 'Buffalo Wild Wings filed for a build-out at the Sendero mixed-use site on SH 71.',
    updated: '2026-10-05',
    sourceUrl: 'https://communityimpact.com/austin/bastrop-cedar-creek/',
    sourceLabel: 'Community Impact',
    newsPath: '/news/buffalo-wild-wings-sendero',
  },
  {
    id: 'taco-casa-chestnut',
    title: 'Taco Casa on Chestnut',
    kind: 'retail',
    status: 'Announced',
    place: 'Bastrop',
    summary: 'Taco Casa is lined up for a Chestnut Street location in Bastrop.',
    updated: '2026-09-15',
    sourceUrl: 'https://communityimpact.com/austin/bastrop-cedar-creek/',
    sourceLabel: 'Community Impact',
    newsPath: '/news/taco-casa-chestnut',
  },
];
