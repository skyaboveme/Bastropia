CREATE TABLE businesses (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  city TEXT NOT NULL,
  areas TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL,
  website TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL,
  contact TEXT NOT NULL DEFAULT '',
  address TEXT NOT NULL DEFAULT '',
  details TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE accounts (
  id TEXT PRIMARY KEY,
  business_id TEXT NOT NULL UNIQUE,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE sessions (
  token TEXT PRIMARY KEY,
  account_id TEXT NOT NULL,
  expires_at TEXT NOT NULL
);

CREATE TABLE specials (
  id TEXT PRIMARY KEY,
  business_id TEXT NOT NULL,
  title TEXT NOT NULL,
  details TEXT NOT NULL,
  starts TEXT NOT NULL DEFAULT '',
  ends TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL
);

CREATE TABLE biz_events (
  id TEXT PRIMARY KEY,
  business_id TEXT NOT NULL,
  title TEXT NOT NULL,
  starts TEXT NOT NULL,
  ends TEXT NOT NULL DEFAULT '',
  venue TEXT NOT NULL DEFAULT '',
  details TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL
);

CREATE TABLE listing_stats (
  business_id TEXT NOT NULL,
  day TEXT NOT NULL,
  views INTEGER NOT NULL DEFAULT 0,
  site_clicks INTEGER NOT NULL DEFAULT 0,
  phone_clicks INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (business_id, day)
);

CREATE INDEX businesses_status ON businesses (status);
CREATE INDEX specials_business ON specials (business_id);
CREATE INDEX biz_events_business ON biz_events (business_id);
