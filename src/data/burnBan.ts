/** Update this file when the county posts a new outdoor-burning order.
 *  scripts/check-burn-ban.mjs rewrites inEffect, checked, headline, and summary
 *  when the county page and the Texas A&M Forest Service layer agree. */
export const burnBan = {
  inEffect: false,
  checked: '2026-11-23',
  headline: 'No burn ban is listed',
  summary:
    'The Bastrop County outdoor burning page says there is no burn ban in effect. The Texas A&M Forest Service burn-ban layer also lists Bastrop County as No. Checked November 23, 2026. That can change the same day.',
  sourceUrl: 'https://www.bastropcounty.gov/page/em.outdoor_burning',
  sourceLabel: 'Bastrop County outdoor burning',
  oemUrl: 'https://www.bastropcounty.gov/page/em.home',
  forestUrl: 'https://tfsweb.tamu.edu/BurnBans/',
  recentOrders: ['September 28, 2026', 'September 14, 2026', 'August 24, 2026', 'March 23, 2026'],
};

/** Masthead status. Keep the wording unambiguous next to the “Burn ban” label. */
export const burnStatus = burnBan.inEffect ? 'Ban in effect' : 'No burn ban';
