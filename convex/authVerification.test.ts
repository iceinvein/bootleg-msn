/**
 * Integration tests for authentication verification functions in authVerification.ts
 * 
 * Tests cover:
 * - Email verification before sign-in
 * - User creation after verification
 * - Error handling for unverified emails
 * - Database operations for user management
 */

/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { describe, it, expect } from 'vitest';
import { api } from "./_generated/api";
import schema from "./schema";

// Import all Convex function modules for convex-test
const modules = import.meta.glob("./**/!(*.*.*)*.*s");

describe('Authentication Verification System', () => {
  describe('verifyEmailForAuth mutation', () => {
    it('should create user when email is verified and user does not exist', async () => {
      const t = convexTest(schema, modules);
      const email = 'test@example.com';

      // First, create a verified email verification record
      await t.run(async (ctx) => {
        await ctx.db.insert("emailVerifications", {
          email,
          token: "test-token",
          verified: true,
          expiresAt: Date.now() + 1000000,
        });
      });

      // Call the function under test
      const result = await t.mutation(api.authVerification.verifyEmailForAuth, { email });

      // Verify a user was created and returned
      expect(result).toBeDefined();
      
      // Verify the user exists in the database
      const user = await t.run(async (ctx) => {
        return await ctx.db.get(result);
      });
      
      expect(user).toMatchObject({
        email,
        emailVerificationTime: expect.any(Number),
      });
    });

    it('should return existing user when email is verified and user exists', async () => {
      const t = convexTest(schema, modules);
      const email = 'existing@example.com';

      // Create a verified email verification record
      await t.run(async (ctx) => {
        await ctx.db.insert("emailVerifications", {
          email,
          token: "test-token",
          verified: true,
          expiresAt: Date.now() + 1000000,
        });
      });

      // Create an existing user
      const existingUserId = await t.run(async (ctx) => {
        return await ctx.db.insert("users", {
          email,
          emailVerificationTime: Date.now(),
        });
      });

      // Call the function under test
      const result = await t.mutation(api.authVerification.verifyEmailForAuth, { email });
      
      // Should return the existing user ID
      expect(result).toBe(existingUserId);
    });

    it('should throw error when email is not verified', async () => {
      const t = convexTest(schema, modules);
      const email = 'unverified@example.com';

      // Create an unverified email verification record
      await t.run(async (ctx) => {
        await ctx.db.insert("emailVerifications", {
          email,
          token: "test-token",
          verified: false,
          expiresAt: Date.now() + 1000000,
        });
      });

      // Should throw error for unverified email
      await expect(
        t.mutation(api.authVerification.verifyEmailForAuth, { email })
      ).rejects.toThrow('Email not verified. Please verify your email before signing in.');
    });

    it('should throw error when no verification record exists', async () => {
      const t = convexTest(schema, modules);
      const email = 'nonexistent@example.com';

      // Should throw error when no verification record exists
      await expect(
        t.mutation(api.authVerification.verifyEmailForAuth, { email })
      ).rejects.toThrow('Email not verified. Please verify your email before signing in.');
    });

    it('should handle edge case with empty email', async () => {
      const t = convexTest(schema, modules);
      const email = '';

      // Should throw error for empty email
      await expect(
        t.mutation(api.authVerification.verifyEmailForAuth, { email })
      ).rejects.toThrow('Email not verified. Please verify your email before signing in.');
    });

    it('should handle verification with expired token but still verified', async () => {
      const t = convexTest(schema, modules);
      const email = 'test@example.com';

      // Create a verified email verification record (even if expired, verified=true should work)
      await t.run(async (ctx) => {
        await ctx.db.insert("emailVerifications", {
          email,
          token: "test-token",
          verified: true,
          expiresAt: Date.now() - 1000, // Expired but verified
        });
      });

      // Should still work since we only check if verified is true
      const result = await t.mutation(api.authVerification.verifyEmailForAuth, { email });
      
      expect(result).toBeDefined();
      
      // Verify the user was created
      const user = await t.run(async (ctx) => {
        return await ctx.db.get(result);
      });
      
      expect(user).toMatchObject({
        email,
        emailVerificationTime: expect.any(Number),
      });
    });
  });
});
