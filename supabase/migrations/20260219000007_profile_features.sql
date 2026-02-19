-- ── Phase 3.2: Onboarding flag ────────────────────────────────────────────────

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS has_completed_onboarding BOOLEAN NOT NULL DEFAULT FALSE;

-- ── Phase 4.6: Team last-active tracking ──────────────────────────────────────

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMPTZ;
