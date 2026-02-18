# UX Audit — Newsletter Wizard

Comprehensive UX analysis of every page and component in the current codebase. Each feature was evaluated across setup quality, usability, accessibility, mobile experience, edge cases, and error handling.

---

## Score Summary

| Page / Component | Score | Verdict |
|------------------|-------|---------|
| useTheme | 9/10 | Excellent — minor FOUC risk |
| Toast | 8/10 | Well-built but barely used by any page |
| ForgotPasswordPage | 7/10 | Missing reset-password route |
| Breadcrumbs | 7/10 | Missing route labels for some pages |
| HealthDashboard | 7/10 | Fake progress bars, inaccessible chart |
| LoginPage | 6/10 | Error message leakage, no white-label branding |
| NewslettersPage | 6/10 | No error handling, native confirm, no pagination |
| KnowledgeBasePage | 6/10 | Hover-only menus inaccessible, silent errors |
| ThemeSwitcher | 6/10 | Dropdown variant broken for keyboard/touch |
| MobileNavigation | 6/10 | No aria-label, no aria-current |
| AIFeedback | 6/10 | Feedback only goes to console.log, never persisted |
| GenerationHistory | 6/10 | Ephemeral despite claiming 30-day retention |
| WizardPage | 5/10 | Mock data, raw HTML in textarea, Send step does not send |
| NewsletterEditorPage | 5/10 | AI Feedback unreachable (bug), XSS risk, no beforeunload |
| InlineAIMenu | 5/10 | No scroll handling, no Escape, no focus management |
| SocialMediaPage | 5/10 | Runtime crash risk, no persistence, auto-regenerates |
| EmbedWizardPage | 5/10 | postMessage security vuln, stuck on error |
| EmbedKnowledgeBasePage | 5/10 | No delete confirmation, postMessage security |
| AuthContext | 5/10 | Race condition, no profile reload on auth change |
| WhiteLabelContext | 5/10 | Not used by auth pages, CSS vars likely broken with Tailwind |
| SignUpPage | 5/10 | Partial creation failure, weak validation |
| AuthCallbackPage | 4/10 | Silent failures, perpetual spinner on error |
| ABTestPage | 4/10 | Results completely simulated, race condition bug |
| SettingsPage | 4/10 | Uses alert(), no loading state, many missing features |
| AnalyticsPage | 3/10 | ALL data fake/hardcoded |
| PartnerPortalPage | 3/10 | Silent errors, no save feedback, blank dashboard |

**Average Score: 5.5 / 10**

---

## Critical Issues (Must Fix)

### 1. BUG — AI Feedback Panel Unreachable
**File:** `NewsletterEditorPage.tsx`
**Severity:** Critical
**Description:** `showAIPanel` is set to `false` immediately after content generation completes. The `AIFeedback` component is rendered inside a conditional that checks `showAIPanel`. This means feedback can never be submitted — the panel disappears before the user can interact with it.
**Fix:** Separate the AI generation panel state from the AI feedback panel state. Keep feedback visible after generation completes.

### 2. SECURITY — XSS via Unsanitized HTML Rendering
**File:** `NewsletterEditorPage.tsx` (preview modal, compare view)
**Severity:** Critical
**Description:** AI-generated HTML content is rendered directly without any sanitization. Malicious content in knowledge sources could execute arbitrary JavaScript. All HTML must be sanitized with DOMPurify or equivalent before rendering.
**Fix:** Add DOMPurify as a dependency and sanitize all HTML before rendering in preview and compare views.

### 3. SECURITY — postMessage with Wildcard Origin
**Files:** `EmbedWizardPage.tsx`, `EmbedKnowledgeBasePage.tsx`
**Severity:** Critical
**Description:** Both embed pages use `window.parent.postMessage(data, '*')` which broadcasts messages to any origin. An attacker could embed the page and intercept all messages.
**Fix:** Accept a `targetOrigin` parameter and validate against it. Never use `'*'` in production.

### 4. BUG — Missing /auth/reset-password Route
**Files:** `AuthContext.tsx`, `App.tsx`
**Severity:** Critical
**Description:** `AuthContext.resetPassword()` calls `supabase.auth.resetPasswordForEmail()` with `redirectTo` pointing to `/auth/reset-password`, but this route does not exist in App.tsx. Users who click the password reset link get a 404.
**Fix:** Add the route to App.tsx with a ResetPasswordPage component.

