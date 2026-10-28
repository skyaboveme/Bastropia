export type Service = {
  name: string;
  detail: string;
  phone?: string;
  href?: string;
  address?: string;
};

export type ServiceGroup = {
  id: string;
  title: string;
  intro: string;
  items: Service[];
};

export const emergencyLine = {
  phone: '911',
  label: 'Police, fire, and medical emergencies',
};

export const serviceGroups: ServiceGroup[] = [
  {
    id: 'emergency',
    title: 'Emergency and law enforcement',
    intro: 'Call 911 if you need help now. The numbers below are offices, not a substitute for 911.',
    items: [
      {
        name: 'Emergency',
        detail: 'Police, fire, and ambulance',
        phone: '911',
      },
      {
        name: 'Bastrop County Office of Emergency Management',
        detail: 'Preparedness, burn bans, and disaster coordination',
        phone: '(512) 581-4022',
        address: '1501 Business Park Drive, Bastrop, TX 78602',
        href: 'https://www.bastropcounty.gov/page/em.home',
      },
      {
        name: 'Warn Central Texas',
        detail: 'Free county alerts by phone, text, or email. Cell phones must be registered.',
        href: 'https://warncentraltexas.org/',
      },
      {
        name: 'Bastrop County Sheriff’s Office',
        detail: 'Non-emergency sheriff’s office',
        phone: '(512) 549-5100',
        address: '200 Jackson Street, Bastrop, TX 78602',
        href: 'https://www.bastropcounty.gov/',
      },
      {
        name: 'Bastrop Police Department',
        detail: 'City of Bastrop non-emergency',
        phone: '(512) 332-8600',
        address: '104 Grady Tuck Lane, Bastrop, TX 78602',
        href: 'https://www.cityofbastrop.org/',
      },
      {
        name: 'Elgin Police Department',
        detail: 'City of Elgin non-emergency',
        phone: '(512) 285-5757',
        href: 'https://www.elgintexas.gov/',
      },
      {
        name: 'Smithville Police Department',
        detail: 'City of Smithville non-emergency',
        phone: '(512) 237-3228',
        address: '105 NW 4th Street, Smithville, TX 78957',
        href: 'https://www.ci.smithville.tx.us/',
      },
      {
        name: 'Poison Control',
        detail: 'National helpline',
        phone: '1-800-222-1222',
      },
    ],
  },
  {
    id: 'county',
    title: 'County offices',
    intro: 'Bastrop County government is centered at the courthouse on Pecan Street.',
    items: [
      {
        name: 'Bastrop County',
        detail: 'Main line and county website',
        phone: '(512) 581-7100',
        address: '804 Pecan Street, Bastrop, TX 78602',
        href: 'https://www.bastropcounty.gov/',
      },
      {
        name: 'County Clerk',
        detail: 'Records and filings',
        phone: '(512) 332-7234',
        address: '803 Pine Street, Bastrop, TX 78602',
      },
      {
        name: 'District Clerk',
        detail: 'District court records',
        phone: '(512) 332-7244',
        address: '804 Pecan Street, Bastrop, TX 78602',
      },
      {
        name: 'District Attorney',
        detail: 'County attorney’s office for criminal cases',
        phone: '(512) 581-7125',
        address: '804 Pecan Street, Bastrop, TX 78602',
      },
      {
        name: 'Justice of the Peace, Precinct 1',
        detail: 'Bastrop',
        phone: '(512) 581-4258',
        address: '803 Pecan Street, Bastrop, TX 78602',
      },
      {
        name: 'Justice of the Peace, Precinct 2',
        detail: 'Smithville',
        phone: '(512) 581-7112',
        address: '1624 NE Loop 230, Smithville, TX 78957',
      },
      {
        name: 'Justice of the Peace, Precinct 3',
        detail: 'Cedar Creek',
        phone: '(512) 332-7288',
        address: '5785 FM 535, Cedar Creek, TX 78612',
      },
      {
        name: 'Justice of the Peace, Precinct 4',
        detail: 'Elgin',
        phone: '(512) 581-7162',
        address: '1125 Dildy Drive, Elgin, TX 78621',
      },
    ],
  },
  {
    id: 'cities',
    title: 'Cities',
    intro: 'Three cities sit inside the county. Cedar Creek, McDade, Paige, and the smaller communities are unincorporated.',
    items: [
      {
        name: 'City of Bastrop',
        detail: 'County seat',
        href: 'https://www.cityofbastrop.org/',
        phone: '(512) 332-8800',
      },
      {
        name: 'City of Elgin',
        detail: 'North side of the county',
        href: 'https://www.elgintexas.gov/',
      },
      {
        name: 'City of Smithville',
        detail: 'East side of the county, on the Colorado River',
        href: 'https://www.ci.smithville.tx.us/',
      },
    ],
  },
  {
    id: 'courts',
    title: 'Municipal courts',
    intro: 'City citations are handled by the municipal court in that city.',
    items: [
      {
        name: 'Bastrop Municipal Court',
        detail: 'City of Bastrop',
        phone: '(512) 332-8650',
        address: '104 Grady Tuck Lane, Bastrop, TX 78602',
      },
      {
        name: 'Elgin Municipal Court',
        detail: 'City of Elgin',
        phone: '(512) 281-0318',
        address: '310 N Main Street, Elgin, TX 78621',
      },
      {
        name: 'Smithville Municipal Court',
        detail: 'City of Smithville',
        phone: '(512) 237-3282',
        address: '317 Main Street, Smithville, TX 78957',
      },
    ],
  },
  {
    id: 'fire',
    title: 'Fire and outdoor burning',
    intro: 'Emergency services districts and volunteer departments cover most of the county. Call 911 for a fire.',
    items: [
      {
        name: 'Outdoor burning status',
        detail: 'The county page is the source for a burn ban',
        href: 'https://www.bastropcounty.gov/page/em.outdoor_burning',
      },
      {
        name: 'Bastrop County ESD No. 2',
        detail: 'Questions about outdoor burning inside ESD 2',
        phone: '(844) 347-3373',
        href: 'https://www.bastropesd2.org/outdoor-burning/',
      },
      {
        name: 'Texas A&M Forest Service burn bans',
        detail: 'Statewide ban map. The county order still controls inside Bastrop County.',
        href: 'https://tfsweb.tamu.edu/BurnBans/',
      },
    ],
  },
  {
    id: 'schools',
    title: 'Schools',
    intro: 'School closings and sports are published by each district.',
    items: [
      { name: 'Bastrop ISD', detail: 'Bastrop and Cedar Creek', href: 'https://www.bisdtx.org/' },
      { name: 'Elgin ISD', detail: 'Elgin', href: 'https://www.elginisd.net/' },
      { name: 'Smithville ISD', detail: 'Smithville', href: 'https://www.smithvilleisd.org/' },
    ],
  },
  {
    id: 'roads',
    title: 'Roads and utilities',
    intro: 'Closures and outages move faster than a calendar. Use the official maps.',
    items: [
      { name: 'DriveTexas', detail: 'Road closures and conditions', href: 'https://drivetexas.org/' },
      {
        name: 'Bluebonnet Electric Cooperative',
        detail: 'Electric service for much of the county',
        href: 'https://www.bluebonnet.coop/',
      },
      {
        name: 'City utility and water notices',
        detail: 'Use the city site for Bastrop, Elgin, or Smithville',
        href: 'https://www.cityofbastrop.org/',
      },
    ],
  },
];
