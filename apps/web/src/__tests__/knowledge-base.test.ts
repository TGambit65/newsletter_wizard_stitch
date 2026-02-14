import { describe, it, expect } from 'vitest';

// Knowledge Base Source Type Tests
describe('Knowledge Base', () => {
  describe('Source Type Validation', () => {
    type SourceType = 'url' | 'document' | 'manual' | 'youtube' | 'gdrive' | 'rss';
    
    const validSourceTypes: SourceType[] = ['url', 'document', 'manual', 'youtube', 'gdrive', 'rss'];

    function isValidSourceType(type: string): type is SourceType {
      return validSourceTypes.includes(type as SourceType);
    }

    it('accepts valid source types', () => {
      expect(isValidSourceType('url')).toBe(true);
      expect(isValidSourceType('document')).toBe(true);
      expect(isValidSourceType('manual')).toBe(true);
      expect(isValidSourceType('youtube')).toBe(true);
      expect(isValidSourceType('gdrive')).toBe(true);
      expect(isValidSourceType('rss')).toBe(true);
    });

    it('rejects invalid source types', () => {
      expect(isValidSourceType('invalid')).toBe(false);
      expect(isValidSourceType('')).toBe(false);
      expect(isValidSourceType('video')).toBe(false);
    });
  });

  describe('URL Validation', () => {
    function isValidUrl(urlString: string): boolean {
      try {
        const url = new URL(urlString);
        return url.protocol === 'http:' || url.protocol === 'https:';
      } catch {
        return false;
      }
    }

    it('accepts valid URLs', () => {
      expect(isValidUrl('https://example.com')).toBe(true);
      expect(isValidUrl('http://example.com/path')).toBe(true);
      expect(isValidUrl('https://sub.domain.com/page?q=1')).toBe(true);
    });

    it('rejects invalid URLs', () => {
      expect(isValidUrl('not-a-url')).toBe(false);
      expect(isValidUrl('')).toBe(false);
      expect(isValidUrl('ftp://example.com')).toBe(false);
      expect(isValidUrl('file:///local/path')).toBe(false);
    });
  });

  describe('YouTube URL Parsing', () => {
    function extractYouTubeId(url: string): string | null {
      const patterns = [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
        /youtube\.com\/shorts\/([^&\n?#]+)/,
      ];
      
      for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match) return match[1];
      }
      return null;
    }

    it('extracts video ID from standard URLs', () => {
      expect(extractYouTubeId('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
      expect(extractYouTubeId('https://youtube.com/watch?v=abc123')).toBe('abc123');
    });

    it('extracts video ID from short URLs', () => {
      expect(extractYouTubeId('https://youtu.be/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
    });

    it('extracts video ID from embed URLs', () => {
      expect(extractYouTubeId('https://www.youtube.com/embed/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
    });

    it('extracts video ID from Shorts URLs', () => {
      expect(extractYouTubeId('https://www.youtube.com/shorts/abc123')).toBe('abc123');
    });

    it('returns null for invalid URLs', () => {
      expect(extractYouTubeId('https://vimeo.com/123456')).toBe(null);
      expect(extractYouTubeId('not-a-url')).toBe(null);
    });
  });

  describe('RSS Feed Validation', () => {
    function isValidRssFeedUrl(url: string): boolean {
      try {
        const parsed = new URL(url);
        return parsed.protocol === 'http:' || parsed.protocol === 'https:';
      } catch {
        return false;
      }
    }

    it('accepts valid RSS feed URLs', () => {
      expect(isValidRssFeedUrl('https://example.com/feed.xml')).toBe(true);
      expect(isValidRssFeedUrl('https://blog.example.com/rss')).toBe(true);
      expect(isValidRssFeedUrl('http://example.com/feed')).toBe(true);
    });

    it('rejects invalid RSS feed URLs', () => {
      expect(isValidRssFeedUrl('')).toBe(false);
      expect(isValidRssFeedUrl('feed.xml')).toBe(false);
    });
  });

  describe('File Type Detection', () => {
    const supportedFileTypes = {
      'application/pdf': 'pdf',
      'text/plain': 'txt',
      'text/markdown': 'md',
      'text/csv': 'csv',
      'application/json': 'json',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
    };

    function getFileTypeFromMime(mimeType: string): string | null {
      return supportedFileTypes[mimeType as keyof typeof supportedFileTypes] || null;
    }

    it('identifies supported file types', () => {
      expect(getFileTypeFromMime('application/pdf')).toBe('pdf');
      expect(getFileTypeFromMime('text/plain')).toBe('txt');
      expect(getFileTypeFromMime('text/markdown')).toBe('md');
      expect(getFileTypeFromMime('text/csv')).toBe('csv');
      expect(getFileTypeFromMime('application/json')).toBe('json');
    });

    it('returns null for unsupported types', () => {
      expect(getFileTypeFromMime('image/png')).toBe(null);
      expect(getFileTypeFromMime('video/mp4')).toBe(null);
    });
  });

  describe('Content Chunking', () => {
    function chunkText(text: string, maxLength: number = 1000): string[] {
      const chunks: string[] = [];
      const sentences = text.split(/(?<=[.!?])\s+/);
      let currentChunk = '';

      for (const sentence of sentences) {
        if ((currentChunk + sentence).length > maxLength && currentChunk) {
          chunks.push(currentChunk.trim());
          currentChunk = sentence;
        } else {
          currentChunk += (currentChunk ? ' ' : '') + sentence;
        }
      }

      if (currentChunk) {
        chunks.push(currentChunk.trim());
      }

      return chunks;
    }

    it('chunks text by sentence boundaries', () => {
      const text = 'First sentence. Second sentence. Third sentence.';
      const chunks = chunkText(text, 30);
      expect(chunks.length).toBeGreaterThan(1);
    });

    it('handles short text', () => {
      const text = 'Short text.';
      const chunks = chunkText(text, 1000);
      expect(chunks).toHaveLength(1);
      expect(chunks[0]).toBe('Short text.');
    });

    it('handles empty text', () => {
      const chunks = chunkText('', 1000);
      expect(chunks).toHaveLength(0);
    });
  });
});
