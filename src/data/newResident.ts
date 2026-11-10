/** Evergreen new-resident desk notes. Confirm office hours and routes on the linked pages. */
export const newResidentGuide = {
  title: 'New to Bastrop County',
  summary:
    'Utilities, trash day, tax dates, and which commissioner covers your road — the desk notes neighbors ask for first.',
  checked: '2026-11-10',
  precinctMapUrl: 'https://www.bastropcounty.gov/page/com.main',
  kitTagId: 25696354,
};

export const countyOfficials = {
  judge: {
    name: 'Dock Jackson',
    role: 'County Judge-elect',
    detail: 'Won the Nov. 3, 2026 race. Takes office with the new term in January 2027. Confirm the current office line on the county page until then.',
    phone: '(512) 581-7100',
    href: 'https://www.bastropcounty.gov/',
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
      area: 'Use the county precinct map for your road',
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
      area: 'Use the county precinct map for your road',
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
      detail: 'Homestead and other exemption applications for the current tax year are due at the appraisal district (confirm the year’s form).',
    },
    {
      label: 'May–July',
      detail: 'Appraisal notices and protest windows run on the appraisal district’s calendar. Watch mail from CAD.',
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

export const starterChecklist = [
  'Register for Warn Central Texas so closings and weather hit your phone.',
  'Find your commissioner on the county precinct map before you need a road fix.',
  'Start Bluebonnet or city electric, and Aqua or city water, before the movers arrive.',
  'Open the trash map for your city — or arrange rural hauling if you are outside city limits.',
  'Bookmark the burn-ban page; it can flip the same day.',
  'Join the Bastropia Facebook group for neighbor tips the desk has not filed yet.',
];
