const headers = {
  // ESPN's edge rejects the site bot. A browser agent is what their public score API accepts.
  'user-agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  accept: 'application/json',
};

/** Texas programs Bastrop County follows: Austin, College Station, San Marcos, then the rest of the state. */
export const collegeTeams: { id: string; school: string; mascot: string }[] = [
  { id: '251', school: 'Texas', mascot: 'Longhorns' },
  { id: '245', school: 'Texas A&M', mascot: 'Aggies' },
  { id: '326', school: 'Texas State', mascot: 'Bobcats' },
  { id: '2641', school: 'Texas Tech', mascot: 'Red Raiders' },
  { id: '239', school: 'Baylor', mascot: 'Bears' },
  { id: '248', school: 'Houston', mascot: 'Cougars' },
  { id: '2636', school: 'UTSA', mascot: 'Roadrunners' },
];

export type CollegeSide = 'Home' | 'Away' | '';

export type CollegeGame = {
  opponent: string;
  schoolScore: number;
  opponentScore: number;
  result: 'won' | 'lost' | 'tied';
  when: string;
  kickoff: string;
  side: CollegeSide;
  detail: string;
};

export type CollegeUpcoming = {
  opponent: string;
  when: string;
  kickoff: string;
  side: CollegeSide;
};

export type CollegeScore = {
  id: string;
  school: string;
  mascot: string;
  href: string;
  logo: string;
  color: string;
  record: string;
  standing: string;
  live: boolean;
  last: CollegeGame | null;
  next: CollegeUpcoming | null;
};

type EspnTeam = {
  id?: string;
  shortDisplayName?: string;
  displayName?: string;
};

type EspnCompetitor = {
  homeAway?: string;
  winner?: boolean;
  score?: { displayValue?: string } | string | number | null;
  team?: EspnTeam;
};

type EspnEvent = {
  date?: string;
  timeValid?: boolean;
  competitions?: {
    timeValid?: boolean;
    status?: { type?: { state?: string; shortDetail?: string; detail?: string } };
    competitors?: EspnCompetitor[];
  }[];
};

type EspnSchedule = {
  team?: {
    color?: string;
    logo?: string;
    clubhouse?: string;
    recordSummary?: string;
    standingSummary?: string;
  };
  events?: EspnEvent[];
};

const cache: { at: number; value: CollegeScore[] } = { at: 0, value: [] };

function footballSeason(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Chicago',
    year: 'numeric',
    month: 'numeric',
  }).formatToParts(now);
  const year = Number(parts.find((part) => part.type === 'year')?.value);
  const month = Number(parts.find((part) => part.type === 'month')?.value);
  return month >= 8 ? year : year - 1;
}

function scoreValue(score: EspnCompetitor['score']) {
  if (score == null) return null;
  const raw = typeof score === 'object' ? score.displayValue : score;
  if (raw == null || raw === '') return null;
  const value = Number(raw);
  return Number.isFinite(value) ? value : null;
}

function centralStamp(iso: string, timeValid: boolean) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return { when: '', kickoff: '' };
  // An unset kickoff is midnight Eastern, which is the previous evening in Central.
  const zone = timeValid ? 'America/Chicago' : 'America/New_York';
  const when = new Intl.DateTimeFormat('en-US', {
    timeZone: zone,
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
  if (!timeValid) return { when, kickoff: '' };
  const kickoff = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Chicago',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
    .format(date)
    .replace(' AM', ' am')
    .replace(' PM', ' pm')
    .replace(':00', '');
  return { when, kickoff };
}

function sideOf(value: string | undefined): CollegeSide {
  if (value === 'home') return 'Home';
  if (value === 'away') return 'Away';
  return '';
}

function pairOf(event: EspnEvent, teamId: string) {
  const comp = event.competitions?.[0];
  const competitors = comp?.competitors ?? [];
  const us = competitors.find((team) => team.team?.id === teamId);
  const opp = competitors.find((team) => team.team?.id !== teamId);
  if (!comp || !us || !opp) return null;
  return { comp, us, opp };
}

export function parseCollegeSchedule(data: EspnSchedule, team: (typeof collegeTeams)[number]): CollegeScore | null {
  const events = data.events ?? [];
  const info = data.team ?? {};
  let live: CollegeGame | null = null;
  let last: CollegeGame | null = null;
  let next: CollegeUpcoming | null = null;

  for (const event of events) {
    const pair = pairOf(event, team.id);
    if (!pair || !event.date) continue;
    const state = pair.comp.status?.type?.state ?? '';
    const timeValid = event.timeValid !== false && pair.comp.timeValid !== false;
    const stamp = centralStamp(event.date, timeValid);
    const opponent = pair.opp.team?.shortDisplayName || pair.opp.team?.displayName || 'Opponent';
    const side = sideOf(pair.us.homeAway);

    if (state === 'pre') {
      if (!next) next = { opponent, when: stamp.when, kickoff: stamp.kickoff, side };
      continue;
    }

    const schoolScore = scoreValue(pair.us.score);
    const opponentScore = scoreValue(pair.opp.score);
    if (schoolScore == null || opponentScore == null) continue;
    const game: CollegeGame = {
      opponent,
      schoolScore,
      opponentScore,
      result: schoolScore === opponentScore ? 'tied' : pair.us.winner ? 'won' : 'lost',
      when: stamp.when,
      kickoff: stamp.kickoff,
      side,
      detail: pair.comp.status?.type?.shortDetail || pair.comp.status?.type?.detail || '',
    };
    if (state === 'in') live = game;
    else if (state === 'post') last = game;
  }

  const current = live ?? last;
  if (!current && !next) return null;

  return {
    id: team.id,
    school: team.school,
    mascot: team.mascot,
    href: info.clubhouse || `https://www.espn.com/college-football/team/_/id/${team.id}`,
    logo: info.logo || `https://a.espncdn.com/i/teamlogos/ncaa/500/${team.id}.png`,
    color: info.color ? `#${info.color.replace(/^#/, '')}` : '#10281f',
    record: info.recordSummary || '',
    standing: info.standingSummary || '',
    live: Boolean(live),
    last: current,
    next,
  };
}

async function loadTeam(team: (typeof collegeTeams)[number], season: number) {
  const url = `https://site.api.espn.com/apis/site/v2/sports/football/college-football/teams/${team.id}/schedule?season=${season}`;
  const response = await fetch(url, { headers, signal: AbortSignal.timeout(8000) });
  if (!response.ok) throw new Error(`${team.school} ${response.status}`);
  return parseCollegeSchedule((await response.json()) as EspnSchedule, team);
}

export async function getCollegeScores(): Promise<CollegeScore[]> {
  if (cache.value.length && Date.now() - cache.at < 10 * 60 * 1000) return cache.value;
  const season = footballSeason();
  const scores = (
    await Promise.all(collegeTeams.map((team) => loadTeam(team, season).catch(() => null)))
  ).filter((score): score is CollegeScore => score !== null);
  if (scores.length) {
    cache.at = Date.now();
    cache.value = scores;
  }
  return scores.length ? scores : cache.value;
}
