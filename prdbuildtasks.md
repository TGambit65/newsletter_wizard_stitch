# PRD Build Tasks — Newsletter Wizard

Comprehensive task list merging all Stitch UI gap features and UX audit findings.
Tasks are ordered by dependency and logical build sequence across 5 phases.

**Legend:**
- **[NEW]** — Nothing exists in the codebase
- **[EXPAND]** — Partial implementation exists
- **[FIX]** — Bug or security issue in existing code
- **[PRD]** — Full product requirements document included

---

# Phase 0: Critical Fixes

These must be resolved before any new feature work. They are security vulnerabilities, broken flows, and data integrity issues in the existing codebase.

---

## Task 0.1: Security — HTML Sanitization [FIX]

**Severity:** Critical
**Files:** `NewsletterEditorPage.tsx`
**UX Audit Ref:** Issue #2

AI-generated HTML content is rendered directly without sanitization in the preview modal and compare view. Malicious content in knowledge sources could execute arbitrary scripts. All HTML must be sanitized with DOMPurify before rendering.

### Subtasks
- [ ] 0.1.1: Install DOMPurify (`pnpm add dompurify && pnpm add -D @types/dompurify` in `apps/web`)
- [ ] 0.1.2: Create utility `lib/sanitize.ts` exporting `sanitizeHtml(html: string): string` wrapper
- [ ] 0.1.3: Apply sanitization in `NewsletterEditorPage.tsx` preview modal (all raw HTML rendering points)
- [ ] 0.1.4: Apply sanitization in compare/diff view rendering
- [ ] 0.1.5: Apply sanitization in `WizardPage.tsx` if it renders generated HTML
- [ ] 0.1.6: Apply sanitization to any embed page HTML rendering
- [ ] 0.1.7: Write unit test for `sanitizeHtml` with script injection payloads (script tags, event handlers, data URIs)

---

## Task 0.2: Security — postMessage Wildcard Origin [FIX]

**Severity:** Critical
**Files:** `EmbedWizardPage.tsx`, `EmbedKnowledgeBasePage.tsx`
**UX Audit Ref:** Issue #3

Both embed pages use `window.parent.postMessage(data, '*')` which broadcasts to any origin.

### Subtasks
- [ ] 0.2.1: Add `targetOrigin` URL parameter to both embed pages (read from `?origin=` query param)
- [ ] 0.2.2: Replace all wildcard-origin postMessage calls with `postMessage(data, targetOrigin)` — fall back to `window.location.origin` if param missing
- [ ] 0.2.3: Add `message` event listener origin validation — reject messages from non-matching origins
- [ ] 0.2.4: Update embed documentation / partner portal with origin parameter requirement
- [ ] 0.2.5: Test with cross-origin iframe to verify messages only go to specified origin

---

## Task 0.3: Security — Error Message Information Leakage [FIX]

**Severity:** Medium
**Files:** `LoginPage.tsx`, `SignUpPage.tsx`
**UX Audit Ref:** Issue #19

Raw Supabase error messages are passed to the UI. Some reveal whether an email exists in the system.

### Subtasks
- [ ] 0.3.1: Create error normalization map in `lib/auth-errors.ts` mapping Supabase error codes to generic messages
- [ ] 0.3.2: Apply to LoginPage — always show "Invalid email or password" for auth failures
- [ ] 0.3.3: Apply to SignUpPage — normalize "User already registered" to generic message
- [ ] 0.3.4: Apply to ForgotPasswordPage — always show "If this email exists, a reset link has been sent"
- [ ] 0.3.5: Audit all other Supabase error paths for leakage

---

## Task 0.4: Bug — AI Feedback Panel Unreachable [FIX]

**Severity:** Critical
**File:** `NewsletterEditorPage.tsx`
**UX Audit Ref:** Issue #1

`showAIPanel` is set to `false` after generation completes, but `AIFeedback` renders inside the `showAIPanel` conditional. Users can never submit feedback.

### Subtasks
- [ ] 0.4.1: Add separate `showAIFeedback` state variable independent of `showAIPanel`
- [ ] 0.4.2: Set `showAIFeedback = true` when generation completes (where `showAIPanel` is set false)
- [ ] 0.4.3: Render `AIFeedback` outside the `showAIPanel` conditional, controlled by `showAIFeedback`
- [ ] 0.4.4: Add dismiss button on feedback panel that sets `showAIFeedback = false`
- [ ] 0.4.5: Verify feedback can be submitted after generation completes

---

## Task 0.5: Bug — Missing /auth/reset-password Route [FIX]

**Severity:** Critical
**Files:** `AuthContext.tsx` (line 141), `App.tsx`
**UX Audit Ref:** Issue #4

`resetPassword()` redirects to `/auth/reset-password` which does not exist. Users who click the reset link get caught by the fallback route and sent to `/dashboard`.

### Subtasks
- [ ] 0.5.1: Create `ResetPasswordPage.tsx` in `pages/auth/` — form with new password + confirm password fields
- [ ] 0.5.2: Add lazy import and route in `App.tsx`: `<Route path="/auth/reset-password" element={<ResetPasswordPage />} />`
- [ ] 0.5.3: In `ResetPasswordPage`, call `supabase.auth.updateUser({ password })` to complete the reset
- [ ] 0.5.4: Handle token extraction from URL (Supabase appends access_token in hash fragment)
- [ ] 0.5.5: Add success state with redirect to login with "Password updated" message
- [ ] 0.5.6: Add error handling for expired/invalid tokens

---

## Task 0.6: Bug — AuthContext Race Condition [FIX]

**Severity:** High
**File:** `AuthContext.tsx`
**UX Audit Ref:** Issue #6

`onAuthStateChange` updates session but does not reload profile/tenant data.

### Subtasks
- [ ] 0.6.1: Add `loadProfileAndTenant()` call inside `onAuthStateChange` for `SIGNED_IN` and `TOKEN_REFRESHED` events
- [ ] 0.6.2: Add debounce to prevent duplicate loads if events fire rapidly
- [ ] 0.6.3: Expose `refreshProfile()` and `refreshTenant()` methods from AuthContext for manual refresh
- [ ] 0.6.4: Test: sign in then wait for token refresh then verify profile/tenant are current

---

## Task 0.7: Bug — Partial Signup Failure [FIX]

**Severity:** High
**File:** `AuthContext.tsx`
**UX Audit Ref:** Issue #7

Auth user is created first, then tenant/profile via separate client-side calls. If those fail, user is in a broken state.

### Subtasks
- [ ] 0.7.1: Create edge function `create-tenant-and-profile` that handles both atomically with transaction
- [ ] 0.7.2: Modify signup flow to call edge function after auth.signUp() succeeds
- [ ] 0.7.3: Add rollback: if edge function fails, call `supabase.auth.admin.deleteUser()` or mark account for cleanup
- [ ] 0.7.4: Add retry UI: if tenant/profile creation fails, show "Setup incomplete" screen with retry button
- [ ] 0.7.5: Add startup check: on login, if profile is missing, redirect to a recovery/setup page

---

## Task 0.8: Bug — SocialMediaPage Crash Risk [FIX]

**Severity:** Medium
**File:** `SocialMediaPage.tsx`
**UX Audit Ref:** Issue #14

UI shows tabs for Reddit, Pinterest, Snapchat but API returns no data for these. Accessing undefined properties will crash.

### Subtasks
- [ ] 0.8.1: Add null/undefined checks before accessing platform-specific post data
- [ ] 0.8.2: Only render tabs for platforms present in API response (filter `Object.keys(posts)`)
- [ ] 0.8.3: Add "Coming soon" badge for platforms with tab but no data
- [ ] 0.8.4: Add error boundary around each platform tab content

---

# Phase 1: Foundation Infrastructure

Architectural improvements that every subsequent task depends on. Build these before any feature work.

---

## Task 1.1: Adopt Toast System App-Wide [FIX]

**Severity:** High
**UX Audit Ref:** Issue #8
**Complexity:** Medium

The Toast component (rated 8/10) exists but almost nothing uses it. Most pages use `console.error()` or `alert()`.

### Subtasks
- [ ] 1.1.1: Audit all pages for `alert()` calls — replace each with `toast.error()` or `toast.success()`
  - SettingsPage: ~3 alert() calls
  - Other pages: search codebase for `alert(`
- [ ] 1.1.2: Audit all pages for `console.error` in catch blocks — add toast notification alongside
  - KnowledgeBasePage, NewsletterEditorPage, SocialMediaPage, PartnerPortalPage, ABTestPage
- [ ] 1.1.3: Add success toasts for all save/create/delete operations that currently give no feedback
- [ ] 1.1.4: Add `useToast()` import to every page that catches errors
- [ ] 1.1.5: Remove all `window.confirm()` calls — replace with a confirmation dialog component (see Task 1.2)
- [ ] 1.1.6: Verify toast visibility in both light and dark mode

---

## Task 1.2: Accessible Modal/Dialog Component [NEW]

**Severity:** High
**UX Audit Ref:** Issue #9
**Complexity:** Medium

No modal in the app has focus trapping, `role="dialog"`, `aria-modal`, or Escape key handling.

