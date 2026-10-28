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

export const collections = { events, news, updates };
