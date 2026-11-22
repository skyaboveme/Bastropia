/**
 * Story infographic cards.
 *
 * Hand-tuned `stats` frontmatter wins. Otherwise each key fact becomes one
 * card. A figure is copied from the fact (money, percent, scaled count,
 * comma number, date, time, other count, or a leading number-word). When
 * none of those is present, the fact becomes a chip. The parser never
 * calculates or rewrites a number.
 */

export type StoryStatInput = {
  value: string;
  label: string;
  note?: string;
  source?: string;
};

export type FigureCard = {
  kind: 'figure';
  value: string;
  label: string;
  note?: string;
  source?: string;
};

export type ChipCard = {
  kind: 'chip';
  lead: string;
  detail: string;
};

export type StoryCard = FigureCard | ChipCard;

const MAX_CARDS = 8;
const LABEL_MAX = 120;

const MONTH =
  'Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|June|July|Aug(?:ust)?|Sept?(?:ember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?';

const MONEY =
  /\$\s?\d{1,3}(?:,\d{3})*(?:\.\d+)?(?:\s*(?:million|billion|trillion|thousand)|[MBT])?\b/gi;
const PERCENT = /\d+(?:\.\d+)?\s?(?:%|percent\b)/gi;
const SCALED = /\b\d+(?:,\d{3})*(?:\.\d+)?(?:\s+|-)(?:million|billion|trillion|thousand)\b/gi;
const COMMA_NUM = /\b\d{1,3}(?:,\d{3})+\b/g;
const DATE = new RegExp(
  `\\b(?:${MONTH})\\.?\\s+(?:\\d{1,2}(?:st|nd|rd|th)?(?:,\\s*\\d{4})?|\\d{4})\\b`,
  'gi',
);
const TIME =
  /\b\d{1,2}(?::\d{2})?\s*(?:[–—-]|to)\s*\d{1,2}(?::\d{2})?\s*(?:a\.m\.|p\.m\.|am|pm)\b|\b\d{1,2}(?::\d{2})?\s*(?:a\.m\.|p\.m\.|am|pm)\b/gi;
const PLAIN = /\b\d+(?:\.\d+)?\b/g;
const YEAR = /\b(?:19|20)\d{2}\b/g;
const PHONE = /\b(?:\+?1[-.\s])?\(?\d{3}\)?[-.\s]\d{3}[-.\s]\d{4}\b/g;
const WORD_NUMBER =
  /^(one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve)\b/i;

const QUALIFIER =
  /\b(?:about|around|approximately|nearly|roughly|over|under|at least|more than|up to|some|with)\s*$/i;
const ROAD_BEFORE =
  /(?:\b(?:FM|SH|US|RR|CR|Hwy\.?|Highway|Route|Texas|No\.?|Interstate|I-)\s*)$/i;
const ROAD_AFTER = /^\s*(?:FM|SH|US|RR|CR|Hwy\.?|Highway|Route|block\b)/i;
const ABBREV =
  /(?:Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sept?|Oct|Nov|Dec|Mr|Mrs|Ms|Dr|St|No|U\.S|a\.m|p\.m|sq)\.$/i;
const TRAILING_COPULA = /\s+(?:is|are|was|were)$/i;

type Span = { value: string; start: number; end: number };

function spans(fact: string, re: RegExp): Span[] {
  const flags = re.flags.includes('g') ? re.flags : `${re.flags}g`;
  const rx = new RegExp(re.source, flags);
  const found: Span[] = [];
  let match: RegExpExecArray | null;
  while ((match = rx.exec(fact))) {
    if (!match[0]) {
      rx.lastIndex += 1;
      continue;
    }
    found.push({ value: match[0], start: match.index, end: match.index + match[0].length });
  }
  return found;
}

function overlaps(a: Span, b: Span): boolean {
  return a.start < b.end && b.start < a.end;
}

function isRoad(fact: string, span: Span): boolean {
  return ROAD_BEFORE.test(fact.slice(0, span.start)) || ROAD_AFTER.test(fact.slice(span.end));
}

