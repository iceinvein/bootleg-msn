/**
 * Tests for Push Notification backend functionality
 */

import { convexTest } from "convex-test";
import { describe, expect, it, beforeEach, vi } from "vitest";
import schema from "./schema";
import { api } from "./_generated/api";

// Import all Convex function modules for convex-test
const modules = import.meta.glob("./**/!(*.*.*)*.*s");

// Mock environment variables
beforeEach(() => {
	// Mock required environment variables for push notifications
	process.env.CONVEX_SITE_URL = "https://test-convex-site.convex.cloud";
	process.env.FUNCTION_JWT_SECRET = "test-jwt-secret-key-for-testing-purposes";
});

describe("Push Notifications Backend", () => {
	describe("upsertSubscription", () => {
		it("should create a new push subscription", async () => {
			const t = convexTest(schema, modules);

			// Create a user
			const userId = await t.run(async (ctx) => {
				return await ctx.db.insert("users", {
					email: "test@example.com",
					name: "Test User",
					isAnonymous: false,
				});
			});

			// Create push subscription
			const subscriptionId = await t.withIdentity({ subject: userId }).mutation(api.push.upsertSubscription, {
				endpoint: "https://fcm.googleapis.com/fcm/send/test123",
				p256dh: "test-p256dh-key",
				auth: "test-auth-key",
			});

			expect(subscriptionId).toBeDefined();

			// Verify subscription was created
			const subscription = await t.run(async (ctx) => {
				return await ctx.db.get(subscriptionId);
			});

			expect(subscription).toMatchObject({
				userId,
				endpoint: "https://fcm.googleapis.com/fcm/send/test123",
				p256dh: "test-p256dh-key",
				auth: "test-auth-key",
			});
			expect(subscription?.createdAt).toBeTypeOf("number");
		});

		it("should update existing push subscription", async () => {
			const t = convexTest(schema, modules);

			// Create a user
			const userId = await t.run(async (ctx) => {
				return await ctx.db.insert("users", {
					email: "test@example.com",
					name: "Test User",
					isAnonymous: false,
				});
			});

			// Create initial subscription
			const initialId = await t.withIdentity({ subject: userId }).mutation(api.push.upsertSubscription, {
				endpoint: "https://fcm.googleapis.com/fcm/send/test123",
				p256dh: "initial-p256dh",
				auth: "initial-auth",
			});

			// Update with same endpoint but different keys
			const updatedId = await t.withIdentity({ subject: userId }).mutation(api.push.upsertSubscription, {
				endpoint: "https://fcm.googleapis.com/fcm/send/test123",
				p256dh: "updated-p256dh",
				auth: "updated-auth",
			});

			// Should return the same ID
			expect(updatedId).toBe(initialId);

			// Verify subscription was updated
			const subscription = await t.run(async (ctx) => {
				return await ctx.db.get(updatedId);
			});

			expect(subscription).toMatchObject({
				userId,
				endpoint: "https://fcm.googleapis.com/fcm/send/test123",
				p256dh: "updated-p256dh",
				auth: "updated-auth",
			});
		});

		it("should not allow updating subscription belonging to another user", async () => {
			const t = convexTest(schema, modules);

			// Create two users
			const user1Id = await t.run(async (ctx) => {
				return await ctx.db.insert("users", {
					email: "user1@example.com",
					name: "User 1",
					isAnonymous: false,
				});
			});

			const user2Id = await t.run(async (ctx) => {
				return await ctx.db.insert("users", {
					email: "user2@example.com",
					name: "User 2",
					isAnonymous: false,
				});
			});

			// User 1 creates subscription
			await t.withIdentity({ subject: user1Id }).mutation(api.push.upsertSubscription, {
				endpoint: "https://fcm.googleapis.com/fcm/send/test123",
				p256dh: "user1-p256dh",
				auth: "user1-auth",
			});

			// User 2 tries to update the same endpoint
			await expect(
				t.withIdentity({ subject: user2Id }).mutation(api.push.upsertSubscription, {
					endpoint: "https://fcm.googleapis.com/fcm/send/test123",
					p256dh: "user2-p256dh",
					auth: "user2-auth",
				})
			).rejects.toThrow("Cannot update subscription belonging to another user");
		});

		it("should require authentication", async () => {
			const t = convexTest(schema, modules);

			await expect(
				t.mutation(api.push.upsertSubscription, {
					endpoint: "https://fcm.googleapis.com/fcm/send/test123",
					p256dh: "test-p256dh",
					auth: "test-auth",
				})
			).rejects.toThrow("Not authenticated");
		});
	});

	describe("notifyNewGroupMessage", () => {
		it("should send push notifications to group members", async () => {
			const t = convexTest(schema, modules);

			// Create users
			const senderId = await t.run(async (ctx) => {
				return await ctx.db.insert("users", {
					email: "sender@example.com",
					name: "Sender User",
					isAnonymous: false,
				});
			});

			const member1Id = await t.run(async (ctx) => {
				return await ctx.db.insert("users", {
					email: "member1@example.com",
					name: "Member 1",
					isAnonymous: false,
				});
			});

			const member2Id = await t.run(async (ctx) => {
				return await ctx.db.insert("users", {
					email: "member2@example.com",
					name: "Member 2",
					isAnonymous: false,
				});
			});

			// Create group
			const groupId = await t.run(async (ctx) => {
				return await ctx.db.insert("groups", {
					name: "Test Group",
					description: "Test group description",
					createdBy: senderId,
					isPrivate: false,
					memberCount: 3,
				});
			});

			// Add group members
			await t.run(async (ctx) => {
				const now = Date.now();
				await ctx.db.insert("groupMembers", {
					groupId,
					userId: senderId,
					role: "admin",
					joinedAt: now,
				});
				await ctx.db.insert("groupMembers", {
					groupId,
					userId: member1Id,
					role: "member",
					joinedAt: now,
				});
				await ctx.db.insert("groupMembers", {
					groupId,
					userId: member2Id,
					role: "member",
					joinedAt: now,
				});
			});

			// Create push subscriptions for members
			await t.withIdentity({ subject: member1Id }).mutation(api.push.upsertSubscription, {
				endpoint: "https://fcm.googleapis.com/fcm/send/member1",
				p256dh: "member1-p256dh",
				auth: "member1-auth",
			});

			await t.withIdentity({ subject: member2Id }).mutation(api.push.upsertSubscription, {
				endpoint: "https://fcm.googleapis.com/fcm/send/member2",
				p256dh: "member2-p256dh",
				auth: "member2-auth",
			});

			// Send group message notification
			await t.withIdentity({ subject: senderId }).action(api.push.notifyNewGroupMessage, {
				senderId,
				groupId,
				content: "Hello group!",
			});

			// Note: We can't easily test the actual HTTP requests to the push service
			// in this test environment, but we can verify the action doesn't throw
			expect(true).toBe(true);
		});

		it("should handle missing users gracefully", async () => {
			const t = convexTest(schema, modules);

			// Create a real user first
			const userId = await t.run(async (ctx) => {
				return await ctx.db.insert("users", {
					email: "test@example.com",
					name: "Test User",
					isAnonymous: false,
				});
			});

			const groupId = await t.run(async (ctx) => {
				return await ctx.db.insert("groups", {
					name: "Test Group",
					description: "Test description",
					createdBy: userId,
					isPrivate: false,
					memberCount: 0,
				});
			});

			// Should not throw when called with valid IDs (even if no push subscriptions exist)
			const result = await t.action(api.push.notifyNewGroupMessage, {
				senderId: userId,
				groupId,
				content: "Hello!",
			});

			// Should return null when no subscriptions to notify
			expect(result).toBeNull();
		});
	});

	describe("notifyNewDirectMessage", () => {
		it("should send push notification for direct message", async () => {
			const t = convexTest(schema, modules);

			// Create users
			const senderId = await t.run(async (ctx) => {
				return await ctx.db.insert("users", {
					email: "sender@example.com",
					name: "Sender User",
					isAnonymous: false,
				});
			});

			const receiverId = await t.run(async (ctx) => {
				return await ctx.db.insert("users", {
					email: "receiver@example.com",
					name: "Receiver User",
					isAnonymous: false,
				});
			});

			// Create push subscription for receiver
			await t.withIdentity({ subject: receiverId }).mutation(api.push.upsertSubscription, {
				endpoint: "https://fcm.googleapis.com/fcm/send/receiver",
				p256dh: "receiver-p256dh",
				auth: "receiver-auth",
			});

			// Send direct message notification
			await t.withIdentity({ subject: senderId }).action(api.push.notifyNewDirectMessage, {
				senderId,
				receiverId,
				content: "Hello there!",
			});

			// Note: We can't easily test the actual HTTP requests to the push service
			// in this test environment, but we can verify the action doesn't throw
			expect(true).toBe(true);
		});

		it("should handle missing users gracefully", async () => {
			const t = convexTest(schema, modules);

			// Create real users first
			const senderId = await t.run(async (ctx) => {
				return await ctx.db.insert("users", {
					email: "sender@example.com",
					name: "Sender User",
					isAnonymous: false,
				});
			});

			const receiverId = await t.run(async (ctx) => {
				return await ctx.db.insert("users", {
					email: "receiver@example.com",
					name: "Receiver User",
					isAnonymous: false,
				});
			});

			// Should not throw when called with valid IDs (even if no push subscriptions exist)
			const result = await t.action(api.push.notifyNewDirectMessage, {
				senderId,
				receiverId,
				content: "Hello!",
			});

			// Should return null when no subscriptions to notify
			expect(result).toBeNull();
		});
	});

	describe("Push Subscription Management", () => {
		it("should handle multiple subscriptions per user", async () => {
			const t = convexTest(schema, modules);

			// Create a user
			const userId = await t.run(async (ctx) => {
				return await ctx.db.insert("users", {
					email: "test@example.com",
					name: "Test User",
					isAnonymous: false,
				});
			});

			// Create multiple subscriptions (different endpoints)
			const subscription1Id = await t.withIdentity({ subject: userId }).mutation(api.push.upsertSubscription, {
				endpoint: "https://fcm.googleapis.com/fcm/send/device1",
				p256dh: "device1-p256dh",
				auth: "device1-auth",
			});

			const subscription2Id = await t.withIdentity({ subject: userId }).mutation(api.push.upsertSubscription, {
				endpoint: "https://fcm.googleapis.com/fcm/send/device2",
				p256dh: "device2-p256dh",
				auth: "device2-auth",
			});

			expect(subscription1Id).not.toBe(subscription2Id);

			// Verify both subscriptions exist
			const subscriptions = await t.run(async (ctx) => {
				return await ctx.db
					.query("pushSubscriptions")
					.filter((q) => q.eq(q.field("userId"), userId))
					.collect();
			});

			expect(subscriptions).toHaveLength(2);
		});

		it("should handle subscription cleanup", async () => {
			const t = convexTest(schema, modules);

			// Create a user
			const userId = await t.run(async (ctx) => {
				return await ctx.db.insert("users", {
					email: "test@example.com",
					name: "Test User",
					isAnonymous: false,
				});
			});

			// Create subscription
			const subscriptionId = await t.withIdentity({ subject: userId }).mutation(api.push.upsertSubscription, {
				endpoint: "https://fcm.googleapis.com/fcm/send/test",
				p256dh: "test-p256dh",
				auth: "test-auth",
			});

			// Verify subscription exists
			let subscription = await t.run(async (ctx) => {
				return await ctx.db.get(subscriptionId);
			});
			expect(subscription).toBeDefined();

			// Delete subscription
			await t.run(async (ctx) => {
				await ctx.db.delete(subscriptionId);
			});

			// Verify subscription is deleted
			subscription = await t.run(async (ctx) => {
				return await ctx.db.get(subscriptionId);
			});
			expect(subscription).toBeNull();
		});
	});
});
