/**
 * Integration tests for message reactions system using convex-test
 * 
 * Tests cover:
 * - Adding message reactions
 * - Removing message reactions
 * - Getting reaction summaries
 * - Reaction validation and permissions
 * - Multiple reactions per message
 */

import { convexTest } from "convex-test";
import { describe, it, expect, beforeEach } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";

const modules = import.meta.glob("./**/!(*.*.*)*.*s");

describe("Message Reactions System", () => {
	let t: Awaited<ReturnType<typeof convexTest>>;

	beforeEach(async () => {
		t = convexTest(schema, modules);
	});

	describe("addMessageReaction", () => {
		it("should add a reaction to a direct message", async () => {
			// Create users
			const senderId = await t.run(async (ctx) => {
				return await ctx.db.insert("users", {
					email: "sender@test.com",
					name: "Sender User",
					isAnonymous: false,
				});
			});

			const receiverId = await t.run(async (ctx) => {
				return await ctx.db.insert("users", {
					email: "receiver@test.com",
					name: "Receiver User",
					isAnonymous: false,
				});
			});

			// Send a message
			const messageId = await t.withIdentity({ subject: senderId }).mutation(api.messages.sendMessage, {
				content: "Hello, this is a test message!",
				messageType: "text",
				receiverId,
			});

			// Add reaction to the message
			await t.withIdentity({ subject: receiverId }).mutation(api.reactions.addMessageReaction, {
				messageId: messageId!,
				reactionType: "thumbs_up",
			});

			// Get reaction summary
			const reactionSummary = await t.withIdentity({ subject: receiverId }).query(api.reactions.getMessageReactionSummary, {
				messageId: messageId!,
			});

			expect(reactionSummary).toHaveLength(1);
			expect(reactionSummary[0]).toMatchObject({
				reactionType: "thumbs_up",
				count: 1,
				hasCurrentUserReacted: true,
			});
		});

		it("should add a custom emoji reaction to a group message", async () => {
			// Create users and group
			const user1Id = await t.run(async (ctx) => {
				return await ctx.db.insert("users", {
					email: "user1@test.com",
					name: "User One",
					isAnonymous: false,
				});
			});

			const user2Id = await t.run(async (ctx) => {
				return await ctx.db.insert("users", {
					email: "user2@test.com",
					name: "User Two",
					isAnonymous: false,
				});
			});

			const groupId = await t.run(async (ctx) => {
				const groupId = await ctx.db.insert("groups", {
					name: "Test Group",
					description: "A test group",
					createdBy: user1Id,
					isPrivate: false,
				});

				// Add both users as group members
				await ctx.db.insert("groupMembers", {
					groupId,
					userId: user1Id,
					role: "admin",
					joinedAt: Date.now(),
				});

				await ctx.db.insert("groupMembers", {
					groupId,
					userId: user2Id,
					role: "member",
					joinedAt: Date.now(),
				});

				return groupId;
			});

			// Send group message
			const messageId = await t.withIdentity({ subject: user1Id }).mutation(api.messages.sendMessage, {
				content: "Hello group!",
				messageType: "text",
				groupId,
			});

			// Add custom emoji reaction to the group message
			await t.withIdentity({ subject: user2Id }).mutation(api.reactions.addMessageReaction, {
				messageId: messageId!,
				reactionType: "custom",
				customEmoji: "🎉",
			});

			// Get reaction summary
			const reactionSummary = await t.withIdentity({ subject: user2Id }).query(api.reactions.getMessageReactionSummary, {
				messageId: messageId!,
			});

			expect(reactionSummary).toHaveLength(1);
			expect(reactionSummary[0]).toMatchObject({
				reactionType: "custom",
				customEmoji: "🎉",
				count: 1,
				hasCurrentUserReacted: true,
			});
		});

		it("should handle multiple users reacting with the same reaction type", async () => {
			// Create users
			const senderId = await t.run(async (ctx) => {
				return await ctx.db.insert("users", {
					email: "sender@test.com",
					name: "Sender User",
					isAnonymous: false,
				});
			});

			const user1Id = await t.run(async (ctx) => {
				return await ctx.db.insert("users", {
					email: "user1@test.com",
					name: "User One",
					isAnonymous: false,
				});
			});

			const user2Id = await t.run(async (ctx) => {
				return await ctx.db.insert("users", {
					email: "user2@test.com",
					name: "User Two",
					isAnonymous: false,
				});
			});

			const groupId = await t.run(async (ctx) => {
				const groupId = await ctx.db.insert("groups", {
					name: "Test Group",
					description: "A test group",
					createdBy: senderId,
					isPrivate: false,
				});

				// Add all users as group members
				await ctx.db.insert("groupMembers", {
					groupId,
					userId: senderId,
					role: "admin",
					joinedAt: Date.now(),
				});

				await ctx.db.insert("groupMembers", {
					groupId,
					userId: user1Id,
					role: "member",
					joinedAt: Date.now(),
				});

				await ctx.db.insert("groupMembers", {
					groupId,
					userId: user2Id,
					role: "member",
					joinedAt: Date.now(),
				});

				return groupId;
			});

			// Send group message
			const messageId = await t.withIdentity({ subject: senderId }).mutation(api.messages.sendMessage, {
				content: "Great news everyone!",
				messageType: "text",
				groupId,
			});

			// Multiple users react with the same reaction type
			await t.withIdentity({ subject: user1Id }).mutation(api.reactions.addMessageReaction, {
				messageId: messageId!,
				reactionType: "heart",
			});

			await t.withIdentity({ subject: user2Id }).mutation(api.reactions.addMessageReaction, {
				messageId: messageId!,
				reactionType: "heart",
			});

			// Get reaction summary from user1's perspective
			const reactionSummary = await t.withIdentity({ subject: user1Id }).query(api.reactions.getMessageReactionSummary, {
				messageId: messageId!,
			});

			expect(reactionSummary).toHaveLength(1);
			expect(reactionSummary[0]).toMatchObject({
				reactionType: "heart",
				count: 2,
				hasCurrentUserReacted: true,
			});

			// Get reaction summary from sender's perspective (hasn't reacted)
			const senderReactionSummary = await t.withIdentity({ subject: senderId }).query(api.reactions.getMessageReactionSummary, {
				messageId: messageId!,
			});

			expect(senderReactionSummary).toHaveLength(1);
			expect(senderReactionSummary[0]).toMatchObject({
				reactionType: "heart",
				count: 2,
				hasCurrentUserReacted: false,
			});
		});

		it("should handle multiple different reaction types on the same message", async () => {
			// Create users
			const senderId = await t.run(async (ctx) => {
				return await ctx.db.insert("users", {
					email: "sender@test.com",
					name: "Sender User",
					isAnonymous: false,
				});
			});

			const receiverId = await t.run(async (ctx) => {
				return await ctx.db.insert("users", {
					email: "receiver@test.com",
					name: "Receiver User",
					isAnonymous: false,
				});
			});

			// Send a message
			const messageId = await t.withIdentity({ subject: senderId }).mutation(api.messages.sendMessage, {
				content: "Check out this amazing feature!",
				messageType: "text",
				receiverId,
			});

			// Receiver adds thumbs up reaction
			await t.withIdentity({ subject: receiverId }).mutation(api.reactions.addMessageReaction, {
				messageId: messageId!,
				reactionType: "thumbs_up",
			});

			// Sender adds thumbs up reaction (same type, different user)
			await t.withIdentity({ subject: senderId }).mutation(api.reactions.addMessageReaction, {
				messageId: messageId!,
				reactionType: "thumbs_up",
			});

			// Receiver changes their reaction to custom fire emoji (updates existing reaction)
			await t.withIdentity({ subject: receiverId }).mutation(api.reactions.addMessageReaction, {
				messageId: messageId!,
				reactionType: "custom",
				customEmoji: "🔥",
			});

			// Get reaction summary from receiver's perspective
			const reactionSummary = await t.withIdentity({ subject: receiverId }).query(api.reactions.getMessageReactionSummary, {
				messageId: messageId!,
			});

			expect(reactionSummary).toHaveLength(2);

			// Find thumbs up reaction (only sender has it now)
			const thumbsUp = reactionSummary.find(r => r.reactionType === "thumbs_up");
			expect(thumbsUp).toMatchObject({
				reactionType: "thumbs_up",
				count: 1,
				hasCurrentUserReacted: false, // receiver changed to fire emoji
			});

			// Find fire reaction (only receiver has it)
			const fire = reactionSummary.find(r => r.reactionType === "custom" && r.customEmoji === "🔥");
			expect(fire).toMatchObject({
				reactionType: "custom",
				customEmoji: "🔥",
				count: 1,
				hasCurrentUserReacted: true, // receiver has this reaction
			});
		});

		it("should require authentication", async () => {
			// Try to add reaction without authentication
			await expect(
				t.mutation(api.reactions.addMessageReaction, {
					messageId: "fake-message-id" as any,
					reactionType: "thumbs_up",
				})
			).rejects.toThrow();
		});
	});

	describe("removeMessageReaction", () => {
		it("should remove a reaction from a message", async () => {
			// Create users
			const senderId = await t.run(async (ctx) => {
				return await ctx.db.insert("users", {
					email: "sender@test.com",
					name: "Sender User",
					isAnonymous: false,
				});
			});

			const receiverId = await t.run(async (ctx) => {
				return await ctx.db.insert("users", {
					email: "receiver@test.com",
					name: "Receiver User",
					isAnonymous: false,
				});
			});

			// Send a message
			const messageId = await t.withIdentity({ subject: senderId }).mutation(api.messages.sendMessage, {
				content: "Test message for reaction removal",
				messageType: "text",
				receiverId,
			});

			// Add reaction
			await t.withIdentity({ subject: receiverId }).mutation(api.reactions.addMessageReaction, {
				messageId: messageId!,
				reactionType: "thumbs_up",
			});

			// Verify reaction was added
			let reactionSummary = await t.withIdentity({ subject: receiverId }).query(api.reactions.getMessageReactionSummary, {
				messageId: messageId!,
			});

			expect(reactionSummary).toHaveLength(1);
			expect(reactionSummary[0].hasCurrentUserReacted).toBe(true);

			// Remove reaction
			await t.withIdentity({ subject: receiverId }).mutation(api.reactions.removeMessageReaction, {
				messageId: messageId!,
			});

			// Verify reaction was removed
			reactionSummary = await t.withIdentity({ subject: receiverId }).query(api.reactions.getMessageReactionSummary, {
				messageId: messageId!,
			});

			expect(reactionSummary).toHaveLength(0);
		});

		it("should only remove the user's own reaction", async () => {
			// Create users
			const senderId = await t.run(async (ctx) => {
				return await ctx.db.insert("users", {
					email: "sender@test.com",
					name: "Sender User",
					isAnonymous: false,
				});
			});

			const user1Id = await t.run(async (ctx) => {
				return await ctx.db.insert("users", {
					email: "user1@test.com",
					name: "User One",
					isAnonymous: false,
				});
			});

			const user2Id = await t.run(async (ctx) => {
				return await ctx.db.insert("users", {
					email: "user2@test.com",
					name: "User Two",
					isAnonymous: false,
				});
			});

			const groupId = await t.run(async (ctx) => {
				const groupId = await ctx.db.insert("groups", {
					name: "Test Group",
					description: "A test group",
					createdBy: senderId,
					isPrivate: false,
				});

				// Add all users as group members
				await ctx.db.insert("groupMembers", {
					groupId,
					userId: senderId,
					role: "admin",
					joinedAt: Date.now(),
				});

				await ctx.db.insert("groupMembers", {
					groupId,
					userId: user1Id,
					role: "member",
					joinedAt: Date.now(),
				});

				await ctx.db.insert("groupMembers", {
					groupId,
					userId: user2Id,
					role: "member",
					joinedAt: Date.now(),
				});

				return groupId;
			});

			// Send group message
			const messageId = await t.withIdentity({ subject: senderId }).mutation(api.messages.sendMessage, {
				content: "Test message for selective reaction removal",
				messageType: "text",
				groupId,
			});

			// Both users react with the same reaction type
			await t.withIdentity({ subject: user1Id }).mutation(api.reactions.addMessageReaction, {
				messageId: messageId!,
				reactionType: "thumbs_up",
			});

			await t.withIdentity({ subject: user2Id }).mutation(api.reactions.addMessageReaction, {
				messageId: messageId!,
				reactionType: "thumbs_up",
			});

			// Verify both reactions exist
			let reactionSummary = await t.withIdentity({ subject: user1Id }).query(api.reactions.getMessageReactionSummary, {
				messageId: messageId!,
			});

			expect(reactionSummary).toHaveLength(1);
			expect(reactionSummary[0]).toMatchObject({
				reactionType: "thumbs_up",
				count: 2,
				hasCurrentUserReacted: true,
			});

			// User1 removes their reaction
			await t.withIdentity({ subject: user1Id }).mutation(api.reactions.removeMessageReaction, {
				messageId: messageId!,
			});

			// Verify only user1's reaction was removed
			reactionSummary = await t.withIdentity({ subject: user1Id }).query(api.reactions.getMessageReactionSummary, {
				messageId: messageId!,
			});

			expect(reactionSummary).toHaveLength(1);
			expect(reactionSummary[0]).toMatchObject({
				reactionType: "thumbs_up",
				count: 1,
				hasCurrentUserReacted: false, // user1 no longer has reacted
			});

			// Verify user2 still has their reaction
			reactionSummary = await t.withIdentity({ subject: user2Id }).query(api.reactions.getMessageReactionSummary, {
				messageId: messageId!,
			});

			expect(reactionSummary).toHaveLength(1);
			expect(reactionSummary[0]).toMatchObject({
				reactionType: "thumbs_up",
				count: 1,
				hasCurrentUserReacted: true, // user2 still has reacted
			});
		});

		it("should handle removing non-existent reactions gracefully", async () => {
			// Create users
			const senderId = await t.run(async (ctx) => {
				return await ctx.db.insert("users", {
					email: "sender@test.com",
					name: "Sender User",
					isAnonymous: false,
				});
			});

			const receiverId = await t.run(async (ctx) => {
				return await ctx.db.insert("users", {
					email: "receiver@test.com",
					name: "Receiver User",
					isAnonymous: false,
				});
			});

			// Send a message
			const messageId = await t.withIdentity({ subject: senderId }).mutation(api.messages.sendMessage, {
				content: "Test message without reactions",
				messageType: "text",
				receiverId,
			});

			// Try to remove a reaction that doesn't exist - should not throw
			await t.withIdentity({ subject: receiverId }).mutation(api.reactions.removeMessageReaction, {
				messageId: messageId!,
			});

			// Verify no reactions exist
			const reactionSummary = await t.withIdentity({ subject: receiverId }).query(api.reactions.getMessageReactionSummary, {
				messageId: messageId!,
			});

			expect(reactionSummary).toHaveLength(0);
		});

		it("should require authentication", async () => {
			// Try to remove reaction without authentication
			await expect(
				t.mutation(api.reactions.removeMessageReaction, {
					messageId: "fake-message-id" as any,
				})
			).rejects.toThrow();
		});
	});

	describe("getMessageReactionSummary", () => {
		it("should return empty array for messages with no reactions", async () => {
			// Create users
			const senderId = await t.run(async (ctx) => {
				return await ctx.db.insert("users", {
					email: "sender@test.com",
					name: "Sender User",
					isAnonymous: false,
				});
			});

			const receiverId = await t.run(async (ctx) => {
				return await ctx.db.insert("users", {
					email: "receiver@test.com",
					name: "Receiver User",
					isAnonymous: false,
				});
			});

			// Send a message
			const messageId = await t.withIdentity({ subject: senderId }).mutation(api.messages.sendMessage, {
				content: "Message with no reactions",
				messageType: "text",
				receiverId,
			});

			// Get reaction summary
			const reactionSummary = await t.withIdentity({ subject: receiverId }).query(api.reactions.getMessageReactionSummary, {
				messageId: messageId!,
			});

			expect(reactionSummary).toEqual([]);
		});

		it("should require authentication", async () => {
			// Create a real message first
			const senderId = await t.run(async (ctx) => {
				return await ctx.db.insert("users", {
					email: "sender@test.com",
					name: "Sender User",
					isAnonymous: false,
				});
			});

			const receiverId = await t.run(async (ctx) => {
				return await ctx.db.insert("users", {
					email: "receiver@test.com",
					name: "Receiver User",
					isAnonymous: false,
				});
			});

			const messageId = await t.withIdentity({ subject: senderId }).mutation(api.messages.sendMessage, {
				content: "Message for unauthenticated test",
				messageType: "text",
				receiverId,
			});

			// Try to get reaction summary without authentication - should throw
			await expect(
				t.query(api.reactions.getMessageReactionSummary, {
					messageId: messageId!,
				})
			).rejects.toThrow("Not authenticated");
		});

		it("should sort reactions by count (descending)", async () => {
			// Create users
			const senderId = await t.run(async (ctx) => {
				return await ctx.db.insert("users", {
					email: "sender@test.com",
					name: "Sender User",
					isAnonymous: false,
				});
			});

			const user1Id = await t.run(async (ctx) => {
				return await ctx.db.insert("users", {
					email: "user1@test.com",
					name: "User One",
					isAnonymous: false,
				});
			});

			const user2Id = await t.run(async (ctx) => {
				return await ctx.db.insert("users", {
					email: "user2@test.com",
					name: "User Two",
					isAnonymous: false,
				});
			});

			const groupId = await t.run(async (ctx) => {
				const groupId = await ctx.db.insert("groups", {
					name: "Test Group",
					description: "A test group",
					createdBy: senderId,
					isPrivate: false,
				});

				// Add all users as group members
				await ctx.db.insert("groupMembers", {
					groupId,
					userId: senderId,
					role: "admin",
					joinedAt: Date.now(),
				});

				await ctx.db.insert("groupMembers", {
					groupId,
					userId: user1Id,
					role: "member",
					joinedAt: Date.now(),
				});

				await ctx.db.insert("groupMembers", {
					groupId,
					userId: user2Id,
					role: "member",
					joinedAt: Date.now(),
				});

				return groupId;
			});

			// Send group message
			const messageId = await t.withIdentity({ subject: senderId }).mutation(api.messages.sendMessage, {
				content: "Message for reaction ordering test",
				messageType: "text",
				groupId,
			});

			// Add reactions - heart gets 2 reactions, thumbs_up gets 1
			await t.withIdentity({ subject: user1Id }).mutation(api.reactions.addMessageReaction, {
				messageId: messageId!,
				reactionType: "thumbs_up",
			});

			await t.withIdentity({ subject: user2Id }).mutation(api.reactions.addMessageReaction, {
				messageId: messageId!,
				reactionType: "heart",
			});

			await t.withIdentity({ subject: senderId }).mutation(api.reactions.addMessageReaction, {
				messageId: messageId!,
				reactionType: "heart",
			});

			// Get reaction summary
			const reactionSummary = await t.withIdentity({ subject: user1Id }).query(api.reactions.getMessageReactionSummary, {
				messageId: messageId!,
			});

			expect(reactionSummary).toHaveLength(2);
			// Heart should be first (count: 2)
			expect(reactionSummary[0]).toMatchObject({
				reactionType: "heart",
				count: 2,
			});
			// Thumbs up should be second (count: 1)
			expect(reactionSummary[1]).toMatchObject({
				reactionType: "thumbs_up",
				count: 1,
			});
		});
	});
});
