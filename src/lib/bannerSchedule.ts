import { eventKey } from './time.ts';

const day = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Keep a banner through its endDate. That date is a calendar day in America/Chicago, inclusive.
 * A banner with no endDate, or an endDate that is not YYYY-MM-DD, stays up.
 */
export function activeBanners<T extends { endDate?: string }>(banners: readonly T[], now = new Date()): T[] {
  const today = eventKey(now);
  return banners.filter((banner) => {
    const end = banner.endDate;
    if (!end || !day.test(end)) return true;
    return end >= today;
  });
}
