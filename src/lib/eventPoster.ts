/** Display helpers for the photo cards on /events and /this-weekend. */

export const EVENT_PLACEHOLDER = '/brand/event-placeholder.svg';

const SIMPLEVIEW =
  /^(https:\/\/assets\.simpleviewinc\.com\/simpleview\/image\/upload\/)[^/]+(\/v1\/.+)$/i;

/** Card-sized Simpleview transform. Other hosts stay as the feed sent them. */
const CARD_TRANSFORM = 'c_fill,g_auto,h_360,q_70,w_640';

export function cardImageUrl(image?: string | null): string | null {
  const value = image?.trim() ?? '';
  if (!value) return null;
  if (/\/api\/event-placeholder|\/og-default\.png(?:$|\?)/i.test(value)) return null;
  if (value.startsWith('/') && !value.startsWith('//')) return value;
  if (!/^https?:\/\//i.test(value)) return null;
  const simple = value.match(SIMPLEVIEW);
  if (simple) return `${simple[1]}${CARD_TRANSFORM}${simple[2]}`;
  return value;
}

export function listingImage(image?: string | null): { src: string; fallback: boolean } {
  const src = cardImageUrl(image);
  if (!src) return { src: EVENT_PLACEHOLDER, fallback: true };
  return { src, fallback: false };
}

/** Two lines on the card. Skip a summary that only repeats the title. */
export function listingSnippet(summary: string, title: string, max = 140): string {
  const text = summary.replace(/\s+/g, ' ').trim();
  if (!text || text.toLowerCase() === title.trim().toLowerCase()) return '';
  if (text.length <= max) return text;
  const cut = text.slice(0, max + 1);
  const space = cut.lastIndexOf(' ');
  const base = (space > 48 ? cut.slice(0, space) : text.slice(0, max)).replace(/[.,;:–—-]+$/, '');
  return `${base}…`;
}

export function listingPlace(venue: string, city: string): string {
  const spot = venue.trim();
  const town = city.trim();
  if (!spot) return town === 'Countywide' ? 'Bastrop County' : town;
  if (!town || town === 'Countywide' || spot.toLowerCase() === town.toLowerCase()) return spot;
  return `${spot} · ${town}`;
}
