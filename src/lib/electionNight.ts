import { electionDay } from '../data/vote';
import { addDays, eventKey } from './time';

/** The special page and popup stay up through the day after Election Day. */
export const electionNightUntil = addDays(electionDay, 2);

export function electionNightIsLive(now = new Date()) {
  const key = eventKey(now);
  return key >= electionDay && key < electionNightUntil;
}

