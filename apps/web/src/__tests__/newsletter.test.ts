import { describe, it, expect, vi } from 'vitest';

// Newsletter Generation Tests
describe('Newsletter Generation', () => {
  describe('Topic Extraction', () => {
    function extractTopics(text: string): string[] {
      // Simple keyword extraction
      const words = text.toLowerCase().split(/\s+/);
      const stopWords = new Set(['the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'and', 'or', 'but', 'for', 'with', 'to', 'of', 'in', 'on', 'at']);
      
      const keywords = words
        .filter(word => word.length > 3 && !stopWords.has(word))
        .map(word => word.replace(/[^a-z]/g, ''))
        .filter(word => word.length > 3);
      
      // Return unique keywords
      return [...new Set(keywords)].slice(0, 10);
    }

    it('extracts keywords from text', () => {
      const text = 'Artificial intelligence and machine learning are transforming technology';
      const topics = extractTopics(text);
      expect(topics).toContain('artificial');
      expect(topics).toContain('intelligence');
      expect(topics).toContain('machine');
    });

    it('filters stop words', () => {
      const text = 'The quick brown fox jumps over the lazy dog';
      const topics = extractTopics(text);
      expect(topics).not.toContain('the');
      expect(topics).toContain('quick');
      expect(topics).toContain('brown');
    });

    it('handles empty text', () => {
      const topics = extractTopics('');
      expect(topics).toHaveLength(0);
    });
  });

  describe('HTML Content Validation', () => {
    function isValidHtml(html: string): boolean {
      // Basic validation - check for balanced tags using stack
      const tagPattern = /<\/?([a-z][a-z0-9]*)\b[^>]*>/gi;
      const selfClosing = new Set(['br', 'hr', 'img', 'input', 'meta', 'link', 'area', 'base', 'col', 'embed', 'source', 'track', 'wbr']);
      const stack: string[] = [];
      
      let match;
      while ((match = tagPattern.exec(html)) !== null) {
        const fullTag = match[0];
        const tagName = match[1].toLowerCase();
        
        if (selfClosing.has(tagName)) continue;
        
        if (fullTag.startsWith('</')) {
          // Closing tag
          if (stack.length === 0 || stack[stack.length - 1] !== tagName) {
            return false;
          }
          stack.pop();
        } else {
          // Opening tag
          stack.push(tagName);
        }
      }
      
      return stack.length === 0;
    }

    it('validates balanced HTML', () => {
      expect(isValidHtml('<div><p>Hello</p></div>')).toBe(true);
      expect(isValidHtml('<h1>Title</h1><p>Content</p>')).toBe(true);
    });

    it('handles self-closing tags', () => {
      expect(isValidHtml('<p>Text<br>More text</p>')).toBe(true);
      expect(isValidHtml('<img src="test.jpg"><p>Caption</p>')).toBe(true);
    });
  });

  describe('Subject Line Generation', () => {
    function generateSubjectLine(title: string, maxLength: number = 60): string {
      if (title.length <= maxLength) return title;
      
      // Truncate at word boundary
      const truncated = title.substring(0, maxLength);
      const lastSpace = truncated.lastIndexOf(' ');
      
      if (lastSpace > maxLength * 0.7) {
        return truncated.substring(0, lastSpace) + '...';
      }
      
      return truncated + '...';
    }

    it('returns short titles unchanged', () => {
      expect(generateSubjectLine('Short Title')).toBe('Short Title');
    });

    it('truncates long titles at word boundaries', () => {
      const longTitle = 'This is a very long newsletter title that exceeds the maximum length allowed for email subject lines';
      const subject = generateSubjectLine(longTitle, 50);
      expect(subject.length).toBeLessThanOrEqual(53); // 50 + '...'
      expect(subject.endsWith('...')).toBe(true);
    });
  });

  describe('Content Sanitization', () => {
    function sanitizeContent(html: string): string {
      // Remove script tags
      let sanitized = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
      // Remove event handlers
      sanitized = sanitized.replace(/\son\w+="[^"]*"/gi, '');
      sanitized = sanitized.replace(/\son\w+='[^']*'/gi, '');
      return sanitized;
    }

    it('removes script tags', () => {
      const dirty = '<p>Safe</p><script>alert("xss")</script><p>Also safe</p>';
      const clean = sanitizeContent(dirty);
      expect(clean).not.toContain('script');
      expect(clean).toContain('Safe');
    });

    it('removes event handlers', () => {
      const dirty = '<button onclick="alert(\'xss\')">Click</button>';
      const clean = sanitizeContent(dirty);
      expect(clean).not.toContain('onclick');
      expect(clean).toContain('Click');
    });
  });
});

describe('Social Media Post Generation', () => {
  describe('Twitter Post Validation', () => {
    const TWITTER_MAX_LENGTH = 280;

    function isValidTweet(text: string): boolean {
      return text.length > 0 && text.length <= TWITTER_MAX_LENGTH;
    }

    function truncateTweet(text: string, hashtags: string[] = []): string {
      const hashtagsStr = hashtags.length ? '\n\n' + hashtags.map(h => '#' + h).join(' ') : '';
      const maxTextLength = TWITTER_MAX_LENGTH - hashtagsStr.length;
      
      if (text.length <= maxTextLength) {
        return text + hashtagsStr;
      }
      
      return text.substring(0, maxTextLength - 3) + '...' + hashtagsStr;
    }

    it('validates tweet length', () => {
      expect(isValidTweet('Hello world!')).toBe(true);
      expect(isValidTweet('')).toBe(false);
      expect(isValidTweet('a'.repeat(281))).toBe(false);
    });

    it('truncates long tweets with hashtags', () => {
      const longText = 'a'.repeat(300);
      const hashtags = ['tech', 'news'];
      const tweet = truncateTweet(longText, hashtags);
      expect(tweet.length).toBeLessThanOrEqual(TWITTER_MAX_LENGTH);
      expect(tweet).toContain('#tech');
    });
  });

  describe('LinkedIn Post Formatting', () => {
    function formatLinkedInPost(content: string, hashtags: string[]): string {
      const formattedHashtags = hashtags.map(h => '#' + h.replace(/\s+/g, '')).join(' ');
      return `${content}\n\n${formattedHashtags}`;
    }

    it('formats post with hashtags', () => {
      const post = formatLinkedInPost('Check out our latest update!', ['Tech', 'Innovation']);
      expect(post).toContain('#Tech');
      expect(post).toContain('#Innovation');
    });
  });

  describe('Instagram Caption Formatting', () => {
    const INSTAGRAM_MAX_HASHTAGS = 30;

    function formatInstagramCaption(caption: string, hashtags: string[]): string {
      const limitedHashtags = hashtags.slice(0, INSTAGRAM_MAX_HASHTAGS);
      const hashtagsStr = limitedHashtags.map(h => '#' + h.replace(/\s+/g, '')).join(' ');
      return `${caption}\n\n.\n.\n.\n\n${hashtagsStr}`;
    }

    it('limits hashtags to 30', () => {
      const hashtags = Array.from({ length: 35 }, (_, i) => `tag${i}`);
      const caption = formatInstagramCaption('Test caption', hashtags);
      const hashtagCount = (caption.match(/#/g) || []).length;
      expect(hashtagCount).toBeLessThanOrEqual(INSTAGRAM_MAX_HASHTAGS);
    });
  });
});

describe('Newsletter Analytics', () => {
  describe('Open Rate Calculation', () => {
    function calculateOpenRate(opens: number, delivered: number): number {
      if (delivered === 0) return 0;
      return Math.round((opens / delivered) * 100 * 100) / 100;
    }

    it('calculates open rate correctly', () => {
      expect(calculateOpenRate(50, 100)).toBe(50);
      expect(calculateOpenRate(25, 200)).toBe(12.5);
    });

    it('handles zero delivered', () => {
      expect(calculateOpenRate(0, 0)).toBe(0);
    });
  });

  describe('Click Rate Calculation', () => {
    function calculateClickRate(clicks: number, opens: number): number {
      if (opens === 0) return 0;
      return Math.round((clicks / opens) * 100 * 100) / 100;
    }

    it('calculates click rate correctly', () => {
      expect(calculateClickRate(10, 50)).toBe(20);
    });

    it('handles zero opens', () => {
      expect(calculateClickRate(0, 0)).toBe(0);
    });
  });

  describe('Engagement Score', () => {
    function calculateEngagementScore(openRate: number, clickRate: number): number {
      // Weighted average: opens 40%, clicks 60%
      return Math.round((openRate * 0.4 + clickRate * 0.6) * 100) / 100;
    }

    it('calculates engagement score', () => {
      const score = calculateEngagementScore(50, 20);
      expect(score).toBe(32); // 50*0.4 + 20*0.6
    });
  });
});
