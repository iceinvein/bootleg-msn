/**
 * Integration tests for authentication functions in auth.ts
 *
 * Tests cover:
 * - User authentication flows
 * - User profile management
 * - Email verification integration
 * - Error handling and validation
 */

/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";

// Import all Convex function modules for convex-test
const modules = import.meta.glob("./**/!(*.*.*)*.*s");

describe("Authentication System", () => {
	describe("loggedInUser query", () => {
		it("should return null when user is not authenticated", async () => {
			const t = convexTest(schema, modules);

			// Call without authentication
			const result = await t.query(api.auth.loggedInUser, {});

			expect(result).toBeNull();
		});

		it("should return user when authenticated", async () => {
			const t = convexTest(schema, modules);

			// Create a user first
			const userId = await t.run(async (ctx) => {
				return await ctx.db.insert("users", {
					email: "test@example.com",
					emailVerificationTime: Date.now(),
				});
			});

			// Simulate authentication by setting the user ID in context
			const result = await t
				.withIdentity({ subject: userId })
				.query(api.auth.loggedInUser, {});

			expect(result).toMatchObject({
				_id: userId,
				email: "test@example.com",
				emailVerificationTime: expect.any(Number),
			});
		});
	});

	describe("getUserById query", () => {
		it("should return user when valid ID is provided", async () => {
			const t = convexTest(schema, modules);

			// Create a user
			const userId = await t.run(async (ctx) => {
				return await ctx.db.insert("users", {
					email: "test@example.com",
					emailVerificationTime: Date.now(),
				});
			});

			// Query the user by ID
			const result = await t.query(api.auth.getUserById, { userId });

			expect(result).toMatchObject({
				_id: userId,
				email: "test@example.com",
				emailVerificationTime: expect.any(Number),
			});
		});

		it("should return null when invalid ID is provided", async () => {
			const t = convexTest(schema, modules);

			// Create a valid ID format but for a non-existent user
			const fakeId = await t.run(async (ctx) => {
				// Create and immediately delete a user to get a valid but non-existent ID
				const tempId = await ctx.db.insert("users", {
					email: "temp@example.com",
					emailVerificationTime: Date.now(),
				});
				await ctx.db.delete(tempId);
				return tempId;
			});

			const result = await t.query(api.auth.getUserById, { userId: fakeId });

			expect(result).toBeNull();
		});
	});

	describe("updateUserName mutation", () => {
		it("should update user name when authenticated", async () => {
			const t = convexTest(schema, modules);

			// Create a user
			const userId = await t.run(async (ctx) => {
				return await ctx.db.insert("users", {
					email: "test@example.com",
					emailVerificationTime: Date.now(),
				});
			});

			// Update the user name
			await t
				.withIdentity({ subject: userId })
				.mutation(api.auth.updateUserName, {
					name: "John Doe",
				});

			// Verify the update
			const updatedUser = await t.run(async (ctx) => {
				return await ctx.db.get(userId);
			});

			expect(updatedUser?.name).toBe("John Doe");
		});

		it("should throw error when not authenticated", async () => {
			const t = convexTest(schema, modules);

			// Try to update without authentication
			await expect(
				t.mutation(api.auth.updateUserName, { name: "John Doe" }),
			).rejects.toThrow();
		});
	});

	describe("updateUserImage mutation", () => {
		it("should update user image when authenticated", async () => {
			const t = convexTest(schema, modules);

			// Create a user
			const userId = await t.run(async (ctx) => {
				return await ctx.db.insert("users", {
					email: "test@example.com",
					emailVerificationTime: Date.now(),
				});
			});

			const imageUrl = "https://example.com/avatar.jpg";

			// Update the user image
			await t
				.withIdentity({ subject: userId })
				.mutation(api.auth.updateUserImage, {
					image: imageUrl,
				});

			// Verify the update
			const updatedUser = await t.run(async (ctx) => {
				return await ctx.db.get(userId);
			});

			expect(updatedUser?.image).toBe(imageUrl);
		});

		it("should clear user image when null is provided", async () => {
			const t = convexTest(schema, modules);

			// Create a user with an image
			const userId = await t.run(async (ctx) => {
				return await ctx.db.insert("users", {
					email: "test@example.com",
					emailVerificationTime: Date.now(),
					image: "https://example.com/old-avatar.jpg",
				});
			});

			// Clear the user image
			await t
				.withIdentity({ subject: userId })
				.mutation(api.auth.updateUserImage, {
					image: null,
				});

			// Verify the image was cleared
			const updatedUser = await t.run(async (ctx) => {
				return await ctx.db.get(userId);
			});

			expect(updatedUser?.image).toBeUndefined();
		});

		it("should throw error when not authenticated", async () => {
			const t = convexTest(schema, modules);

			// Try to update without authentication
			await expect(
				t.mutation(api.auth.updateUserImage, {
					image: "https://example.com/avatar.jpg",
				}),
			).rejects.toThrow();
		});
	});

	describe("checkEmailVerificationForAuth mutation", () => {
		it("should return true when email is verified", async () => {
			const t = convexTest(schema, modules);
			const email = "verified@example.com";

			// Create a verified email verification record
			await t.run(async (ctx) => {
				await ctx.db.insert("emailVerifications", {
					email,
					token: "test-token",
					verified: true,
					expiresAt: Date.now() + 1000000,
				});
			});

			// Check verification status
			const result = await t.mutation(api.auth.checkEmailVerificationForAuth, {
				email,
			});

			expect(result).toBe(true);
		});

		it("should return false when email is not verified", async () => {
			const t = convexTest(schema, modules);
			const email = "unverified@example.com";

			// Create an unverified email verification record
			await t.run(async (ctx) => {
				await ctx.db.insert("emailVerifications", {
					email,
					token: "test-token",
					verified: false,
					expiresAt: Date.now() + 1000000,
				});
			});

			// Check verification status
			const result = await t.mutation(api.auth.checkEmailVerificationForAuth, {
				email,
			});

			expect(result).toBe(false);
		});

		it("should return false when no verification record exists", async () => {
			const t = convexTest(schema, modules);
			const email = "nonexistent@example.com";

			// Check verification status for non-existent email
			const result = await t.mutation(api.auth.checkEmailVerificationForAuth, {
				email,
			});

			expect(result).toBe(false);
		});
	});

	describe("getUserAuthMethods query", () => {
		it("should return auth methods object when user has no auth methods", async () => {
			const t = convexTest(schema, modules);

			// Create a user without auth methods
			const userId = await t.run(async (ctx) => {
				return await ctx.db.insert("users", {
					email: "test@example.com",
					emailVerificationTime: Date.now(),
				});
			});

			// Get auth methods
			const result = await t
				.withIdentity({ subject: userId })
				.query(api.auth.getUserAuthMethods, {});

			expect(result).toMatchObject({
				accountLinked: false,
				hasOAuth: false,
				hasPassword: false,
				oauthProviders: [],
			});
		});
	});
});
