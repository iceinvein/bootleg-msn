import { v } from "convex/values";
import type { Doc } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";
import {
	canSendNudge,
	getCurrentUser,
	isUserInFocusMode,
	isVipContact,
	logUserActivity,
} from "./utils";
import { nudgeTypeValidator, sendNudgeValidator } from "./validators";

// Send a nudge or buzz to another user
export const sendNudge = mutation({
	args: sendNudgeValidator,
	returns: v.union(v.id("nudges"), v.null()),
	handler: async (ctx, args) => {
		const user = await getCurrentUser(ctx);

		// Check if user can send nudge (cooldown check)
		const canSend = await canSendNudge(ctx, user._id, args.toUserId);
		if (!canSend) {
			throw new Error("Please wait before sending another nudge");
		}

		// Check if recipient is in focus mode
		const recipientInFocusMode = await isUserInFocusMode(ctx, args.toUserId);
		const isVip = await isVipContact(ctx, args.toUserId, user._id);

		if (recipientInFocusMode && !isVip) {
			throw new Error("User is in focus mode and cannot receive nudges");
		}

		// Check if recipient has nudge notifications enabled
		const recipientSettings = await ctx.db
			.query("userNotificationSettings")
			.withIndex("by_user", (q) => q.eq("userId", args.toUserId))
			.unique();

		if (recipientSettings && !recipientSettings.nudgeNotifications) {
			throw new Error("User has disabled nudge notifications");
		}

		// Create the nudge
		const nudgeId = await ctx.db.insert("nudges", {
			fromUserId: user._id,
			toUserId: args.toUserId,
			nudgeType: args.nudgeType,
			conversationId: args.conversationId,
			conversationType: args.conversationType,
			createdAt: Date.now(),
		});

		await logUserActivity(
			ctx,
			user._id,
			"send_nudge",
			`Sent ${args.nudgeType} to user`,
			{
				contactId: args.toUserId,
			},
		);

		return nudgeId;
	},
});

// Get recent nudges received by the current user
export const getReceivedNudges = query({
	args: {
		limit: v.optional(v.number()),
		since: v.optional(v.number()),
	},
	returns: v.array(
		v.object({
			_id: v.id("nudges"),
			fromUserId: v.id("users"),
			nudgeType: nudgeTypeValidator,
			conversationId: v.optional(v.string()),
			conversationType: v.union(v.literal("direct"), v.literal("group")),
			createdAt: v.number(),
			fromUser: v.object({
				_id: v.id("users"),
				name: v.optional(v.string()),
				image: v.optional(v.string()),
			}),
		}),
	),
	handler: async (ctx, args) => {
		const user = await getCurrentUser(ctx);
		const limit = args.limit || 50;
		const since = args.since || Date.now() - 24 * 60 * 60 * 1000; // Last 24 hours by default

		const nudges = await ctx.db
			.query("nudges")
			.withIndex("by_recipient_and_time", (q) =>
				q.eq("toUserId", user._id).gte("createdAt", since),
			)
			.order("desc")
			.take(limit);

		// Get sender details for each nudge
		const nudgesWithSenders = await Promise.all(
			nudges.map(async (nudge) => {
				const fromUser = await ctx.db.get(nudge.fromUserId);
				if (!fromUser) {
					throw new Error("Sender user not found");
				}
				return {
					_id: nudge._id,
					fromUserId: nudge.fromUserId,
					nudgeType: nudge.nudgeType,
					conversationId: nudge.conversationId,
					conversationType: nudge.conversationType,
					createdAt: nudge.createdAt,
					fromUser: {
						_id: fromUser._id,
						name: fromUser.name,
						image: fromUser.image,
					},
				};
			}),
		);

		return nudgesWithSenders;
	},
});

// Get nudges sent by the current user
export const getSentNudges = query({
	args: {
		limit: v.optional(v.number()),
		since: v.optional(v.number()),
	},
	returns: v.array(
		v.object({
			_id: v.id("nudges"),
			toUserId: v.id("users"),
			nudgeType: nudgeTypeValidator,
			conversationId: v.optional(v.string()),
			conversationType: v.union(v.literal("direct"), v.literal("group")),
			createdAt: v.number(),
			toUser: v.object({
				_id: v.id("users"),
				name: v.optional(v.string()),
				image: v.optional(v.string()),
			}),
		}),
	),
	handler: async (ctx, args) => {
		const user = await getCurrentUser(ctx);
		const limit = args.limit || 50;
		const since = args.since || Date.now() - 24 * 60 * 60 * 1000; // Last 24 hours by default

		const nudges = await ctx.db
			.query("nudges")
			.withIndex("by_sender_and_time", (q) =>
				q.eq("fromUserId", user._id).gte("createdAt", since),
			)
			.order("desc")
			.take(limit);

		// Get recipient details for each nudge
		const nudgesWithRecipients = await Promise.all(
			nudges.map(async (nudge) => {
				const toUser = await ctx.db.get(nudge.toUserId);
				if (!toUser) {
					throw new Error("Recipient user not found");
				}
				return {
					_id: nudge._id,
					toUserId: nudge.toUserId,
					nudgeType: nudge.nudgeType,
					conversationId: nudge.conversationId,
					conversationType: nudge.conversationType,
					createdAt: nudge.createdAt,
					toUser: {
						_id: toUser._id,
						name: toUser.name,
						image: toUser.image,
					},
				};
			}),
		);

		return nudgesWithRecipients;
	},
});

