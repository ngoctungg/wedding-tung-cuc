CREATE TABLE IF NOT EXISTS rsvp (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL CHECK(length(name) BETWEEN 1 AND 100),
  status TEXT NOT NULL CHECK(status IN ('yes','no','maybe')),
  guests INTEGER NOT NULL CHECK((status = 'no' AND guests = 0) OR (status <> 'no' AND guests BETWEEN 1 AND 30)),
  created TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS wishes (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL CHECK(length(name) BETWEEN 1 AND 100),
  message TEXT NOT NULL CHECK(length(message) BETWEEN 1 AND 1000),
  approved INTEGER NOT NULL DEFAULT 0 CHECK(approved IN (0,1)),
  created TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS wishes_approved_id ON wishes(approved,id);
CREATE TABLE IF NOT EXISTS sessions (
  token TEXT PRIMARY KEY,
  credential_version TEXT NOT NULL,
  expires INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS sessions_expiry ON sessions(expires);
CREATE TABLE IF NOT EXISTS limits (
  key TEXT PRIMARY KEY,
  count INTEGER NOT NULL,
  expires INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS limits_expiry ON limits(expires);
