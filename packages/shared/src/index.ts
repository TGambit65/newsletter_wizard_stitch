// Shared types for Newsletter Wizard

export type SubscriptionTier = 'free' | 'creator' | 'pro' | 'business';

export const TIER_LIMITS: Record<SubscriptionTier, { sources: number; newsletters: number; aiGenerations: number; price: number }> = {
  free: { sources: 10, newsletters: 5, aiGenerations: 50, price: 0 },
  creator: { sources: 50, newsletters: 25, aiGenerations: 250, price: 39 },
  pro: { sources: 200, newsletters: 100, aiGenerations: 1000, price: 99 },
  business: { sources: 1000, newsletters: 500, aiGenerations: 5000, price: 249 },
};

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  subscription_tier: SubscriptionTier;
  max_sources: number;
  max_newsletters_per_month: number;
  max_ai_generations_per_month: number;
  settings: Record<string, unknown>;
  created_at: string;
}

export interface Profile {
  id: string;
  tenant_id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  role: string;
  timezone: string;
  is_active: boolean;
  created_at: string;
}

export type SourceType = 'url' | 'document' | 'manual' | 'youtube' | 'rss' | 'gdrive';
export type SourceStatus = 'pending' | 'processing' | 'ready' | 'error';

export interface KnowledgeSource {
  id: string;
  tenant_id: string;
  source_type: SourceType;
  source_uri: string | null;
  title: string;
  description: string | null;
  status: SourceStatus;
  error_message: string | null;
  token_count: number;
  chunk_count: number;
  file_path?: string | null;
  file_size?: number | null;
  mime_type?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Newsletter {
  id: string;
  tenant_id: string;
  title: string;
  subject_line: string | null;
  preheader: string | null;
  content_html: string | null;
  content_json: Record<string, unknown> | null;
  status: 'draft' | 'generating' | 'review' | 'scheduled' | 'sending' | 'sent';
  scheduled_at: string | null;
  sent_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface NewsletterStats {
  id: string;
  newsletter_id: string;
  total_sent: number;
  unique_opens: number;
  open_rate: number;
  unique_clicks: number;
  click_rate: number;
  unsubscribes: number;
}

export interface SourceChunk {
  id: string;
  source_id: string;
  tenant_id: string;
  chunk_index: number;
  content: string;
  token_count: number;
  embedding?: number[];
}

export interface RAGSearchResult {
  chunk_id: string;
  source_id: string;
  source_title: string;
  content: string;
  similarity: number;
}

export interface ProcessSourceRequest {
  source_id: string;
  source_type: SourceType;
  content?: string;
  url?: string;
  file_path?: string;
}

export interface GenerateContentRequest {
  tenant_id: string;
  topic: string;
  context: RAGSearchResult[];
  voice_profile_id?: string;
}

export interface GenerateContentResponse {
  title: string;
  subject_line: string;
  content_html: string;
  citations: { chunk_id: string; text: string }[];
}
