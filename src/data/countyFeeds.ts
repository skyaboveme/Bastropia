export type CountyFeed = {
  id: string;
  name: string;
  kind: string;
  action: string;
  href: string;
  note: string;
  youtubeId?: string;
};

/**
 * Official live and recorded sources for Bastrop County.
 * Only a source with a youtubeId plays in the page. The others refuse to be framed, so the player opens them on their own site.
 */
export const countyFeeds: CountyFeed[] = [
  {
    id: 'broadcastify',
    name: 'Bastrop County Law Enforcement / Fire / EMS',
    kind: 'Live audio',
    action: 'Listen on Broadcastify',
    href: 'https://www.broadcastify.com/listen/feed/40578',
    note: 'Live scanner audio for county law enforcement, fire, and EMS, including the cities of Bastrop, Elgin, and Smithville. An ad plays at the start. This is radio, not video.',
  },
  {
    id: 'bastrop-hs',
    name: 'Bastrop High School',
    kind: 'Games',
    action: 'Open Watch Games Live',
    href: 'https://bhs.bisdtx.org/athletics/bhs-athletics/watch-games-live-on-the-nfhs-network',
    note: 'Bastrop High School’s page for Bears and Eagles events at Memorial Stadium and both high school gyms. The games play on the NFHS Network.',
  },
  {
    id: 'cedar-creek-hs',
    name: 'Cedar Creek High School',
    kind: 'Games',
    action: 'Watch on NFHS Network',
    href: 'https://www.nfhsnetwork.com/schools/cedar-creek-high-school-bastrop-tx',
    note: 'Live and on-demand Cedar Creek High School games on the NFHS Network.',
  },
  {
    id: 'elgin-isd',
    name: 'Elgin ISD School Board Meeting — October 26, 2026',
    kind: 'Recorded meeting',
    action: 'Play the recording',
    href: 'https://www.elginisd.net/about-elgin-isd/school-board/board-meeting-dates',
    youtubeId: 'iaUlOrYtUBc',
    note: 'Recorded by EISD Media. The board’s meeting-dates page lists the other recordings.',
  },
  {
    id: 'smithville-isd',
    name: 'Smithville ISD Board Meeting Agendas',
    kind: 'Agendas',
    action: 'Open the agendas',
    href: 'https://www.smithvilleisd.org/page/board-meeting-agendas/',
    note: 'Agendas, minutes, and meeting documents on BoardBook. This page is not a video.',
  },
  {
    id: 'municode',
    name: 'City of Bastrop Municode Meetings',
    kind: 'Meetings',
    action: 'Open the meetings',
    href: 'https://bastrop-tx.municodemeetings.com/',
    note: 'Agendas, packets, minutes, and any audio or video the city attaches to a meeting.',
  },
  {
    id: 'lcra',
    name: 'LCRA Hydromet',
    kind: 'River gauges',
    action: 'Open the gauges',
    href: 'https://hydromet.lcra.org/',
    note: 'Live river and weather gauges for the lower Colorado River basin, including the Colorado River at Bastrop. This is a gauge map, not a camera.',
  },
  {
    id: 'drivetexas',
    name: 'DriveTexas',
    kind: 'Road conditions',
    action: 'Open DriveTexas',
    href: 'https://drivetexas.org/',
    note: 'TxDOT’s live highway-conditions map. Bastrop County points drivers here for SH 71, US 290, and the other state roads. This is a conditions map, not a camera.',
  },
  {
    id: 'txdot-cameras',
    name: 'TxDOT Austin District cameras',
    kind: 'Traffic cameras',
    action: 'Open the cameras',
    href: 'https://its.txdot.gov/its/District/AUS/cameras',
    note: 'Live Austin District cameras. On SH 71 they run from Montopolis Drive to SH 130. On US 290 they are in Austin, including US 183 and Ben White. None of those cameras is in Bastrop County. Footage is not recorded.',
  },
  {
    id: 'bastrop-state-park',
    name: 'Bastrop State Park',
    kind: 'State park',
    action: 'Open the park page',
    href: 'https://tpwd.texas.gov/state-parks/bastrop',
    note: 'Texas Parks & Wildlife page for the park on Park Road 1A. No live camera is posted.',
  },
  {
    id: 'buescher-state-park',
    name: 'Buescher State Park',
    kind: 'State park',
    action: 'Open the park page',
    href: 'https://tpwd.texas.gov/state-parks/buescher',
    note: 'Texas Parks & Wildlife page for Buescher State Park. No live camera is posted.',
  },
  {
    id: 'bastrop-isd-youtube',
    name: 'Bastrop ISD on YouTube',
    kind: 'District channel',
    action: 'Open the channel',
    href: 'https://www.youtube.com/@BastropISD',
    note: 'The district channel linked from the Bastrop ISD athletics page. It is not a separate athletics channel. Bastrop and Cedar Creek games are on the NFHS Network.',
  },
  {
    id: 'elgin-hs',
    name: 'Elgin High School',
    kind: 'Games',
    action: 'Watch on NFHS Network',
    href: 'https://www.nfhsnetwork.com/schools/elgin-high-school-elgin-tx',
    note: 'Elgin High School games, live and on demand. No Elgin ISD athletics YouTube channel was found.',
  },
  {
    id: 'smithville-hs',
    name: 'Smithville High School',
    kind: 'Games',
    action: 'Watch on NFHS Network',
    href: 'https://www.nfhsnetwork.com/schools/smithville-high-school-smithville-tx',
    note: 'Smithville High School games, live and on demand, on the NFHS Network.',
  },
  {
    id: 'smithville-isd-youtube',
    name: 'Smithville ISD on YouTube',
    kind: 'District channel',
    action: 'Open the channel',
    href: 'https://www.youtube.com/@SmithvilleISD',
    note: 'Smithville ISD’s district channel. It posts district news and some Tiger athletics. It is not a separate athletics channel.',
  },
  {
    id: 'mcdade-hs',
    name: 'McDade High School',
    kind: 'Games',
    action: 'Watch on NFHS Network',
    href: 'https://www.nfhsnetwork.com/schools/mcdade-high-school-mcdade-tx',
    note: 'McDade High School games on the NFHS Network. No McDade athletics YouTube channel was found.',
  },
];
