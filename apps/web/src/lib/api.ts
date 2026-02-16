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

// Error types for better user feedback
export class ApiError extends Error {
  code: string;
  retryable: boolean;
  
  constructor(message: string, code: string, retryable = false) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.retryable = retryable;
  }
}

// User-friendly error messages
const errorMessages: Record<string, string> = {
  'RATE_LIMIT': 'Too many requests. Please wait a moment and try again.',
  'NETWORK_ERROR': 'Network connection failed. Please check your internet connection.',
  'TIMEOUT': 'The request took too long. Please try again.',
  'AUTH_ERROR': 'Authentication failed. Please log in again.',
  'PROCESSING_FAILED': 'Processing failed. Please check your input and try again.',
  'GENERATION_FAILED': 'Content generation failed. Please try with different input.',
  'UNKNOWN': 'An unexpected error occurred. Please try again.',
};

async function callEdgeFunction<T>(
  functionName: string, 
  body: object,
  options: { maxRetries?: number; timeout?: number } = {}
): Promise<T> {
  const { maxRetries = 3, timeout = 30000 } = options;
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      
      const response = await fetch(`${supabaseUrl}/functions/v1/${functionName}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseAnonKey}`,
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);

      const data = await response.json();
      
      if (!response.ok) {
        const errorCode = data.error?.code || 'UNKNOWN';
        const isRetryable = response.status === 429 || response.status >= 500;
        
        // If rate limited, wait before retry
        if (response.status === 429 && attempt < maxRetries) {
          const retryAfter = parseInt(response.headers.get('Retry-After') || '5', 10);
          await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
          continue;
        }
        
        // If server error, retry with exponential backoff
        if (response.status >= 500 && attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
          continue;
        }
        
        const userMessage = errorMessages[errorCode] || data.error?.message || errorMessages['UNKNOWN'];
        throw new ApiError(userMessage, errorCode, isRetryable);
      }

      return data as T;
    } catch (error) {
      lastError = error as Error;
      
      // Handle abort/timeout
      if (error instanceof Error && error.name === 'AbortError') {
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 1000));
          continue;
        }
        throw new ApiError(errorMessages['TIMEOUT'], 'TIMEOUT', true);
      }
      
      // Handle network errors
      if (error instanceof TypeError && error.message.includes('fetch')) {
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
          continue;
        }
        throw new ApiError(errorMessages['NETWORK_ERROR'], 'NETWORK_ERROR', true);
      }
      
      // Re-throw ApiErrors
      if (error instanceof ApiError) {
        throw error;
      }
    }
  }
  
  // If all retries failed
  throw lastError || new ApiError(errorMessages['UNKNOWN'], 'UNKNOWN', false);
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
