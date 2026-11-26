/**
 * Named writers. A story may set `author` to a slug from this list.
 * When the field is omitted, a bastropia-daily-* roundup is the editor
 * and every other story is the reporter. An unknown slug uses that same
 * rule, so a package that leaves the field off still builds.
 */
export type Author = {
  slug: string;
  name: string;
  jobTitle?: string;
  description: string;
};

export const editorSlug = 'michael-smith';
export const reporterSlug = 'ben-caxton';
export const dailyStoryPrefix = 'bastropia-daily-';

export const authors: Author[] = [
  {
    slug: 'michael-smith',
    name: 'Michael Smith',
    jobTitle: 'Editor',
    description: 'Michael Smith is the editor of Bastropia and edits local news for Bastrop County, Texas.',
  },
  {
    slug: 'ben-caxton',
    name: 'Ben Caxton',
    jobTitle: 'Reporter',
    description: 'Ben Caxton is a reporter for Bastropia and covers news in Bastrop County, Texas.',
  },
];

export function authorBySlug(slug: string | undefined) {
  if (!slug) return undefined;
  return authors.find((author) => author.slug === slug);
}

/** Byline slug. An explicit masthead slug wins. Otherwise the daily is the editor and every other story is the reporter. */
export function storyAuthorSlug(id: string, author: string | undefined) {
  const named = authorBySlug(author);
  if (named) return named.slug;
  if (id.startsWith(dailyStoryPrefix)) return editorSlug;
  return reporterSlug;
}

export function storyAuthor(id: string, author: string | undefined) {
  const person = authorBySlug(storyAuthorSlug(id, author));
  if (!person) throw new Error(`Missing masthead entry for ${id}`);
  return person;
}
