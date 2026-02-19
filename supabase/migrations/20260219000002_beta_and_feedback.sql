-- Beta Lab and Feedback system tables
-- Apply: supabase db push  OR  run in Supabase dashboard SQL editor

-- ─── beta_features ───────────────────────────────────────────────────────────
-- Global feature definitions (admin-managed). One row per feature.
CREATE TABLE IF NOT EXISTS beta_features (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  key                 TEXT        NOT NULL UNIQUE,
  name                TEXT        NOT NULL,
  description         TEXT,
  stability           TEXT        NOT NULL DEFAULT 'beta'
                        CHECK (stability IN ('stable', 'beta', 'experimental')),
  required_tier       TEXT        NOT NULL DEFAULT 'free',
  enabled_by_default  BOOLEAN     NOT NULL DEFAULT FALSE,
  coming_soon         BOOLEAN     NOT NULL DEFAULT FALSE,
  vote_count          INT         NOT NULL DEFAULT 0,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── tenant_beta_features ────────────────────────────────────────────────────
-- Per-tenant enabled state and vote for each feature.
-- vote: -1 = downvote, 0 = no vote, 1 = upvote
CREATE TABLE IF NOT EXISTS tenant_beta_features (
  tenant_id   UUID        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  feature_key TEXT        NOT NULL REFERENCES beta_features(key) ON DELETE CASCADE,
  enabled     BOOLEAN     NOT NULL DEFAULT FALSE,
  vote        SMALLINT    NOT NULL DEFAULT 0 CHECK (vote IN (-1, 0, 1)),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (tenant_id, feature_key)
);

CREATE INDEX IF NOT EXISTS tenant_beta_features_tenant_id_idx ON tenant_beta_features(tenant_id);

-- ─── feedback ────────────────────────────────────────────────────────────────
-- Mood + optional comment submissions.
CREATE TABLE IF NOT EXISTS feedback (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id     UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  mood        TEXT        CHECK (mood IN ('happy', 'neutral', 'sad')),
  comment     TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS feedback_tenant_id_idx ON feedback(tenant_id);

-- ─── feature_requests ────────────────────────────────────────────────────────
-- Community-voted feature ideas. Admin-managed; users only vote.
CREATE TABLE IF NOT EXISTS feature_requests (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  title       TEXT        NOT NULL,
  description TEXT,
  status      TEXT        NOT NULL DEFAULT 'open'
                CHECK (status IN ('open', 'planned', 'in-progress', 'shipped')),
  vote_count  INT         NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── feature_request_votes ───────────────────────────────────────────────────
-- One vote per tenant per feature request (toggle: insert/delete).
CREATE TABLE IF NOT EXISTS feature_request_votes (
  tenant_id           UUID        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  feature_request_id  UUID        NOT NULL REFERENCES feature_requests(id) ON DELETE CASCADE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (tenant_id, feature_request_id)
);

-- ─── Row Level Security ───────────────────────────────────────────────────────

-- beta_features: readable by all authenticated users; writable by service role only
ALTER TABLE beta_features           ENABLE ROW LEVEL SECURITY;
CREATE POLICY "beta_features_read_all"
  ON beta_features FOR SELECT USING (auth.uid() IS NOT NULL);

ALTER TABLE tenant_beta_features    ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_beta_features_tenant_isolation"
  ON tenant_beta_features
  USING (
    tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid())
  );

ALTER TABLE feedback                ENABLE ROW LEVEL SECURITY;
CREATE POLICY "feedback_tenant_isolation"
  ON feedback
  USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()))
  WITH CHECK (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

-- feature_requests: readable by all authenticated users; insertable by authenticated users (new requests)
ALTER TABLE feature_requests        ENABLE ROW LEVEL SECURITY;
CREATE POLICY "feature_requests_read_all"
  ON feature_requests FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "feature_requests_insert_authenticated"
  ON feature_requests FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

ALTER TABLE feature_request_votes   ENABLE ROW LEVEL SECURITY;
CREATE POLICY "feature_request_votes_tenant_isolation"
  ON feature_request_votes
  USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()))
  WITH CHECK (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

-- ─── Seed Data ────────────────────────────────────────────────────────────────

INSERT INTO beta_features (key, name, description, stability, required_tier, coming_soon) VALUES
  ('smart-scheduling',  'Smart Scheduling AI',       'AI picks the optimal send time based on your audience''s engagement patterns.', 'beta',         'pro',      false),
  ('ab-subject',        'A/B Subject Line Testing',  'Simultaneously test two subject lines and automatically send the winner.',        'stable',       'creator',  false),
  ('ai-images',         'AI Image Generation',       'Generate on-brand hero images for newsletters via DALL-E 3.',                    'experimental', 'pro',      false),
  ('rss-digest',        'RSS Auto-Digest',           'Automatically generate and schedule a newsletter digest from your RSS feeds.',   'beta',         'creator',  false),
  ('segment-ai',        'Audience Segmentation AI',  'AI-driven subscriber cohorts based on engagement behavior.',                     'experimental', 'business', false),
  ('voice-clone',       'Voice Cloning',             'Fine-tune your brand voice model from your past sent newsletters.',              'beta',         'pro',      false),
  ('gdpr-tools',        'GDPR Compliance Tools',     'One-click GDPR data export and right-to-erasure tools for subscribers.',        'stable',       'free',     false),
  ('multi-language',    'Multi-Language Support',    'Auto-translate newsletters into 30+ languages for global audiences.',            'experimental', 'business', true)
ON CONFLICT (key) DO NOTHING;

INSERT INTO feature_requests (title, description, status, vote_count) VALUES
  ('Mobile app',                'Native iOS/Android app for composing on the go.',                             'planned',      142),
  ('Subscriber import',         'Bulk import subscriber lists from CSV or other ESPs.',                        'in-progress',  98),
  ('Custom domain tracking',    'Track opens and clicks using your own domain.',                               'open',         76),
  ('Template marketplace',      'Share and sell newsletter templates to other users.',                         'open',         64),
  ('Zapier integration',        'Connect Newsletter Wizard to 5000+ apps via Zapier.',                        'planned',      55),
  ('Drip campaigns',            'Automated welcome sequences and drip email funnels.',                         'in-progress',  49),
  ('Emoji subject line test',   'Test emoji vs plain text subject lines for open rate impact.',                'open',         31),
  ('RSS auto-send',             'Automatically send a digest newsletter when new RSS posts appear.',           'open',         28)
ON CONFLICT DO NOTHING;
