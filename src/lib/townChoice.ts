import type { City } from '../data/taxonomy';
import { townPages } from '../data/towns';

export const townCookie = 'bastropia-city';

const known = new Set(townPages.map((town) => town.name));

export function readTown(value: string | undefined | null): City | '' {
  const town = (value ?? '').replace(/\+/g, ' ').trim();
  if (known.has(town as City)) return town as City;
  return '';
}
