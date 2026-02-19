-- Team invitations table
-- Apply: supabase db push  OR  run in Supabase dashboard SQL editor

-- ─── profiles.role ────────────────────────────────────────────────────────────
-- Add role column to profiles so each member has a defined role in their tenant.
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'editor'
  CHECK (role IN ('owner', 'admin', 'editor', 'viewer'));

-- ─── team_invitations ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS team_invitations (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  email       TEXT        NOT NULL,
  role        TEXT        NOT NULL DEFAULT 'editor'
                CHECK (role IN ('admin', 'editor', 'viewer')),
  invited_by  UUID        REFERENCES profiles(id) ON DELETE SET NULL,
  token       TEXT        UNIQUE NOT NULL,
  status      TEXT        NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending', 'accepted', 'revoked')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at  TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days')
);

CREATE INDEX IF NOT EXISTS team_invitations_tenant_id_idx ON team_invitations(tenant_id);
CREATE INDEX IF NOT EXISTS team_invitations_token_idx     ON team_invitations(token);

-- ─── Row Level Security ───────────────────────────────────────────────────────

ALTER TABLE team_invitations ENABLE ROW LEVEL SECURITY;

-- Tenant members can read their own invitations
CREATE POLICY "team_invitations_read_tenant"
  ON team_invitations FOR SELECT
  USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

-- Tenant members can insert invitations (server validates who is allowed)
CREATE POLICY "team_invitations_insert_tenant"
  ON team_invitations FOR INSERT
  WITH CHECK (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

-- Tenant members can update (revoke) invitations
CREATE POLICY "team_invitations_update_tenant"
  ON team_invitations FOR UPDATE
  USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));