### Subtasks
- [ ] 1.2.1: Create reusable `components/ui/Dialog.tsx` with:
  - `role="dialog"` and `aria-modal="true"`
  - Focus trap (tab cycles within dialog)
  - Escape key closes dialog
  - Click-outside-to-close with `aria-label` on backdrop
  - Return focus to trigger element on close
  - Body scroll lock when open
- [ ] 1.2.2: Create `components/ui/ConfirmDialog.tsx` — confirm/cancel variant for delete operations
- [ ] 1.2.3: Replace all inline modal `<div>` implementations with Dialog component:
  - NewsletterEditorPage preview modal
  - NewsletterEditorPage schedule modal
  - SettingsPage modals
  - KnowledgeBasePage add source modal
  - All delete confirmation patterns
- [ ] 1.2.4: Write unit tests for focus trap, Escape key, and screen reader announcements
- [ ] 1.2.5: Test with keyboard-only navigation (Tab, Shift+Tab, Escape, Enter)

---

## Task 1.3: Beforeunload Handler Utility [NEW]

**Severity:** High
**UX Audit Ref:** Issue #10
**Complexity:** Low

No page warns about unsaved changes on tab close or navigation.

### Subtasks
- [ ] 1.3.1: Create `hooks/useUnsavedChanges.ts` hook that:
  - Accepts `isDirty: boolean` parameter
  - Adds `beforeunload` event listener when dirty
  - Uses React Router `useBlocker` or `unstable_usePrompt` for in-app navigation warnings
  - Cleans up listener on unmount or when dirty becomes false
- [ ] 1.3.2: Apply to `NewsletterEditorPage` — track dirty state from editor changes vs last save
- [ ] 1.3.3: Apply to `SettingsPage` — track dirty state for profile/voice edits
- [ ] 1.3.4: Apply to `KnowledgeBasePage` — track dirty state for manual source editing
- [ ] 1.3.5: Test: make changes then close tab then verify browser prompt appears

---

## Task 1.4: Pagination Infrastructure [NEW]

**Severity:** Medium
**UX Audit Ref:** Issue #11
**Complexity:** Medium

Every list view fetches all records without pagination. Will break at scale.

### Subtasks
- [ ] 1.4.1: Create reusable `hooks/usePagination.ts` with:
  - `page`, `pageSize`, `totalCount`, `totalPages` state
  - `nextPage()`, `prevPage()`, `goToPage()` methods
  - Supabase `.range(from, to)` integration helper
- [ ] 1.4.2: Create `components/ui/Pagination.tsx` — page controls (prev/next, page numbers, page size selector)
- [ ] 1.4.3: Apply to `NewslettersPage` — paginate newsletter list (default 20 per page)
- [ ] 1.4.4: Apply to `KnowledgeBasePage` — paginate source list
- [ ] 1.4.5: Apply to `AnalyticsPage` — paginate newsletter-by-newsletter stats (once real data exists)
- [ ] 1.4.6: Fix `NewslettersPage` count query — currently limited to 5 rows for stats

---

## Task 1.5: Global Accessibility Pass [FIX]

**UX Audit Refs:** Issues #26, #29
**Complexity:** Low

Icon buttons have no accessible names. Mobile nav lacks ARIA attributes.

### Subtasks
- [ ] 1.5.1: Add `aria-label` to all icon-only `<button>` elements across the app:
  - DashboardLayout: mobile menu toggle, sidebar close
  - NewsletterEditorPage: all toolbar buttons
  - KnowledgeBasePage: action buttons
  - All close/dismiss buttons
- [ ] 1.5.2: Add `aria-label="Main navigation"` to `MobileNavigation` `<nav>` element
- [ ] 1.5.3: Add `aria-current="page"` to active nav items in both sidebar and mobile nav
- [ ] 1.5.4: Add `role="navigation"` and `aria-label` to sidebar `<aside>` in DashboardLayout
- [ ] 1.5.5: Audit with axe-core or Lighthouse accessibility scan

---

## Task 1.6: FOUC Fix in useTheme [FIX]

**UX Audit Ref:** Issue #30
**Complexity:** Low

Theme is read from localStorage in `useEffect` (runs after render), causing a flash of wrong theme.

### Subtasks
- [ ] 1.6.1: Read theme synchronously in `useState` initializer: `useState(() => localStorage.getItem('theme') || 'system')`
- [ ] 1.6.2: Add blocking `<script>` in `index.html` `<head>` that sets `class="dark"` on `<html>` before React loads
- [ ] 1.6.3: Verify no flash when refreshing page in dark mode

---

## Task 1.7: Breadcrumbs Route Labels [FIX]

**UX Audit Ref:** Issue #27
**Complexity:** Low

Some routes show raw path segments instead of human-readable labels.

### Subtasks
- [ ] 1.7.1: Audit all routes in `App.tsx` against breadcrumb label config
- [ ] 1.7.2: Add missing labels for: `/settings/api-keys`, `/settings/webhooks`, `/newsletters/:id/social`, `/newsletters/:id/ab-test`, any new routes
- [ ] 1.7.3: Handle dynamic segments (`:id`) with newsletter title lookup

---

## Task 1.8: Type System Cleanup [FIX]

**Complexity:** Low

Types are duplicated between `packages/shared/src/index.ts` and `apps/web/src/lib/supabase.ts`.

### Subtasks
- [ ] 1.8.1: Make `packages/shared` the single source of truth for all types
- [ ] 1.8.2: Update `SourceType` in shared to include all variants: `'url' | 'document' | 'manual' | 'youtube' | 'rss' | 'gdrive'`
- [ ] 1.8.3: Remove duplicate type definitions from `supabase.ts` — import from `@newsletter-wizard/shared`
- [ ] 1.8.4: Remove duplicate interface definitions from `api.ts` — import from shared package
- [ ] 1.8.5: Run `pnpm build` to verify no type errors across workspace

---

## Task 1.9: WhiteLabel Context Fixes [FIX]

**UX Audit Refs:** Issues #17, #18
**Complexity:** Medium

Auth pages hardcode "Newsletter Wizard" branding. CSS variables do not connect to Tailwind's color system.

### Subtasks
- [ ] 1.9.1: Wrap auth routes in `WhiteLabelProvider` (or move it above `AuthProvider` in `App.tsx` component tree)
- [ ] 1.9.2: Update `LoginPage`, `SignUpPage`, `ForgotPasswordPage` to consume `useWhiteLabel()` for brand name, logo, and primary color
- [ ] 1.9.3: Extend `tailwind.config.ts` to reference CSS variables for primary color:
  ```
  colors: { primary: { 500: 'var(--primary-color, #6366f1)' } }
  ```
- [ ] 1.9.4: Verify branded colors apply when tenant has custom `primary_color` set
- [ ] 1.9.5: Test with multiple tenants to confirm isolation

---

## Task 1.10: Theme-Aware Color Tokens [FIX]

**UX Audit Ref:** Issue #20
**Complexity:** Low

Chart colors in AnalyticsPage are hardcoded light-mode hex values. Charts break in dark mode.

### Subtasks
- [ ] 1.10.1: Create `lib/chart-colors.ts` exporting theme-aware color palettes:
  - `getChartColors(mode: 'light' | 'dark')` returns primary, secondary, accent, grid, text colors
- [ ] 1.10.2: Apply to AnalyticsPage ECharts config — read current theme mode from `useTheme()`
- [ ] 1.10.3: Apply to HealthDashboard charts if applicable
- [ ] 1.10.4: Add `backgroundColor: 'transparent'` to chart containers so page background shows through
- [ ] 1.10.5: Verify charts are readable in both light and dark mode

---

# Phase 2: Existing Page Improvements

Fix existing pages before building new features. Many of these unblock or improve the experience for subsequent phases.

---

## Task 2.1: Replace Mock Data with Real Queries [FIX]

**Severity:** Critical
**UX Audit Ref:** Issue #5
**Complexity:** High

Dashboard, Analytics, Wizard, and ABTest pages show hardcoded fake data as if it were real.

### Subtasks
- [ ] 2.1.1: **DashboardPage** — Replace hardcoded stats with Supabase queries:
  - Total newsletters: `SELECT count(*) FROM newsletters WHERE tenant_id = ?`
  - Total sources: `SELECT count(*) FROM knowledge_sources WHERE tenant_id = ?`
  - Total sent: `SELECT count(*) FROM newsletters WHERE tenant_id = ? AND status = 'sent'`
  - Recent newsletters: `SELECT * FROM newsletters WHERE tenant_id = ? ORDER BY updated_at DESC LIMIT 5`
- [ ] 2.1.2: **AnalyticsPage** — Replace all hardcoded stats:
  - Query `newsletter_stats` joined with `newsletters` for real open/click rates
  - Aggregate by date range for chart data
  - Wire date range selector to filter queries
  - Show "No data yet" empty state when no sent newsletters exist
- [ ] 2.1.3: **WizardPage** — Remove fake "previous newsletter" data; show actual last newsletter or empty state
- [ ] 2.1.4: **ABTestPage** — Replace simulated results with real variant performance data (or show "Awaiting results" for active tests)
- [ ] 2.1.5: **HealthDashboard** — Connect progress bars to real metrics or clearly label as "Demo"
- [ ] 2.1.6: Add loading states for all data-fetching sections
- [ ] 2.1.7: Add empty states with helpful CTAs when no data exists

