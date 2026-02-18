# PRD Build Tasks — Newsletter Wizard

Comprehensive task list for building and expanding features to match the Stitch UI designs.
Each task is classified as **NEW** (nothing exists) or **EXPAND** (partial implementation exists).

---

## Task 1: Onboarding Flow [NEW]

**What to build:** A 4-step guided onboarding experience for new users shown after first signup.

**Current state:** None. Users go directly from signup → dashboard.

**Deliverables:**
- New page component: `OnboardingPage.tsx` with 4 steps:
  1. **Welcome** — Animated intro, value proposition, "Get Started" CTA
  2. **Knowledge Base intro** — Explain what sources are, show supported types (URL, PDF, RSS, etc.)
  3. **Repurposing intro** — Show how newsletters become social posts across platforms
  4. **Complete** — Prompt to add first knowledge source or create first newsletter
- Progress indicator (step dots or progress bar)
- Animated illustrations per step (CSS/Lottie)
- Skip button on every step
- `has_completed_onboarding` flag on `profiles` table to track completion
- Route: `/onboarding` (shown once after first signup, then never again)
- Modify `AuthContext` or `ProtectedRoute` to redirect new users to `/onboarding`

**Database changes:**
- Add `has_completed_onboarding: boolean` column to `profiles` table

**Stitch references:** `onboarding_1:_welcome`, `onboarding_2:_knowledge_base`, `onboarding_3:_repurposing`, `onboarding_4:_sign_up`

---

## Task 2: Brand Voice — Advanced UI [EXPAND]

**What to build:** Replace the basic voice profile CRUD in Settings with a rich, dedicated brand voice configuration system.

**Current state:** Settings page has a "Voice Profiles" tab with name/description fields, text-area training samples, and a "Train Voice" button that calls the `train-voice` edge function. Voice profiles store `name`, `description`, `tone_markers`, `voice_prompt`, and `training_samples`.

**Deliverables:**

### Frontend:
- New dedicated page or expanded settings section with these sub-views:
  - **Persona Builder** — Create named personas with avatar upload, archetype selection from preset cards (Educator, Entertainer, Authority, Storyteller, Analyst, etc.)
  - **Interactive Sliders** — Adjustable axes for Formality (casual↔formal), Humor (serious↔playful), Technicality (simple↔expert), Energy (calm↔energetic). Values stored as numeric 0–100 on the voice profile.
  - **Tone & Archetype Picker** — Visual card grid of archetype presets that pre-fill slider positions
  - **Tone Comparison** — Side-by-side panel: input sample text on left, AI-rewritten version using the voice profile on right. Live preview as sliders change.
  - **Style Guide Generator** — Button to auto-generate a downloadable brand style guide document from current voice settings (vocabulary, tone rules, do's/don'ts)
  - **Interactive Playground** — Text input area with a "Preview in this voice" button; shows the text rewritten using current voice settings in real-time

### Backend:
- Update `train-voice` edge function to accept slider values and archetype selection
- New edge function or endpoint: `preview-voice` — takes sample text + voice config, returns rewritten text
- New edge function or endpoint: `generate-style-guide` — takes voice profile ID, returns formatted style guide

### Database changes:
- Add columns to `voice_profiles`: `archetype: text`, `formality: integer`, `humor: integer`, `technicality: integer`, `energy: integer`, `avatar_url: text`

**Stitch references:** `brand_voice:_persona_builder`, `brand_voice:_interactive_sliders`, `brand_voice:_tone_&_archetype`, `brand_voice:_tone_comparison_v2`, `brand_voice:_style_guide_v3`, `brand_voice:_interactive_play_v4`, `brand_voice:_sample_sheet_v1`, `brand_voice:_training_examples`

---

## Task 3: AI Training Progress [NEW]

**What to build:** Visual progress UI shown during voice training that communicates what the AI is doing.

**Current state:** The "Train Voice" button shows a spinning icon and an alert on completion. No progress feedback.

**Deliverables:**
- New component: `AITrainingProgress.tsx` — a modal or inline panel with:
  - Animated progress bar with percentage
  - Phase labels: "Analyzing writing samples" → "Learning patterns" → "Calibrating voice model"
  - Estimated time remaining
  - Completion animation with success state
- Modify `train-voice` edge function to support streaming progress updates (SSE or polling) or simulate phases with timed transitions on the frontend
- Show this component when `trainVoiceProfile()` is called instead of the current spinner

**Stitch references:** `ai_training_progress_1`, `ai_training_progress_2`, `ai_training_progress_3`

---

## Task 4: Beta Lab [NEW]

**What to build:** A feature flag management page where users can toggle experimental features on/off.

**Current state:** None. No feature flag system exists.

**Deliverables:**

