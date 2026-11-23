-- Paid directory tier on a listing.
-- Empty means a free listing.
-- 'featured' pins the business in matching directory results.
-- 'spotlight' keeps the Spotlight badge. Category and town sponsor
-- tiles are configured in src/data/directoryAds.ts, not this column.
-- Run once. D1 rejects the statement if the column already exists.
-- The site keeps working before this file is applied.
ALTER TABLE businesses ADD COLUMN tier TEXT NOT NULL DEFAULT '';