---

## Task 2.2: NewsletterEditorPage Refactor [FIX]

**UX Audit Ref:** Issue #25
**Complexity:** Medium

~30 `useState` calls in a single 1100-line component. State interactions are bug-prone.

### Subtasks
- [ ] 2.2.1: Extract editor toolbar into `components/editor/EditorToolbar.tsx`
- [ ] 2.2.2: Extract preview modal into `components/editor/PreviewModal.tsx` (using Dialog from Task 1.2)
- [ ] 2.2.3: Extract schedule modal into `components/editor/ScheduleModal.tsx`
- [ ] 2.2.4: Extract AI generation panel into `components/editor/AIGenerationPanel.tsx`
- [ ] 2.2.5: Create `useEditorState` reducer or hook consolidating the ~30 useState calls
- [ ] 2.2.6: Create `useAutosave` hook extracting the autosave debounce logic
- [ ] 2.2.7: Verify all functionality works after refactor (save, generate, preview, schedule, compare)

---

## Task 2.3: SettingsPage Refactor [FIX]

**UX Audit Ref:** Issue #16
**Complexity:** Medium

22 `useState` calls in one component. Uses `alert()` for errors. No loading indicators.

### Subtasks
- [ ] 2.3.1: Extract each tab into its own component:
  - `components/settings/ProfileSettings.tsx`
  - `components/settings/ApiKeySettings.tsx`
  - `components/settings/VoiceProfileSettings.tsx`
  - `components/settings/BillingSettings.tsx`
  - `components/settings/IntegrationSettings.tsx`
- [ ] 2.3.2: Add `saving` state per section with spinner on save button
- [ ] 2.3.3: Replace all `alert()` with toast notifications (from Task 1.1)
- [ ] 2.3.4: Add success toasts for all save operations
- [ ] 2.3.5: Add form validation with inline error messages

---

## Task 2.4: KnowledgeBasePage UX Fixes [FIX]

**UX Audit Ref:** Issue #12
**Complexity:** Low

Hover-only action menus are inaccessible on touch devices and to keyboard users.

### Subtasks
- [ ] 2.4.1: Replace hover-revealed actions with persistent kebab menu (three-dot) button per source card
- [ ] 2.4.2: Implement dropdown menu from kebab button with: Edit, Delete, Reprocess, Copy URL
- [ ] 2.4.3: Replace `window.confirm()` delete with ConfirmDialog from Task 1.2
- [ ] 2.4.4: Add toast notifications for all operations (add, delete, reprocess)
- [ ] 2.4.5: Add error states when source operations fail (currently silent)

---

## Task 2.5: SocialMediaPage Fixes [FIX]

**UX Audit Refs:** Issues #13, #14
**Complexity:** Medium

Auto-regenerates on every visit destroying edits. No persistence.

### Subtasks
- [ ] 2.5.1: Stop auto-generation on page mount — only generate when user clicks "Generate Posts"
- [ ] 2.5.2: Cache generated posts in component state keyed by newsletter ID
- [ ] 2.5.3: Add "Regenerate" button with confirmation ("This will replace your edits")
- [ ] 2.5.4: Filter platform tabs to only show platforms with API response data
- [ ] 2.5.5: Add null checks for all platform data access paths
- [ ] 2.5.6: Add error boundary per platform tab to prevent full-page crash
- [ ] 2.5.7: Add "Save to clipboard" toast feedback (currently no feedback on copy)

---

## Task 2.6: AuthCallbackPage Error Handling [FIX]

**UX Audit Ref:** Issue #15
**Complexity:** Low

Silent failure shows perpetual spinner if OAuth callback fails.

### Subtasks
- [ ] 2.6.1: Add 15-second timeout — if no auth event fires, show error state
- [ ] 2.6.2: Add error UI: "Authentication failed" message with "Try again" and "Back to login" buttons
- [ ] 2.6.3: Log error details to console for debugging but show generic message to user
- [ ] 2.6.4: Handle edge case: user navigates directly to `/auth/callback` without OAuth flow

---

## Task 2.7: GenerationHistory Persistence [FIX]

**UX Audit Ref:** Issue #21
**Complexity:** Low

Claims "30-day retention" but stores everything in React state. Lost on refresh.

### Subtasks
- [ ] 2.7.1: Persist history to localStorage keyed by `generation-history-{tenantId}`
- [ ] 2.7.2: Load from localStorage on mount, merge with any new in-memory entries
- [ ] 2.7.3: Implement 30-day TTL — filter out entries older than 30 days on load
- [ ] 2.7.4: Cap storage at ~100 entries to avoid localStorage bloat
- [ ] 2.7.5: Update UI label to match actual retention behavior

---

## Task 2.8: ThemeSwitcher Dropdown Accessibility [FIX]

**UX Audit Ref:** Issue #22
**Complexity:** Low

Dropdown variant has no keyboard navigation.

### Subtasks
- [ ] 2.8.1: Add `onKeyDown` handler: Arrow Up/Down to navigate options, Enter/Space to select, Escape to close
- [ ] 2.8.2: Add `role="listbox"` to dropdown, `role="option"` to items, `aria-selected` for current
- [ ] 2.8.3: Move focus into dropdown when opened, return focus to trigger on close
- [ ] 2.8.4: Test with keyboard-only navigation

---

## Task 2.9: ABTestPage Race Condition Fix [FIX]

**UX Audit Ref:** Issue #23
**Complexity:** Low

Multi-step async operations leave test in partial state if a middle step fails.

### Subtasks
- [ ] 2.9.1: Wrap create-test then update-variants then start-test in a single edge function call
- [ ] 2.9.2: Add error recovery UI: "Setup incomplete, retry?" if any step fails
- [ ] 2.9.3: Add loading state with step progress indicator
- [ ] 2.9.4: Replace simulated results with empty state until real data exists

---

## Task 2.10: PartnerPortalPage Onboarding and Feedback [FIX]

**UX Audit Ref:** Issue #24
**Complexity:** Low

Blank state with no guidance. Silent errors.

### Subtasks
- [ ] 2.10.1: Add onboarding guide section: "Get started with the Partner Portal" with numbered steps
- [ ] 2.10.2: Add example API key usage with copy-paste code snippets
- [ ] 2.10.3: Add example webhook payload documentation
- [ ] 2.10.4: Replace silent error handling with toast notifications
- [ ] 2.10.5: Add save confirmation feedback for all form operations

---

## Task 2.11: HealthDashboard Data Connection [FIX]

**UX Audit Ref:** Issue #28
**Complexity:** Low

Progress bars show fabricated percentages.

### Subtasks
- [ ] 2.11.1: Connect to real health metrics from Supabase (function invocation stats, error rates)
- [ ] 2.11.2: If real metrics unavailable, add "Demo Data" banner with explanation
- [ ] 2.11.3: Add `aria-label` and `role="progressbar"` to all progress indicators
- [ ] 2.11.4: Make chart accessible (add alt text or table fallback)

---

# Phase 3: Core Product Features

New features and major expansions that define the core product experience. Build in this order due to dependencies.

---

## Task 3.1: Splash Screen [NEW]

**Complexity:** Low

### Subtasks
- [ ] 3.1.1: Create `components/SplashScreen.tsx` with branded loading animation:
  - App logo (wand icon or WhiteLabel logo)
  - App name (from WhiteLabel context if available)
  - Animated pulse/shimmer indicator
  - Brand-colored background
- [ ] 3.1.2: Replace `LoadingSpinner` in `App.tsx` with `SplashScreen`
- [ ] 3.1.3: Only show during initial auth check — not on lazy route loads (keep spinner for those)
- [ ] 3.1.4: CSS-only animation (no Lottie or heavy dependencies)
- [ ] 3.1.5: Test in both light and dark mode

**Stitch refs:** `splash_screen:_3d_wizard_magic`, `splash_screen:_glowing_orb_v2`, `splash_screen:_wizard's_desk_v3`

---

## Task 3.2: Onboarding Flow [NEW] [PRD]

**Complexity:** Medium
**Dependencies:** Task 1.2 (Dialog), Task 1.9 (WhiteLabel fixes)

### PRD

**Goal:** Convert new signups into active users by teaching them the product's value in 60 seconds.

**Target User:** First-time user who just completed signup. No knowledge of the product.

**Success Metrics:**
- Onboarding completion rate > 80%
- Time to first newsletter creation < 5 minutes post-onboarding
- 7-day retention improvement vs direct-to-dashboard

**User Flow:**
1. Signup completes then redirect to `/onboarding` instead of `/dashboard`
2. Step 1 (Welcome): Animated hero, value prop, "Get Started" CTA
3. Step 2 (Knowledge Base): Explain sources, show supported types, "Add your first source" optional action
4. Step 3 (Repurposing): Show newsletter-to-social flow, preview of what AI creates
5. Step 4 (Complete): Congrats, "Create your first newsletter" CTA, "Explore dashboard" secondary CTA
6. On any step: Skip button to go to dashboard immediately
7. Flag set on profile so onboarding never shows again

**Out of Scope:** Interactive tutorials, video walkthroughs, product tours with pointers

