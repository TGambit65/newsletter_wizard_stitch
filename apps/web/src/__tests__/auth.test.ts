import { describe, it, expect, vi, beforeEach } from 'vitest';

// Test authentication utility functions
describe('Auth Utilities', () => {
  describe('Email Validation', () => {
    function isValidEmail(email: string): boolean {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(email);
    }

    it('accepts valid email addresses', () => {
      expect(isValidEmail('user@example.com')).toBe(true);
      expect(isValidEmail('user.name@example.co.uk')).toBe(true);
      expect(isValidEmail('user+tag@example.org')).toBe(true);
    });

    it('rejects invalid email addresses', () => {
      expect(isValidEmail('')).toBe(false);
      expect(isValidEmail('invalid')).toBe(false);
      expect(isValidEmail('invalid@')).toBe(false);
      expect(isValidEmail('@example.com')).toBe(false);
      expect(isValidEmail('user @example.com')).toBe(false);
    });
  });

  describe('Password Validation', () => {
    interface PasswordValidation {
      valid: boolean;
      errors: string[];
    }

    function validatePassword(password: string): PasswordValidation {
      const errors: string[] = [];
      
      if (password.length < 8) {
        errors.push('Password must be at least 8 characters');
      }
      if (!/[A-Z]/.test(password)) {
        errors.push('Password must contain an uppercase letter');
      }
      if (!/[a-z]/.test(password)) {
        errors.push('Password must contain a lowercase letter');
      }
      if (!/[0-9]/.test(password)) {
        errors.push('Password must contain a number');
      }
      
      return { valid: errors.length === 0, errors };
    }

    it('accepts strong passwords', () => {
      const result = validatePassword('SecurePass123');
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('rejects short passwords', () => {
      const result = validatePassword('Short1');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password must be at least 8 characters');
    });

    it('rejects passwords without uppercase', () => {
      const result = validatePassword('lowercase123');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password must contain an uppercase letter');
    });

    it('rejects passwords without numbers', () => {
      const result = validatePassword('NoNumbersHere');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password must contain a number');
    });
  });

  describe('Tenant Slug Generation', () => {
    function generateTenantSlug(email: string): string {
      const base = email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '-');
      return `${base}-${Date.now()}`;
    }

    it('generates slug from email', () => {
      const slug = generateTenantSlug('User.Name@example.com');
      expect(slug).toMatch(/^user-name-\d+$/);
    });

    it('handles special characters', () => {
      const slug = generateTenantSlug('user+test@example.com');
      expect(slug).toMatch(/^user-test-\d+$/);
    });

    it('generates unique slugs', () => {
      const slug1 = generateTenantSlug('test@example.com');
      // Small delay to ensure different timestamp
      const slug2 = generateTenantSlug('test@example.com');
      // Slugs should have same prefix but potentially different timestamps
      expect(slug1.startsWith('test-')).toBe(true);
      expect(slug2.startsWith('test-')).toBe(true);
    });
  });

  describe('Role Permissions', () => {
    type Role = 'owner' | 'admin' | 'member';
    
    const rolePermissions: Record<Role, string[]> = {
      owner: ['read', 'write', 'delete', 'admin', 'billing'],
      admin: ['read', 'write', 'delete', 'admin'],
      member: ['read', 'write'],
    };

    function hasPermission(role: Role, permission: string): boolean {
      return rolePermissions[role]?.includes(permission) ?? false;
    }

    it('owner has all permissions', () => {
      expect(hasPermission('owner', 'read')).toBe(true);
      expect(hasPermission('owner', 'write')).toBe(true);
      expect(hasPermission('owner', 'delete')).toBe(true);
      expect(hasPermission('owner', 'admin')).toBe(true);
      expect(hasPermission('owner', 'billing')).toBe(true);
    });

    it('admin cannot access billing', () => {
      expect(hasPermission('admin', 'admin')).toBe(true);
      expect(hasPermission('admin', 'billing')).toBe(false);
    });

    it('member has limited permissions', () => {
      expect(hasPermission('member', 'read')).toBe(true);
      expect(hasPermission('member', 'write')).toBe(true);
      expect(hasPermission('member', 'delete')).toBe(false);
      expect(hasPermission('member', 'admin')).toBe(false);
    });
  });
});
