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
    category: z.enum(categories),
    cost: z.string(),
    tier: z.enum(tiers),
    organizer: z.string().optional(),
    sourceUrl: z.string().url().optional(),
    sourceLabel: z.string().optional(),
    streamUrl: z.string().url().optional(),
    image: z.string().optional(),
  }),
});

const news = defineCollection({
  loader: glob({ base: './src/content/news', pattern: '**/*.md' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    place: z.string(),
    sourceUrl: z.string().url().optional(),
    sourceLabel: z.string().optional(),
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

export const collections = { events, news, updates, decisions, social };