### Subtasks
- [ ] 3.2.1: Add `has_completed_onboarding: boolean DEFAULT false` column to `profiles` table (migration)
- [ ] 3.2.2: Create `pages/OnboardingPage.tsx` with step state machine (4 steps)
- [ ] 3.2.3: Build Step 1 — Welcome: animated illustration (CSS), value proposition copy, progress dots
- [ ] 3.2.4: Build Step 2 — Knowledge Base intro: icon grid of source types, brief explanation
- [ ] 3.2.5: Build Step 3 — Repurposing intro: before/after mockup showing newsletter becoming social posts
- [ ] 3.2.6: Build Step 4 — Completion: celebration state, primary CTA (create newsletter), secondary CTA (explore)
- [ ] 3.2.7: Add skip button on every step — calls API to set `has_completed_onboarding = true`
- [ ] 3.2.8: Add route `/onboarding` in App.tsx (protected)
- [ ] 3.2.9: Modify `ProtectedRoute` or `DashboardLayout` to check `profile.has_completed_onboarding` and redirect to `/onboarding` if false
- [ ] 3.2.10: Mobile responsive — steps must work on 375px viewport
- [ ] 3.2.11: Test full flow: signup then onboarding then dashboard. Verify onboarding only shows once.

**Stitch refs:** `onboarding_1:_welcome`, `onboarding_2:_knowledge_base`, `onboarding_3:_repurposing`, `onboarding_4:_sign_up`

---

## Task 3.3: Navigation — FAB + 5-Tab Bar [EXPAND]

**Complexity:** Medium
**Dependencies:** Runs incrementally as Phase 4/5 features ship

### Subtasks
- [ ] 3.3.1: Update `MobileNavigation.tsx` tab layout:
  - Current: Dashboard, Sources, **Create** (elevated), Newsletters, Settings
  - Target: Home, Sources, **Wizard FAB** (circular, larger, glow), Analytics, Settings
- [ ] 3.3.2: Restyle center button as circular FAB with brand color, shadow, and subtle pulse animation
- [ ] 3.3.3: Update desktop sidebar grouping:
  - Primary section: Dashboard, Knowledge Base, Newsletters, Analytics
  - Secondary section (with divider): Settings
  - Add "Create Newsletter" prominent button above navigation list
- [ ] 3.3.4: Move Partner Portal under Settings as a sub-route
- [ ] 3.3.5: Remove "Create" from sidebar navigation (replaced by prominent button)
- [ ] 3.3.6: As new features ship, add nav items: Templates (Task 3.6), Scheduling (Task 3.7), Team (Task 4.6), Beta Lab (Task 5.1)
- [ ] 3.3.7: Add `aria-label` to FAB button and all nav items

**Stitch refs:** Stitch 5-tab mobile nav with central wizard FAB

---

## Task 3.4: Newsletters List — Enhanced UI [EXPAND]

**Complexity:** Medium
**Dependencies:** Task 1.4 (Pagination), Task 2.1 (Real data)

### Subtasks
- [ ] 3.4.1: Join `newsletter_stats` on newsletter list query to get inline metrics
- [ ] 3.4.2: Add inline performance columns: open rate, click rate, subscriber count (for sent newsletters)
- [ ] 3.4.3: Add campaign grouping: group by month with collapsible headers
- [ ] 3.4.4: Add visual status badges with brand-consistent styling (animated glow for sending/generating)
- [ ] 3.4.5: Add sort dropdown: Date (default), Open Rate, Click Rate, Status
- [ ] 3.4.6: Add bulk actions: checkbox selection then bulk delete, bulk export
- [ ] 3.4.7: Add thumbnail preview column (render first 200 chars of HTML as tiny preview)
- [ ] 3.4.8: Replace `window.confirm()` delete with ConfirmDialog
- [ ] 3.4.9: Apply pagination from Task 1.4

**Stitch refs:** `newsletters_list_v9:_indigo_glow`

---

## Task 3.5: Newsletter Preview — Multi-Device and Accuracy [EXPAND] [PRD]

**Complexity:** Medium
**Dependencies:** Task 0.1 (HTML sanitization), Task 1.2 (Dialog), Task 2.2 (Editor refactor)

### PRD

**Goal:** Give newsletter authors confidence their content looks good and reads well across all devices and email clients.

**Target User:** Newsletter author in the editor about to send or schedule.

**Success Metrics:**
- Preview usage rate > 60% before send
- Quality check adoption > 30% of previews
- Reduction in post-send "it looks broken on mobile" complaints

**Features:**
1. **Multi-Device Toggle** — Desktop (650px), Tablet (480px), Mobile (375px) preview frames with device chrome borders
2. **Campaign View** — Full inbox simulation: From name, Subject line, Preheader, then body
3. **Accuracy Check** — AI quality scorer:
   - Readability score (Flesch-Kincaid)
   - Spam word detection
   - Link validation (href exists, not broken)
   - Image alt text audit
   - Subject line length check (< 50 chars recommended)
   - Overall grade (A-F)
4. **Fix Issues** — Auto-correct button for fixable issues (add alt text, shorten subject)

**Out of Scope:** Actual email client rendering (Litmus-style), A/B test preview, dark mode email preview

### Subtasks
- [ ] 3.5.1: Redesign preview modal as full-screen Dialog with device frame selector
- [ ] 3.5.2: Build device frame component: CSS borders/shadows simulating desktop/tablet/mobile chrome
- [ ] 3.5.3: Build campaign view: From/Subject/Preheader header above content, inbox-style rendering
- [ ] 3.5.4: Create edge function `check-newsletter-quality`:
  - Input: `{ content_html, subject_line, preheader }`
  - Output: `{ readability_score, spam_score, broken_links[], missing_alt_text[], subject_length_ok, overall_grade }`
- [ ] 3.5.5: Build quality check panel in preview modal — scores with colored indicators
- [ ] 3.5.6: Build "Fix issues" button — auto-add alt text placeholders, flag long subject line
- [ ] 3.5.7: Add `api.ts` wrapper: `checkNewsletterQuality()`
- [ ] 3.5.8: Sanitize all HTML in preview (uses Task 0.1 utility)
- [ ] 3.5.9: Mobile responsive — device toggle switches to vertical stack on small screens
- [ ] 3.5.10: Test with various HTML newsletter layouts

**Stitch refs:** `preview:_multi-device_toggle`, `preview:_accuracy_check`, `preview:_campaign_view`, `preview:_final_review_v1`

---

## Task 3.6: Template Library [NEW] [PRD]

**Complexity:** High
**Dependencies:** Task 1.4 (Pagination), Task 3.3 (Navigation update)

### PRD

**Goal:** Reduce time-to-first-newsletter by providing ready-to-use templates that match common newsletter objectives.

**Target User:** New or returning user who wants to create a newsletter but does not want to start from scratch.

**Success Metrics:**
- 40%+ of new newsletters created from templates within 30 days of feature launch
- Template users reach "sent" status 2x faster than blank-start users
- NPS score for template quality > 70

**Features:**
1. **Visual Categories** — Card grid browsable by category: Promotional, Educational, Curated, Company Update, Product Launch, Event Recap
2. **AI Recommendations** — "Recommended for you" section personalized by past newsletter topics and performance
3. **Performance-Based Ranking** — Templates sorted by avg open/click rate of newsletters created from them
4. **Goal-Oriented Selection** — Filter by objective: Grow subscribers, Drive clicks, Re-engage, Inform
5. **Preview and Use** — Click template then full-content preview modal then "Use this template" creates new newsletter prefilled

**Data Model:**
```sql
CREATE TABLE newsletter_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  goal_tags TEXT[] DEFAULT '{}',
  content_html TEXT NOT NULL,
  content_json JSONB,
  thumbnail_url TEXT,
  is_system BOOLEAN DEFAULT true,
  tenant_id UUID REFERENCES tenants(id),
  usage_count INTEGER DEFAULT 0,
  avg_open_rate DECIMAL(5,2),
  avg_click_rate DECIMAL(5,2),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE newsletters ADD COLUMN template_id UUID REFERENCES newsletter_templates(id);
```

**Seed Data:** 12 system templates covering all categories.

**Out of Scope:** Template editor/builder, custom template creation by users (v2), drag-and-drop template customization

### Subtasks
- [ ] 3.6.1: Create DB migration: `newsletter_templates` table + `template_id` column on `newsletters`
- [ ] 3.6.2: Create seed data: 12 system templates with HTML content, descriptions, categories, goal tags
- [ ] 3.6.3: Add shared types: `NewsletterTemplate` interface in `packages/shared`
- [ ] 3.6.4: Create `pages/TemplatesPage.tsx` with:
  - Category filter tabs across top
  - Goal filter pills (Grow, Drive clicks, Re-engage, Inform)
  - Card grid: thumbnail, name, category badge, usage count, avg performance
- [ ] 3.6.5: Build template preview modal (using Dialog) — full HTML preview + metadata
- [ ] 3.6.6: Build "Use this template" flow — creates new newsletter with `template_id`, prefilled content
- [ ] 3.6.7: Create edge function `recommend-templates`:
  - Input: `{ tenant_id }`
  - Output: ranked template IDs based on tenant's newsletter history topics and engagement
