/**
 * Integration tests for email verification functions in emailVerification.ts
 * 
 * Tests cover:
 * - Email verification token generation and validation
 * - Token expiration handling
 * - Verification status management
 * - Error handling for invalid tokens
 */

/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { describe, it, expect } from 'vitest';
import { api } from "./_generated/api";
import schema from "./schema";

// Import all Convex function modules for convex-test
const modules = import.meta.glob("./**/!(*.*.*)*.*s");

describe('Email Verification System', () => {
  describe('sendVerificationEmail action', () => {
    it.skip('should create verification record when sending email (requires API key)', async () => {
      // This test requires a Resend API key to be configured
      // Skipping in test environment
    });
  });

  describe('verifyEmail mutation', () => {
    it('should verify email with valid token', async () => {
      const t = convexTest(schema, modules);
      const email = "test@example.com";
      const token = "valid-token-123";

      // Create verification record
      await t.run(async (ctx) => {
        await ctx.db.insert("emailVerifications", {
          email,
          token,
          verified: false,
          expiresAt: Date.now() + 1000000, // Valid for 1000 seconds
        });
      });

      // Verify the email
      const result = await t.mutation(api.emailVerification.verifyEmail, { token });

      expect(result.success).toBe(true);
      expect(result.email).toBe(email);

      // Check that record was updated
      const verificationRecord = await t.run(async (ctx) => {
        return await ctx.db
          .query("emailVerifications")
          .filter((q) => q.eq(q.field("email"), email))
          .first();
      });

      expect(verificationRecord?.verified).toBe(true);
    });

    it('should reject expired token', async () => {
      const t = convexTest(schema, modules);
      const email = "test@example.com";
      const token = "expired-token-123";

      // Create expired verification record
      await t.run(async (ctx) => {
        await ctx.db.insert("emailVerifications", {
          email,
          token,
          verified: false,
          expiresAt: Date.now() - 1000, // Expired 1 second ago
        });
      });

      // Try to verify with expired token - should throw ConvexError
      await expect(
        t.mutation(api.emailVerification.verifyEmail, { token })
      ).rejects.toThrow("Verification token has expired");
    });

    it('should reject invalid token', async () => {
      const t = convexTest(schema, modules);
      const token = "invalid-token-123";

      // Try to verify with non-existent token - should throw ConvexError
      await expect(
        t.mutation(api.emailVerification.verifyEmail, { token })
      ).rejects.toThrow("Invalid verification token");
    });

    it('should reject already verified token', async () => {
      const t = convexTest(schema, modules);
      const email = "test@example.com";
      const token = "already-verified-token";

      // Create already verified record
      await t.run(async (ctx) => {
        await ctx.db.insert("emailVerifications", {
          email,
          token,
          verified: true,
          expiresAt: Date.now() + 1000000,
        });
      });

      // Try to verify again - should throw ConvexError
      await expect(
        t.mutation(api.emailVerification.verifyEmail, { token })
      ).rejects.toThrow("Email is already verified");
    });
  });

  describe('checkEmailVerification query', () => {
    it('should return true for verified email', async () => {
      const t = convexTest(schema, modules);
      const email = "verified@example.com";

      // Create verified record
      await t.run(async (ctx) => {
        await ctx.db.insert("emailVerifications", {
          email,
          token: "test-token",
          verified: true,
          expiresAt: Date.now() + 1000000,
        });
      });

      // Check verification status
      const result = await t.query(api.emailVerification.checkEmailVerification, { email });

      expect(result).toBe(true);
    });

    it('should return false for unverified email', async () => {
      const t = convexTest(schema, modules);
      const email = "unverified@example.com";

      // Create unverified record
      await t.run(async (ctx) => {
        await ctx.db.insert("emailVerifications", {
          email,
          token: "test-token",
          verified: false,
          expiresAt: Date.now() + 1000000,
        });
      });

      // Check verification status
      const result = await t.query(api.emailVerification.checkEmailVerification, { email });

      expect(result).toBe(false);
    });

    it('should return false for non-existent email', async () => {
      const t = convexTest(schema, modules);
      const email = "nonexistent@example.com";

      // Check verification status for non-existent email
      const result = await t.query(api.emailVerification.checkEmailVerification, { email });

      expect(result).toBe(false);
    });
  });

  describe('resendVerificationEmail action', () => {
    it.skip('should resend verification email for existing record (requires API key)', async () => {
      // This test requires a Resend API key to be configured
      // Skipping in test environment
    });

    it('should handle resend for already verified email', async () => {
      const t = convexTest(schema, modules);
      const email = "verified@example.com";

      // Create verified record
      await t.run(async (ctx) => {
        await ctx.db.insert("emailVerifications", {
          email,
          token: "verified-token",
          verified: true,
          expiresAt: Date.now() + 1000000,
        });
      });

      // Try to resend for verified email - should throw ConvexError
      await expect(
        t.action(api.emailVerification.resendVerificationEmail, { email })
      ).rejects.toThrow("Email is already verified");
    });

    it.skip('should create new record if none exists (requires API key)', async () => {
      // This test requires a Resend API key to be configured
      // Skipping in test environment
    });
  });
});
