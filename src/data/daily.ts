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
