-- ============================================================
-- BAH SERVICES TECH — Supabase Schema
-- Colle ce SQL dans : Supabase > SQL Editor > New query
-- ============================================================

-- 1. TABLES

CREATE TABLE IF NOT EXISTS settings (
  id         INTEGER PRIMARY KEY DEFAULT 1,
  rate       NUMERIC NOT NULL DEFAULT 500,
  deduction  NUMERIC NOT NULL DEFAULT 5
);
INSERT INTO settings (id, rate, deduction) VALUES (1, 500, 5) ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS companies (
  id         TEXT PRIMARY KEY,
  name       TEXT NOT NULL,
  password   TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS translators (
  id         TEXT PRIMARY KEY,
  name       TEXT NOT NULL,
  contact    TEXT DEFAULT '',
  notes      TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS accounts (
  id             TEXT PRIMARY KEY,
  email          TEXT NOT NULL,
  pass           TEXT NOT NULL DEFAULT '',
  key            TEXT DEFAULT '',
  lang           TEXT DEFAULT '',
  accid          TEXT DEFAULT '',
  notes          TEXT DEFAULT '',
  translator_id  TEXT,
  company        TEXT DEFAULT '',
  username       TEXT DEFAULT '',
  status         TEXT DEFAULT 'pending',
  created_at     TEXT DEFAULT ''
);

CREATE TABLE IF NOT EXISTS payments (
  id             TEXT PRIMARY KEY,
  translator_id  TEXT,
  account_id     TEXT,
  period         TEXT,
  words          INTEGER DEFAULT 0,
  amount         NUMERIC DEFAULT 0,
  paid           BOOLEAN DEFAULT FALSE,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);


-- 2. RLS — activer + politique ouverte (app interne, pas d'auth)

ALTER TABLE settings    ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies   ENABLE ROW LEVEL SECURITY;
ALTER TABLE translators ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts    ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments    ENABLE ROW LEVEL SECURITY;

CREATE POLICY "open" ON settings    FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "open" ON companies   FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "open" ON translators FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "open" ON accounts    FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "open" ON payments    FOR ALL TO anon USING (true) WITH CHECK (true);