### Frontend:
- New page: `BetaLabPage.tsx` with:
  - **Feature Toggles** — List of experimental features, each with name, description, toggle switch, and stability indicator (stable/beta/experimental)
  - **Master Toggle** — Single switch at the top to enable/disable all beta features at once
  - **Stability Metrics** — Per-feature indicators showing reliability (could be static labels for MVP)
  - **Tiered Access** — Features gated by subscription tier; locked features show upgrade CTA
  - Community voting section (upvote/downvote which features should ship next)
- New route: `/beta-lab`
- Add "Beta Lab" to sidebar navigation in `DashboardLayout.tsx`

### Backend:
- New DB table: `beta_features` (id, name, description, stability, min_tier, is_active_default)
- New DB table: `tenant_beta_features` (tenant_id, feature_id, enabled)
- New DB table: `beta_feature_votes` (tenant_id, feature_id, vote: up/down)
- Edge function: `manage-beta-features` — CRUD for tenant feature toggles
- Context or hook: `useBetaFeatures()` — loads tenant's enabled features, gates UI with `isBetaEnabled('feature-name')`

### Shared types:
- Add `BetaFeature` and `TenantBetaFeature` interfaces to `packages/shared`

**Stitch references:** `beta_lab:_feature_toggles_v1`, `beta_lab:_master_toggle_v3`, `beta_lab:_stability_metrics_v2`, `beta_lab:_tiered_access_v4`

---

## Task 5: Scheduling — Calendar & AI Optimization [EXPAND]

**What to build:** Replace the basic date/time picker with a full scheduling system including calendar view, timeline, and AI-optimized send times.

**Current state:** `NewsletterEditorPage.tsx` has a schedule modal with two native `<input type="date">` and `<input type="time">` fields. Sets `scheduled_at` and `status: 'scheduled'` on the newsletter. No calendar view, no AI optimization, no recurrence.

**Deliverables:**

### Frontend:
- New page: `SchedulingPage.tsx` (or tab within Newsletters) with:
  - **Calendar View** — Month/week calendar grid showing all scheduled newsletters as colored blocks. Click a date to schedule. Drag to reschedule.
  - **Visual Timeline** — Horizontal timeline showing upcoming send queue. Drag-to-reorder or drag-to-reschedule.
  - **AI-Optimized Send Time** — "Suggest best time" button that recommends optimal send time based on past engagement data (open rates by day/hour). Display as highlighted slots on the calendar.
  - **Focused Task View** — Single-newsletter scheduling with timezone dropdown and recurrence rules (daily, weekly, biweekly, monthly)
  - **Smart Queue** — Priority-ordered list of scheduled sends with conflict detection (warns if two newsletters scheduled within 1 hour)
- New route: `/scheduling`
- Add "Schedule" to sidebar navigation or as a sub-section of Newsletters
- Update the schedule modal in `NewsletterEditorPage.tsx` to include timezone selector and recurrence options

### Backend:
- New edge function: `suggest-send-time` — analyzes `newsletter_stats` for the tenant, returns optimal day/hour recommendations
- Add columns to `newsletters`: `timezone: text`, `recurrence_rule: text` (iCal RRULE format or simplified enum), `recurrence_end_date: timestamptz`
- New edge function or cron: `process-recurring-newsletters` — creates new newsletter instances from recurring schedules

**Stitch references:** `scheduling:_ai_optimized_v1`, `scheduling:_calendar_view_v2`, `scheduling:_visual_timeline_v3_*`, `scheduling:_focused_task_v4`

---

## Task 6: Global Search [NEW]

**What to build:** A dedicated search system that queries across all content types with AI-powered semantic search.

**Current state:** Per-page text filters only (newsletter title search on `NewslettersPage`, source title/URL search on `KnowledgeBasePage`). No cross-content search, no semantic search.

**Deliverables:**

### Frontend:
- New page: `SearchPage.tsx` with:
  - Search input with auto-suggestions
  - Faceted results grouped by type: Newsletters, Knowledge Sources, Templates (once built)
  - Filter sidebar: date range, content type, status
  - Card-based result display with title, snippet, type badge, date
  - Empty state with search tips and AI-suggested queries
- Command-palette style search (Cmd/Ctrl+K) overlay accessible from any page
- New route: `/search` and `/search?q=...`

### Backend:
- New edge function: `global-search` — accepts query + filters, searches across:
  - `newsletters` (title, subject_line, content_html via text search)
  - `knowledge_sources` (title, source_uri)
  - `source_chunks` (semantic search via existing `rag-search` infrastructure)
- Returns unified results with type, title, snippet, relevance score
- Leverage existing OpenAI embeddings for semantic component

**Stitch references:** `search:_ai_semantic_search`, `search:_results_&_filters`, `search:_visual_discovery`, `search:_ai_suggestions_empty_state`, `search:_quick_add_empty_state`, `search:_tips_empty_state`, `search:_high-density_list`, `search:_no_results_found_v1`

---

## Task 7: Social Editor — Thread Builder & Multi-Sync [EXPAND]

