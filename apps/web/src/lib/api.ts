import { supabase, supabaseUrl, supabaseAnonKey, SourceType, RAGSearchResult } from './supabase';

interface ProcessSourceRequest {
  source_id: string;
  source_type: SourceType;
  content?: string;
  url?: string;
  file_path?: string;
}

interface RAGSearchRequest {
  tenant_id: string;
  query: string;
  limit?: number;
}

interface GenerateContentRequest {
  tenant_id: string;
  topic: string;
  context: RAGSearchResult[];
  voice_profile_id?: string;
}

interface TrainVoiceRequest {
  voice_profile_id: string;
  training_samples: string[];
}

interface TrainVoiceResponse {
  success: boolean;
  tone_markers: Record<string, string>;
  vocabulary: Record<string, unknown>;
  voice_prompt: string;
}

interface SendMailchimpRequest {
  api_key: string;
  list_id: string;
  subject: string;
  from_name?: string;
  from_email?: string;
  content_html: string;
}

interface SendConvertKitRequest {
  api_secret: string;
  subject: string;
  content_html: string;
}

interface GenerateContentResponse {
  title: string;
  subject_line: string;
  content_html: string;
  citations: { chunk_id: string; text: string }[];
}

interface UploadDocumentRequest {
  fileData: string;
  fileName: string;
  mimeType: string;
  tenant_id: string;
}

interface UploadDocumentResponse {
  success: boolean;
  source: { id: string };
  file_path: string;
}

async function callEdgeFunction<T>(functionName: string, body: object): Promise<T> {
  // Use fetch with the anon key - proven to work via curl test
  const response = await fetch(`${supabaseUrl}/functions/v1/${functionName}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${supabaseAnonKey}`,
    },
    body: JSON.stringify(body),
  });

  const data = await response.json();
  
  if (!response.ok) {
    console.error(`Edge function ${functionName} error:`, data);
    throw new Error(data.error?.message || data.message || `Edge function error: ${response.status}`);
  }

  return data as T;
}

export async function processSource(request: ProcessSourceRequest): Promise<{ success: boolean; chunks?: number }> {
  return await callEdgeFunction('process-source', request);
}

export async function ragSearch(request: RAGSearchRequest): Promise<{ results: RAGSearchResult[] }> {
  return await callEdgeFunction('rag-search', request);
}

export async function generateContent(request: GenerateContentRequest): Promise<GenerateContentResponse> {
  return await callEdgeFunction('generate-content', request);
}

export async function uploadDocument(request: UploadDocumentRequest): Promise<UploadDocumentResponse> {
  return await callEdgeFunction('upload-document', request);
}

// Backwards compatibility
export async function generateNewsletter(request: GenerateContentRequest): Promise<GenerateContentResponse> {
  return generateContent(request);
}

export async function trainVoice(request: TrainVoiceRequest): Promise<TrainVoiceResponse> {
  return await callEdgeFunction('train-voice', request);
}

export async function sendMailchimp(request: SendMailchimpRequest): Promise<{ success: boolean; campaign_id: string }> {
  return await callEdgeFunction('send-mailchimp', request);
}

export async function sendConvertKit(request: SendConvertKitRequest): Promise<{ success: boolean; broadcast_id: string }> {
  return await callEdgeFunction('send-convertkit', request);
}

interface GenerateSocialPostsRequest {
  newsletter_content: string;
  newsletter_title: string;
}

interface GenerateSocialPostsResponse {
  success: boolean;
  posts: {
    twitter: { main_post: string; hashtags: string[]; thread?: string[] | null };
    linkedin: { post: string; hashtags: string[] };
    facebook: { post: string; cta: string };
    instagram: { caption: string; hashtags: string[]; image_suggestion: string };
    tiktok: { hook: string; script: string; video_prompt: string };
    youtube_shorts: { hook: string; script: string; video_prompt: string };
    threads: { post: string; hashtags: string[] };
  };
  ai_generated: boolean;
}

export async function generateSocialPosts(request: GenerateSocialPostsRequest): Promise<GenerateSocialPostsResponse> {
  return await callEdgeFunction('generate-social-posts', request);
}

export const api = {
  processSource,
  ragSearch,
  generateContent,
  generateNewsletter,
  uploadDocument,
  trainVoice,
  sendMailchimp,
  sendConvertKit,
  generateSocialPosts,
};
