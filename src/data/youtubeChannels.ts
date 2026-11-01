export type YoutubeChannel = {
  id: string;
  name: string;
  handle: string;
  channelId: string;
  place: string;
  note: string;
};

/** Public YouTube channels for the local sources on the live page. */
export const youtubeChannels: YoutubeChannel[] = [
  {
    id: 'bastrop-isd',
    name: 'Bastrop ISD',
    handle: 'BastropISD',
    channelId: 'UCt_oytyw2_mYeH2D-aK7Sgg',
    place: 'Bastrop',
    note: 'District channel for Bastrop and Cedar Creek. Game broadcasts stay on the NFHS Network.',
  },
  {
    id: 'elgin-isd',
    name: 'Elgin ISD',
    handle: 'eisdmedia1662',
    channelId: 'UCAhnregqlkNFKkhZAjirEFA',
    place: 'Elgin',
    note: 'EISD Media. Board meetings and the Wildcat Recap.',
  },
  {
    id: 'smithville-isd',
    name: 'Smithville ISD',
    handle: 'SmithvilleISD',
    channelId: 'UCBOeqJpncmFLwpZe80lSZNA',
    place: 'Smithville',
    note: 'Smithville ISD in Smithville, Texas.',
  },
  {
    id: 'city-bastrop',
    name: 'City of Bastrop',
    handle: 'BTXNTVOnline',
    channelId: 'UCeI3MYcqXy8CPUt5UhA7bpw',
    place: 'Bastrop',
    note: 'Bastrop TX Network. City Council, Planning and Zoning, and Economic Development Corporation recordings.',
  },
];

export const channelUrl = (handle: string) => `https://www.youtube.com/@${handle}`;

export const electionsChannel: YoutubeChannel = {
  id: 'county-elections',
  name: 'Bastrop County Elections',
  handle: '',
  channelId: 'UCum8UX2G7PXTywf5s_xOLWA',
  place: 'Bastrop',
  note: 'Central count cameras from the elections office.',
};

export const channelPage = (channel: YoutubeChannel) =>
  channel.handle ? channelUrl(channel.handle) : `https://www.youtube.com/channel/${channel.channelId}`;