**What to build:** Upgrade the read-only social post display into a full interactive editor with thread building, AI remixing, and multi-platform sync.

**Current state:** `SocialMediaPage.tsx` generates posts for 10 platforms via the `generate-social-posts` edge function. Posts are already editable via textarea fields with `updatePostText()`, have character count per platform with over-limit warnings, display Twitter threads from generated data, and show video prompts for TikTok/YouTube Shorts/Snapchat. Copy-to-clipboard exists per post. What's MISSING: thread building (add/remove/reorder), AI remixing, multi-platform sync, image/video attachments, and post persistence.

**Deliverables:**

### Frontend:
- Upgrade `SocialMediaPage.tsx` to a full social editor:
  - **Thread Builder** — For Twitter/Threads: add/remove tweets in a thread, drag-to-reorder individual tweets, per-tweet character count, visual thread preview (currently threads are display-only from generated data)
  - **AI Remix** — "Remix for [platform]" button per post that regenerates content optimized for that specific platform's format
  - **Multi-Sync** — Checkboxes to select multiple platforms, "Post to selected" button (requires platform API integrations)
  - **Visual Focus** — Image/video attachment area per platform with upload, crop/resize preview, platform-specific dimension guides (e.g., 1080x1080 for Instagram)
  - Platform-specific formatting tips (character counts and over-limit warnings already exist)

### Backend:
- New edge function: `remix-social-post` — takes existing post content + target platform, returns platform-optimized version
- Social media API integrations (future): Twitter API, LinkedIn API, Facebook Graph API for direct posting
- Store generated social posts in DB for history (new table or JSON field on newsletters)

### Database changes:
- New table: `social_posts` (id, newsletter_id, tenant_id, platform, content_json, status, posted_at, external_post_id)

**Stitch references:** `social_editor:_ai_remix_v1`, `social_editor:_multi-sync_v2`, `social_editor:_thread_builder_v4_*`, `social_editor:_visual_focus_v3`

---

## Task 8: Template Library [NEW]

**What to build:** A browsable template gallery where users can start newsletters from pre-built layouts.

**Current state:** None. Users create blank drafts or use the AI wizard. No template concept exists.

**Deliverables:**

### Frontend:
- New page: `TemplatesPage.tsx` with:
  - **Visual Categories** — Grid of template cards organized by category (Promotional, Educational, Curated, Company Update, Product Launch, etc.)
  - **AI Recommendations** — "Recommended for you" section showing templates personalized by usage history and performance
  - **Performance-Based List** — Sort/filter by historical open/click rates of newsletters created from each template
  - **Goal-Oriented Selection** — Filter by objective: "Grow subscribers", "Drive clicks", "Re-engage", "Inform"
  - Template preview modal (full content preview before using)
  - "Use this template" button that creates a new newsletter pre-filled with template content
- New route: `/templates`
- Add "Templates" to sidebar navigation

### Backend:
- New DB table: `newsletter_templates` (id, name, description, category, goal_tags[], content_html, content_json, thumbnail_url, is_system, tenant_id nullable for custom templates, usage_count, avg_open_rate, avg_click_rate, created_at)
- Seed data: 10–15 system templates across categories
- Edge function: `recommend-templates` — analyzes tenant's newsletter history, returns ranked template suggestions
- Track template usage: when a newsletter is created from a template, store `template_id` on the newsletter

### Database changes:
- New table: `newsletter_templates` (as described above)
- Add column to `newsletters`: `template_id: uuid` (nullable FK to newsletter_templates)

### Shared types:
- Add `NewsletterTemplate` interface to `packages/shared`

**Stitch references:** `templates:_visual_categories_v1`, `templates:_ai_recommendations_v2`, `templates:_performance_list_v3`, `templates:_goal-oriented_v4`

---

## Task 9: Team Management [NEW]

**What to build:** A team management UI for inviting members, assigning roles, and managing permissions.

**Current state:** The data model supports multi-tenancy (`tenants`, `profiles` with `role` field: owner/admin/member). But there is **no UI** for managing team members. No invite flow, no permissions matrix, no member list.

**Deliverables:**

### Frontend:
- New page: `TeamPage.tsx` (or Settings sub-page) with tabs:
  - **Overview** — Member list table: name, email, role, last active date, status (active/invited/deactivated)
  - **Permissions** — Matrix grid showing role → permission mapping. Permissions: edit newsletters, manage sources, view analytics, manage billing, manage API keys, manage team
  - **Shared Assets** — Browse team-shared voice profiles, templates (once built), and knowledge sources
  - **Invitations** — Pending invites list with resend/revoke actions
- Invite member modal with:
  - Email input (single or bulk CSV upload)
  - Role selector (Admin, Editor, Viewer)
  - Shareable invite link option
  - Step-by-step wizard variant for complex invites
- New route: `/team` or `/settings/team`
- Add "Team" to sidebar navigation (visible only to owner/admin roles)

