import type { DirectoryShelf } from '../data/facebookDirectory.ts';

export const pageShelfIds = new Set(['news-pages', 'official', 'parties', 'nonprofits', 'places']);

export type ListingKind = 'group' | 'page';

export type ListingCard = {
  type: string;
  members: string;
  note: string;
};

export function describeListing(detail: string, kind: ListingKind, extra?: string): ListingCard {
  const parts = detail.split('·').map((part) => part.trim()).filter(Boolean);
  let privacy: 'public' | 'private' | null = null;
  let members = '';
  const rest: string[] = [];
  for (const part of parts) {
    if (/^public$/i.test(part)) privacy = 'public';
    else if (/^private$/i.test(part)) privacy = 'private';
    else if (/\b(members|followers)\b/i.test(part)) members = part;
    else rest.push(part);
  }
  const type = kind === 'group'
    ? privacy === 'private'
      ? 'Private group'
      : privacy === 'public'
        ? 'Public group'
        : 'Group'
    : 'Page';
  const note = [rest.join(' · '), extra?.trim() ?? ''].filter(Boolean).join(' · ');
  return { type, members, note };
}

export type DirectoryCardItem = {
  name: string;
  href: string;
  detail: string;
  note?: string;
  card: ListingCard;
  search: string;
};

export type DirectoryCardShelf = DirectoryShelf & {
  kind: ListingKind;
  items: DirectoryCardItem[];
};

/** Every shelf and item, with a card label for the directory. */
export function directoryCards(shelves: DirectoryShelf[]): DirectoryCardShelf[] {
  return shelves.map((shelf) => {
    const kind: ListingKind = pageShelfIds.has(shelf.id) ? 'page' : 'group';
    return {
      ...shelf,
      kind,
      items: shelf.items.map((item) => ({
        ...item,
        card: describeListing(item.detail, kind, item.note),
        search: `${item.name} ${item.detail} ${item.note ?? ''}`.toLowerCase(),
      })),
    };
  });
}
