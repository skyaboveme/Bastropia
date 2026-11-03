import { electionDay } from '../data/vote';
import type { ResultRace } from './electionResults';
import { addDays, eventKey } from './time';

/** The special page and popup stay up through the day after Election Day. */
export const electionNightUntil = addDays(electionDay, 2);

export function electionNightIsLive(now = new Date()) {
  const key = eventKey(now);
  return key >= electionDay && key < electionNightUntil;
}

const nightCategories = [
  'County',
  'City of Bastrop Special Election',
  'City of Smithville Special Election',
  'City of Elgin Special Election',
  'Bastrop ISD',
  'McDade ISD',
  'ESD#2',
];

export function nightRaces(races: ResultRace[]) {
  const picked: ResultRace[] = [];
  for (const category of nightCategories) {
    const limit = category === 'County' ? 3 : 1;
    picked.push(...races.filter((race) => race.category === category).slice(0, limit));
  }
  if (picked.length) return picked;
  return races.slice(0, 8);
}
