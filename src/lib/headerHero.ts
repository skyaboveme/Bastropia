import { chicagoParts } from './time';

export type HeaderImage = { src: string; width: number; height: number };

const image = (src: string, height: number): HeaderImage => ({ src, width: 1024, height });

const heroes = {
  smithville: image('/images/header/smithville.webp', 341),
  lostPines: image('/images/header/lost-pines.webp', 341),
  bastrop: image('/images/header/bastrop-main.webp', 341),
  night: image('/images/header/main-night.webp', 434),
  stadium: image('/images/header/stadium.webp', 434),
  parade: image('/images/header/parade.webp', 434),
  sunny: image('/images/header/weather-sunny.webp', 434),
  rain: image('/images/header/weather-rain.webp', 434),
  storm: image('/images/header/weather-storm.webp', 434),
  rainbow: image('/images/header/weather-rainbow.webp', 434),
  development: image('/images/header/development.webp', 434),
  directory: image('/images/header/directory.webp', 434),
  groups: image('/images/header/groups.webp', 434),
  government: image('/images/header/government.webp', 434),
  news: image('/images/header/news.webp', 434),
  videos: image('/images/header/videos.webp', 434),
  eats: image('/images/header/eats.webp', 434),
  fallback: image('/images/header/default.webp', 434),
};

export type HeaderHero = { visible: HeaderImage; rest: HeaderImage[]; heroClass: string };

const weatherHero: Record<string, HeaderImage> = {
  sunny: heroes.sunny,
  rain: heroes.rain,
  storm: heroes.storm,
  rainbow: heroes.rainbow,
};

/**
 * The visible header photo for this path. Hidden slides are the homepage rotation.
 * Files are already 1024px webps, which covers the full-bleed header at phone and laptop sizes.
 */
export function headerHero(pathname: string, options: { night: boolean; scene?: string }): HeaderHero {
  const path = pathname.replace(/\/index\.html$/, '').replace(/\/+$/, '') || '/';
  if (path === '/' && options.night) return { visible: heroes.night, rest: [], heroClass: 'is-night' };
  if (path === '/') return { visible: heroes.smithville, rest: [heroes.lostPines, heroes.bastrop], heroClass: '' };
  if (path === '/scores') return { visible: heroes.stadium, rest: [], heroClass: 'is-stadium' };
  if (path === '/events' || path === '/this-weekend') return { visible: heroes.parade, rest: [], heroClass: 'is-parade' };
  if (path === '/weather') {
    return { visible: weatherHero[options.scene ?? ''] ?? heroes.sunny, rest: [], heroClass: 'is-weather' };
  }
  if (path === '/development') return { visible: heroes.development, rest: [], heroClass: 'is-development' };
  if (path === '/directory' || path === '/churches') return { visible: heroes.directory, rest: [], heroClass: 'is-directory' };
  if (path === '/groups') return { visible: heroes.groups, rest: [], heroClass: 'is-groups' };
  if (path === '/government') return { visible: heroes.government, rest: [], heroClass: 'is-government' };
  if (path === '/news') return { visible: heroes.news, rest: [], heroClass: 'is-news' };
  if (path === '/guides' || path.startsWith('/guides/')) return { visible: heroes.lostPines, rest: [], heroClass: '' };
  if (path === '/videos') return { visible: heroes.videos, rest: [], heroClass: 'is-videos' };
  if (path === '/eats') return { visible: heroes.eats, rest: [], heroClass: 'is-eats' };
  return { visible: heroes.fallback, rest: [], heroClass: 'is-default' };
}

export function headerNight(now = new Date()) {
  const hour = chicagoParts(now).hour;
  return hour >= 18 || hour < 6;
}
