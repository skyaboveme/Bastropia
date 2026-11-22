import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { cardFromFact, storyCards } from './storyStats.ts';

const newsDir = join(dirname(fileURLToPath(import.meta.url)), '../content/news');

function keyFactsIn(markdown: string): string[] {
  const front = markdown.match(/^---\n([\s\S]*?)\n---/);
  if (!front) return [];
  const facts: string[] = [];
  let reading = false;
  for (const line of front[1].split('\n')) {
    if (/^keyFacts:\s*$/.test(line)) {
      reading = true;
      continue;
    }
    if (!reading) continue;
    if (/^\S/.test(line)) break;
    const item = line.match(/^\s+-\s+"(.*)"\s*$/) ?? line.match(/^\s+-\s+'(.*)'\s*$/);
    if (!item) continue;
    facts.push(item[1].replace(/\\"/g, '"').replace(/\\'/g, "'"));
  }
  return facts;
}

test('a count in the sentence beats a road number later in the same fact', () => {
  const card = cardFromFact(
    'SpaceX told county commissioners in May it employs 1,590 people at its Starlink plant at 858 FM 1209.',
  );
  assert.equal(card.kind, 'figure');
  if (card.kind !== 'figure') return;
  assert.equal(card.value, '1,590');
  assert.equal(card.label, 'People at its Starlink plant at 858 FM 1209');
  assert.equal(card.value.includes('858'), false);
  assert.equal(card.value.includes('1209'), false);
});

test('money outranks a percent and a year in the same fact', () => {
  const card = cardFromFact(
    "SpaceX was Bastrop County's largest taxpayer in 2025, with $338.2 million in taxable value, 2.2% of the county total.",
  );
  assert.equal(card.kind, 'figure');
  if (card.kind !== 'figure') return;
  assert.equal(card.value, '$338.2 million');
  assert.equal(card.label, 'Taxable value, 2.2% of the county total');
});

test('the first money amount is the figure and later amounts stay in the label', () => {
  const card = cardFromFact(
    "SpaceX's stock market value was about $1.74 trillion at the Nov. 20 close; Tesla's was about $1.37 trillion. The Boring Company was valued at $23 billion in September.",
  );
  assert.equal(card.kind, 'figure');
  if (card.kind !== 'figure') return;
  assert.equal(card.value, '$1.74 trillion');
  assert.match(card.label, /\$1\.37 trillion/);
  assert.match(card.label, /\$23 billion/);
});

test('a month and year is the figure when the fact has no stronger number', () => {
  const card = cardFromFact(
    'xAI merged into SpaceX in February 2026 and now operates as SpaceXAI, branded SpaceX Super Intelligence. X is part of it.',
  );
  assert.equal(card.kind, 'figure');
  if (card.kind !== 'figure') return;
  assert.equal(card.value, 'February 2026');
  assert.match(card.label, /^xAI merged into SpaceX/);
});

test('a date at the end of a sentence keeps the earlier words as the label', () => {
  const card = cardFromFact('Reopens Dec. 3');
  assert.deepEqual(card, { kind: 'figure', value: 'Dec. 3', label: 'Reopens' });
  const target = cardFromFact(
    'The target start is Aug. 1, 2027. Public meetings and agreements between the county and cities come first.',
  );
  assert.equal(target.kind, 'figure');
  if (target.kind !== 'figure') return;
  assert.equal(target.value, 'Aug. 1, 2027');
  assert.match(target.label, /Public meetings/);
});

test('a leading percent, a leading money amount, and a word number are copied as written', () => {
  assert.deepEqual(cardFromFact('2.2% of the county total'), {
    kind: 'figure',
    value: '2.2%',
    label: 'Of the county total',
  });
  assert.deepEqual(cardFromFact('$11 million rehab of the bridge'), {
    kind: 'figure',
    value: '$11 million',
    label: 'Rehab of the bridge',
  });
  assert.deepEqual(cardFromFact('Three city halls'), { kind: 'figure', value: 'Three', label: 'City halls' });
  assert.deepEqual(cardFromFact('35% of new hires come from economically disadvantaged areas'), {
    kind: 'figure',
    value: '35%',
    label: 'New hires come from economically disadvantaged areas',
  });
});

