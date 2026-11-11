import { newsletterNewResidentTagId } from './site';

/** Evergreen new-resident desk notes. Confirm office hours and routes on the linked pages. */
export const newResidentGuide = {
  title: 'New to Bastrop County',
  summary:
    'Utilities, trash day, tax dates, and which commissioner covers your road — the desk notes neighbors ask for first.',
  checked: '2026-11-10',
  precinctMapUrl: 'https://www.bastropcounty.gov/page/com.main',
  kitTagId: newsletterNewResidentTagId,
};

export const countyOfficials = {
  judge: {
    name: 'Gregory Klaus',
    role: 'County Judge',
    detail: 'Sitting judge through the current term. Office hours Monday–Thursday 8 am–5 pm, Friday 8 am–4 pm, closed 12–1 for lunch.',
    phone: '(512) 332-7201',
    href: 'https://www.bastropcounty.gov/page/co.county_judge',
  },
  judgeElect: {
    name: 'Dock Jackson',
    role: 'County Judge-elect',
    detail: 'Won the Nov. 3, 2026 race. Takes office with the new term in January 2027. Use the sitting judge line above until then.',
    phone: '(512) 332-7201',
    href: 'https://www.bastropcounty.gov/page/co.county_judge',
  },
  commissioners: [
    {
      precinct: 1,
      name: 'Butch Carmack',
      area: 'Central Bastrop area',
      phone: '(512) 332-7295',
      email: 'charles.carmack@co.bastrop.tx.us',
      href: 'https://www.bastropcounty.gov/page/com.pct_1',
    },
    {
      precinct: 2,
      name: 'Clara Beckett',
      area: 'Confirm your road on the county precinct map',
      phone: '(512) 581-4002',
      email: 'clara.beckett@co.bastrop.tx.us',
      href: 'https://www.bastropcounty.gov/page/com.pct_2',
    },
    {
      precinct: 3,
      name: 'Mark Meuth',
      area: 'West county, including Cedar Creek area',
      phone: '(512) 581-4000',
      email: 'mark.meuth@co.bastrop.tx.us',
      href: 'https://www.bastropcounty.gov/page/com.pct_3',
    },
    {
      precinct: 4,
      name: 'David Glass',
      area: 'Confirm your road on the county precinct map',
      phone: '(512) 581-4004',
      email: 'david.glass@co.bastrop.tx.us',
      href: 'https://www.bastropcounty.gov/page/com.pct_4',
    },
  ],
};

export const taxDates = {
  intro:
    'Bastrop County follows the usual Texas property-tax calendar. The Tax Assessor-Collector bills; the appraisal district handles value and exemptions.',
  items: [
    {
      label: 'January 31',
      detail: 'Taxes for the prior year are due. Pay by this date to avoid penalty and interest under the Texas Tax Code.',
    },
    {
      label: 'February 1',
      detail: 'Unpaid taxes become delinquent. Penalty and interest start accruing.',
    },
    {
      label: 'April 30',
      detail: 'Homestead and other exemption applications for the current tax year are due at the appraisal district.',
      href: 'https://bastropcad.org/when-and-where-do-i-apply-for-my-homestead-exemption/',
    },
    {
      label: 'May–July',
      detail: 'Appraisal notices and protest windows run on the appraisal district’s calendar. Watch mail from CAD and use their protest page for the year’s dates.',
      href: 'https://www.bastropcad.org/',
    },
  ],
  taxOffice: {
    name: 'Bastrop County Tax Assessor-Collector',
    phone: '(512) 581-7161',
    address: '211 Jackson Street, Bastrop, TX 78602',
    href: 'https://www.bastropcounty.gov/page/tac.locations',
  },
  appraisal: {
    name: 'Bastrop Central Appraisal District',
    phone: '(512) 303-1930',
    href: 'https://www.bastropcad.org/',
  },
};

export const utilityContacts = [
  {
    name: 'Bluebonnet Electric Cooperative',
    detail: 'Electric service for much of the county outside city systems. Start or stop service online before move-in.',
    phone: '(800) 842-7708',
    phoneAlt: '(512) 332-7800',
    hours: 'Member services Monday–Friday, 8 am–5 pm. Outage line (800) 949-4414.',
    href: 'https://www.bluebonnet.coop/start-stop-service',
    contactHref: 'https://www.bluebonnet.coop/contact-us',
  },
  {
    name: 'Aqua Water Supply Corporation',
    detail: 'Water for large parts of the county. Customer service and the 24-hour leak line.',
    phone: '(512) 303-3943',
    hours: 'Lobby 8:30 am–4:30 pm, closed 12–1. Counter at 415 Old Austin Highway, Bastrop.',
    href: 'https://www.aquawsc.com/contact/',
  },
  {
    name: 'City utility desks',
    detail: 'Inside Bastrop, Elgin, or Smithville limits, start with that city’s utility or water office for trash billing and city water.',
    href: '/phone-numbers',
  },
];

export const starterChecklist: { text: string; href?: string }[] = [
  {
    text: 'Register for Warn Central Texas so closings and weather hit your phone.',
    href: 'https://warncentraltexas.org/communities/bastrop-county/',
  },
  {
    text: 'Find your commissioner on the county precinct map before you need a road fix.',
    href: newResidentGuide.precinctMapUrl,
  },
  {
    text: 'Start Bluebonnet or city electric, and Aqua or city water, before the movers arrive.',
    href: 'https://www.bluebonnet.coop/start-stop-service',
  },
  {
    text: 'Open the trash map for your city — or arrange rural hauling if you are outside city limits.',
    href: '#trash',
  },
  {
    text: 'Bookmark the burn-ban page; it can flip the same day.',
    href: '/burn-ban',
  },
  {
    text: 'Join the Bastropia Facebook group for neighbor tips the desk has not filed yet.',
    href: 'https://www.facebook.com/groups/bastropia',
  },
];
