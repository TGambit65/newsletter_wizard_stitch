import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://pktxmwyinqdbkxnshzdf.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBrdHhtd3lpbnFkYmt4bnNoemRmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA4Njg0ODQsImV4cCI6MjA4NjQ0NDQ4NH0.zTJaWgfcqc5-vDM57Y5tQ8lNdg1wCrckY0l7g7PwFWs';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
export { supabaseUrl, supabaseAnonKey };

// All shared types are defined in @newsletter-wizard/shared (packages/shared/src/index.ts).
// Re-exported here for backwards compatibility — all existing `import { X } from '@/lib/supabase'`
// imports continue to work without change.
export { TIER_LIMITS } from '@newsletter-wizard/shared';
export type {
  SubscriptionTier,
  Tenant,
  Profile,
  SourceType,
  SourceStatus,
  KnowledgeSource,
  Newsletter,
  NewsletterStats,
  SourceChunk,
  RAGSearchResult,
  ProcessSourceRequest,
  GenerateContentRequest,
  GenerateContentResponse,
} from '@newsletter-wizard/shared';