### Backend:
- New DB table: `team_invitations` (id, tenant_id, email, role, invited_by, token, status: pending/accepted/expired, created_at, expires_at)
- New edge function: `manage-team` — invite member, revoke invite, change role, deactivate member
- New edge function: `accept-invitation` — validates token, creates profile linked to tenant
- Email sending for invitation (via existing ESP integration)
- New DB table: `role_permissions` (role, permission, allowed) or hardcode permission matrix

### Database changes:
- New table: `team_invitations` (as described above)
- Add `last_active_at: timestamptz` column to `profiles`
- Consider `role_permissions` table or constants in shared package

### Shared types:
- Add `TeamInvitation`, `Permission`, `RolePermissions` interfaces

**Stitch references:** `team_management:_overview`, `team_management:_permissions`, `team_management:_shared_assets`, `team_management:_invitations`, `invite_new_member_v1:_role_select`, `invite_new_member_v2:_bulk_invite`, `invite_new_member_v3:_link_share`, `invite_new_member_v4:_step-by-step`

---

## Task 10: Performance Reports — AI Tips & Growth [EXPAND]

**What to build:** Upgrade analytics with AI-generated performance tips, growth analysis, and exportable reports.

**Current state:** `AnalyticsPage.tsx` shows 4 stat cards (total sent, avg open rate, avg click rate, total subscribers), two ECharts (engagement over time, subscriber growth), and a top links table. All data is **mock/hardcoded**. Date range selector exists but doesn't filter real data.

**Deliverables:**

### Frontend:
- Expand `AnalyticsPage.tsx` with:
  - **AI Performance Tips** — Card section showing AI-generated recommendations (e.g., "Your Tuesday sends outperform Friday by 23%", "Subject lines under 50 chars get 18% higher opens"). Pull from new edge function.
  - **Growth Focus View** — New tab or section: subscriber growth trends, churn rate, audience segment breakdown
  - **Newsletter Comparison** — Minimalist list view comparing all sent newsletters side-by-side: open rate, click rate, unsubscribe rate per newsletter
  - **Export Report** — "Export as PDF/Email" button that generates a formatted performance summary
- Wire up real data instead of mock data (query `newsletter_stats` joined with `newsletters`)
- Make date range selector actually filter queries

### Backend:
- New edge function: `generate-performance-tips` — analyzes tenant's `newsletter_stats`, returns 3–5 actionable tips
- New edge function: `export-performance-report` — generates HTML/PDF report for a date range
- Ensure `newsletter_stats` table is populated (currently may be empty if no real sends have occurred)

**Stitch references:** `performance_report:_ai_tips_v4`, `performance_report:_email_view_v1`, `performance_report:_growth_focus_v2`, `performance_report:_minimalist_list_v3`, `analytics:_rocket_launch_v3`, `analytics:_empty_state_v1`, `analytics:_preview_empty_state`

---

## Task 11: Referral Program [NEW]

**What to build:** A referral system where users earn rewards for inviting others.

**Current state:** None.

**Deliverables:**

### Frontend:
- New page: `ReferralPage.tsx` with:
  - **Give & Get** — Display unique referral code and shareable link. Show reward: "Give 1 month free, get 1 month free" (or credit-based)
  - **Tiered Rewards** — Progress tracker showing reward tiers: 1 referral → X reward, 5 referrals → Y reward, 10 referrals → Z reward
  - **Leaderboard** — Top referrers ranked by successful referrals with badges
  - **Direct Invites** — Email input to send referral invitations directly from the app
  - Stats: total referrals, successful conversions, rewards earned
- New route: `/referral`
- Add "Referrals" to sidebar navigation or Settings

### Backend:
- New DB table: `referral_codes` (id, tenant_id, code, created_at)
- New DB table: `referrals` (id, referrer_tenant_id, referred_email, referred_tenant_id nullable, status: sent/signed_up/converted, reward_status: pending/granted, created_at, converted_at)
- New DB table: `referral_rewards` (id, tenant_id, referral_id, reward_type, reward_value, granted_at)
- New edge function: `manage-referrals` — generate code, track referral, grant rewards
- Modify signup flow to accept `?ref=CODE` parameter and link the referral

**Stitch references:** `referral:_give_&_get_v1`, `referral:_tiered_rewards_v2`, `referral:_leaderboard_focus_v3`, `referral:_direct_invites_v4`

---

## Task 12: Newsletter Preview — Multi-Device & Accuracy [EXPAND]

**What to build:** Replace the simple HTML preview modal with multi-device preview frames and an AI accuracy checker.

**Current state:** `NewsletterEditorPage.tsx` has a preview modal that renders the HTML content with subject line and preheader in a single `<div>`. No device frames, no quality scoring.

**Deliverables:**

