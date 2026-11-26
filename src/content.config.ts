import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { categories, cities, tiers } from './data/taxonomy';

const events = defineCollection({
  loader: glob({ base: './src/content/events', pattern: '**/*.md' }),
  schema: z.object({
    title: z.string(),
    summary: z.string(),
    start: z.coerce.date(),
    end: z.coerce.date().optional(),
    schedule: z.enum(['timed', 'all-day', 'agenda']),
    city: z.enum(cities),
    venue: z.string(),
    address: z.string().optional(),
    phone: z.string().optional(),
    category: z.enum(categories),
    cost: z.string(),
    tier: z.enum(tiers),
    organizer: z.string().optional(),
    /** Named act. Omit when the listing does not name one. */
    performer: z.union([z.string().min(1), z.array(z.string().min(1)).min(1)]).optional(),
    eventStatus: z.enum(['scheduled', 'cancelled', 'postponed', 'rescheduled', 'moved-online']).optional(),
    attendanceMode: z.enum(['offline', 'online', 'mixed']).optional(),
    sourceUrl: z.string().url().optional(),
    sourceLabel: z.string().optional(),
    streamUrl: z.string().url().optional(),
    image: z.string().optional(),
  }),
});

const news = defineCollection({
  loader: glob({ base: './src/content/news', pattern: '**/*.{md,mdx}' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    /** Set when the story is corrected. dateModified uses this, then pubDate. */
    updated: z.coerce.date().optional(),
    place: z.string(),
    /**
     * Slug from src/data/authors.ts. Optional.
     * Omitted (or unknown) on bastropia-daily-* is Michael Smith. Every other story is Ben Caxton.
     * A Reporter package that leaves the field off still builds.
     */
    author: z.string().min(1).optional(),
    /** Short bullets copied into the article abstract. Also the fallback for the infographic when `stats` is omitted. */
    keyFacts: z.array(z.string().min(1)).max(8).optional(),
    /**
     * Infographic figures under the hero. Each card is a big figure, a short label,
     * and an optional note or source. Use only numbers already in the story.
     * When omitted, the page builds cards from keyFacts. See docs/news-format.md.
     */
    stats: z
      .array(
        z.object({
          value: z.string().min(1),
          label: z.string().min(1),
          note: z.string().min(1).optional(),
          source: z.string().min(1).optional(),
        }),
      )
      .max(8)
      .optional(),
    sourceUrl: z.string().url().optional(),
    sourceLabel: z.string().optional(),
    /** Newest story with lead: true is the homepage lead. Omit it to leave the previous lead in place. */
    lead: z.boolean().optional(),
    /** Wire slug or URL to hide on the homepage when it is not the sourceUrl. */
    covers: z.union([z.string().min(1), z.array(z.string().min(1)).min(1)]).optional(),
    image: z.string().optional(),
    imageAlt: z.string().optional(),
    imageCredit: z.string().optional(),
    /** Optional desk tags used to suggest related stories. */
    tags: z.array(z.string().min(1)).optional(),
  }),
});

const updates = defineCollection({
  loader: glob({ base: './src/content/updates', pattern: '**/*.md' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    agency: z.string(),
    sourceUrl: z.string().url(),
    sourceLabel: z.string(),
  }),
});

const decisions = defineCollection({
  loader: glob({ base: './src/content/decisions', pattern: '**/*.md' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    meetingDate: z.preprocess(
      (value) => (value instanceof Date ? value.toISOString().slice(0, 10) : value),
      z.string(),
    ),
    pubDate: z.coerce.date(),
    sourceUrl: z.string().url(),
    sourceLabel: z.string(),
    decided: z.boolean(),
  }),
});

const social = defineCollection({
  loader: glob({ base: './src/content/social', pattern: '**/*.md' }),
  schema: z.object({
    title: z.string(),
    summary: z.string(),
    pubDate: z.coerce.date(),
    group: z.string(),
    groupUrl: z.string().url(),
    tier: z.enum(['primary', 'standout']),
    topic: z.string().optional(),
    city: z.string().optional(),
    sourceUrl: z.string().url().optional(),
  }),
});

const guides = defineCollection({
  loader: glob({ base: './src/content/guides', pattern: '**/*.mdx' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    /** Direct answer shown under the title. Two or three sentences. */
    answer: z.string().min(1),
    updated: z.coerce.date(),
    towns: z.array(z.enum(cities)).min(1),
    heroImage: z.string().optional(),
    faqs: z
      .array(
        z.object({
          q: z.string().min(1),
          a: z.string().min(1),
        }),
      )
      .max(8)
      .optional(),
    keyFacts: z.array(z.string().min(1)).max(8).optional(),
    sources: z
      .array(
        z.object({
          title: z.string().min(1),
          url: z.string().url(),
        }),
      )
      .min(1),
  }),
});

export const collections = { events, news, updates, decisions, social, guides };
