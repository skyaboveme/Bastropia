-- Directory maintenance columns.
-- hours already exists from migrations/0002_listing_fields.sql.
-- Do not add it again: D1 rejects a duplicate column.
ALTER TABLE businesses ADD COLUMN source TEXT NOT NULL DEFAULT '';
ALTER TABLE businesses ADD COLUMN last_verified TEXT;
ALTER TABLE businesses ADD COLUMN socials TEXT NOT NULL DEFAULT '';
ALTER TABLE businesses ADD COLUMN in_county INTEGER NOT NULL DEFAULT 1;
