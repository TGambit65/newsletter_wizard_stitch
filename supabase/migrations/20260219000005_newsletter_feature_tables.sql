-- ── Phase 3.6: Template Library ───────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS newsletter_templates (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT        NOT NULL,
  description   TEXT,
  category      TEXT        NOT NULL,
  goal_tags     TEXT[]      NOT NULL DEFAULT '{}',
  content_html  TEXT        NOT NULL,
  content_json  JSONB,
  thumbnail_url TEXT,
  is_system     BOOLEAN     NOT NULL DEFAULT TRUE,
  tenant_id     UUID        REFERENCES tenants(id) ON DELETE CASCADE,
  usage_count   INTEGER     NOT NULL DEFAULT 0,
  avg_open_rate DECIMAL(5,2),
  avg_click_rate DECIMAL(5,2),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE newsletter_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "templates_select" ON newsletter_templates
  FOR SELECT USING (is_system OR tenant_id = (current_setting('app.tenant_id', TRUE))::UUID);

CREATE POLICY "templates_insert" ON newsletter_templates
  FOR INSERT WITH CHECK (
    NOT is_system AND tenant_id = (current_setting('app.tenant_id', TRUE))::UUID
  );

CREATE POLICY "templates_delete" ON newsletter_templates
  FOR DELETE USING (
    NOT is_system AND tenant_id = (current_setting('app.tenant_id', TRUE))::UUID
  );

-- ── Phase 3.7: Scheduling columns ─────────────────────────────────────────────

ALTER TABLE newsletters
  ADD COLUMN IF NOT EXISTS timezone            TEXT NOT NULL DEFAULT 'UTC',
  ADD COLUMN IF NOT EXISTS recurrence_rule     TEXT,
  ADD COLUMN IF NOT EXISTS recurrence_end_date TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS template_id         UUID REFERENCES newsletter_templates(id);

-- ── Phase 4.4: Social Posts ───────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS social_posts (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  newsletter_id    UUID        NOT NULL REFERENCES newsletters(id) ON DELETE CASCADE,
  tenant_id        UUID        NOT NULL REFERENCES tenants(id)    ON DELETE CASCADE,
  platform         TEXT        NOT NULL,
  content_json     JSONB       NOT NULL,
  status           TEXT        NOT NULL DEFAULT 'draft',
  posted_at        TIMESTAMPTZ,
  external_post_id TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE social_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "social_posts_all" ON social_posts
  USING (tenant_id = (current_setting('app.tenant_id', TRUE))::UUID);

-- ── Seed: 12 system templates ─────────────────────────────────────────────────

INSERT INTO newsletter_templates (name, description, category, goal_tags, content_html, is_system)
VALUES
  ('Welcome Newsletter',
   'Warm introduction for new subscribers. Sets expectations and builds trust.',
   'Company Update',
   ARRAY['Grow subscribers','Inform'],
   '<h1>Welcome to [Newsletter Name]!</h1><p>We''re thrilled to have you here. Each edition, you''ll get [value prop].</p><h2>What to expect</h2><ul><li>Insight 1</li><li>Insight 2</li><li>Insight 3</li></ul><p>See you next week!</p>',
   TRUE),

  ('Product Launch',
   'Announce a new product or feature with excitement and clear CTAs.',
   'Promotional',
   ARRAY['Drive clicks','Inform'],
   '<h1>Introducing [Product Name]</h1><p>We''ve been working on something big — and it''s finally here.</p><h2>What it does</h2><p>[Feature description]</p><h2>Why it matters</h2><p>[Benefit statement]</p><p><a href="#">Try it now →</a></p>',
   TRUE),

  ('Weekly Roundup',
   'Curated collection of links, articles, and news relevant to your audience.',
   'Curated',
   ARRAY['Inform','Grow subscribers'],
   '<h1>This Week in [Topic]</h1><h2>Top Stories</h2><p>📰 <a href="#">Story headline</a> — One sentence summary.</p><p>📰 <a href="#">Story headline</a> — One sentence summary.</p><p>📰 <a href="#">Story headline</a> — One sentence summary.</p><h2>Quick Takes</h2><p>[Short commentary]</p>',
   TRUE),

  ('Educational Deep Dive',
   'Teach your audience something valuable with a structured lesson format.',
   'Educational',
   ARRAY['Inform','Grow subscribers'],
   '<h1>How to [Topic]</h1><p>Today we''re going to cover [topic] — by the end you''ll know [outcome].</p><h2>Step 1: [Title]</h2><p>[Explanation]</p><h2>Step 2: [Title]</h2><p>[Explanation]</p><h2>Step 3: [Title]</h2><p>[Explanation]</p><h2>Key Takeaway</h2><p>[Summary]</p>',
   TRUE),

  ('Event Recap',
   'Summary of a recent event, conference, or milestone with key highlights.',
   'Event Recap',
   ARRAY['Inform'],
   '<h1>[Event Name] — What You Missed</h1><p>Last [day], we held/attended [event]. Here''s what happened.</p><h2>Highlights</h2><ul><li>[Highlight 1]</li><li>[Highlight 2]</li><li>[Highlight 3]</li></ul><h2>What''s next</h2><p>[Follow-up actions or upcoming events]</p>',
   TRUE),

  ('Re-engagement Campaign',
   'Win back inactive subscribers with a compelling offer or update.',
   'Promotional',
   ARRAY['Re-engage'],
   '<h1>We miss you, [First Name]!</h1><p>It''s been a while since you opened one of our emails. We''ve been busy — here''s what you''ve missed.</p><h2>Recent highlights</h2><ul><li>[Update 1]</li><li>[Update 2]</li></ul><p>Still interested? <a href="#">Stay subscribed</a> or <a href="#">update your preferences</a>.</p>',
   TRUE),

  ('Monthly Digest',
   'End-of-month summary of everything published, shipped, or learned.',
   'Company Update',
   ARRAY['Inform','Re-engage'],
   '<h1>[Month] in Review</h1><p>Here''s everything that happened this month.</p><h2>Published</h2><ul><li>[Item 1]</li><li>[Item 2]</li></ul><h2>By the numbers</h2><p>[Metric]: [Value]</p><h2>Coming up in [Next month]</h2><p>[Preview]</p>',
   TRUE),

  ('Subscriber Milestone',
   'Celebrate a growth milestone and thank your community.',
   'Company Update',
   ARRAY['Grow subscribers','Re-engage'],
   '<h1>We just hit [Number] subscribers! 🎉</h1><p>This milestone wouldn''t exist without you.</p><h2>How we got here</h2><p>[Brief story]</p><h2>What''s coming next</h2><p>[Plans or improvements]</p><h2>Thank you</h2><p>Seriously — thank you for being part of this.</p>',
   TRUE),

  ('Ask Me Anything',
   'Community Q&A format. Answer subscriber questions and invite more.',
   'Educational',
   ARRAY['Grow subscribers','Drive clicks'],
   '<h1>Your Questions, Answered</h1><p>This week I''m answering questions from the community.</p><h2>Q: [Question 1]</h2><p>[Answer 1]</p><h2>Q: [Question 2]</h2><p>[Answer 2]</p><h2>Got a question?</h2><p><a href="#">Submit yours here →</a></p>',
   TRUE),

  ('Case Study',
   'Tell a success story with data and clear narrative arc.',
   'Educational',
   ARRAY['Drive clicks','Inform'],
   '<h1>How [Person/Company] [Achievement]</h1><p>The challenge: [Problem statement]</p><h2>The approach</h2><p>[What they did]</p><h2>The results</h2><p>✅ [Result 1]</p><p>✅ [Result 2]</p><p>✅ [Result 3]</p><h2>Lessons learned</h2><p>[Takeaway]</p>',
   TRUE),

  ('Seasonal Promotion',
   'Time-sensitive promotional email tied to a season or holiday.',
   'Promotional',
   ARRAY['Drive clicks','Re-engage'],
   '<h1>[Season/Holiday] Special 🎁</h1><p>For a limited time, [offer description].</p><h2>What''s included</h2><ul><li>[Benefit 1]</li><li>[Benefit 2]</li></ul><p><strong>Offer ends [date].</strong></p><p><a href="#">Claim your offer →</a></p>',
   TRUE),

  ('Behind the Scenes',
   'Give subscribers an insider look at your process, team, or journey.',
   'Company Update',
   ARRAY['Grow subscribers','Inform'],
   '<h1>Behind the Scenes: [Topic]</h1><p>Today I''m pulling back the curtain on [topic].</p><h2>How it actually works</h2><p>[Explanation]</p><h2>What surprised me</h2><p>[Insight]</p><h2>What''s next</h2><p>[Teaser]</p>',
   TRUE)
ON CONFLICT DO NOTHING;