- [ ] 3.6.8: Build "Recommended for you" section consuming recommendation API
- [ ] 3.6.9: Build performance sorting — query aggregated stats of newsletters using each template
- [ ] 3.6.10: Add `api.ts` wrapper: `getTemplates()`, `recommendTemplates()`, `useTemplate()`
- [ ] 3.6.11: Add route `/templates` in App.tsx, add to sidebar navigation
- [ ] 3.6.12: Add pagination (Task 1.4) for template grid
- [ ] 3.6.13: Mobile responsive — 1-column cards on mobile, 2-column on tablet, 3+ on desktop
- [ ] 3.6.14: Add empty state for categories with no templates

**Stitch refs:** `templates:_visual_categories_v1`, `templates:_ai_recommendations_v2`, `templates:_performance_list_v3`, `templates:_goal-oriented_v4`

---

## Task 3.7: Scheduling — Calendar and AI Optimization [EXPAND] [PRD]

**Complexity:** High
**Dependencies:** Task 2.1 (Real data), Task 1.2 (Dialog)

### PRD

**Goal:** Help authors schedule newsletters at optimal times with a visual planning interface that prevents scheduling conflicts.

**Target User:** Active newsletter author sending 2+ newsletters per month who wants to plan their content calendar.

**Success Metrics:**
- 50%+ of sends are scheduled (vs immediate send)
- Engagement improvement for AI-optimized send times vs manually chosen times
- Zero double-sends (conflict detection working)

**Features:**
1. **Calendar View** — Month/week toggle, newsletters as colored blocks, click date to schedule
2. **Visual Timeline** — Horizontal queue of upcoming sends, drag-to-reschedule
3. **AI Send Time** — "Suggest best time" analyzes past engagement by day/hour, highlights optimal slots
4. **Focused Task View** — Single-newsletter scheduling with timezone selector and recurrence rules
5. **Smart Queue** — Priority-ordered send list with conflict detection (warns < 1 hour gap)

**Data Model Changes:**
```sql
ALTER TABLE newsletters ADD COLUMN timezone TEXT DEFAULT 'UTC';
ALTER TABLE newsletters ADD COLUMN recurrence_rule TEXT;
ALTER TABLE newsletters ADD COLUMN recurrence_end_date TIMESTAMPTZ;
```

**Out of Scope:** Drag-to-reschedule in calendar (v2), recurring newsletter auto-generation, integration with external calendars (Google/Outlook)

### Subtasks
- [ ] 3.7.1: Create DB migration: add `timezone`, `recurrence_rule`, `recurrence_end_date` columns to `newsletters`
- [ ] 3.7.2: Add shared types: `SchedulingConfig`, `RecurrenceRule` in `packages/shared`
- [ ] 3.7.3: Create `pages/SchedulingPage.tsx` with calendar and timeline views
- [ ] 3.7.4: Build month calendar view component using CSS grid (no heavy calendar library):
  - Day cells with scheduled newsletter indicators
  - Click day to open schedule dialog
  - Color-code by status (draft, scheduled, sent)
- [ ] 3.7.5: Build week view variant with time slots
- [ ] 3.7.6: Build visual timeline component — horizontal scroll of upcoming sends
- [ ] 3.7.7: Create edge function `suggest-send-time`:
  - Input: `{ tenant_id }`
  - Output: `{ recommended_slots: [{ day, hour, confidence, reason }] }`
  - Analyzes `newsletter_stats` open rates by day/hour
- [ ] 3.7.8: Build AI send time UI — highlighted calendar slots with confidence indicators
- [ ] 3.7.9: Update schedule modal in editor with timezone dropdown and recurrence selector
- [ ] 3.7.10: Build conflict detection — warn when scheduling < 1 hour from another send
- [ ] 3.7.11: Add `api.ts` wrappers: `suggestSendTime()`, `getScheduledNewsletters()`
- [ ] 3.7.12: Add route `/scheduling` in App.tsx, add to sidebar navigation
- [ ] 3.7.13: Mobile responsive — calendar collapses to list view on small screens

**Stitch refs:** `scheduling:_ai_optimized_v1`, `scheduling:_calendar_view_v2`, `scheduling:_visual_timeline_v3_*`, `scheduling:_focused_task_v4`

---

# Phase 4: Growth and Engagement

Features that drive user engagement, content quality, and collaboration.

---

## Task 4.1: Brand Voice — Advanced UI [EXPAND] [PRD]

**Complexity:** High
**Dependencies:** Task 2.3 (Settings refactor)

### PRD

**Goal:** Enable users to define a distinctive brand voice that the AI consistently applies, moving beyond basic text descriptions to an interactive voice configuration system.

**Target User:** Content creator or marketing team that wants consistent brand voice across all AI-generated content.

**Success Metrics:**
- Voice profile completion rate > 70% (all sliders + archetype set)
- Playground usage > 3 previews per voice setup session
- User satisfaction with AI tone accuracy > 4/5

**Features:**
1. **Persona Builder** — Named personas with avatar, archetype cards (Educator, Entertainer, Authority, Storyteller, Analyst)
2. **Interactive Sliders** — Formality, Humor, Technicality, Energy (0-100 each)
3. **Archetype Picker** — Visual cards that pre-fill slider positions
4. **Tone Comparison** — Side-by-side: sample text vs AI-rewritten version
5. **Style Guide Generator** — Auto-generate downloadable brand style guide
6. **Interactive Playground** — Live text preview updating as sliders change

**Data Model Changes:**
```sql
ALTER TABLE voice_profiles ADD COLUMN archetype TEXT;
ALTER TABLE voice_profiles ADD COLUMN formality INTEGER DEFAULT 50;
ALTER TABLE voice_profiles ADD COLUMN humor INTEGER DEFAULT 50;
ALTER TABLE voice_profiles ADD COLUMN technicality INTEGER DEFAULT 50;
ALTER TABLE voice_profiles ADD COLUMN energy INTEGER DEFAULT 50;
ALTER TABLE voice_profiles ADD COLUMN avatar_url TEXT;
```

**Out of Scope:** Multiple personas per newsletter section, voice analytics, competitor voice analysis

### Subtasks
- [ ] 4.1.1: Create DB migration: add voice profile columns
- [ ] 4.1.2: Create dedicated `pages/BrandVoicePage.tsx` (or large section in refactored Settings)
- [ ] 4.1.3: Build persona card component — avatar, name, archetype badge, edit/delete actions
- [ ] 4.1.4: Build archetype picker — 6 visual cards with icon, name, description; clicking pre-fills sliders
- [ ] 4.1.5: Build interactive sliders — 4 range inputs (Formality, Humor, Technicality, Energy) with labels at each end
- [ ] 4.1.6: Create edge function `preview-voice`:
  - Input: `{ sample_text, voice_config: { archetype, formality, humor, technicality, energy } }`
  - Output: `{ rewritten_text }`
- [ ] 4.1.7: Build tone comparison panel — input text left, AI output right, updates on slider change (debounced)
- [ ] 4.1.8: Build interactive playground — text area + "Preview" button showing voice-applied version
- [ ] 4.1.9: Create edge function `generate-style-guide`:
  - Input: `{ voice_profile_id }`
  - Output: `{ style_guide_html }` — vocabulary, tone rules, guidelines
- [ ] 4.1.10: Build style guide generator — "Generate Style Guide" button with downloadable output
- [ ] 4.1.11: Update `train-voice` edge function to accept slider values and archetype
- [ ] 4.1.12: Add `api.ts` wrappers: `previewVoice()`, `generateStyleGuide()`
- [ ] 4.1.13: Add route `/brand-voice` or update Settings navigation

**Stitch refs:** `brand_voice:_persona_builder`, `brand_voice:_interactive_sliders`, `brand_voice:_tone_&_archetype`, `brand_voice:_tone_comparison_v2`, `brand_voice:_style_guide_v3`, `brand_voice:_interactive_play_v4`

---

## Task 4.2: AI Training Progress [NEW]

**Complexity:** Medium
**Dependencies:** Task 4.1 (Voice UI location)

### Subtasks
- [ ] 4.2.1: Create `components/AITrainingProgress.tsx` — modal/overlay with:
  - Animated progress bar with percentage
  - Phase labels: "Analyzing writing samples" then "Learning patterns" then "Calibrating voice model"
  - ETA text
  - Completion animation (checkmark + success message)
- [ ] 4.2.2: Implement phased progress — either:
  - Option A: Frontend-simulated phases with timed transitions (simpler, no backend change)
  - Option B: Backend SSE stream from `train-voice` with real progress events
- [ ] 4.2.3: Replace current spinner in voice training with `AITrainingProgress` component
- [ ] 4.2.4: Add completion callback that refreshes voice profile data
- [ ] 4.2.5: Handle error state — show failure message with "Try again" button

**Stitch refs:** `ai_training_progress_1`, `ai_training_progress_2`, `ai_training_progress_3`

---

## Task 4.3: Global Search [NEW] [PRD]

**Complexity:** High
**Dependencies:** Task 1.2 (Dialog for command palette), existing RAG infrastructure

### PRD

**Goal:** Let users find any content across the platform instantly via a unified search interface.

**Target User:** Active user with 10+ newsletters and 20+ knowledge sources who needs to find specific content quickly.

**Success Metrics:**
- Search usage > 5 searches per active user per week
- Cmd+K adoption > 30% of searches
- Result click-through rate > 60%