// Get nudges for a specific conversation (direct or group)
export const getConversationNudges = query({
	args: {
		otherUserId: v.optional(v.id("users")),
		groupId: v.optional(v.id("groups")),
		limit: v.optional(v.number()),
		since: v.optional(v.number()),
	},
	returns: v.array(
		v.object({
			_id: v.id("nudges"),
			fromUserId: v.id("users"),
			toUserId: v.id("users"),
			nudgeType: nudgeTypeValidator,
			conversationId: v.optional(v.string()),
			conversationType: v.union(v.literal("direct"), v.literal("group")),
			createdAt: v.number(),
			fromUser: v.object({
				_id: v.id("users"),
				name: v.optional(v.string()),
				image: v.optional(v.string()),
			}),
			toUser: v.object({
				_id: v.id("users"),
				name: v.optional(v.string()),
				image: v.optional(v.string()),
			}),
			isFromMe: v.boolean(),
		}),
	),
	handler: async (ctx, args) => {
		const user = await getCurrentUser(ctx);
		const limit = args.limit || 20;
		const since = args.since || Date.now() - 24 * 60 * 60 * 1000; // Last 24 hours by default

		let nudges: Doc<"nudges">[];

		if (args.otherUserId) {
			// Get nudges between two users (both directions)
			nudges = await ctx.db
				.query("nudges")
				.filter((q) =>
					q.and(
						q.or(
							q.and(
								q.eq(q.field("fromUserId"), user._id),
								q.eq(q.field("toUserId"), args.otherUserId),
							),
							q.and(
								q.eq(q.field("fromUserId"), args.otherUserId),
								q.eq(q.field("toUserId"), user._id),
							),
						),
						q.gte(q.field("createdAt"), since),
						q.eq(q.field("conversationType"), "direct"),
					),
				)
				.order("asc")
				.take(limit);
		} else if (args.groupId) {
			// Get nudges for a group (not implemented in original schema, but keeping for future)
			nudges = await ctx.db
				.query("nudges")
				.filter((q) =>
					q.and(
						q.eq(q.field("conversationId"), args.groupId),
						q.gte(q.field("createdAt"), since),
						q.eq(q.field("conversationType"), "group"),
					),
				)
				.order("asc")
				.take(limit);
		} else {
			return [];
		}

		// Get user details for each nudge
		const nudgesWithUsers = await Promise.all(
			nudges.map(async (nudge) => {
				const fromUser = await ctx.db.get(nudge.fromUserId);
				const toUser = await ctx.db.get(nudge.toUserId);

				if (!fromUser || !toUser) {
					throw new Error("User not found");
				}

				return {
					_id: nudge._id,
					fromUserId: nudge.fromUserId,
					toUserId: nudge.toUserId,
					nudgeType: nudge.nudgeType,
					conversationId: nudge.conversationId,
					conversationType: nudge.conversationType,
					createdAt: nudge.createdAt,
					fromUser: {
						_id: fromUser._id,
						name: fromUser.name,
						image: fromUser.image,
					},
					toUser: {
						_id: toUser._id,
						name: toUser.name,
						image: toUser.image,
					},
					isFromMe: nudge.fromUserId === user._id,
				};
			}),
		);

		return nudgesWithUsers;
	},
});

// Check if user can send nudge (for UI state)
export const canSendNudgeToUser = query({
	args: { toUserId: v.id("users") },
	returns: v.object({
		canSend: v.boolean(),
		reason: v.optional(v.string()),
	}),
	handler: async (ctx, args) => {
		const user = await getCurrentUser(ctx);

		// Check cooldown
		const canSend = await canSendNudge(ctx, user._id, args.toUserId);
		if (!canSend) {
			return {
				canSend: false,
				reason: "Please wait before sending another nudge",
			};
		}

		// Check if recipient is in focus mode
		const recipientInFocusMode = await isUserInFocusMode(ctx, args.toUserId);
		const isVip = await isVipContact(ctx, args.toUserId, user._id);

		if (recipientInFocusMode && !isVip) {
			return {
				canSend: false,
				reason: "User is in focus mode",
			};
		}

		// Check if recipient has nudge notifications enabled
		const recipientSettings = await ctx.db
			.query("userNotificationSettings")
			.withIndex("by_user", (q) => q.eq("userId", args.toUserId))
			.unique();

		if (recipientSettings && !recipientSettings.nudgeNotifications) {
			return {
				canSend: false,
				reason: "User has disabled nudge notifications",
			};
		}

		return { canSend: true };
	},
});