function isYear(value: string): boolean {
  return /^(?:19|20)\d{2}$/.test(value);
}

/** Sentence end, ignoring abbreviations (Nov., a.m.) and decimals. */
function splitSentence(text: string): { sentence: string; rest: string } {
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch !== '.' && ch !== '!' && ch !== '?') continue;
    if (ch === '.' && ABBREV.test(text.slice(Math.max(0, i - 8), i + 1))) continue;
    if (ch === '.' && /\d\.$/.test(text.slice(0, i + 1)) && /^\d/.test(text.slice(i + 1))) continue;
    const next = text[i + 1] ?? '';
    if (next !== '' && !/\s/.test(next)) continue;
    return { sentence: text.slice(0, i), rest: text.slice(i + 1).trim() };
  }
  return { sentence: text, rest: '' };
}

function cleanJoin(text: string): string {
  let out = text.replace(/\s+/g, ' ').replace(/\s+([,.;:])/g, '$1').trim();
  out = out.replace(/^(?:[,:;.\s]+|(?:and|or|but|with)\s+)+/i, '');
  out = out.replace(/^(?:a|an)\s+(?=\S+\s+\S)/i, '');
  out = out.replace(/^(?:at|in|of|for|to|on|by)\s+(?!the\b)/i, '');
  out = out.replace(TRAILING_COPULA, '');
  out = out.replace(/(?:\s+(?:and|or|but|with|about|around|nearly|approximately|roughly)|[,:;.\s]+)$/i, '');
  return out.trim();
}

function wordsOf(text: string): string[] {
  return text.split(/\s+/).filter(Boolean);
}

function clip(text: string): string {
  const flat = text.replace(/\s+/g, ' ').trim();
  if (flat.length <= LABEL_MAX) return flat;
  const cut = flat.slice(0, LABEL_MAX);
  const space = cut.lastIndexOf(' ');
  return (space > 48 ? cut.slice(0, space) : cut).replace(/[,:;.\s]+$/, '');
}