**Features:**
1. **Command Palette** — Cmd/Ctrl+K overlay accessible from any page
2. **Dedicated Search Page** — Full results with faceted filters
3. **AI Semantic Search** — Natural language queries leveraging existing RAG embeddings
4. **Faceted Results** — Filter by type (Newsletter, Source, Template), status, date range
5. **Smart Suggestions** — AI-suggested queries and "quick add" from results
6. **Empty States** — Tips, suggested actions when no results

**Backend Design:**
- Edge function: `global-search`
- Input: `{ tenant_id, query, filters?: { types?, date_range?, status? }, limit? }`
- Output: `{ results: [{ type, id, title, snippet, relevance, date }], suggestions: string[] }`
- Search strategy: text search on newsletters + knowledge_sources, semantic search via existing rag-search, merge and rank

**Out of Scope:** Search analytics, saved searches, search within newsletter HTML content (full-text), real-time indexing

### Subtasks
- [ ] 4.3.1: Create `pages/SearchPage.tsx` with search input, filter sidebar, result grid
- [ ] 4.3.2: Create `components/ui/CommandPalette.tsx`:
  - Opens on Cmd/Ctrl+K
  - Text input with instant results
  - Arrow keys to navigate, Enter to select, Escape to close
  - Shows recent searches
- [ ] 4.3.3: Add global `keydown` listener in `DashboardLayout` for Cmd/Ctrl+K
- [ ] 4.3.4: Create edge function `global-search`:
  - Text search across newsletters and knowledge_sources
  - Semantic search via existing `rag-search` for source chunks
  - Merge, deduplicate, and rank results
  - Return unified result format
- [ ] 4.3.5: Build faceted filter UI — type pills, date range picker, status dropdown
- [ ] 4.3.6: Build result cards — type badge, title, snippet, date, "Open" action
- [ ] 4.3.7: Build empty state with search tips and suggested queries
- [ ] 4.3.8: Add shared types: `SearchResult`, `SearchRequest` in `packages/shared`
- [ ] 4.3.9: Add `api.ts` wrapper: `globalSearch()`
- [ ] 4.3.10: Add route `/search` in App.tsx
- [ ] 4.3.11: Add search icon to header bar in `DashboardLayout` (opens command palette)
- [ ] 4.3.12: Mobile: command palette becomes full-screen search overlay

**Stitch refs:** `search:_ai_semantic_search`, `search:_results_&_filters`, `search:_visual_discovery`, `search:_ai_suggestions_empty_state`

---

## Task 4.4: Social Editor — Thread Builder and Multi-Sync [EXPAND] [PRD]

**Complexity:** High
**Dependencies:** Task 2.5 (SocialMedia fixes)

### PRD

**Goal:** Transform the read-and-copy social output into a full editing suite where users can build threads, remix content per platform, and eventually cross-post.

**Target User:** Newsletter author who wants to promote their newsletter across social platforms.

**Success Metrics:**
- Social post edit rate > 50% (users customize generated posts)
- Thread builder usage for Twitter/Threads > 30%
- AI remix usage > 20% of social sessions

**Features:**
1. **Thread Builder** — For Twitter/Threads: add/remove/reorder tweets in a thread, per-tweet character count
2. **AI Remix** — "Remix for [platform]" button regenerates content optimized for specific platform format
3. **Multi-Sync** — Platform checkboxes + "Post to selected" (requires platform API integrations, Phase 2)
4. **Visual Focus** — Image/video attachment area per platform with upload and dimension guides
5. **Persistence** — Save edited posts to database

**Data Model:**
```sql
CREATE TABLE social_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  newsletter_id UUID REFERENCES newsletters(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  content_json JSONB NOT NULL,
  status TEXT DEFAULT 'draft',
  posted_at TIMESTAMPTZ,
  external_post_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

**Out of Scope:** Direct API posting to platforms (v2), analytics per social post, scheduling social posts

### Subtasks
- [ ] 4.4.1: Create DB migration: `social_posts` table
- [ ] 4.4.2: Add shared type: `SocialPost` in `packages/shared`
- [ ] 4.4.3: Build thread builder component for Twitter/Threads:
  - List of tweet cards with textarea per tweet
  - "Add tweet" button at bottom
  - Drag handle per tweet for reordering
  - Delete button per tweet
  - Per-tweet character count with over-limit warning
  - Thread numbering display
- [ ] 4.4.4: Create edge function `remix-social-post`:
  - Input: `{ content, source_platform, target_platform }`
  - Output: `{ remixed_content }`
- [ ] 4.4.5: Build AI Remix button per platform tab — calls remix function, shows loading, replaces content
- [ ] 4.4.6: Build persistence layer — save all posts to `social_posts` table on edit
- [ ] 4.4.7: Load saved posts on page visit instead of auto-generating
- [ ] 4.4.8: Build image/video attachment area per platform with dimension guide text
- [ ] 4.4.9: Build multi-sync UI — checkboxes per platform, "Post to all selected" button (disabled with "Coming soon")
- [ ] 4.4.10: Add `api.ts` wrappers: `saveSocialPosts()`, `remixSocialPost()`, `getSocialPosts()`
- [ ] 4.4.11: Add toast notifications for save/remix operations

**Stitch refs:** `social_editor:_ai_remix_v1`, `social_editor:_multi-sync_v2`, `social_editor:_thread_builder_v4_*`, `social_editor:_visual_focus_v3`

---

## Task 4.5: Performance Reports — AI Tips and Growth [EXPAND]

**Complexity:** Medium
**Dependencies:** Task 2.1 (Real data), Task 1.10 (Theme-aware colors)

### Subtasks
- [ ] 4.5.1: Create edge function `generate-performance-tips`:
  - Input: `{ tenant_id, date_range? }`
  - Output: `{ tips: [{ title, description, metric, improvement }] }`
  - Analyzes newsletter_stats: best day/time, subject line patterns, content length correlations
- [ ] 4.5.2: Build AI tips card section in AnalyticsPage — 3-5 actionable tips with icons
- [ ] 4.5.3: Build growth focus tab/section:
  - Subscriber growth trend chart (line chart over time)
  - Churn rate calculation and display
  - Audience segment breakdown (if segments exist)
- [ ] 4.5.4: Build newsletter comparison view — sortable table: newsletter title, open rate, click rate, unsubs
- [ ] 4.5.5: Build export report feature:
  - "Export as PDF" button
  - Create edge function `export-performance-report` generating formatted report
  - Download link
- [ ] 4.5.6: Add shared types: `PerformanceTip`, `PerformanceReport` in `packages/shared`
- [ ] 4.5.7: Add `api.ts` wrappers: `generatePerformanceTips()`, `exportPerformanceReport()`
- [ ] 4.5.8: Wire date range selector to filter all queries

**Stitch refs:** `performance_report:_ai_tips_v4`, `performance_report:_growth_focus_v2`, `performance_report:_minimalist_list_v3`

---

## Task 4.6: Team Management [NEW] [PRD]

**Complexity:** High
**Dependencies:** Task 1.2 (Dialog), Task 1.8 (Type cleanup)

### PRD

**Goal:** Enable collaborative newsletter creation by allowing account owners to invite team members with appropriate permissions.

**Target User:** Business/Pro tier account owner managing a content team of 2-10 people.

**Success Metrics:**
- Team feature adoption > 20% of Pro/Business accounts
- Average team size > 3 members within 60 days
- Multi-author newsletters > 15% of total output

**Features:**
1. **Team Overview** — Member list: name, email, role, last active, status
2. **Permissions Matrix** — Role to permission mapping (Owner, Admin, Editor, Viewer)
3. **Invitation Flow** — Email invite with role selection, shareable link, bulk CSV
4. **Shared Assets** — Team-shared voice profiles and knowledge sources

**Permissions Matrix:**
| Permission | Owner | Admin | Editor | Viewer |
|-----------|-------|-------|--------|--------|
| Manage team | Yes | Yes | No | No |
| Manage billing | Yes | No | No | No |
| Edit newsletters | Yes | Yes | Yes | No |
| Manage sources | Yes | Yes | Yes | No |
| View analytics | Yes | Yes | Yes | Yes |
| Manage API keys | Yes | Yes | No | No |
| Manage voice profiles | Yes | Yes | Yes | No |

**Data Model:**
```sql
CREATE TABLE team_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'member',
  invited_by UUID REFERENCES profiles(id),
  token TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ DEFAULT (now() + INTERVAL '7 days')
);