### Frontend:
- Redesign preview modal in `NewsletterEditorPage.tsx`:
  - **Multi-Device Toggle** — Tab bar or buttons: Desktop (650px), Tablet (480px), Mobile (375px). Render content inside a styled device frame (CSS border/shadow simulating device chrome).
  - **Campaign View** — Full inbox-style preview showing: From name, Subject line, Preheader text, then body content. Simulates how it appears in Gmail/Outlook.
  - **Accuracy Check** — AI-powered quality score panel:
    - Readability score (Flesch-Kincaid or similar)
    - Spam score (check for spam trigger words)
    - Link validation (detect broken links)
    - Image alt text check
    - Subject line length check
    - Overall quality grade (A–F or percentage)
  - "Fix issues" button that auto-corrects detected problems

### Backend:
- New edge function: `check-newsletter-quality` — accepts newsletter HTML + subject line, returns quality report with scores and issues

**Stitch references:** `preview:_multi-device_toggle`, `preview:_accuracy_check`, `preview:_campaign_view`, `preview:_final_review_v1`

---

## Task 13: Feedback & Community Voting [NEW]

**What to build:** In-app feedback system for rating AI quality and voting on feature requests.

**Current state:** `AIFeedback` component exists in the editor for thumbs up/down on generated content, but feedback is only logged to `console.log`. No persistent storage, no community voting.

**Deliverables:**

### Frontend:
- **AI Performance Feedback** — Upgrade existing `AIFeedback` component to persist ratings to DB. Add detailed rubric options (accuracy, tone, relevance, length).
- New page or modal: `FeedbackPage.tsx` with:
  - **Quick Feedback** — Emoji-based satisfaction input (1–5 faces) + optional text comment
  - **Community Upvotes** — List of feature requests with upvote/downvote buttons, sorted by votes. Users can submit new feature requests.
  - **Feedback History** — User's own past feedback submissions
- New route: `/feedback` or accessible from a "Give Feedback" button in the sidebar/footer

### Backend:
- New DB table: `ai_feedback` (id, tenant_id, user_id, generation_id, rating, rubric_scores jsonb, comment, created_at)
- New DB table: `feature_requests` (id, tenant_id, user_id, title, description, votes_up, votes_down, status: open/planned/shipped, created_at)
- New DB table: `feature_votes` (id, feature_request_id, user_id, vote: up/down)
- Edge function: `manage-feedback` — submit AI feedback, submit feature requests, vote

**Stitch references:** `feedback:_ai_performance_focus`, `feedback:_community_upvotes_v4`, `feedback:_minimalist_input_v3`, `feedback:_mood_&_details_v1`

---

## Task 14: Account Lifecycle — Delete, Reactivate, Magic Link, Biometric [EXPAND]

**What to build:** Full account lifecycle flows beyond basic login/signup/forgot-password.

**Current state:** `LoginPage` (email/password), `SignUpPage` (name/email/password), `ForgotPasswordPage` (email input → Supabase reset). No delete account, no reactivation, no magic link, no biometric.

**Deliverables:**

### 14a. Delete Account Flow
- New page or Settings sub-section: `DeleteAccountPage.tsx` with 4 steps:
  1. **Export Data** — Button to download all user data (newsletters, sources, analytics) as ZIP
  2. **Exit Survey** — Multiple-choice reason for leaving + optional comment
  3. **Safety Verification** — Type "DELETE" to confirm
  4. **Confirmation** — Final confirmation page, then redirect to goodbye screen
- New edge function: `export-user-data` — generates downloadable archive
- New edge function: `delete-account` — soft-delete or hard-delete tenant + profile + all data
- Store exit survey responses for analytics

### 14b. Reactivate Account Flow
- New page: `ReactivatePage.tsx` with steps:
  1. **Welcome Back** — Personalized greeting, account summary
  2. **Plan Selection** — Choose subscription plan
  3. **Security Verification** — Re-verify email or password
  4. **Quick Resume** — Show what was left off (recent drafts, sources)
- Modify auth flow to detect deactivated accounts and redirect to reactivation

### 14c. Magic Link Login
- Add "Sign in with email link" option to `LoginPage.tsx`
- Use Supabase Auth `signInWithOtp({ email })` for passwordless magic link
- Handle magic link callback in `AuthCallbackPage.tsx`

### 14d. Biometric Login (Progressive Enhancement)
- Add Web Authentication API (WebAuthn/FIDO2) support for fingerprint/face ID
- "Set up biometric login" option in Settings
- Fallback to email/password when biometric unavailable

### Database changes:
- Add `is_deactivated: boolean`, `deactivated_at: timestamptz` to `profiles`
- New table: `exit_surveys` (id, user_id, reason, comment, created_at)

**Stitch references:** `delete_account:_exit_survey_v4`, `delete_account:_export_first_v2`, `delete_account:_permanent_removal_v1`, `delete_account:_safety_verification_v3`, `reactivate:_welcome_back_v1`, `reactivate:_plan_selection_v2`, `reactivate:_security_verification_v4`, `reactivate:_quick_resume_v3`, `login:_magic_link_v3`, `login:_biometric_entry_v2`

