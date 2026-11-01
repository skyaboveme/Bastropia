import { facebookGroup } from './site';

export type Stream = {
  id: string;
  name: string;
  host: string;
  schedule: string;
  where: string;
  href: string;
  hrefLabel: string;
  note: string;
  dates?: string[];
};

/** Dates named in the FY 2026–2027 Commissioners Court order. */
export const commissionersDates = [
  '2026-10-13',
  '2026-10-26',
  '2026-11-09',
  '2026-11-23',
  '2026-12-14',
  '2026-12-28',
  '2027-01-11',
  '2027-01-25',
  '2027-02-08',
  '2027-02-22',
  '2027-03-08',
  '2027-03-22',
  '2027-04-12',
  '2027-04-26',
  '2027-05-10',
  '2027-05-24',
  '2027-06-07',
  '2027-06-28',
  '2027-07-12',
  '2027-07-26',
  '2027-08-09',
  '2027-08-23',
  '2027-09-13',
  '2027-09-27',
];

export const streams: Stream[] = [
  {
    id: 'commissioners-court',
    name: 'Commissioners Court',
    host: 'Bastrop County',
    schedule: 'Second and fourth Mondays, unless the court moves a holiday',
    where: 'Commissioners Courtroom, second floor of the courthouse annex, 804 Pecan Street, Bastrop',
    href: 'https://www.bastropcounty.gov/',
    hrefLabel: 'County website',
    note: 'Agendas and any public video are posted by the county. Confirm the start time on the agenda. Bastropia does not rebroadcast the meeting.',
    dates: commissionersDates,
  },
  {
    id: 'city-bastrop',
    name: 'City of Bastrop meetings',
    host: 'City of Bastrop',
    schedule: 'Posted with each agenda',
    where: 'City of Bastrop',
    href: 'https://www.cityofbastrop.org/',
    hrefLabel: 'City of Bastrop',
    note: 'Council and board videos, when the city streams them, stay on the city’s site.',
  },
  {
    id: 'city-elgin',
    name: 'City of Elgin meetings',
    host: 'City of Elgin',
    schedule: 'Posted with each agenda',
    where: 'Elgin',
    href: 'https://www.elgintexas.gov/',
    hrefLabel: 'City of Elgin',
    note: 'Check the city agenda for a stream or a recording.',
  },
  {
    id: 'city-smithville',
    name: 'City of Smithville meetings',
    host: 'City of Smithville',
    schedule: 'Posted with each agenda',
    where: 'Smithville',
    href: 'https://www.ci.smithville.tx.us/',
    hrefLabel: 'City of Smithville',
    note: 'Check the city agenda for a stream or a recording.',
  },
  {
    id: 'bastropia-group',
    name: 'Bastropia community',
    host: 'Neighbors',
    schedule: 'Whenever someone goes live',
    where: 'Facebook group',
    href: facebookGroup,
    hrefLabel: 'Open the Facebook group',
    note: 'Last-minute cancellations, live video from events, road talk, and photos from around the county.',
  },
];
