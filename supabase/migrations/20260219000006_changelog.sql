-- ── Phase 5.4: What's New / Changelog ────────────────────────────────────────

CREATE TABLE IF NOT EXISTS changelog_entries (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  title       TEXT        NOT NULL,
  description TEXT        NOT NULL,
  version_tag TEXT,
  category    TEXT        NOT NULL DEFAULT 'feature'
    CHECK (category IN ('feature', 'improvement', 'fix', 'announcement')),
  screenshot_url TEXT,
  video_url   TEXT,
  published_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS changelog_reads (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id        UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  last_read_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (profile_id)
);

ALTER TABLE changelog_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE changelog_reads   ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read changelog entries
CREATE POLICY "changelog_entries_select" ON changelog_entries
  FOR SELECT TO authenticated USING (TRUE);

-- Users can only manage their own read status
CREATE POLICY "changelog_reads_all" ON changelog_reads
  FOR ALL USING (profile_id = auth.uid());
