-- Initial schema for Newsletter Wizard
-- Establishes all core tables before feature-specific migrations (20260219+).
-- Uses IF NOT EXISTS / DO blocks throughout so this is safe to run against an
-- existing Supabase project where these tables were created manually.

-- ── Extensions ────────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS vector; -- pgvector for RAG embeddings

-- ── tenants ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tenants (
  id                           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name                         TEXT        NOT NULL,
  slug                         TEXT        NOT NULL UNIQUE,
  subscription_tier            TEXT        NOT NULL DEFAULT 'free'
    CHECK (subscription_tier IN ('free', 'creator', 'pro', 'business')),
  max_sources                  INT         NOT NULL DEFAULT 10,
  max_newsletters_per_month    INT         NOT NULL DEFAULT 5,
  max_ai_generations_per_month INT         NOT NULL DEFAULT 50,
  settings                     JSONB       NOT NULL DEFAULT '{}',
  -- Partner / white-label hierarchy (used by manage-sub-tenants)
  partner_id                   UUID        REFERENCES tenants(id) ON DELETE SET NULL,
  parent_tenant_id             UUID        REFERENCES tenants(id) ON DELETE SET NULL,
  created_at                   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── profiles ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS profiles (
  id         UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id  UUID        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  email      TEXT        NOT NULL,
  full_name  TEXT,
  avatar_url TEXT,
  role       TEXT        NOT NULL DEFAULT 'editor'
    CHECK (role IN ('owner', 'admin', 'editor', 'viewer')),
  timezone   TEXT        NOT NULL DEFAULT 'UTC',
  is_active  BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── newsletters ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS newsletters (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    UUID        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  title        TEXT        NOT NULL,
  subject_line TEXT,
  preheader    TEXT,
  content_html TEXT,
  content_json JSONB,
  status       TEXT        NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'generating', 'review', 'scheduled', 'sending', 'sent')),
  scheduled_at TIMESTAMPTZ,
  sent_at      TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── newsletter_stats ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS newsletter_stats (
  id            UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  newsletter_id UUID    NOT NULL REFERENCES newsletters(id) ON DELETE CASCADE,
  total_sent    INT     NOT NULL DEFAULT 0,
  unique_opens  INT     NOT NULL DEFAULT 0,
  open_rate     NUMERIC(5,2) NOT NULL DEFAULT 0,
  unique_clicks INT     NOT NULL DEFAULT 0,
  click_rate    NUMERIC(5,2) NOT NULL DEFAULT 0,
  unsubscribes  INT     NOT NULL DEFAULT 0
);

-- ── knowledge_sources ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS knowledge_sources (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         UUID        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  source_type       TEXT        NOT NULL
    CHECK (source_type IN ('url', 'document', 'manual', 'youtube', 'rss', 'gdrive')),
  source_uri        TEXT,
  title             TEXT        NOT NULL,
  description       TEXT,
  status            TEXT        NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'processing', 'ready', 'error')),
  error_message     TEXT,
  token_count       INT         NOT NULL DEFAULT 0,
  chunk_count       INT         NOT NULL DEFAULT 0,
  file_path         TEXT,
  original_filename TEXT,
  mime_type         TEXT,
  file_size_bytes   BIGINT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── source_chunks (RAG) ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS source_chunks (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  source_id   UUID        NOT NULL REFERENCES knowledge_sources(id) ON DELETE CASCADE,
  chunk_index INT         NOT NULL,
  content     TEXT        NOT NULL,
  embedding   vector(1536),  -- OpenAI text-embedding-3-small dimension
  token_count INT         NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS source_chunks_tenant_idx
  ON source_chunks (tenant_id);

CREATE INDEX IF NOT EXISTS source_chunks_embedding_idx
  ON source_chunks USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- ── voice_profiles ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS voice_profiles (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        UUID        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name             TEXT        NOT NULL,
  description      TEXT,
  is_default       BOOLEAN     NOT NULL DEFAULT FALSE,
  tone_markers     JSONB,
  voice_prompt     TEXT,
  training_samples JSONB,  -- JSON array of sample strings
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── tenant_settings ───────────────────────────────────────────────────────────
-- One row per tenant; stores API keys and ESP preferences.
CREATE TABLE IF NOT EXISTS tenant_settings (
  tenant_id          UUID        PRIMARY KEY REFERENCES tenants(id) ON DELETE CASCADE,
  openai_api_key     TEXT,
  anthropic_api_key  TEXT,
  sendgrid_api_key   TEXT,
  mailchimp_api_key  TEXT,
  convertkit_api_key TEXT,
  esp_provider       TEXT        NOT NULL DEFAULT 'sendgrid'
    CHECK (esp_provider IN ('sendgrid', 'mailchimp', 'convertkit')),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── api_keys ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS api_keys (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    UUID        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name         TEXT        NOT NULL,
  key_prefix   TEXT        NOT NULL,   -- public prefix shown in UI (e.g. "nw_live_xxxx")
  key_hash     TEXT        NOT NULL,   -- sha256 hash of the full key
  permissions  JSONB       NOT NULL DEFAULT '["read"]',
  rate_limit   INT         NOT NULL DEFAULT 1000,
  is_active    BOOLEAN     NOT NULL DEFAULT TRUE,
  last_used_at TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  revoked_at   TIMESTAMPTZ
);

-- ── api_key_usage ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS api_key_usage (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  api_key_id UUID        NOT NULL REFERENCES api_keys(id) ON DELETE CASCADE,
  endpoint   TEXT        NOT NULL,
  status     INT         NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── webhooks ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS webhooks (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id  UUID        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name       TEXT        NOT NULL,
  url        TEXT        NOT NULL,
  events     TEXT[]      NOT NULL DEFAULT '{}',
  secret     TEXT,
  is_active  BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── audit_logs ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS audit_logs (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID        REFERENCES tenants(id) ON DELETE SET NULL,
  user_id       UUID        REFERENCES profiles(id) ON DELETE SET NULL,
  action        TEXT        NOT NULL,
  resource_type TEXT,
  resource_id   TEXT,
  details       JSONB,
  ip_address    TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Row Level Security ────────────────────────────────────────────────────────

ALTER TABLE tenants          ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles         ENABLE ROW LEVEL SECURITY;
ALTER TABLE newsletters      ENABLE ROW LEVEL SECURITY;
ALTER TABLE newsletter_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE source_chunks    ENABLE ROW LEVEL SECURITY;
ALTER TABLE voice_profiles   ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_settings  ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys         ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_key_usage    ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhooks         ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs       ENABLE ROW LEVEL SECURITY;

-- Helper: resolve current user's tenant_id from their profile
CREATE OR REPLACE FUNCTION current_tenant_id()
  RETURNS UUID LANGUAGE sql STABLE
  AS $$ SELECT tenant_id FROM profiles WHERE id = auth.uid() $$;

-- tenants
CREATE POLICY "tenants_select" ON tenants FOR SELECT
  USING (id = current_tenant_id());

-- profiles: read all in tenant, write own row only
CREATE POLICY "profiles_select" ON profiles FOR SELECT
  USING (tenant_id = current_tenant_id());

CREATE POLICY "profiles_update" ON profiles FOR UPDATE
  USING (id = auth.uid()) WITH CHECK (id = auth.uid());

-- newsletters
CREATE POLICY "newsletters_all" ON newsletters
  USING (tenant_id = current_tenant_id())
  WITH CHECK (tenant_id = current_tenant_id());

-- newsletter_stats (via newsletter FK)
CREATE POLICY "newsletter_stats_select" ON newsletter_stats FOR SELECT
  USING (newsletter_id IN (
    SELECT id FROM newsletters WHERE tenant_id = current_tenant_id()
  ));

-- knowledge_sources
CREATE POLICY "knowledge_sources_all" ON knowledge_sources
  USING (tenant_id = current_tenant_id())
  WITH CHECK (tenant_id = current_tenant_id());

-- source_chunks (reads only — writes done by service role via edge functions)
CREATE POLICY "source_chunks_select" ON source_chunks FOR SELECT
  USING (tenant_id = current_tenant_id());

-- voice_profiles
CREATE POLICY "voice_profiles_all" ON voice_profiles
  USING (tenant_id = current_tenant_id())
  WITH CHECK (tenant_id = current_tenant_id());

-- tenant_settings
CREATE POLICY "tenant_settings_all" ON tenant_settings
  USING (tenant_id = current_tenant_id())
  WITH CHECK (tenant_id = current_tenant_id());

-- api_keys
CREATE POLICY "api_keys_all" ON api_keys
  USING (tenant_id = current_tenant_id())
  WITH CHECK (tenant_id = current_tenant_id());

-- api_key_usage (via api_key FK)
CREATE POLICY "api_key_usage_select" ON api_key_usage FOR SELECT
  USING (api_key_id IN (
    SELECT id FROM api_keys WHERE tenant_id = current_tenant_id()
  ));

-- webhooks
CREATE POLICY "webhooks_all" ON webhooks
  USING (tenant_id = current_tenant_id())
  WITH CHECK (tenant_id = current_tenant_id());

-- audit_logs (read-only for users; writes via service role)
CREATE POLICY "audit_logs_select" ON audit_logs FOR SELECT
  USING (tenant_id = current_tenant_id());
