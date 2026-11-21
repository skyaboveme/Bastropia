import { burnBan, burnStatus } from '../data/burnBan';
import { eventKey } from './time';

/** A reading older than this is shown as unconfirmed, not as the current order. */
export const BURN_STALE_DAYS = 3;

export function burnAgeDays(now = new Date()) {
  const dayKey = eventKey(now);
  const [fromYear, fromMonth, fromDay] = burnBan.checked.split('-').map(Number);
  const [toYear, toMonth, toDay] = dayKey.split('-').map(Number);
  return Math.round((Date.UTC(toYear, toMonth - 1, toDay) - Date.UTC(fromYear, fromMonth - 1, fromDay)) / 86400000);
}

function checkedOn(withYear: boolean) {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'UTC',
    month: 'long',
    day: 'numeric',
    ...(withYear ? { year: 'numeric' as const } : {}),
  }).format(new Date(`${burnBan.checked}T12:00:00Z`));
}

export function burnView(now = new Date()) {
  const age = burnAgeDays(now);
  const stale = age >= BURN_STALE_DAYS;
  const checkedLabel = checkedOn(false);
  const checkedLong = checkedOn(true);
  if (stale) {
    return {
      stale: true,
      age,
      checkedLabel,
      checkedLong,
      status: 'Not confirmed',
      tone: 'stale' as const,
      aria: `Status not confirmed since ${checkedLong}. Check the county page.`,
      sub: `Since ${checkedLabel}`,
      pageTitle: 'Status not confirmed',
      pageLede: `Status not confirmed since ${checkedLong}. The last reading on this desk was “${burnStatus}.” The county page is the order.`,
    };
  }
  return {
    stale: false,
    age,
    checkedLabel,
    checkedLong,
    status: burnStatus,
    tone: (burnBan.inEffect ? 'stop' : 'ok') as 'stop' | 'ok',
    aria: `${burnStatus} in Bastrop County. Checked ${checkedLabel}.`,
    sub: `Checked ${checkedLabel}`,
    pageTitle: burnBan.headline,
    pageLede: burnBan.summary,
  };
}
