-- Referral system tables
-- Apply: supabase db push  OR  run in Supabase dashboard SQL editor

-- ─── referral_codes ──────────────────────────────────────────────────────────
-- One code per tenant/user. Codes are unique across the platform.
CREATE TABLE IF NOT EXISTS referral_codes (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id         UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  code            TEXT        NOT NULL UNIQUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS referral_codes_tenant_id_idx ON referral_codes(tenant_id);
CREATE INDEX IF NOT EXISTS referral_codes_user_id_idx   ON referral_codes(user_id);
CREATE INDEX IF NOT EXISTS referral_codes_code_idx      ON referral_codes(code);

-- ─── referrals ────────────────────────────────────────────────────────────────
-- Created when a user sends an invite. Status progresses: invited → signed_up → converted.
CREATE TABLE IF NOT EXISTS referrals (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_code_id    UUID        NOT NULL REFERENCES referral_codes(id) ON DELETE CASCADE,
  referrer_tenant_id  UUID        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  referee_email       TEXT        NOT NULL,
  status              TEXT        NOT NULL DEFAULT 'invited'
                        CHECK (status IN ('invited', 'signed_up', 'converted')),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  converted_at        TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS referrals_referrer_tenant_id_idx ON referrals(referrer_tenant_id);
CREATE INDEX IF NOT EXISTS referrals_code_id_idx            ON referrals(referrer_code_id);
CREATE INDEX IF NOT EXISTS referrals_status_idx             ON referrals(status);

-- ─── referral_rewards ────────────────────────────────────────────────────────
-- Granted automatically when conversion thresholds are hit.
CREATE TABLE IF NOT EXISTS referral_rewards (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  referral_id UUID        NOT NULL REFERENCES referrals(id) ON DELETE CASCADE,
  reward_type TEXT        NOT NULL
                CHECK (reward_type IN ('month_free', 'pro_upgrade', 'lifetime')),
  granted_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at  TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS referral_rewards_tenant_id_idx ON referral_rewards(tenant_id);

-- ─── Row Level Security ───────────────────────────────────────────────────────

ALTER TABLE referral_codes    ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals         ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_rewards  ENABLE ROW LEVEL SECURITY;

-- Users can only see their own tenant's referral codes
CREATE POLICY "referral_codes_tenant_isolation"
  ON referral_codes
  USING (
    tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid())
  );

-- Users can only see referrals they sent
CREATE POLICY "referrals_tenant_isolation"
  ON referrals
  USING (
    referrer_tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid())
  );

-- Users can only see their own rewards
CREATE POLICY "referral_rewards_tenant_isolation"
  ON referral_rewards
  USING (
    tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid())
  );