### 5. FAKE DATA — Mock Data Displayed as Real
**Files:** `DashboardPage.tsx`, `AnalyticsPage.tsx`, `WizardPage.tsx`, `ABTestPage.tsx`
**Severity:** Critical
**Description:** Hardcoded mock data is displayed without any indication it is fake. AnalyticsPage shows `avgOpenRate: 24.5`, `avgClickRate: 3.2`, `totalSubscribers: 1250` — all constants. DashboardPage has similar hardcoded stats. Users cannot distinguish real metrics from fabricated ones.
**Fix:** Either connect to real data sources or clearly label mock data with a banner/watermark.

### 6. BUG — AuthContext Race Condition
**File:** `AuthContext.tsx`
**Severity:** High
**Description:** The `onAuthStateChange` listener only updates the session state. It does not call `loadProfileAndTenant()`, so after a token refresh or tab re-focus, the profile and tenant data can be stale or null.
**Fix:** Call `loadProfileAndTenant()` inside `onAuthStateChange` when the event is `SIGNED_IN` or `TOKEN_REFRESHED`.

### 7. BUG — Partial Signup Failure
**File:** `AuthContext.tsx`
**Severity:** High
**Description:** During signup, the auth user is created first via `supabase.auth.signUp()`. Then tenant and profile are created via separate client-side calls. If either of those fail, the user exists in auth but has no tenant/profile — a broken state with no rollback.
**Fix:** Move tenant/profile creation to a server-side function triggered by auth webhook, or implement client-side rollback.

---

## High-Priority Issues

### 8. Toast System Unused
**Severity:** High (UX)
**Description:** A well-implemented Toast component (8/10 quality) exists with success/error/warning variants and auto-dismiss. However, almost every page uses `console.error()` or `alert()` for error feedback. Users see no feedback when operations fail.
**Pages affected:** SettingsPage (alert), KnowledgeBasePage (silent), NewsletterEditorPage (silent), SocialMediaPage (silent), PartnerPortalPage (silent), ABTestPage (silent)
**Fix:** Replace all `console.error` catch blocks and `alert()` calls with toast notifications.

### 9. No Modal Accessibility
**Severity:** High (A11Y)
**Description:** No modal or dialog in the entire application implements focus trapping, `role="dialog"`, `aria-modal="true"`, or Escape key handling. Users navigating with keyboard or screen readers cannot properly interact with modals.
**Components affected:** Newsletter preview modal, delete confirmation dialogs, settings panels, editor overlays, all dropdown menus
**Fix:** Create a reusable Modal/Dialog component with proper ARIA attributes and focus management. Apply to all existing modals.

### 10. No Beforeunload Handler
**Severity:** High (Data Loss)
**Description:** No page in the application warns users about unsaved changes when closing or navigating away. The editor has autosave (3s debounce) but changes made in the last 3 seconds before tab close are silently lost.
**Pages affected:** NewsletterEditorPage, SettingsPage (profile/voice edits), KnowledgeBasePage (manual source editing)
**Fix:** Add `beforeunload` event listener on pages with unsaved state. Track dirty state and warn before navigation.

---

## Medium-Priority Issues

### 11. No Pagination
**Description:** Every list view fetches all records without pagination. Newsletter list, knowledge sources, analytics history — all unbounded queries. Will cause performance degradation at scale.
**Fix:** Add cursor-based pagination to all list queries. Show page controls or infinite scroll.

### 12. Hover-Only Menus (KnowledgeBasePage)
**Description:** Source action menus (edit, delete) only appear on hover. Inaccessible on touch devices and to keyboard users.
**Fix:** Use a persistent kebab menu button with a dropdown, or show actions on focus.

### 13. SocialMediaPage Auto-Regenerates
**Description:** Opening the social media page triggers a fresh AI generation call every time, destroying any previous edits. No persistence layer for edited posts.
**Fix:** Cache generated posts. Only regenerate on explicit user action.

### 14. SocialMediaPage Crash Risk
**Description:** UI shows tabs for Reddit, Pinterest, Snapchat, but the API does not return data for these platforms. Accessing undefined properties will crash.
**Fix:** Add null checks, or remove tabs for unsupported platforms.

### 15. AuthCallbackPage Silent Failure
**Description:** If the OAuth callback fails, the page shows a perpetual loading spinner with no error message and no retry option. User is stuck.
**Fix:** Add timeout detection, show error state with retry button.

### 16. SettingsPage Monolithic State
**Description:** 22 `useState` calls in a single component with no loading indicators during save operations. Users get `alert()` on error and no feedback on success.
**Fix:** Extract tab contents into sub-components. Add loading/saving states per section.

### 17. WhiteLabelContext Not Applied to Auth Pages
**Description:** Login, SignUp, and ForgotPassword pages hardcode "Newsletter Wizard" branding and do not consume WhiteLabelContext. White-label customers see the wrong brand on all auth screens.
**Fix:** Wrap auth pages with WhiteLabelContext or pass brand config as props.

