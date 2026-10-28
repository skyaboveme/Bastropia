export type Video = {
  id: string;
  title: string;
  channel: string;
  channelUrl: string;
};

/** The first video is the featured one. Add a video by adding its YouTube id, title, and channel here. */
export const videos: Video[] = [
  {
    id: 'HDwos1IOIl0',
    title: 'Bastrop, Tx: Small Town Charm History and Things to Do Near Austin',
    channel: 'David Bridwell Music',
    channelUrl: 'https://www.youtube.com/@DavidBridwellMusic',
  },
  {
    id: '3DlTVberpKM',
    title: '10 Best Things to Do in Bastrop, Texas',
    channel: 'Jillu Travel',
    channelUrl: 'https://www.youtube.com/@Jillutravel',
  },
  {
    id: '0okq7Lg4P74',
    title: 'What’s It REALLY Like in Bastrop, Texas? | Downtown Tour and Local Insights',
    channel: 'Living in Bastrop Texas',
    channelUrl: 'https://www.youtube.com/@LIVINGINBASTROP',
  },
  {
    id: 'jeGT3lcNEpM',
    title: 'Bastrop, Texas (Things to Do) Season 4 | Episode 3',
    channel: 'Van Life Thru a Lens',
    channelUrl: 'https://www.youtube.com/@vanlifethrualens',
  },
  {
    id: 'cz-OnBNjG_Y',
    title: 'The Best Kept Secret in Texas | City of Bastrop, TX',
    channel: 'WebsEdgeSociety',
    channelUrl: 'https://www.youtube.com/@WebsEdgeSociety',
  },
];

export const watchUrl = (id: string) => `https://www.youtube.com/watch?v=${id}`;
export const thumbnail = (id: string, size: 'mqdefault' | 'hqdefault' = 'mqdefault') => `https://i.ytimg.com/vi/${id}/${size}.jpg`;