test('facts with no usable number become chips, including road numbers and phone numbers', () => {
  assert.deepEqual(
    cardFromFact("Tesla's Giga Texas and Neuralink are in Travis County, not Bastrop County."),
    {
      kind: 'chip',
      lead: "Tesla's Giga Texas and Neuralink",
      detail: 'are in Travis County, not Bastrop County.',
    },
  );
  assert.deepEqual(cardFromFact('SH 150 at the river'), { kind: 'chip', lead: 'SH 150 at the river', detail: '' });
  assert.deepEqual(cardFromFact('No addresses have changed yet.'), {
    kind: 'chip',
    lead: 'No addresses have changed yet.',
    detail: '',
  });
  const phone = cardFromFact('Questions: BISD Family Resource Center, 512-772-7130.');
  assert.equal(phone.kind, 'chip');
  if (phone.kind === 'chip') assert.equal(phone.lead.includes('512-772-7130'), true);
});

test('hand-tuned stats win, and a blank stats list falls back to key facts', () => {
  const hand = storyCards(
    [{ value: ' 1,590 ', label: ' local Starlink workers ', note: ' May 2026 ', source: ' Elgin Courier ' }],
    ['This fact has 9 workers and must not be used.'],
  );
  assert.deepEqual(hand, [
    {
      kind: 'figure',
      value: '1,590',
      label: 'local Starlink workers',
      note: 'May 2026',
      source: 'Elgin Courier',
    },
  ]);
  const fallback = storyCards([{ value: ' ', label: ' ' }], ['Reopens Dec. 3']);
  assert.equal(fallback[0]?.kind, 'figure');
  if (fallback[0]?.kind === 'figure') assert.equal(fallback[0].value, 'Dec. 3');
  assert.equal(storyCards(undefined, ['  ', 'Reopens Dec. 3']).length, 1);
});

test('cards stop at eight', () => {
  const facts = Array.from({ length: 9 }, (_, index) => `Fact ${index + 1} counts ${index + 10} people.`);
  assert.equal(storyCards(undefined, facts).length, 8);
  const stats = Array.from({ length: 9 }, (_, index) => ({ value: String(index + 1), label: 'workers' }));
  assert.equal(storyCards(stats, facts).length, 8);
});

test('every derived figure is a substring of its fact', () => {
  const samples = [
    'May 2026',
    'in May it employs 1,590 people',
    'Winter Blast is Thursday, Dec. 17, 5–7 p.m., at Cedar Creek High School, 793 Union Chapel Road.',
    'Families must register to request toys, one form per child, by Dec. 1. Registering does not guarantee a toy.',
    'Bastrop County Commissioners Court meets Monday, Nov. 23, at 9 a.m. at 804 Pecan St. in Bastrop.',
    'EdgeConneX is building three data center campuses along FM 535 in Cedar Creek. State filings for nine buildings list about $5.84 billion in estimated construction costs.',
    "State lawmakers have filed bills to repeal Texas' 2013 sales tax exemption for data centers, which the comptroller's office says costs more than $1 billion a year.",
    'The 2027 legislative session begins Jan. 12.',
    'County staff estimated 1,697 addresses along Texas 71 could be renumbered: 1,080 residential, 529 commercial, 71 civic and 17 other.',
    'The recommendation drops "East" and "West" and uses mile-based numbers, about 10000 at the Travis County line to about 16000 at the Fayette County line.',
  ];
  for (const file of readdirSync(newsDir)) {
    if (!file.endsWith('.md') && !file.endsWith('.mdx')) continue;
    samples.push(...keyFactsIn(readFileSync(join(newsDir, file), 'utf8')));
  }
  assert.ok(samples.length > 10);
  for (const fact of samples) {
    const card = cardFromFact(fact);
    if (card.kind !== 'figure') continue;
    assert.equal(fact.includes(card.value), true, `${card.value} is not in: ${fact}`);
    const digits = card.value.match(/\d[\d,]*(?:\.\d+)?/g) ?? [];
    for (const digit of digits) assert.equal(fact.includes(digit), true, `${digit} invented from: ${fact}`);
  }
});
