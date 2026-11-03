/** Associated Press race calls, from the file The Texas Tribune publishes. */

const resultsUrl = 'https://s3.amazonaws.com/sos-test-2.texastribune.org/2026_general/republic_json/results_FLAT.json';
const cacheMs = 60 * 1000;

export const electionSources = [
  {
    name: 'Associated Press',
    href: 'https://apnews.com/projects/elections-2026/texas-results/',
    note: 'Race calls and the statewide vote.',
  },
  {
    name: 'Texas Tribune',
    href: 'https://apps.texastribune.org/features/2026/texas-general-election-live-results-2026/',
    note: 'The same Associated Press numbers, live.',
  },
  {
    name: 'Texas Secretary of State',
    href: 'https://electionresults.sos.state.tx.us/results.html',
    note: 'Official statewide results.',
  },
  {
    name: 'KXAN',
    href: 'https://www.kxan.com/news/your-local-election-hq/nov-2026-election-live-updates/',
    note: 'Austin election-night updates.',
  },
  {
    name: 'KVUE',
    href: 'https://www.kvue.com/article/news/politics/vote-texas/2026-texas-midterm-election-coverage-how-to-watch-live-election-results-coverage-kvue/269-4aecd9f8-8572-41cb-90bd-6fc7bb23ff42',
    note: 'Election-night video from 7 pm.',
  },
] as const;

const watch = [
  { slug: 'us-senate-class-2', name: 'U.S. Senate', note: '', scope: 'statewide' },
  { slug: 'governor', name: 'Governor', note: '', scope: 'statewide' },
  { slug: 'lieutenant-governor', name: 'Lieutenant governor', note: '', scope: 'statewide' },
  { slug: 'attorney-general', name: 'Attorney general', note: '', scope: 'statewide' },
  { slug: 'us-house-district-10', name: 'U.S. House District 10', note: 'Part of Bastrop County votes in this district.', scope: 'district' },
  { slug: 'us-house-district-27', name: 'U.S. House District 27', note: 'Part of Bastrop County votes in this district.', scope: 'district' },
  { slug: 'texas-senate-district-5', name: 'Texas Senate District 5', note: '', scope: 'district' },
  { slug: 'texas-house-district-17', name: 'Texas House District 17', note: '', scope: 'district' },
] as const;

const parties: Record<string, string> = {
  Republican: 'REP',
  Democrat: 'DEM',
  Democratic: 'DEM',
  Libertarian: 'LIB',
  Green: 'GRN',
  Independent: 'IND',
};

type RawCandidate = {
  id?: string;
  name?: string;
  party?: string;
  is_incumbent?: boolean;
  is_winner?: boolean;
  votes?: number;
};

type RawCounty = {
  county?: string;
  total_votes?: number;
  results?: Record<string, number>;
};

type RawRace = {
  office_slug?: string;
  source?: string;
  is_called?: boolean;
  contest_result?: string;
  total_votes?: number;
  eevp?: number;
  precincts_reporting?: number;
  total_precincts?: number;
  candidacies?: RawCandidate[];
  counties?: RawCounty[];
};

export type ElectionCall = {
  slug: string;
  name: string;
  note: string;
  scope: 'statewide' | 'district';
  status: string;
  called: boolean;
  votes: number;
  expected: number | null;
  choices: {
    name: string;
    party: string;
    incumbent: boolean;
    winner: boolean;
    votes: number;
    percent: number;
    countyVotes: number | null;
  }[];
};

let cache: { at: number; races: ElectionCall[] | null } | null = null;

function percent(votes: number, total: number) {
  if (!total) return 0;
  return Math.round((votes / total) * 1000) / 10;
}

function statusFor(race: RawRace, winner?: RawCandidate) {
  if (race.contest_result === 'uncontested') return 'Uncontested';
  if (race.contest_result !== 'not called' && winner?.name) return `AP projects ${winner.name}`;
  return 'Not called';
}

function shape(race: RawRace, desk: (typeof watch)[number]): ElectionCall {
  const county = race.counties?.find((item) => item.county === 'Bastrop');
  const votes = race.total_votes ?? 0;
  const winner = race.candidacies?.find((candidate) => candidate.is_winner);
  const expected = race.eevp && race.eevp > 0 ? race.eevp : null;
  const choices = [...(race.candidacies ?? [])]
    .sort((a, b) => (b.votes ?? 0) - (a.votes ?? 0))
    .map((candidate) => ({
      name: candidate.name || 'Unnamed',
      party: parties[candidate.party ?? ''] ?? candidate.party ?? '',
      incumbent: Boolean(candidate.is_incumbent),
      winner: Boolean(candidate.is_winner),
      votes: candidate.votes ?? 0,
      percent: percent(candidate.votes ?? 0, votes),
      countyVotes: candidate.id && county?.results ? county.results[candidate.id] ?? 0 : null,
    }));
  return {
    slug: desk.slug,
    name: desk.name,
    note: desk.note,
    scope: desk.scope,
    status: statusFor(race, winner),
    called: race.contest_result !== 'not called' && race.contest_result !== 'uncontested',
    votes,
    expected,
    choices,
  };
}

export async function getElectionCalls(): Promise<ElectionCall[] | null> {
  if (cache && Date.now() - cache.at < cacheMs) return cache.races;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch(resultsUrl, {
      signal: controller.signal,
      headers: { accept: 'application/json', 'user-agent': 'Bastropia election night' },
    });
    if (!response.ok) throw new Error(String(response.status));
    const data = (await response.json()) as RawRace[];
    const bySlug = new Map(data.map((race) => [race.office_slug, race]));
    const races = watch.flatMap((desk) => {
      const race = bySlug.get(desk.slug);
      return race ? [shape(race, desk)] : [];
    });
    cache = { at: Date.now(), races: races.length ? races : null };
    return cache.races;
  } catch (error) {
    console.error('Election calls failed', error);
    return cache?.races ?? null;
  } finally {
    clearTimeout(timer);
  }
}