---

## Task 15: What's New / Changelog [NEW]

**What to build:** An in-app changelog page showing new features and updates.

**Current state:** None.

**Deliverables:**

### Frontend:
- New page: `WhatsNewPage.tsx` with:
  - **Feature Cards** — Visual card per feature: title, description, screenshot/illustration, date, version tag
  - **Update Timeline** — Chronological list grouped by release date
  - **Video Recap** — Embedded video player for update walkthroughs (YouTube embed or hosted)
  - "New" badge on sidebar nav item when there are unread updates
  - Dismiss/mark-as-read functionality
- New route: `/whats-new`
- Add "What's New" to sidebar navigation (or footer/header link)

### Backend:
- New DB table: `changelog_entries` (id, title, description, content_html, image_url, video_url, version, category: feature/improvement/fix, published_at)
- New DB table: `changelog_reads` (user_id, entry_id, read_at) — track which entries each user has seen
- Admin-only: ability to create/edit changelog entries (or manage via seed data)

**Stitch references:** `what's_new:_feature_cards_v1`, `what's_new:_update_timeline_v2`, `what's_new:_story_format_v4`, `what's_new:_video_recap_v3`

---

## Task 16: Splash Screen [NEW]

**What to build:** A branded loading screen shown during initial app load.

**Current state:** A simple spinner (`LoadingSpinner` component in `App.tsx`: a spinning circle with no branding).

**Deliverables:**
- Replace `LoadingSpinner` in `App.tsx` with a branded splash screen component:
  - App logo (wand icon or custom logo)
  - App name "Newsletter Wizard"
  - Animated loading indicator (pulse, shimmer, or wizard-themed animation)
  - Background matching brand colors
- Only show during initial auth check (first load), not on every route transition
- CSS animation only (no heavy dependencies)

**Stitch references:** `splash_screen:_3d_wizard_magic`, `splash_screen:_glowing_orb_v2`, `splash_screen:_wizard's_desk_v3`

---

## Task 17: Maintenance & Network Error Pages [NEW]

**What to build:** Themed error and maintenance pages replacing the generic ErrorBoundary.

**Current state:** App has a basic `ErrorBoundary` in `main.tsx` that catches React rendering errors. No maintenance page, no network error handling UI.

**Deliverables:**

### Maintenance Pages:
- New component: `MaintenancePage.tsx` with wizard-themed illustrations and messaging:
  - "AI is recalibrating" variant
  - "Magic is recharging" variant
  - Estimated time until service restored
  - Auto-refresh or "Check again" button
- Triggered by: API returning 503, or a feature flag/config check

### Network Error Pages:
- New component: `NetworkErrorPage.tsx` with:
  - Disconnect detection (online/offline event listener)
  - Auto-retry with countdown timer and hourglass animation
  - "Retry now" manual button
  - Branded wizard-themed illustrations
- Wrap API calls or add a global network status banner

### Error Boundary Upgrade:
- Redesign the existing ErrorBoundary with branded styling
- "Something went wrong" with wizard theme
- "Go back to dashboard" and "Report issue" buttons

**Stitch references:** `maintenance:_ai_recalibrating_v2`, `maintenance:_magic_recharging_v1`, `maintenance:_wizard's_library_v3`, `network:_auto-retry_hourglass_v3`, `network:_flickering_magic_v1`, `network:_lightning_bolt_warning_v2`

---

## Task 18: Success / Completion States [NEW]

**What to build:** Dedicated full-page success screens after key actions, replacing simple toast notifications.

**Current state:** Toast notifications via `useToast()`. The `sendSuccess` state in `NewsletterEditorPage` shows a small green banner. No dedicated success pages.

**Deliverables:**
- New component: `SuccessPage.tsx` (reusable) with variants:
  - **Newsletter Sent** — Confetti animation, "Your newsletter is on its way!" message, stats (recipient count), wizard illustration
  - **Next Steps** — Suggested actions: "View analytics", "Create another newsletter", "Generate social posts"
  - **Social Sharing** — Quick share buttons to announce the newsletter on social media
  - **Session Summary** — Stats from current session (words written, AI generations used, time spent)
- Route to success page after newsletter send completes
- Reusable for other actions (source processed, voice trained, etc.)

**Stitch references:** `success:_newsletter_sent_v1`, `success:_next_steps_focus`, `success:_social_sharing_focus`, `success:_wizard_theme_v4`

---

## Task 19: Press Kit [NEW]

**What to build:** A public-facing page with downloadable brand assets.

**Current state:** None.

**Deliverables:**
- New public page: `PressKitPage.tsx` with:
  - Logo downloads (SVG, PNG in various sizes)
  - App screenshots gallery
  - Brand color palette display with hex codes
  - Typography reference
  - Boilerplate description copy
  - Media contact information
  - "Download all assets" ZIP button
