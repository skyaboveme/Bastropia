/**
 * Directory search. Port of the reference matcher shipped with
 * directorySynonyms.json (word-start AND match, town filters, no address search).
 */
import synonymsFile from '../data/directorySynonyms.json' with { type: 'json' };
import groupsFile from '../data/directoryCategoryGroups.json' with { type: 'json' };
import { directoryLabelInfo } from './directoryGroups.ts';

export type MatchRow = {
  n: string;
  c: string;
  t?: string;
  id?: string;
  /** Towns this business serves besides its home town. */
  sv?: string[];
};

export type QueryUnit = { kind: 'concept' | 'word'; ids?: string[]; text: string };

type Concept = {
  id: string;
  label: string;
  terms: string[];
  categories: string[];
  groups?: string[];
  nameKeywords: string[];
  excludeCategories?: string[];
};

type SynFile = {
  stopwords: string[];
  towns: Record<string, string>;
  countyPhrases: string[];
  exactWordOnly: string[];
  concepts: Concept[];
};

type GroupsFile = {
  groups: { id: string; label: string; short?: string }[];
  labels: Record<string, { group: string; subgroup?: string }>;
};

type Prepared = {
  nameNorm: string;
  nameWords: string[];
  all: string[];
  group: string;
  cat: string;
};

const STEM = /(ists|ist|ers|er|ing|es|s)$/;

