# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Dev Commands

```bash
# Install dependencies (pnpm 9.0.0+ required)
pnpm install

# Development (runs all workspaces via Turbo)
pnpm dev

# Build everything
pnpm build

# Lint
pnpm lint

# Type-check shared package
cd packages/shared && pnpm type-check
```

### Web App (apps/web)

```bash
cd apps/web

pnpm dev              # Vite dev server on localhost:5173
pnpm build            # tsc -b && vite build
pnpm build:prod       # Production build (disables source-identifier plugin)
pnpm lint             # ESLint

# Testing
pnpm test             # Vitest (single run)
pnpm test:watch       # Vitest (watch mode)
pnpm test:coverage    # Vitest with v8 coverage
pnpm test:e2e         # Playwright (Chromium, requires dev server running)
pnpm test:e2e:ui      # Playwright interactive UI
```

### Supabase Edge Functions

Edge functions run on Deno runtime. They are deployed to Supabase, not run locally via pnpm. JWT verification is disabled in `supabase/config.toml` for most functions — auth is handled in function code via API key validation or service role checks.

## Architecture

This is a **multi-tenant SaaS** for AI-powered newsletter creation. The monorepo has three workspaces:

### apps/web — React SPA (Vite)

- **UI**: shadcn/ui (Radix primitives) + Tailwind CSS + dark mode via CSS variables
- **Editor**: TipTap for rich text newsletter editing
- **Routing**: React Router DOM with lazy-loaded pages wrapped in `<Suspense>`
- **State**: React Context API — `AuthContext` (user/tenant/session) and `WhiteLabelContext` (per-tenant branding)
- **API calls**: `src/lib/api.ts` wraps all Supabase Edge Function invocations with retry logic (3 retries, exponential backoff, 30s timeout)
- **Supabase client**: `src/lib/supabase.ts` — direct DB queries from frontend use this client
- **Draft persistence**: localStorage keyed by `wizard_draft_${tenant_id}`
- **Path alias**: `@/*` maps to `./src/*`

### packages/shared — TypeScript types

Exports shared DTOs: `Newsletter`, `KnowledgeSource`, `SourceChunk`, `Tenant`, `Profile`, `SubscriptionTier`, `TIER_LIMITS`, and request/response types used by both frontend and edge functions.

### supabase/functions — 18 Deno Edge Functions

Core pipeline:
1. **process-source** — Ingests documents (DOCX/PDF/TXT/URL/RSS/YouTube), chunks text, counts tokens, stores in `source_chunks`
2. **rag-search** — Vector similarity search (OpenAI `text-embedding-3-small`) with keyword fallback
3. **generate-content** — LLM generation using RAG context, supports both OpenAI and Anthropic
4. **train-voice** — Builds brand voice profiles from tone examples

Distribution:
- **send-mailchimp** / **send-convertkit** / **send-newsletter** — Email campaign dispatch
- **generate-social-posts** — Multi-platform social content (Twitter/LinkedIn/Instagram/TikTok)
- **trigger-webhook** — Event dispatch to subscriber URLs

Infrastructure:
- **validate-api-key** — SHA-256 hash lookup, rate limiting (sliding 1hr window), permission checks
- **manage-api-keys** / **manage-webhooks** — CRUD endpoints (JWT auth)
- **log-audit** — Security event logging
- **calculate-billing** — Monthly usage aggregation (cron)
- **manage-sub-tenants** — Multi-tenant user management

All functions set standard CORS headers (`Access-Control-Allow-Origin: *`) and security headers (nosniff, DENY framing, XSS protection).

## Data Model

Tenant isolation is enforced via `tenant_id` on all tables with Row-Level Security. Key relationships:

- **tenants** → has many **profiles** (users with roles: owner/admin/member)
- **tenants** → has many **knowledge_sources** (status: pending→processing→ready/error)
- **knowledge_sources** → has many **source_chunks** (with vector embeddings)
- **tenants** → has many **newsletters** (status: draft→generating→review→scheduled→sent)
- **newsletters** → has one **newsletter_stats** (opens, clicks, unsubscribes)
- **tenants** → has many **api_keys** (hashed, with permissions bitmask)
- **tenants** → has many **voice_profiles** (tone markers, vocabulary)

Database RPC: `match_chunks(query_embedding, match_tenant_id, match_count)` for vector similarity search.

## Auth Flow

Supabase Auth with JWT. `AuthContext` handles sign-in/sign-up/sign-out and auto-creates tenant + profile on signup. Protected routes redirect to `/login`; public routes redirect authenticated users to `/dashboard`.

API key auth is separate — external consumers pass `X-API-Key` header, validated via `validate-api-key` function against SHA-256 hashes in the `api_keys` table.

## Environment Variables

**Frontend** (`apps/web/.env`):
- `VITE_SUPABASE_URL` — Supabase project URL
- `VITE_SUPABASE_ANON_KEY` — Supabase anon/public key

**Edge Functions** (Supabase secrets):
- `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY` — Used for embeddings and LLM generation
- `ANTHROPIC_API_KEY` — Alternative LLM provider

**Build flag**: `BUILD_MODE=prod` disables the `vite-plugin-source-identifier` (which adds `data-matrix-*` attributes in dev).

## Testing

- **Unit/integration**: Vitest + React Testing Library, jsdom environment. Tests in `apps/web/src/__tests__/`. Setup file at `src/__tests__/setup.ts`.
- **E2E**: Playwright (Chromium only). Config expects dev server at `localhost:5173`. 2 retries in CI, screenshots on failure.
- **Edge function tests**: Located in `supabase/functions/__tests__/` and `supabase/functions/tests/`.

## Subscription Tiers

Defined in `packages/shared` — `TIER_LIMITS` maps each tier (free/creator/pro/business) to quotas for sources, newsletters per month, AI generations, and pricing. These limits are enforced in both frontend UI and edge functions.
