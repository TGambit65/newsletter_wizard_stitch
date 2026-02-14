import { describe, it, expect } from 'vitest';
import { cn } from '@/lib/utils';

describe('Utils Module', () => {
  describe('cn (classNames utility)', () => {
    it('merges class names', () => {
      expect(cn('foo', 'bar')).toBe('foo bar');
    });

    it('handles conditional classes', () => {
      const isActive = true;
      const isDisabled = false;
      expect(cn('base', isActive && 'active', isDisabled && 'disabled')).toBe('base active');
    });

    it('handles undefined and null', () => {
      expect(cn('foo', undefined, null, 'bar')).toBe('foo bar');
    });

    it('handles empty strings', () => {
      expect(cn('foo', '', 'bar')).toBe('foo bar');
    });

    it('merges tailwind classes correctly', () => {
      // tailwind-merge should handle conflicting classes
      expect(cn('px-2 py-1', 'px-4')).toBe('py-1 px-4');
    });

    it('handles array of classes', () => {
      expect(cn(['foo', 'bar'])).toBe('foo bar');
    });

    it('handles object syntax', () => {
      expect(cn({ foo: true, bar: false, baz: true })).toBe('foo baz');
    });

    it('handles mixed inputs', () => {
      expect(cn('base', ['array-class'], { 'object-class': true })).toBe('base array-class object-class');
    });
  });
});