function capitalize(text: string): string {
  const first = text.split(/\s+/)[0] ?? '';
  if (!first || first !== first.toLowerCase()) return text;
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function labelFor(fact: string, start: number, end: number): string {
  const beforeRaw = fact.slice(0, start).replace(QUALIFIER, '');
  const afterRaw = fact.slice(end);
  const { sentence: afterSentence, rest: afterRest } = splitSentence(afterRaw);
  const nextSplit = splitSentence(afterRest);
  const nextSentence = nextSplit.sentence.trim();
  const beforeBits = beforeRaw.split(/(?<=[.!?])\s/);
  const beforeSentence = (beforeBits[beforeBits.length - 1] ?? beforeRaw).trim();
  const beforeClean = cleanJoin(beforeSentence).replace(/\s+(?:in|at|on|of|for|to|by|with)$/i, '');
  const afterClean = cleanJoin(afterSentence);
  const afterWords = wordsOf(afterClean).length;
  const beforeWords = wordsOf(beforeClean).length;
  const startsWithConjunction = /^\s*(?:and|or|but)\b/i.test(afterSentence);

  let label = '';
  if (afterWords >= 3 && afterWords <= 20 && !startsWithConjunction) {
    label = afterClean;
    if (nextSentence && /\d/.test(nextSentence)) {
      const withNext = `${label}. ${cleanJoin(nextSentence)}`;
      if (withNext.length <= LABEL_MAX) label = withNext;
    }
  } else if (beforeWords >= 2 && beforeWords <= 16) {
    label = cleanJoin(startsWithConjunction ? `${beforeClean} and ${afterClean}` : `${beforeClean} ${afterClean}`);
    if (afterWords === 0 && nextSentence && wordsOf(label).length <= 4) {
      const withNext = `${label}. ${cleanJoin(nextSentence)}`;
      if (withNext.length <= LABEL_MAX) label = withNext;
    }
  } else if (beforeWords > 16) {
    const tail = wordsOf(beforeClean).slice(-12).join(' ');
    label = cleanJoin(`${tail} ${afterClean}`);
  } else if (afterClean) {
    label = afterClean;
  } else {
    label = cleanJoin(nextSentence);
  }

  if (!label) label = cleanJoin(`${beforeRaw} ${afterRaw}`);
  return capitalize(clip(label));
}

function chipFromFact(fact: string): ChipCard {
  const text = fact.replace(/\s+/g, ' ').trim();
  const words = text.split(' ');
  if (words.length <= 8) return { kind: 'chip', lead: text, detail: '' };
  const comma = text.indexOf(',');
  if (comma > 0) {
    const head = text.slice(0, comma).trim();
    const headWords = head.split(/\s+/).length;
    if (headWords >= 2 && headWords <= 7) {
      return { kind: 'chip', lead: head, detail: text.slice(comma + 1).trim() };
    }
  }
  let count = Math.min(6, words.length - 1);
  while (count > 2 && /^(?:a|an|the|of|to|for|and|or|in|on|at|by|is|are|was|were|will|would)$/i.test(words[count - 1] ?? '')) count -= 1;
  return { kind: 'chip', lead: words.slice(0, count).join(' '), detail: words.slice(count).join(' ') };
}

/** One card from one key fact. The figure, when there is one, is a substring of `fact`. */
export function cardFromFact(fact: string): StoryCard {
  const text = fact.replace(/\s+/g, ' ').trim();
  const phones = spans(text, PHONE);
  const dated = spans(text, DATE);
  const tiers: Array<{ hits: Span[]; roads?: boolean; years?: boolean; phones?: boolean }> = [
    { hits: spans(text, MONEY) },
    { hits: spans(text, PERCENT) },
    { hits: spans(text, SCALED) },
    { hits: spans(text, COMMA_NUM), roads: true },
    { hits: dated },
    { hits: spans(text, TIME) },
    { hits: spans(text, PLAIN), roads: true, years: true, phones: true },
    { hits: spans(text, YEAR) },
  ];

  for (const tier of tiers) {
    const usable = tier.hits.filter((hit) => {
      if (tier.roads && isRoad(text, hit)) return false;
      if (tier.years && isYear(hit.value)) return false;
      if (tier.phones && phones.some((phone) => overlaps(hit, phone))) return false;
      if (dated.some((date) => overlaps(hit, date) && hit.value !== date.value)) return false;
      return true;
    });
    if (!usable.length) continue;
    const hit = usable[0];
    const value = hit.value.trim();
    return { kind: 'figure', value, label: labelFor(text, hit.start, hit.end) };
  }

  const word = WORD_NUMBER.exec(text);
  WORD_NUMBER.lastIndex = 0;
  if (word) {
    return { kind: 'figure', value: word[1], label: labelFor(text, word.index, word.index + word[1].length) };
  }
  return chipFromFact(text);
}

function cleanStat(stat: StoryStatInput): FigureCard | undefined {
  const value = stat.value?.trim() ?? '';
  const label = stat.label?.trim() ?? '';
  if (!value || !label) return undefined;
  const note = stat.note?.trim();
  const source = stat.source?.trim();
  return {
    kind: 'figure',
    value,
    label,
    ...(note ? { note } : {}),
    ...(source ? { source } : {}),
  };
}

/**
 * Prefer hand-tuned stats. An empty or unusable stats list falls back to key facts.
 * At most eight cards, matching the key-facts cap.
 */
export function storyCards(stats?: StoryStatInput[], keyFacts?: string[]): StoryCard[] {
  const hand = (stats ?? []).map(cleanStat).filter((card): card is FigureCard => Boolean(card)).slice(0, MAX_CARDS);
  if (hand.length) return hand;
  return (keyFacts ?? [])
    .map((fact) => fact.trim())
    .filter(Boolean)
    .slice(0, MAX_CARDS)
    .map(cardFromFact);
}
