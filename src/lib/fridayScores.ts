const headers = {
  'user-agent': 'BastropiaBot/1.0 (+https://bastropia.com)',
  accept: 'text/html',
};

export type SchoolScore = {
  id: string;
  school: string;
  mascot: string;
  href: string;
  watch: string;
  opponent: string;
  schoolScore: number;
  opponentScore: number;
  result: 'won' | 'lost' | 'tied';
  when: string;
  kickoff: string;
  place: string;
  side: 'Home' | 'Away' | '';
};

export const footballSchools: { id: string; school: string; mascot: string; href: string; watch: string }[] = [
  {
    id: 'bastrop',
    school: 'Bastrop',
    mascot: 'Bears',
    href: 'https://www.maxpreps.com/tx/bastrop/bastrop-bears/football/',
    watch: 'https://www.nfhsnetwork.com/schools/bastrop-high-school-bastrop-tx',
  },
  {
    id: 'cedar-creek',
    school: 'Cedar Creek',
    mascot: 'Eagles',
    href: 'https://www.maxpreps.com/tx/cedar-creek/cedar-creek-eagles/football/',
    watch: 'https://www.nfhsnetwork.com/schools/cedar-creek-high-school-bastrop-tx',
  },
  {
    id: 'elgin',
    school: 'Elgin',
    mascot: 'Wildcats',
    href: 'https://www.maxpreps.com/tx/elgin/elgin-wildcats/football/',
    watch: 'https://www.nfhsnetwork.com/schools/elgin-high-school-elgin-tx',
  },
  {
    id: 'smithville',
    school: 'Smithville',
    mascot: 'Tigers',
    href: 'https://www.maxpreps.com/tx/smithville/smithville-tigers/football/',
    watch: 'https://www.nfhsnetwork.com/schools/smithville-high-school-smithville-tx',
  },
];

const cache: { at: number; value: SchoolScore[] } = { at: 0, value: [] };

function visible(html: string) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

export function parseLatestGame(
  html: string,
  school: (typeof footballSchools)[number],
): SchoolScore | null {
  const text = visible(html);
  const last = text.split('Last Game')[1] ?? '';
  const match = last.match(
    /On (?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday), ([A-Z][a-z]{2,8} \d{1,2}, \d{4}), the .+? team (won|lost|tied) their(?: ([A-Za-z0-9 .'-]{2,80}?))? game against (.+?) by a score of (\d+)-(\d+)/,
  );
  if (!match) return null;
  const kickoff = last.match(/@ (\d{1,2}:\d{2}\s*[ap]m)/i)?.[1] ?? '';
  const side = last.startsWith(' Home Game') ? 'Home' : last.startsWith(' Away Game') ? 'Away' : '';
  const place = (match[3] ?? '').replace(/\bStd\b/, 'Stadium').trim();
  return {
    ...school,
    opponent: match[4].replace(/ High School$/, ''),
    schoolScore: Number(match[5]),
    opponentScore: Number(match[6]),
    result: match[2] as SchoolScore['result'],
    when: match[1],
    kickoff,
    place,
    side,
  };
}

async function loadSchool(school: (typeof footballSchools)[number]) {
  const response = await fetch(school.href, { headers, signal: AbortSignal.timeout(8000) });
  if (!response.ok) throw new Error(`${school.school} ${response.status}`);
  return parseLatestGame(await response.text(), school);
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
