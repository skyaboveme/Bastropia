export type DailyEdition = {
  /** Calendar date, YYYY-MM-DD. */
  date: string;
  title: string;
  caption: string;
  /** Public path to the mp4, for example /media/bastropia-daily-2026-11-10.mp4 */
  src: string;
  /** Public path to the poster image. */
  poster: string;
};

/**
 * Bastropia Daily editions, newest first.
 * Publish a day by adding one entry at the top (date, title, caption, src, poster)
 * and putting the mp4 and poster in public/media/. The homepage plays the first
 * entry. The news page plays it too and, once a second edition exists, lists
 * every edition under the player so a reader can switch days.
 */
export const dailyEditions: DailyEdition[] = [
  {
    date: '2026-11-15',
    title: 'Bastropia Daily | Sunday, Nov. 15',
    caption:
      'Sunday edition: showers and thunderstorms today with a high near 55 and an inch or more of rain possible; warming to the mid-70s later in the week. The Lord’s Prayer, an invitation to worship this morning, and Bastrop County church events for Nov. 16–22.',
    src: '/media/bastropia-daily-2026-11-15-v2.mp4',
    poster: '/media/bastropia-daily-2026-11-15-v2-poster.jpg',
  },
  {
    date: '2026-11-14',
    title: 'Bastropia Daily — Saturday, Nov. 14, 2026',
    caption:
      'Weekend weather with close to an inch of rain tonight and Sunday, Smithville’s Airing of the Quilts, the Garden Club Tour of Homes, Heroes & Hot Rods, the Veterans Banquet, and Sunday’s Community Unity meal and Rosanky Pinewood Derby.',
    src: '/media/bastropia-daily-2026-11-14.mp4',
    poster: '/media/bastropia-daily-2026-11-14-poster.jpg',
  },
  {
    date: '2026-11-13',
    title: 'Bastropia Daily | Friday, Nov. 13',
    caption:
      'Weather: sunny near 79 today, showers likely Saturday night with about a quarter inch of rain. City of Bastrop responds to questions about ICE presence; 10 Bastrop business updates; county disaster recovery and hazard mitigation workshops; weekend events.',
    src: '/media/bastropia-daily-2026-11-13.mp4',
    poster: '/media/bastropia-daily-2026-11-13-poster.jpg',
  },
  {
    date: '2026-11-12',
    title: 'Bastropia Daily | Thursday, Nov. 12',
    caption:
      'Bastrop County weather is sunny with a weekend rain chance, then the free Community Unity Thanksgiving meal Sunday, Nov. 15 at the Bastrop Convention & Exhibit Center, a $1.5M Fast N Fuel store planned near Hunters Crossing on SH 304, and weekend events Heroes & Hot Rods and Smithville’s Airing of the Quilts.',
    src: '/media/bastropia-daily-2026-11-12.mp4',
    poster: '/media/bastropia-daily-2026-11-12-poster.jpg',
  },
  {
    date: '2026-11-11',
    title: 'Bastropia Daily — Nov. 11, 2026: Veterans Day, election results and the weekend lineup',
    caption:
      'Bastrop County weather, then election results, Veterans Day help for veterans, Commissioners Court on Nov. 23, Elgin playoffs, and the weekend lineup: Heroes & Hot Rods, Airing of the Quilts, and Community Unity.',
    src: '/media/bastropia-daily-2026-11-11.mp4',
    poster: '/media/bastropia-daily-2026-11-11-poster.jpg',
  },
  {
    date: '2026-11-10',
    title: 'Bastropia Daily — Nov. 10, 2026',
    caption: 'Bastrop County weather, then the day’s local news.',
    src: '/media/bastropia-daily-2026-11-10.mp4',
    poster: '/media/bastropia-daily-2026-11-10-poster.jpg',
  },
];

/** 18:00 UTC is midday in America/Chicago, so the calendar date does not shift. */
export function dailyDate(edition: DailyEdition) {
  const [year, month, day] = edition.date.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day, 18));
}
