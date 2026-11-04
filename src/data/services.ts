export type Service = {
  name: string;
  detail: string;
  phone?: string;
  href?: string;
  address?: string;
  hours?: string;
  checked?: string;
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
        name: 'Tax Assessor-Collector',
        detail: 'Main office. Property-tax exemptions go to the appraisal district at (512) 303-1930.',
        hours: 'Monday through Friday, 8 am to 4 pm. Drive-thru 7:30 am to 4 pm. No title transfers after 4 pm. No Texas Parks & Wildlife after 3:30 pm. The line is inside 211 Jackson Street, with a drive-thru teller and a drop box.',
        checked: '2026-11-04',
        phone: '(512) 581-7161',
        address: '211 Jackson Street, Bastrop, TX 78602',
        href: 'https://www.bastropcounty.gov/page/tac.locations',
      },
      {
        name: 'Tax office, Cedar Creek',
        detail: 'Substation',
        hours: 'Monday through Friday, 8 am to 4:30 pm. No title transfers after 4 pm.',
        checked: '2026-11-04',
        phone: '(512) 581-4270',
        address: '5785 FM 535, Cedar Creek, TX 78612',
        href: 'https://www.bastropcounty.gov/page/tac.locations',
      },
      {
        name: 'Tax office, Elgin',
        detail: 'Substation',
        hours: 'Monday through Friday, 8 am to 4:30 pm. No title transfers after 4 pm.',
        checked: '2026-11-04',
        phone: '(512) 581-7146',
        address: '1125 Dildy Drive, Elgin, TX 78621',
        href: 'https://www.bastropcounty.gov/page/tac.locations',
      },
      {
        name: 'Tax office, Smithville',
        detail: 'Substation. Open Tuesdays and Fridays only, since October 5.',
        hours: 'Tuesday and Friday, 8 am to 4:30 pm, closed 12 to 1. No title transfers after 4 pm.',
        checked: '2026-11-04',
        phone: '(512) 581-7114',
        address: '1624 NE Loop 230, Smithville, TX 78957',
        href: 'https://www.bastropcounty.gov/page/tac.locations',
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
        detail: 'City hall, 310 N. Main Street',
        phone: '(512) 281-5724',
        href: 'https://www.elgintexas.gov/',
      },
      {
        name: 'City of Smithville',
        detail: 'City offices',
        hours: 'Monday through Friday, 7:30 am to 5 pm. The counter is at 317 Main Street.',
        checked: '2026-11-04',
        phone: '(512) 237-3282',
        address: '317 Main Street, Smithville, TX 78957',
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
      { name: 'Bastrop ISD', detail: 'Bastrop and Cedar Creek', phone: '(512) 772-7100', address: '906 Farm Street, Bastrop, TX 78602', href: 'https://www.bisdtx.org/' },
      { name: 'Elgin ISD', detail: 'Elgin', phone: '(512) 281-3434', href: 'https://www.elginisd.net/' },
      { name: 'Smithville ISD', detail: 'Smithville', phone: '(512) 237-2487', href: 'https://www.smithvilleisd.org/' },
      { name: 'McDade ISD', detail: 'McDade', phone: '(512) 273-2522', address: '156 Marlin Street, McDade, TX 78650', href: 'https://www.mcdadeisd.com/' },
    ],
  },
  {
    id: 'libraries',
    title: 'Libraries',
    intro: 'Hours are the ones posted by each library.',
    items: [
      {
        name: 'Bastrop Public Library',
        detail: 'City library',
        hours: 'Monday, Wednesday, and Friday 10 am to 6 pm. Tuesday and Thursday 12 pm to 9 pm. Saturday 10 am to 4 pm. Closed Sunday.',
        checked: '2026-11-04',
        phone: '(512) 332-8880',
        address: '1100 Church Street, Bastrop, TX 78602',
        href: 'https://www.cityofbastrop.org/page/lib.contact',
      },
      {
        name: 'Elgin Public Library',
        detail: 'Extension 1408',
        hours: 'Tuesday through Friday 9 am to 7 pm. Saturday 9 am to 5 pm. Closed Sunday and Monday.',
        checked: '2026-11-04',
        phone: '(512) 281-5678',
        address: '404 N. Main Street, Elgin, TX 78621',
        href: 'https://www.elgintexas.gov/1225/About-the-Library',
      },
      {
        name: 'Smithville Public Library',
        detail: 'Extension 6',
        hours: 'Monday and Wednesday 10 am to 6 pm. Tuesday and Thursday 10 am to 7 pm. Friday 10 am to 5 pm. Saturday 9 am to 1 pm. Closed Sunday.',
        checked: '2026-11-04',
        phone: '(512) 237-3282',
        address: '507 Main Street, Smithville, TX 78957',
        href: 'https://www.smithvillepubliclibrary.org/',
      },
    ],
  },
  {
    id: 'trash',
    title: 'Trash and recycling',
    intro: 'The pickup day follows the route. Cedar Creek, McDade, and Paige are outside these three city routes.',
    items: [
      {
        name: 'Bastrop trash and recycling',
        detail: 'Texas Disposal Systems posts the route map and the pickup dates. Questions go to the utility lobby.',
        hours: 'Utility lobby and drive-thru, Monday through Friday, 8 am to 4 pm. Stand in line at 600 Spring Street.',
        checked: '2026-11-04',
        phone: '(512) 332-8830',
        address: '600 Spring Street, Bastrop, TX 78602',
        href: 'https://www.cityofbastrop.org/page/us.solidwaste',
      },
      {
        name: 'Elgin trash and recycling',
        detail: 'The day depends on the route. The city posts the 2026 trash and recycling calendar.',
        checked: '2026-11-04',
        phone: '(512) 281-5724',
        href: 'https://www.elgintexas.gov/DocumentCenter/View/13269/Trash-Calendar-2026',
      },
      {
        name: 'Smithville trash and recycling',
        detail: 'Texas Disposal Systems map and schedule. Bulk pickup is TDS at (844) 873-7734. City questions stay at the utilities line.',
        checked: '2026-11-04',
        phone: '(512) 237-3282',
        href: 'https://www.ci.smithville.tx.us/DocumentCenter/View/1386',
      },
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
        name: 'Aqua Water Supply',
        detail: 'Customer service and the 24-hour leak line.',
        hours: 'Lobby 8:30 am to 4:30 pm, closed 12 to 1. The counter is at 415 Old Austin Highway.',
        checked: '2026-11-03',
        phone: '(512) 303-3943',
        address: '415 Old Austin Highway, Bastrop, TX 78602',
        href: 'https://www.aquawsc.com/contact/',
      },
      {
        name: 'City utility and water notices',
        detail: 'City water questions go to that city hall',
        href: 'https://www.cityofbastrop.org/',
      },
    ],
  },
];
