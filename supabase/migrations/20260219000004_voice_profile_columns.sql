-- ── Phase 4.1: Brand Voice advanced columns ──────────────────────────────────
-- Adds slider values, archetype, and avatar URL to voice_profiles.

ALTER TABLE voice_profiles
  ADD COLUMN IF NOT EXISTS archetype   TEXT,
  ADD COLUMN IF NOT EXISTS formality   INTEGER NOT NULL DEFAULT 50
    CHECK (formality   BETWEEN 0 AND 100),
  ADD COLUMN IF NOT EXISTS humor       INTEGER NOT NULL DEFAULT 50
    CHECK (humor       BETWEEN 0 AND 100),
  ADD COLUMN IF NOT EXISTS technicality INTEGER NOT NULL DEFAULT 50
    CHECK (technicality BETWEEN 0 AND 100),
  ADD COLUMN IF NOT EXISTS energy      INTEGER NOT NULL DEFAULT 50
    CHECK (energy      BETWEEN 0 AND 100),
  ADD COLUMN IF NOT EXISTS avatar_url  TEXT;