ALTER TABLE profiles ADD COLUMN last_active_at TIMESTAMPTZ;
```

**Out of Scope:** Real-time collaboration (Google Docs style), team activity feed, per-newsletter permissions

### Subtasks
- [ ] 4.6.1: Create DB migration: `team_invitations` table, `last_active_at` column on profiles
- [ ] 4.6.2: Define permission constants in `packages/shared`: `ROLE_PERMISSIONS` mapping
- [ ] 4.6.3: Add shared types: `TeamInvitation`, `Permission`, `RolePermissions`
- [ ] 4.6.4: Create edge function `manage-team`:
  - `invite`: create invitation, send email, return token
  - `revoke`: revoke pending invitation
  - `change-role`: update member role
  - `deactivate`: deactivate member profile
  - `list`: list all members and pending invitations
- [ ] 4.6.5: Create edge function `accept-invitation`: validate token, link profile to tenant
- [ ] 4.6.6: Create `pages/TeamPage.tsx` with:
  - Member list table (name, email, role badge, last active, status indicator)
  - Pending invitations section with resend/revoke actions
- [ ] 4.6.7: Build invite modal:
  - Email input (single invite)
  - Role selector dropdown (Admin, Editor, Viewer)
  - "Generate invite link" option
  - Bulk CSV upload variant
- [ ] 4.6.8: Build permissions display — read-only matrix showing what each role can do
- [ ] 4.6.9: Create `hooks/usePermissions.ts` — check current user's permissions, gate UI elements
- [ ] 4.6.10: Apply permission gating to existing pages (e.g., hide Settings billing tab for non-owners)
- [ ] 4.6.11: Add route `/team` in App.tsx, add to sidebar (visible to Owner/Admin only)
- [ ] 4.6.12: Add `api.ts` wrappers: `inviteTeamMember()`, `revokeInvitation()`, `changeRole()`, `getTeamMembers()`
- [ ] 4.6.13: Update `last_active_at` on profile via auth middleware or heartbeat

**Stitch refs:** `team_management:_overview`, `team_management:_permissions`, `team_management:_invitations`, `invite_new_member_v1-v4`

---

# Phase 5: Platform and Polish

Features that complete the platform, add delight, and support growth.

---

## Task 5.1: Beta Lab [NEW]

**Complexity:** Medium

### Subtasks
- [ ] 5.1.1: Create DB tables: `beta_features`, `tenant_beta_features`, `beta_feature_votes`
- [ ] 5.1.2: Seed 8-10 initial beta features (can be placeholder/upcoming features)
- [ ] 5.1.3: Add shared types: `BetaFeature`, `TenantBetaFeature`
- [ ] 5.1.4: Create edge function `manage-beta-features`: list, toggle, vote
- [ ] 5.1.5: Create `hooks/useBetaFeatures.ts` — loads tenant feature flags, provides `isBetaEnabled(name)`
- [ ] 5.1.6: Create `pages/BetaLabPage.tsx`:
  - Feature toggle list with name, description, stability badge, toggle switch
  - Master toggle at top
  - Tier gating: locked features show upgrade CTA
  - Vote section: upvote/downvote per feature, sorted by votes
- [ ] 5.1.7: Add route `/beta-lab` in App.tsx, add to sidebar
- [ ] 5.1.8: Gate at least one existing feature behind a beta flag as proof-of-concept

**Stitch refs:** `beta_lab:_feature_toggles_v1`, `beta_lab:_master_toggle_v3`, `beta_lab:_stability_metrics_v2`, `beta_lab:_tiered_access_v4`

---

## Task 5.2: Feedback and Community Voting [NEW]

**Complexity:** Medium
**Dependencies:** Task 0.4 (AI Feedback fix), shares voting infra with Task 5.1

### Subtasks
- [ ] 5.2.1: Create DB tables: `ai_feedback`, `feature_requests`, `feature_votes`
- [ ] 5.2.2: Add shared types: `AIFeedbackRecord`, `FeatureRequest`
- [ ] 5.2.3: Upgrade `AIFeedback` component — persist ratings via `api.submitAIFeedback()` instead of console.log
  - Add detailed rubric: accuracy, tone, relevance, length (1-5 each)
- [ ] 5.2.4: Create edge function `manage-feedback`: submit feedback, submit feature request, vote
- [ ] 5.2.5: Create `pages/FeedbackPage.tsx`:
  - Quick feedback: emoji satisfaction input + optional text
  - Feature requests: list with upvote, sorted by votes, submit new request form
  - User's feedback history
- [ ] 5.2.6: Add route `/feedback` in App.tsx
- [ ] 5.2.7: Add "Give Feedback" link in sidebar footer
- [ ] 5.2.8: Add `api.ts` wrappers: `submitAIFeedback()`, `submitFeatureRequest()`, `voteFeatureRequest()`

**Stitch refs:** `feedback:_ai_performance_focus`, `feedback:_community_upvotes_v4`, `feedback:_minimalist_input_v3`, `feedback:_mood_&_details_v1`

---

## Task 5.3: Account Lifecycle [EXPAND] [PRD]

**Complexity:** High (combined)
**Dependencies:** Task 0.5 (Reset password route), Task 1.2 (Dialog)

### PRD

**Goal:** Support the full account lifecycle: passwordless login, account deletion with data export, and reactivation for returning users.

**Target Users:**
- 5.3a Delete: User leaving the platform — give them data portability and a clean exit
- 5.3b Reactivate: Former user returning — restore context quickly
- 5.3c Magic Link: User who prefers passwordless auth
- 5.3d Biometric: Power user on supported device

**Data Model:**
```sql
ALTER TABLE profiles ADD COLUMN is_deactivated BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN deactivated_at TIMESTAMPTZ;

CREATE TABLE exit_surveys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  reason TEXT NOT NULL,
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### 5.3a: Delete Account Flow
- [ ] 5.3a.1: Create `pages/DeleteAccountPage.tsx` with 4-step wizard:
  - Step 1: Export data button (download ZIP of newsletters, sources, analytics)
  - Step 2: Exit survey (multiple choice + optional comment)
  - Step 3: Type "DELETE" to confirm
  - Step 4: Processing then goodbye screen then redirect to landing
- [ ] 5.3a.2: Create edge function `export-user-data`:
  - Gathers all newsletters, knowledge sources, analytics for tenant
  - Returns as downloadable JSON/ZIP
- [ ] 5.3a.3: Create edge function `delete-account`:
  - Stores exit survey
  - Soft-delete: set `is_deactivated = true`, `deactivated_at = now()`
  - Hard-delete option: cascade delete all tenant data after 30-day grace period
- [ ] 5.3a.4: Add DB migration: exit_surveys table, profile columns
- [ ] 5.3a.5: Add route or Settings sub-section for account deletion

### 5.3b: Reactivate Account Flow
- [ ] 5.3b.1: Create `pages/ReactivatePage.tsx` with steps:
  - Welcome back with account summary
  - Plan selection
  - Email re-verification
  - Context restoration (show recent drafts, sources)
- [ ] 5.3b.2: Modify auth flow: detect deactivated profile then redirect to reactivation
- [ ] 5.3b.3: Create edge function: `reactivate-account` — unset deactivation flags, restore data

### 5.3c: Magic Link Login
- [ ] 5.3c.1: Add "Sign in with email link" button to LoginPage
- [ ] 5.3c.2: Call `supabase.auth.signInWithOtp({ email })` for passwordless flow
- [ ] 5.3c.3: Handle OTP callback in AuthCallbackPage (already handles OAuth, extend for OTP)
- [ ] 5.3c.4: Add success state: "Check your email for a sign-in link"

### 5.3d: Biometric Login (Stretch Goal)
- [ ] 5.3d.1: Research WebAuthn/FIDO2 integration with Supabase Auth
- [ ] 5.3d.2: Add "Set up biometric login" option in Settings
- [ ] 5.3d.3: Register credential via `navigator.credentials.create()`
- [ ] 5.3d.4: Login via `navigator.credentials.get()` — fallback to email/password

**Stitch refs:** `delete_account:_*`, `reactivate:_*`, `login:_magic_link_v3`, `login:_biometric_entry_v2`

---

## Task 5.4: What's New / Changelog [NEW]

**Complexity:** Medium

### Subtasks
- [ ] 5.4.1: Create DB tables: `changelog_entries`, `changelog_reads`
- [ ] 5.4.2: Add shared type: `ChangelogEntry`
- [ ] 5.4.3: Create `pages/WhatsNewPage.tsx`:
  - Feature cards with title, description, screenshot, date, version tag
  - Chronological timeline grouped by release
  - Video embed section for walkthroughs
- [ ] 5.4.4: Build "New" badge on sidebar nav item — shows when unread entries exist
- [ ] 5.4.5: Mark entries as read on page visit
- [ ] 5.4.6: Seed initial changelog entries for existing features
- [ ] 5.4.7: Add route `/whats-new` in App.tsx, add to sidebar
- [ ] 5.4.8: Add admin-only edge function for creating/editing entries (or manage via DB seeds)

**Stitch refs:** `what's_new:_feature_cards_v1`, `what's_new:_update_timeline_v2`, `what's_new:_story_format_v4`, `what's_new:_video_recap_v3`

---

## Task 5.5: Maintenance and Network Error Pages [NEW]

**Complexity:** Medium

### Subtasks
- [ ] 5.5.1: Create `components/MaintenancePage.tsx`:
  - Wizard-themed illustration
  - Variant messages: "AI Recalibrating", "Magic Recharging"
  - ETA display + auto-refresh countdown
  - "Check again" manual button
- [ ] 5.5.2: Create `components/NetworkErrorBanner.tsx`:
  - Detect online/offline via `navigator.onLine` and `online`/`offline` events
  - Show banner when offline with auto-retry countdown
  - Dismiss when back online
- [ ] 5.5.3: Add network error banner to `DashboardLayout` (global)
- [ ] 5.5.4: Redesign ErrorBoundary with branded styling:
  - Wizard-themed "Something went wrong" page
  - "Go to dashboard" and "Report issue" buttons
  - Stack trace hidden behind "Show details" toggle
