/** Strict reading of the county outdoor-burning page and the Forest Service layer.
 *  Anything that is not an exact status sentence is refused. The site then ages
 *  into the “not confirmed” masthead instead of repeating an old order. */

const COUNTY_URL = 'https://www.bastropcounty.gov/page/em.outdoor_burning';
const FOREST_QUERY =
  'https://gis.tfs.tamu.edu/arcgis/rest/services/EOC/BurnBan/FeatureServer/0/query?where=County%3D%27Bastrop%27&outFields=County,BurnBan,StartDate&returnGeometry=false&f=json';
const FOREST_PAGE = 'https://tfsweb.tamu.edu/BurnBans/';

const CLEAR = /^there is no burn ban in effect\.?$/i;
const BAN = /^(?:there is a burn ban in effect|a burn ban is (?:currently )?in effect|burn ban is in effect)\.?$/i;

export function parseCountyStatus(html) {
  const widget = String(html).match(/<h2>\s*Burn Ban Status\s*<\/h2>\s*<p[^>]*>([\s\S]*?)<\/p>/i);
  if (!widget) return { ok: false, reason: 'Burn Ban Status heading was not on the county page' };
  const text = widget[1]
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/\s+/g, ' ')
    .trim();
  if (CLEAR.test(text)) return { ok: true, inEffect: false, text };
  if (BAN.test(text)) return { ok: true, inEffect: true, text };
  return { ok: false, reason: 'unrecognized status sentence', text };
}

export function parseForestStatus(payload) {
  const feature = payload?.features?.[0]?.attributes;
  const county = String(feature?.County ?? '').trim();
  const ban = String(feature?.BurnBan ?? '').trim();
  if (county !== 'Bastrop') return { ok: false, reason: 'Forest Service layer did not return Bastrop County' };
  if (ban !== 'Yes' && ban !== 'No') return { ok: false, reason: 'Forest Service burn flag was not Yes or No', ban };
  return { ok: true, inEffect: ban === 'Yes', ban };
}

export function decide(county, forest) {
  if (!county?.ok) return { write: false, reason: county?.reason || 'county page unreadable' };
  if (!forest?.ok) return { write: false, reason: forest?.reason || 'Forest Service layer unreadable' };
  if (county.inEffect !== forest.inEffect) {
    return {
      write: false,
      reason: `county says ${county.inEffect ? 'ban' : 'no ban'} and Forest Service says ${forest.ban}`,
      countyText: county.text,
    };
  }
  return { write: true, inEffect: county.inEffect, countyText: county.text, forestBan: forest.ban };
}

export function chicagoDate(now = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Chicago',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
}

export function longDate(iso) {
  const [year, month, day] = iso.split('-').map(Number);
  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'UTC',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(Date.UTC(year, month - 1, day, 12)));
}

export function statusCopy(inEffect, checked) {
  const when = longDate(checked);
  if (inEffect) {
    return {
      headline: 'A burn ban is in effect',
      summary: `The Bastrop County outdoor burning page says a burn ban is in effect. The Texas A&M Forest Service burn-ban layer also lists Bastrop County as Yes. Checked ${when}. Read the county order before you burn.`,
      description: `The county page lists a burn ban in effect as of ${when}.`,
      body: `As of ${when}, the Bastrop County outdoor burning page says a burn ban is in effect. The Texas A&M Forest Service burn-ban layer also lists Bastrop County as Yes. The same county page keeps earlier orders, including September 28, September 14, and August 24, 2026.`,
    };
  }
  return {
    headline: 'No burn ban is listed',
    summary: `The Bastrop County outdoor burning page says there is no burn ban in effect. The Texas A&M Forest Service burn-ban layer also lists Bastrop County as No. Checked ${when}. That can change the same day.`,
    description: `The county page lists no burn ban in effect as of ${when}.`,
    body: `As of ${when}, the Bastrop County outdoor burning page says there is no burn ban in effect. The Texas A&M Forest Service burn-ban layer also lists Bastrop County as No. The same county page keeps earlier orders, including September 28, September 14, and August 24, 2026.`,
  };
}

export function patchBurnBan(source, fields) {
  const summary = fields.summary.replace(/'/g, "\\'");
  const headline = fields.headline.replace(/'/g, "\\'");
  let next = source;
  const replacements = [
    [/inEffect:\s*(?:true|false)/, `inEffect: ${fields.inEffect}`],
    [/checked:\s*'[^']*'/, `checked: '${fields.checked}'`],
    [/headline:\s*'[^']*'/, `headline: '${headline}'`],
    [/summary:\s*(?:\n\s*)?'(?:\\'|[^'])*'/, `summary:\n    '${summary}'`],
  ];
  for (const [pattern, value] of replacements) {
    if (!pattern.test(next)) throw new Error(`burnBan.ts is missing ${pattern}`);
    next = next.replace(pattern, value);
  }
  return next;
}

export function noticeMarkdown(fields) {
  const copy = statusCopy(fields.inEffect, fields.checked);
  const pub = chicagoMorning(fields.checked);
  return `---
title: Outdoor burning status
description: ${copy.description}
pubDate: ${pub}
agency: Bastrop County Office of Emergency Management
sourceUrl: ${COUNTY_URL}
sourceLabel: County outdoor burning page
---

This is a summary of a public county page, not a new order from the county.

${copy.body}

Check that page the day you plan to burn. Bastropia copies the status into the top of this site. A daily check updates this note when the county sentence and the Forest Service layer agree. If they do not, the masthead says the status is not confirmed.
`;
}

function chicagoMorning(iso) {
  const probe = new Date(`${iso}T14:00:00Z`);
  const hour = Number(
    new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Chicago',
      hour: '2-digit',
      hourCycle: 'h23',
    }).format(probe),
  );
  const offset = hour === 8 ? '-06:00' : '-05:00';
  return `${iso}T08:00:00${offset}`;
}

export const sources = { COUNTY_URL, FOREST_QUERY, FOREST_PAGE };