### 18. WhiteLabelContext CSS Variables vs Tailwind
**Description:** WhiteLabelContext sets CSS custom properties (`--primary-color`, etc.) but the app uses Tailwind utility classes (`bg-primary-500`). The CSS variables likely do not connect to Tailwind's color system.
**Fix:** Extend Tailwind config to reference CSS variables, or use inline styles for branded elements.

### 19. Error Message Information Leakage (LoginPage)
**Description:** Login errors pass raw Supabase error messages to the UI (e.g., "Invalid login credentials"). Some error messages may reveal whether an email exists in the system.
**Fix:** Normalize error messages to generic text like "Invalid email or password."

### 20. Dark Mode Color Hardcoding (AnalyticsPage)
**Description:** Chart colors are hardcoded as light-mode hex values. Charts are unreadable in dark mode.
**Fix:** Use theme-aware color tokens from the design system.

### 21. GenerationHistory Claims 30-Day Retention
**Description:** The component claims to keep 30 days of generation history, but stores everything in React state (in-memory). All history is lost on page refresh.
**Fix:** Either persist to localStorage/database, or remove the retention claim.

### 22. ThemeSwitcher Dropdown Accessibility
**Description:** The dropdown variant opens on click but has no keyboard navigation (Arrow keys, Enter/Space to select, Escape to close). Focus does not move into the dropdown.
**Fix:** Add proper keyboard event handlers and focus management.

### 23. ABTestPage Race Condition
**Description:** Multiple async operations (create test, update variants, start test) run in sequence. If any middle step fails, the test is left in a partially configured state.
**Fix:** Wrap multi-step operations in a transaction or add rollback logic.

### 24. PartnerPortalPage Blank State
**Description:** The partner dashboard shows an empty state with no guidance. API key section, webhook config, and embed settings all show nothing for new partners.
**Fix:** Add onboarding guidance, example configurations, and clear CTAs for each section.

### 25. NewsletterEditorPage State Complexity
**Description:** ~30 `useState` calls in a single 1100-line component. No state machine or reducer pattern. State interactions are difficult to reason about and prone to bugs.
**Fix:** Extract editor state into a reducer or state machine. Split the component into sub-components.

---

## Low-Priority Issues

### 26. Icon Buttons Missing aria-label
**Description:** Icon-only buttons (toolbar actions, close buttons, mobile menu toggle) have no accessible names. Screen readers announce them as "button" with no context.
**Affected:** Editor toolbar, sidebar close, mobile menu, all icon-only actions
**Fix:** Add `aria-label` to all icon-only buttons.

### 27. Breadcrumbs Missing Route Labels
**Description:** Some routes do not have corresponding labels in the breadcrumb config, resulting in raw path segments being displayed.
**Fix:** Add labels for all routes in the breadcrumb configuration.

### 28. HealthDashboard Fake Progress
**Description:** Progress bars show fabricated percentages. The component is useful as a concept but misleading if users think the data is real.
**Fix:** Connect to real health metrics or label as demo.

### 29. MobileNavigation Missing ARIA
**Description:** Bottom nav bar lacks `aria-label="Main navigation"` and active items do not have `aria-current="page"`.
**Fix:** Add proper ARIA attributes.

### 30. FOUC Risk in useTheme
**Description:** Theme is read from localStorage in a `useEffect`, which runs after initial render. Users may briefly see the wrong theme on page load.
**Fix:** Read theme from localStorage synchronously in the initial state, or use a blocking script in `index.html`.

---

## Recommendations

### Immediate Actions (Pre-Build)
Before implementing any new Stitch features, fix these foundation issues:
1. Fix AI Feedback panel bug (Issue #1)
2. Sanitize all unsanitized HTML rendering (Issue #2)
3. Fix postMessage security (Issue #3)
4. Add /auth/reset-password route (Issue #4)
5. Replace all alert()/console.error with toast notifications (Issue #8)
6. Fix AuthContext race condition (Issue #6)

### Architecture Improvements
These should be addressed as part of the build phase:
1. Create a reusable accessible Modal/Dialog component (Issue #9)
2. Add pagination infrastructure (Issue #11)
3. Add beforeunload handler utility (Issue #10)
4. Establish theme-aware color tokens for charts (Issue #20)
5. Extract SettingsPage and NewsletterEditorPage into sub-components (Issues #16, #25)

### Data Integrity
Before shipping to real users:
1. Replace all mock/hardcoded data with real Supabase queries (Issue #5)
2. Fix GenerationHistory persistence (Issue #21)
3. Add SocialMediaPage post persistence (Issue #13)
4. Fix partial signup failure (Issue #7)