- New route: `/press` (public, no auth required)
- Store assets in Supabase Storage or static files

**Stitch references:** `press_kit:_media_assets_v1`, `press_kit:_visual_story_v2`, `press_kit:_resource_list_v3`, `press_kit:_identity_showcase_v4`

---

## Task 20: Thank You / Session Summary [NEW]

**What to build:** End-of-session summary pages with productivity stats.

**Current state:** None.

**Deliverables:**
- New component: `SessionSummary.tsx` shown when user clicks "Sign Out" or after extended inactivity:
  - Productivity stats: newsletters created/edited this session, sources added, AI generations used
  - Personalized goodbye message
  - "See you next time" with wizard illustration
  - Quick links: save drafts, schedule pending newsletters
- Track session metrics in memory (React state or context): increment counters for actions performed
- Option to dismiss and continue working

**Stitch references:** `thank_you:_session_summary_v2`, `thank_you:_magical_goodbye_v1`, `thank_you:_community_focus_v3`, `thank_you:_night_mode_v4`

---

## Task 21: Newsletters List — Enhanced UI [EXPAND]

**What to build:** Upgrade the newsletters list with richer visual design, inline metrics, and campaign grouping.

**Current state:** `NewslettersPage.tsx` shows a flat list with title, subject line, status badge, date, and edit/social/delete action buttons. No inline metrics, no grouping.

**Deliverables:**
- Redesign `NewslettersPage.tsx`:
  - **Inline Performance Metrics** — For sent newsletters: show open rate, click rate, and subscriber count directly in the list row
  - **Campaign Archive Grouping** — Group newsletters by month or campaign tag. Collapsible sections.
  - **Visual Status Indicators** — Richer status badges with the "indigo glow" design language (animated glow on active/sending states, subtle animations)
  - **Thumbnail previews** — Small HTML preview thumbnail per newsletter
  - **Bulk actions** — Select multiple newsletters for bulk delete, bulk export
  - **Sort options** — Sort by date, open rate, click rate, status
- Join `newsletter_stats` data when loading newsletters to display inline metrics

**Stitch references:** `newsletters_list_v9:_indigo_glow`

---

## Task 22: Global Navigation — FAB + 5-Tab Bar [EXPAND]

**What to build:** Redesign the mobile bottom navigation to match the Stitch 5-tab layout with a central FAB for the wizard.

**Current state:** `DashboardLayout.tsx` has a sidebar (desktop) with 7 items: Dashboard, Knowledge Base, Newsletters, Create, Analytics, Settings, Partner Portal. `MobileNavigation.tsx` ALREADY has a 5-tab layout (Dashboard, Sources, Create, Newsletters, Settings) with "Create" styled as an elevated primary button with shadow — this partially matches the target FAB pattern.

**Deliverables:**
- Update `MobileNavigation.tsx` tab layout:
  - Current: Dashboard, Sources, **Create** (elevated), Newsletters, Settings
  - Target: Home, Sources, **Wizard FAB** (elevated circular), Analytics, Settings
  - Key change: swap Newsletters out for Analytics in the bottom nav tabs
  - Restyle the center button as a true FAB (circular, larger, brand-colored with shadow/glow)
- Update desktop sidebar to match the information hierarchy:
  - Primary: Dashboard, Knowledge Base, Newsletters, Templates (new, Task 8), Analytics
  - Secondary: Team (Task 9), Scheduling (Task 5), Beta Lab (Task 4), Settings
  - "Create Newsletter" prominent button at top of sidebar (above navigation list)
- **Depends on:** Tasks 4, 5, 8, 9 for secondary nav items — add items as those features ship

**Stitch references:** Stitch designs show a 5-tab mobile nav with central wizard FAB button

---

## Summary — Build Priority

### Tier 1 — Core Product (build first)
| # | Task | Type | Complexity |
|---|------|------|------------|
| 1 | Onboarding Flow | NEW | Medium |
| 8 | Template Library | NEW | High |
| 5 | Scheduling — Calendar & AI | EXPAND | High |
| 12 | Newsletter Preview — Multi-Device | EXPAND | Medium |
| 21 | Newsletters List — Enhanced UI | EXPAND | Low |
| 22 | Navigation — FAB + 5-Tab | EXPAND | Low |
| 16 | Splash Screen | NEW | Low |

### Tier 2 — Growth & Engagement
| # | Task | Type | Complexity |
|---|------|------|------------|
| 2 | Brand Voice — Advanced UI | EXPAND | High |
| 3 | AI Training Progress | NEW | Low |
| 7 | Social Editor — Thread Builder | EXPAND | High |
| 9 | Team Management | NEW | High |
| 10 | Performance Reports — AI Tips | EXPAND | Medium |
| 6 | Global Search | NEW | High |