- [ ] 5.5.5: Trigger maintenance page when API returns 503
- [ ] 5.5.6: CSS-only animations for all illustrations

**Stitch refs:** `maintenance:_ai_recalibrating_v2`, `maintenance:_magic_recharging_v1`, `network:_auto-retry_hourglass_v3`, `network:_lightning_bolt_warning_v2`

---

## Task 5.6: Success / Completion States [NEW]

**Complexity:** Low

### Subtasks
- [ ] 5.6.1: Create reusable `components/SuccessScreen.tsx`:
  - Confetti animation (CSS particles or lightweight lib)
  - Customizable title, message, illustration
  - Primary CTA button + secondary action links
  - Stats display area (recipient count, etc.)
- [ ] 5.6.2: Build "Newsletter Sent" variant — confetti + "on its way!" + recipient count
- [ ] 5.6.3: Build "Next Steps" section: View analytics, Create another, Generate social posts
- [ ] 5.6.4: Build social sharing prompt: "Share that you published!" with platform links
- [ ] 5.6.5: Route to success screen after newsletter send completes (replace current green banner)
- [ ] 5.6.6: Make component reusable for other events (source processed, voice trained)

**Stitch refs:** `success:_newsletter_sent_v1`, `success:_next_steps_focus`, `success:_social_sharing_focus`, `success:_wizard_theme_v4`

---

## Task 5.7: Referral Program [NEW]

**Complexity:** Medium

### Subtasks
- [ ] 5.7.1: Create DB tables: `referral_codes`, `referrals`, `referral_rewards`
- [ ] 5.7.2: Add shared types: `ReferralCode`, `Referral`, `ReferralReward`
- [ ] 5.7.3: Create edge function `manage-referrals`: generate code, track, grant rewards
- [ ] 5.7.4: Modify signup flow: accept `?ref=CODE` query param, link referral
- [ ] 5.7.5: Create `pages/ReferralPage.tsx`:
  - Unique referral link with copy button
  - Reward tiers progress tracker (1 referral, 5, 10)
  - Leaderboard: top referrers with badges
  - Direct invite: email input to send referral
  - Stats: total sent, converted, rewards earned
- [ ] 5.7.6: Add route `/referral` in App.tsx, add to sidebar or Settings
- [ ] 5.7.7: Add `api.ts` wrappers: `getReferralCode()`, `getReferralStats()`, `sendReferralInvite()`

**Stitch refs:** `referral:_give_&_get_v1`, `referral:_tiered_rewards_v2`, `referral:_leaderboard_focus_v3`, `referral:_direct_invites_v4`

---

## Task 5.8: Press Kit [NEW]

**Complexity:** Low

### Subtasks
- [ ] 5.8.1: Create `pages/PressKitPage.tsx`:
  - Logo downloads (SVG, PNG variants)
  - App screenshot gallery
  - Brand color palette with hex codes
  - Typography reference
  - Boilerplate description copy
  - Media contact info
  - "Download all" ZIP button
- [ ] 5.8.2: Create brand assets and store in Supabase Storage or `/public` directory
- [ ] 5.8.3: Add route `/press` in App.tsx — OUTSIDE ProtectedRoute (public page)
- [ ] 5.8.4: Style with brand design language

**Stitch refs:** `press_kit:_media_assets_v1`, `press_kit:_visual_story_v2`, `press_kit:_resource_list_v3`

---

## Task 5.9: Thank You / Session Summary [NEW]

**Complexity:** Medium

### Subtasks
- [ ] 5.9.1: Create `contexts/SessionMetricsContext.tsx`:
  - Track: newsletters created/edited, sources added, AI generations used, session start time
  - Increment counters via context methods called from relevant pages
- [ ] 5.9.2: Create `components/SessionSummary.tsx`:
  - Productivity stats display
  - Personalized goodbye message
  - Wizard illustration
  - "Save drafts" / "Schedule pending" quick action links
  - Dismiss button to continue working
- [ ] 5.9.3: Show session summary when user clicks "Sign Out" (before actual sign-out)
- [ ] 5.9.4: Add session metrics provider to App.tsx component tree
- [ ] 5.9.5: Wire increment calls into newsletter create, source add, AI generate actions

**Stitch refs:** `thank_you:_session_summary_v2`, `thank_you:_magical_goodbye_v1`, `thank_you:_community_focus_v3`

---

# Cross-Cutting Concerns

These apply across all phases and should be kept in mind throughout development.

---

## App.tsx Route Additions

Every task adding a new page needs a lazy import + `<Route>` in `App.tsx`.

| Task | Route | Protected? |
|------|-------|-----------|
| 0.5 | `/auth/reset-password` | No (public) |
| 3.2 | `/onboarding` | Yes |
| 3.6 | `/templates` | Yes |
| 3.7 | `/scheduling` | Yes |
| 4.3 | `/search` | Yes |
| 4.6 | `/team` | Yes |
| 5.1 | `/beta-lab` | Yes |
| 5.2 | `/feedback` | Yes |
| 5.3a | `/settings/delete-account` | Yes |
| 5.3b | `/reactivate` | Semi (deactivated users) |
| 5.4 | `/whats-new` | Yes |
| 5.7 | `/referral` | Yes |
| 5.8 | `/press` | **No (public)** |

---

## DashboardLayout Navigation Master Plan

Final sidebar structure (after all phases complete):

**Primary:**
1. Dashboard
2. Knowledge Base
3. Newsletters
4. Templates (Task 3.6)
5. Analytics

**Secondary (divider above):**
6. Scheduling (Task 3.7)
7. Team (Task 4.6, Owner/Admin only)
8. Beta Lab (Task 5.1)
9. Referrals (Task 5.7)
10. What's New (Task 5.4, with unread badge)
11. Settings

**Removed:** Partner Portal (moved under Settings), Create (replaced by prominent "Create Newsletter" button above nav)

---

## api.ts Modularization

As new edge functions are added (~15 new functions), split `api.ts` into modules:
- `api/core.ts` — callEdgeFunction, ApiError (shared infrastructure)
- `api/content.ts` — processSource, ragSearch, generateContent, uploadDocument
- `api/newsletter.ts` — sendMailchimp, sendConvertKit, generateSocialPosts
- `api/voice.ts` — trainVoice, previewVoice, generateStyleGuide
- `api/search.ts` — globalSearch
- `api/team.ts` — inviteTeamMember, revokeInvitation, changeRole, getTeamMembers
- `api/analytics.ts` — generatePerformanceTips, exportPerformanceReport, suggestSendTime
- `api/index.ts` — re-export all for backwards compatibility

---

## Shared Package Type Additions

Types needed in `packages/shared/src/index.ts` by phase:

| Phase | Types |
|-------|-------|
| 1 | (Type cleanup only — no new types) |
| 3 | `NewsletterTemplate`, `SchedulingConfig`, `RecurrenceRule` |
| 4 | `VoiceProfile` (move from SettingsPage), `SearchResult`, `SearchRequest`, `SocialPost`, `PerformanceTip`, `PerformanceReport`, `TeamInvitation`, `Permission`, `RolePermissions` |
| 5 | `BetaFeature`, `TenantBetaFeature`, `AIFeedbackRecord`, `FeatureRequest`, `ChangelogEntry`, `ReferralCode`, `Referral`, `ReferralReward` |

---

## Inter-Task Dependencies

```
Phase 0 (all) --> Phase 1 (all) --> Phase 2 (all) --> Phase 3+

Task 0.1 (HTML sanitization) --> Task 3.5 (Preview uses sanitized HTML)
Task 0.4 (AI Feedback fix) --> Task 5.2 (Feedback persistence)
Task 0.5 (Reset password) --> Task 5.3c (Magic link, same auth area)
Task 1.1 (Toast adoption) --> every subsequent task uses toasts
Task 1.2 (Dialog component) --> Tasks 3.2, 3.4, 3.5, 3.6, 3.7, 4.3, 4.6, 5.3
Task 1.4 (Pagination) --> Tasks 3.4, 3.6, 4.5
Task 1.8 (Type cleanup) --> all new shared types
Task 2.1 (Real data) --> Tasks 3.7, 4.5 (need real stats)
Task 2.2 (Editor refactor) --> Task 3.5 (Preview redesign)
Task 2.3 (Settings refactor) --> Task 4.1 (Brand voice in settings area)
Task 2.5 (Social fixes) --> Task 4.4 (Social editor expansion)
Task 4.1 (Brand voice) --> Task 4.2 (Training progress UI location)
Task 5.1 (Beta Lab voting) <--> Task 5.2 (Feedback voting) — share DB patterns
```

---

## Summary — Task Count by Phase

| Phase | Tasks | Complexity |
|-------|-------|------------|
| Phase 0: Critical Fixes | 8 | Low-Medium (all targeted fixes) |
| Phase 1: Foundation | 10 | Low-Medium (infrastructure) |
| Phase 2: Page Improvements | 11 | Low-High (mostly Medium) |
| Phase 3: Core Features | 7 | Medium-High |
| Phase 4: Growth and Engagement | 6 | Medium-High |
| Phase 5: Platform and Polish | 9 | Low-High |
| **Total** | **51 tasks, ~280 subtasks** | |
