/**
 * Named writers. A story sets `author` to a slug from this list.
 * Adding a person is one entry here. An empty list keeps the Bastropia desk
 * byline. Only add someone whose name is already public.
 */
export type Author = {
  slug: string;
  name: string;
  jobTitle?: string;
  description: string;
};

export const authors: Author[] = [];

export function authorBySlug(slug: string | undefined) {
  if (!slug) return undefined;
  return authors.find((author) => author.slug === slug);
}
