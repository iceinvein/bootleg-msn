import { v } from "convex/values";
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
					...nudge,
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
					...nudge,
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
