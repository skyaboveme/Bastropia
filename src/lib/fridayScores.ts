const headers = {
  'user-agent': 'BastropiaBot/1.0 (+https://bastropia.com)',
  accept: 'text/html',
};

export type GameResult = {
  opponent: string;
  schoolScore: number;
  opponentScore: number;
  result: 'won' | 'lost' | 'tied';
  when: string;
  kickoff: string;
  place: string;
  side: 'Home' | 'Away' | '';
};

export type UpcomingGame = {
  opponent: string;
  when: string;
  kickoff: string;
  side: 'Home' | 'Away' | '';
};

export type GameHighlight = {
  id: string;
  title: string;
  href: string;
  image: string;
  kind: string;
};

/** Last final plus the next listed kickoff for one county varsity team. */
export type SchoolScore = {
  id: string;
  school: string;
  mascot: string;
  href: string;
  watch: string;
  logo: string;
  color: string;
  last: GameResult | null;
  next: UpcomingGame | null;
  highlights: GameHighlight[];
  /** Flattened last-game fields for older call sites. */
  opponent: string;
  schoolScore: number;
  opponentScore: number;
  result: 'won' | 'lost' | 'tied' | '';
  when: string;
  kickoff: string;
  place: string;
  side: 'Home' | 'Away' | '';
};

export const footballSchools: {
  id: string;
  school: string;
  mascot: string;
  href: string;
  watch: string;
  logo?: string;
  color?: string;
}[] = [
  {
    id: 'bastrop',
    school: 'Bastrop',
    mascot: 'Bears',
    href: 'https://www.maxpreps.com/tx/bastrop/bastrop-bears/football/',
    watch: 'https://www.nfhsnetwork.com/schools/bastrop-high-school-bastrop-tx',
    color: '#8F0018',
  },
  {
    id: 'cedar-creek',
    school: 'Cedar Creek',
    mascot: 'Eagles',
    href: 'https://www.maxpreps.com/tx/cedar-creek/cedar-creek-eagles/football/',
    watch: 'https://www.nfhsnetwork.com/schools/cedar-creek-high-school-bastrop-tx',
    color: '#022C66',
  },
  {
    id: 'elgin',
    school: 'Elgin',
    mascot: 'Wildcats',
    href: 'https://www.maxpreps.com/tx/elgin/elgin-wildcats/football/',
    watch: 'https://www.nfhsnetwork.com/schools/elgin-high-school-elgin-tx',
    color: '#754ACC',
  },
  {
    id: 'smithville',
    school: 'Smithville',
    mascot: 'Tigers',
    href: 'https://www.maxpreps.com/tx/smithville/smithville-tigers/football/',
    watch: 'https://www.nfhsnetwork.com/schools/smithville-high-school-smithville-tx',
    color: '#CC4E10',
  },
];

const cache: { at: number; value: SchoolScore[] } = { at: 0, value: [] };

const monthNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

type GlanceTeam = {
  teamId: string;
  schoolName: string;
  score: number | null;
  result: string | null;
};

type GlanceGame = {
  hasResult: boolean;
  timestamp: string;
  homeAwayType: number;
  teams: GlanceTeam[];
};

function stampParts(iso: string) {
  const match = iso.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
  if (!match) return { when: '', kickoff: '' };
  const when = `${monthNames[Number(match[2]) - 1]} ${Number(match[3])}, ${match[1]}`;
  let hour = Number(match[4]);
  const minute = match[5];
  const suffix = hour >= 12 ? 'pm' : 'am';
  hour = hour % 12 || 12;
  const kickoff = minute === '00' ? `${hour} ${suffix}` : `${hour}:${minute} ${suffix}`;
  return { when, kickoff };
}

function sideOf(homeAwayType: number): 'Home' | 'Away' | '' {
  if (homeAwayType === 1) return 'Home';
  if (homeAwayType === 0) return 'Away';
  return '';
}

function shortSchool(name: string) {
  return name.replace(/ High School$/i, '').trim();
}

function resultOf(code: string | null | undefined): GameResult['result'] {
  if (code === 'W') return 'won';
  if (code === 'L') return 'lost';
  return 'tied';
}

function fromGlance(game: GlanceGame, schoolId: string): { us: GlanceTeam; opp: GlanceTeam } | null {
  const us = game.teams.find((team) => team.teamId === schoolId);
  const opp = game.teams.find((team) => team.teamId !== schoolId);
  if (!us || !opp) return null;
  return { us, opp };
}

function parseNextData(html: string) {
  const match = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/i);
  if (!match) return null;
  try {
    return JSON.parse(match[1]) as {
      props?: {
        pageProps?: {
          schoolId?: string;
          teamContext?: { data?: { schoolMascotUrl?: string; schoolColor1?: string } };
          featuredGameData?: {
            date?: string;
            hasResult?: boolean;
            teams?: { teamId: string; name: string; homeAwayType: number }[];
          };
          wallCards?: { schedule?: { data?: GlanceGame[] } };
        };
      };
    };
  } catch {
    return null;
  }
}