### Tier 3 — Platform & Polish
| # | Task | Type | Complexity |
|---|------|------|------------|
| 4 | Beta Lab | NEW | Medium |
| 11 | Referral Program | NEW | Medium |
| 13 | Feedback & Community Voting | NEW | Medium |
| 14a | Delete Account Flow | EXPAND | Medium |
| 14b | Reactivate Account Flow | EXPAND | Medium |
| 14c | Magic Link Login | EXPAND | Low |
| 14d | Biometric Login (WebAuthn) | EXPAND | High (stretch) |
| 15 | What's New / Changelog | NEW | Medium |
| 17 | Maintenance & Network Error Pages | NEW | Medium |
| 18 | Success / Completion States | NEW | Low |
| 19 | Press Kit | NEW | Low |
| 20 | Thank You / Session Summary | NEW | Medium |

---

## Critical Review Addendum

The following cross-cutting concerns apply across multiple tasks and should be resolved before or during implementation.

### Pre-Existing Bug: Missing `/auth/reset-password` Route

`AuthContext.tsx` line 141 redirects password reset to `/auth/reset-password`, but no route exists for this in `App.tsx`. The fallback route catches it and redirects to `/dashboard`, so password reset completion likely fails. **Fix this in Task 14c** alongside magic link work.

### Type Duplication Between `supabase.ts` and `packages/shared`

`SourceType` is defined differently in both files:
- `packages/shared`: `'url' | 'document' | 'manual'`
- `apps/web/src/lib/supabase.ts`: `'url' | 'document' | 'manual' | 'youtube' | 'rss' | 'gdrive'`

Resolve this inconsistency before adding new shared types. All types should be canonical in `packages/shared` and imported everywhere else.

### App.tsx Route Additions Required

Every task adding a new page needs a lazy import + `<Route>` element in `App.tsx`. Tasks that need routes: 1, 4, 5, 6, 8, 9, 11, 13, 14, 15, 19. Task 19 (`/press`) must be placed OUTSIDE the `<ProtectedRoute>` wrapper since it's public.

### DashboardLayout Navigation Master Plan

Multiple tasks add sidebar items. The final sidebar should be:

**Primary:**
1. Dashboard
2. Knowledge Base
3. Newsletters
4. Templates (Task 8)
5. Analytics

**Secondary:**
6. Scheduling (Task 5)
7. Team (Task 9, visible to owner/admin only — first role-gated nav item)
8. Beta Lab (Task 4)
9. Referrals (Task 11)
10. What's New (Task 15, with unread badge)
11. Settings

**Removed from sidebar:** Partner Portal (moved under Settings), Create (replaced by prominent "Create Newsletter" button above nav)

### api.ts Pattern for New Edge Functions

Tasks 2–15 add ~12 new edge functions. Each needs a client-side wrapper in `api.ts`. Consider splitting `api.ts` into modules (e.g., `api/voice.ts`, `api/search.ts`, `api/team.ts`) if it grows beyond ~30 functions.

### Shared Package Type Additions

The following tasks need types added to `packages/shared/src/index.ts` but did not originally note it:
- Task 2: `VoiceProfile` (currently only in `SettingsPage.tsx`)
- Task 5: `SchedulingConfig`, `RecurrenceRule`
- Task 6: `SearchResult`, `SearchRequest`
- Task 7: `SocialPost`
- Task 10: `PerformanceTip`, `PerformanceReport`
- Task 11: `ReferralCode`, `Referral`, `ReferralReward`
- Task 13: `AIFeedbackRecord`, `FeatureRequest`
- Task 15: `ChangelogEntry`

### Inter-Task Dependencies

```
Task 3 (AI Training Progress) → depends on Task 2 (voice UI location)
Task 8 (Templates) → should precede Task 9 (Team shared assets reference templates)
Task 4 (Beta Lab voting) ↔ Task 13 (Feedback voting) → share DB tables
Task 22 (Navigation) → depends on Tasks 4, 5, 8, 9 (nav items for those features)
Task 10 (Performance Reports) → depends on newsletter_stats being populated by real sends
Task 7 (Social post persistence) → enables Task 10 social analytics
Task 14c (Magic Link) → should fix pre-existing /auth/reset-password route bug
Task 21 (Enhanced list) → needs newsletter_stats join, complexity is Medium not Low
```

### Complexity Corrections

| Task | Original | Corrected | Reason |
|------|----------|-----------|--------|
| 3 | Low | Medium | SSE/polling for real progress, or dependency on Task 2 |
| 14 | High (combined) | Split into 14a–d | 4 features bundled; 14d (WebAuthn) is stretch goal |
| 15 | Low | Medium | Unread badge tracking, admin editing, video embeds |
| 17 | Low | Medium | Network detection, auto-retry countdown, maintenance mode |
| 20 | Low | Medium | Session metrics context provider, auth flow interception |
| 21 | Low | Medium | DB join, grouping logic, bulk actions, sort state |
| 22 | Low | Medium | Role-gated nav items, FAB animation, conditional items |
