import { electionDay } from '../data/vote';
import { addDays, eventKey } from './time';

/** Election night closed the morning after Election Day. The board now lives at /results. */
export const electionNightUntil = addDays(electionDay, 1);

export function electionNightIsLive(now = new Date()) {
  const key = eventKey(now);
  return key >= electionDay && key < electionNightUntil;
}

