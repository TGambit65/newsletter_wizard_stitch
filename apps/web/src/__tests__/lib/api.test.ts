import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock the supabase module
vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: vi.fn(),
      getSession: vi.fn(),
    },
  },
  supabaseUrl: 'https://test.supabase.co',
  supabaseAnonKey: 'test-anon-key',
}));

// Import after mocking
import { api, processSource, ragSearch, generateContent, uploadDocument } from '@/lib/api';

describe('API Module', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('processSource', () => {
    it('calls edge function with correct parameters', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true, chunks: 5 }),
      });

      const result = await processSource({
        source_id: 'source-123',
        source_type: 'url',
        url: 'https://example.com',
      });

      expect(mockFetch).toHaveBeenCalledWith(
        'https://test.supabase.co/functions/v1/process-source',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer test-anon-key',
          },
        })
      );
      expect(result).toEqual({ success: true, chunks: 5 });
    });

    it('handles errors correctly', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: () => Promise.resolve({ error: { message: 'Invalid source' } }),
      });

      await expect(processSource({
        source_id: 'source-123',
        source_type: 'url',
      })).rejects.toThrow('Invalid source');
    });
  });

  describe('ragSearch', () => {
    it('returns search results', async () => {
      const mockResults = {
        results: [
          { chunk_id: '1', text: 'Result 1', similarity: 0.9 },
          { chunk_id: '2', text: 'Result 2', similarity: 0.8 },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResults),
      });

      const result = await ragSearch({
        tenant_id: 'tenant-123',
        query: 'test query',
        limit: 10,
      });

      expect(result.results).toHaveLength(2);
      expect(result.results[0].similarity).toBe(0.9);
    });
  });

  describe('generateContent', () => {
    it('generates newsletter content', async () => {
      const mockResponse = {
        title: 'Test Newsletter',
        subject_line: 'Check this out!',
        content_html: '<h1>Hello</h1>',
        citations: [{ chunk_id: '1', text: 'Source text' }],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await generateContent({
        tenant_id: 'tenant-123',
        topic: 'AI trends',
        context: [],
      });

      expect(result.title).toBe('Test Newsletter');
      expect(result.content_html).toContain('Hello');
    });
  });

  describe('uploadDocument', () => {
    it('uploads document successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          source: { id: 'source-456' },
          file_path: 'documents/test.pdf',
        }),
      });

      const result = await uploadDocument({
        fileData: 'base64data',
        fileName: 'test.pdf',
        mimeType: 'application/pdf',
        tenant_id: 'tenant-123',
      });

      expect(result.success).toBe(true);
      expect(result.source.id).toBe('source-456');
    });
  });

  describe('api object exports', () => {
    it('exports all API functions', () => {
      expect(api.processSource).toBeDefined();
      expect(api.ragSearch).toBeDefined();
      expect(api.generateContent).toBeDefined();
      expect(api.generateNewsletter).toBeDefined();
      expect(api.uploadDocument).toBeDefined();
      expect(api.trainVoice).toBeDefined();
      expect(api.sendMailchimp).toBeDefined();
      expect(api.sendConvertKit).toBeDefined();
      expect(api.generateSocialPosts).toBeDefined();
    });
  });
});