function decodeHtml(value: string) {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

function cleanHighlightTitle(label: string) {
  return decodeHtml(label)
    .replace(/\s*[—–-]\s*(?:Texan Live|Dave Campbell'?s Texas Sports|Vype Broadcast|Rudder)\s*$/i, '')
    .replace(/^(Game Teaser|Team Highlights|Highlights|Game Recap):\s*/i, '')
    .replace(/\s*Varsity (?:Boys )?Football\s*/i, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function highlightKind(label: string) {
  const text = label.toLowerCase();
  if (text.includes('game teaser')) return 'Teaser';
  if (text.includes('game recap')) return 'Recap';
  if (text.includes('team highlights') || text.includes('highlights')) return 'Highlights';
  return 'Clip';
}

const highlightKindRank: Record<string, number> = {
  Teaser: 0,
  Highlights: 1,
  Recap: 2,
  Clip: 3,
};

/** Pull recent football highlight cards from an NFHS Network school page. */
export function parseNfhsHighlights(html: string, limit = 3): GameHighlight[] {
  const pattern =
    /href="(\/highlights\/hlt[a-z0-9]+)"[^>]*aria-label="([^"]+)"[\s\S]{0,2200}?url\((https:\/\/(?:delivery\.vod|recaps)\.nfhsnetwork\.com[^)\s"]+)/gi;
  const seen = new Set<string>();
  const items: GameHighlight[] = [];
  for (const match of html.matchAll(pattern)) {
    const path = match[1];
    const label = decodeHtml(match[2]);
    const image = match[3];
    if (seen.has(path)) continue;
    if (!/football/i.test(label)) continue;
    if (!/game teaser|highlights|game recap/i.test(label)) continue;
    seen.add(path);
    items.push({
      id: path.replace('/highlights/', ''),
      title: cleanHighlightTitle(label),
      href: `https://www.nfhsnetwork.com${path}`,
      image,
      kind: highlightKind(label),
    });
  }
  items.sort((a, b) => (highlightKindRank[a.kind] ?? 9) - (highlightKindRank[b.kind] ?? 9));
  return items.slice(0, limit);
}

export function parseTeamBoard(html: string, school: (typeof footballSchools)[number]): SchoolScore | null {
  const data = parseNextData(html);
  const page = data?.props?.pageProps;
  const schoolId = page?.schoolId;
  const games = page?.wallCards?.schedule?.data;
  if (!schoolId || !games?.length) return null;

  const logo = page.teamContext?.data?.schoolMascotUrl || school.logo || '';
  const color = page.teamContext?.data?.schoolColor1
    ? `#${page.teamContext.data.schoolColor1.replace(/^#/, '')}`
    : school.color || '#10281f';

  const finished = [...games].filter((game) => game.hasResult).reverse();
  const upcoming = games.find((game) => !game.hasResult);

  let last: GameResult | null = null;
  for (const game of finished) {
    const pair = fromGlance(game, schoolId);
    if (!pair || pair.us.score == null || pair.opp.score == null) continue;
    const stamp = stampParts(game.timestamp);
    last = {
      opponent: shortSchool(pair.opp.schoolName),
      schoolScore: Number(pair.us.score),
      opponentScore: Number(pair.opp.score),
      result: resultOf(pair.us.result),
      when: stamp.when,
      kickoff: stamp.kickoff,
      place: '',
      side: sideOf(game.homeAwayType),
    };
    break;
  }

  let next: UpcomingGame | null = null;
  if (upcoming) {
    const pair = fromGlance(upcoming, schoolId);
    if (pair) {
      const stamp = stampParts(upcoming.timestamp);
      next = {
        opponent: shortSchool(pair.opp.schoolName),
        when: stamp.when,
        kickoff: stamp.kickoff,
        side: sideOf(upcoming.homeAwayType),
      };
    }
  } else if (page.featuredGameData && !page.featuredGameData.hasResult && page.featuredGameData.teams?.length) {
    const featured = page.featuredGameData;
    const us = featured.teams.find((team) => team.teamId === schoolId);
    const opp = featured.teams.find((team) => team.teamId !== schoolId);
    if (us && opp && featured.date) {
      const stamp = stampParts(featured.date);
      next = {
        opponent: shortSchool(opp.name),
        when: stamp.when,
        kickoff: stamp.kickoff,
        side: sideOf(us.homeAwayType),
      };
    }
  }

  if (!last && !next) return null;

  return {
    ...school,
    logo,
    color,
    last,
    next,
    highlights: [],
    opponent: last?.opponent ?? '',
    schoolScore: last?.schoolScore ?? 0,
    opponentScore: last?.opponentScore ?? 0,
    result: last?.result ?? '',
    when: last?.when ?? next?.when ?? '',
    kickoff: last?.kickoff ?? next?.kickoff ?? '',
    place: last?.place ?? '',
    side: last?.side ?? next?.side ?? '',
  };
}

/** @deprecated Prefer parseTeamBoard. Kept for the old Last Game HTML copy. */
export function parseLatestGame(html: string, school: (typeof footballSchools)[number]): SchoolScore | null {
  return parseTeamBoard(html, school);
}

async function loadHighlights(watch: string) {
  const response = await fetch(watch, { headers, signal: AbortSignal.timeout(8000) });
  if (!response.ok) return [] as GameHighlight[];
  return parseNfhsHighlights(await response.text(), 3);
}

async function loadSchool(school: (typeof footballSchools)[number]) {
  const [boardResponse, highlights] = await Promise.all([
    fetch(school.href, { headers, signal: AbortSignal.timeout(8000) }),
    loadHighlights(school.watch).catch(() => [] as GameHighlight[]),
  ]);
  if (!boardResponse.ok) throw new Error(`${school.school} ${boardResponse.status}`);
  const board = parseTeamBoard(await boardResponse.text(), school);
  if (!board) return null;
  return { ...board, highlights };
}

export async function getFridayScores(): Promise<SchoolScore[]> {
  if (cache.value.length && Date.now() - cache.at < 10 * 60 * 1000) return cache.value;
  const scores = (
    await Promise.all(footballSchools.map((school) => loadSchool(school).catch(() => null)))
  ).filter((score): score is SchoolScore => score !== null);
  if (scores.length) {
    cache.at = Date.now();
    cache.value = scores;
  }
  return scores.length ? scores : cache.value;
}