export function normalizeDirectoryText(value: string) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[’‘`]/g, "'")
    .replace(/\./g, '')
    .replace(/[^a-z0-9'&/+\-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const wordsOf = (value: string) => normalizeDirectoryText(value).split(' ').filter(Boolean);

export function buildDirectoryMatcher(syn: SynFile = synonymsFile as SynFile, groups: GroupsFile = groupsFile as GroupsFile) {
  const exact = new Set(syn.exactWordOnly.map((item) => normalizeDirectoryText(item)));
  const stop = new Set(syn.stopwords.map((item) => normalizeDirectoryText(item)));
  const towns = Object.entries(syn.towns)
    .map(([key, label]) => [normalizeDirectoryText(key), label] as const)
    .sort((a, b) => b[0].length - a[0].length);
  const county = syn.countyPhrases.map((item) => normalizeDirectoryText(item)).sort((a, b) => b.length - a.length);
  const concepts = new Map(
    syn.concepts.map((concept) => [
      concept.id,
      {
        ...concept,
        cats: new Set(concept.categories.map((item) => item.toLowerCase())),
        groups: new Set(concept.groups || []),
        kws: concept.nameKeywords.map((item) => normalizeDirectoryText(item)).filter(Boolean),
        excl: new Set((concept.excludeCategories || []).map((item) => item.toLowerCase())),
      },
    ]),
  );
  const terms = new Map<string, string[]>();
  for (const concept of syn.concepts) {
    for (const term of concept.terms) {
      const key = normalizeDirectoryText(term);
      if (!terms.has(key)) terms.set(key, []);
      terms.get(key)!.push(concept.id);
    }
  }
  const maxTermWords = Math.max(...[...terms.keys()].map((term) => term.split(' ').length));
  const labelInfo = groups.labels || {};
  const groupLabel = Object.fromEntries(groups.groups.map((group) => [group.id, group]));

  function prep(row: MatchRow): Prepared {
    const cached = (row as MatchRow & { _p?: Prepared })._p;
    if (cached) return cached;
    const key = (row.c || '').toLowerCase().replace(/\s+/g, ' ').trim();
    const info = labelInfo[key] || { group: 'business', subgroup: '' };
    const nameNorm = ` ${normalizeDirectoryText(row.n)} `;
    const nameWords = wordsOf(row.n);
    const metaWords = wordsOf(row.c);
    const prepared = { nameNorm, nameWords, all: [...nameWords, ...metaWords], group: info.group, cat: (row.c || '').toLowerCase() };
    (row as MatchRow & { _p?: Prepared })._p = prepared;
    return prepared;
  }

  const wordHit = (list: string[], token: string) => {
    if (exact.has(token) || token.length <= 2) return list.some((word) => word === token || word === `${token}s`);
    const stem = token.replace(STEM, '');
    return list.some((word) => word.startsWith(token) || (stem.length >= 4 && stem !== token && word.startsWith(stem)));
  };

  const kwHit = (prepared: Prepared, keyword: string) =>
    keyword.includes(' ')
      ? prepared.nameNorm.includes(` ${keyword} `) || prepared.nameNorm.includes(` ${keyword}`)
      : exact.has(keyword)
        ? prepared.nameWords.includes(keyword)
        : prepared.nameWords.some((word) => word.startsWith(keyword));

  function parse(query: string) {
    let text = ` ${normalizeDirectoryText(query)} `;
    for (const phrase of county) text = text.replace(` ${phrase} `, ' ');
    let town = '';
    for (const [key, label] of towns) {
      if (text.includes(` ${key} `)) {
        town = label;
        text = text.replace(` ${key} `, ' ');
        break;
      }
    }
    const tokens = text.trim().split(' ').filter(Boolean);
    const units: QueryUnit[] = [];
    for (let index = 0; index < tokens.length; ) {
      let took = 0;
      for (let size = Math.min(maxTermWords, tokens.length - index); size >= 1; size--) {
        const phrase = tokens.slice(index, index + size).join(' ');
        if (terms.has(phrase)) {
          units.push({ kind: 'concept', ids: terms.get(phrase), text: phrase });
          took = size;
          break;
        }
      }
      if (took) {
        index += took;
        continue;
      }
      if (!stop.has(tokens[index])) units.push({ kind: 'word', text: tokens[index] });
      index++;
    }
    return { town, units, text: units.map((unit) => unit.text).join(' ') };
  }

  function townOk(row: MatchRow, prepared: Prepared, town: string) {
    if (!town) return true;
    if ((row.t || '') === town) return true;
    if (row.sv?.includes(town)) return true;
    return prepared.nameNorm.includes(` ${normalizeDirectoryText(town)} `);
  }

  function conceptGroup(id: string) {
    const concept = concepts.get(id);
    if (!concept) return '';
    const listed = [...concept.groups];
    if (listed[0]) return listed[0];
    const category = concept.categories?.[0];
    return category ? directoryLabelInfo(category).group : '';
  }

  function unitOk(prepared: Prepared, unit: QueryUnit) {
    if (unit.kind === 'word') return wordHit(prepared.all, unit.text);
    const live = (unit.ids || [])
      .map((id) => concepts.get(id))
      .filter((concept) => concept && !concept.excl.has(prepared.cat));
    if (!live.length) return false;
    for (const concept of live) {
      if (!concept) continue;
      if (concept.cats.has(prepared.cat) || concept.groups.has(prepared.group) || concept.kws.some((keyword) => kwHit(prepared, keyword))) return true;
    }
    return unit.text.split(' ').every((token) => wordHit(prepared.all, token));
  }

  function search<T extends MatchRow>(rows: T[], query: string, opts: { town?: string } = {}) {
    const parsed = parse(query);
    const town = opts.town || parsed.town;
    const text = rows.filter((row) => parsed.units.every((unit) => unitOk(prep(row), unit)));
    const results = text.filter((row) => townOk(row, prep(row), town));
    const countywide = town ? text.filter((row) => !(row.t || '') && !results.includes(row)) : [];
    return Object.assign(results, { countywide, town, units: parsed.units, text: parsed.text });
  }

  function conceptLabel(units: QueryUnit[]) {
    if (units.length !== 1 || units[0].kind !== 'concept') return '';
    const concept = concepts.get(units[0].ids?.[0] || '');
    return concept?.label || '';
  }

  return { parse, search, prep, conceptLabel, conceptGroup, concepts };
}

let shared: ReturnType<typeof buildDirectoryMatcher> | undefined;

export function directoryMatcher() {
  if (!shared) shared = buildDirectoryMatcher();
  return shared;
}

export function directoryAzKey(name: string) {
  const stripped = name.replace(/^[^A-Za-z0-9]+/, '');
  return `${/^[A-Za-z]/.test(stripped) ? '0' : '1'}${name.toLowerCase()}`;
}

export function compareDirectoryAz(a: string, b: string) {
  return directoryAzKey(a).localeCompare(directoryAzKey(b));
}

/** Relevance when the query has words. Partners and featured only break ties. */
export function rankDirectoryRows<T extends MatchRow & { r?: number }>(rows: T[], units: QueryUnit[]) {
  if (!units.length) return [...rows].sort((a, b) => compareDirectoryAz(a.n, b.n));
  const phrase = normalizeDirectoryText(units.map((unit) => unit.text).join(' '));
  const score = (row: T) => {
    const name = normalizeDirectoryText(row.n);
    const nameWords = name.split(' ').filter(Boolean);
    let value = 0;
    if (phrase && (name === phrase || name.startsWith(`${phrase} `))) value += 400;
    for (const unit of units) {
      const token = normalizeDirectoryText(unit.text);
      if (!token) continue;
      if (nameWords.includes(token)) value += 300;
      else if (token.length >= 4 && nameWords.some((word) => word.startsWith(token))) value += 250;
      else if (unit.kind === 'concept') value += 200;
      else value += 120;
    }
    return value;
  };
  return [...rows].sort((a, b) => score(b) - score(a) || (a.r || 9) - (b.r || 9) || compareDirectoryAz(a.n, b.n));
}

function levenshtein(a: string, b: string) {
  if (Math.abs(a.length - b.length) > 2) return 3;
  const row = Array.from({ length: b.length + 1 }, (_, index) => index);
  for (let i = 1; i <= a.length; i++) {
    let previous = row[0];
    row[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const next = row[j];
      row[j] = a[i - 1] === b[j - 1] ? previous : Math.min(previous, row[j], row[j - 1]) + 1;
      previous = next;
    }
  }
  return row[b.length];
}

export function suggestDirectoryQuery(query: string, sample: (next: string) => number) {
  const matcher = directoryMatcher();
  const parsed = matcher.parse(query);
  const termList = [...new Set((synonymsFile as SynFile).concepts.flatMap((concept) => concept.terms.map((term) => normalizeDirectoryText(term))))];
  let best = '';
  let bestCount = 0;
  for (const unit of parsed.units) {
    if (unit.text.length < 4 || unit.kind === 'concept') continue;
    for (const term of termList) {
      if (term === unit.text || term.includes(' ')) continue;
      if (levenshtein(unit.text, term) > 1) continue;
      const next = query.replace(new RegExp(unit.text, 'i'), term);
      const count = sample(next);
      if (count > bestCount) {
        best = term;
        bestCount = count;
      }
    }
  }
  return bestCount ? { term: best, count: bestCount } : null;
}
