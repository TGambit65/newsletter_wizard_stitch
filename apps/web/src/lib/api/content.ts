import { SourceType, RAGSearchResult } from '../supabase';
import { callEdgeFunction } from './core';

interface ProcessSourceRequest {
  source_id:   string;
  source_type: SourceType;
  content?:    string;
  url?:        string;
  file_path?:  string;
}

interface RAGSearchRequest {
  tenant_id: string;
  query:     string;
  limit?:    number;
}

export interface GenerateContentRequest {
  tenant_id:        string;
  topic:            string;
  context:          RAGSearchResult[];
  voice_profile_id?: string;
}

export interface GenerateContentResponse {
  title:        string;
  subject_line: string;
  content_html: string;
  citations:    { chunk_id: string; text: string }[];
}

interface UploadDocumentRequest {
  fileData:  string;
  fileName:  string;
  mimeType:  string;
  tenant_id: string;
}

interface UploadDocumentResponse {
  success:   boolean;
  source:    { id: string };
  file_path: string;
}

interface GenerateSocialPostsRequest {
  newsletter_content: string;
  newsletter_title:   string;
}

export interface GenerateSocialPostsResponse {
  success: boolean;
  posts: {
    twitter:        { main_post: string; hashtags: string[]; thread?: string[] | null };
    linkedin:       { post: string; hashtags: string[] };
    facebook:       { post: string; cta: string };
    instagram:      { caption: string; hashtags: string[]; image_suggestion: string };
    tiktok:         { hook: string; script: string; video_prompt: string };
    youtube_shorts: { hook: string; script: string; video_prompt: string };
    threads:        { post: string; hashtags: string[] };
  };
  ai_generated: boolean;
}

export async function processSource(request: ProcessSourceRequest): Promise<{ success: boolean; chunks?: number }> {
  return callEdgeFunction('process-source', request);
}

export async function ragSearch(request: RAGSearchRequest): Promise<{ results: RAGSearchResult[] }> {
  return callEdgeFunction('rag-search', request);
}

export async function generateContent(request: GenerateContentRequest): Promise<GenerateContentResponse> {
  return callEdgeFunction('generate-content', request);
}

export async function uploadDocument(request: UploadDocumentRequest): Promise<UploadDocumentResponse> {
  return callEdgeFunction('upload-document', request);
}

// Backwards compatibility alias
export async function generateNewsletter(request: GenerateContentRequest): Promise<GenerateContentResponse> {
  return generateContent(request);
}

export async function generateSocialPosts(request: GenerateSocialPostsRequest): Promise<GenerateSocialPostsResponse> {
  return callEdgeFunction('generate-social-posts', request);
}
