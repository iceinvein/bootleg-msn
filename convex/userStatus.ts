import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const updateStatus = mutation({
	args: {
		status: v.union(
			v.literal("online"),
			v.literal("away"),
			v.literal("busy"),
			v.literal("invisible"),
			v.literal("offline"),
		),
		statusMessage: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) {
			throw new Error("Not authenticated");
		}

		const existingStatus = await ctx.db
			.query("userStatus")
			.withIndex("by_user", (q) => q.eq("userId", userId))
			.unique();

		if (existingStatus) {
			await ctx.db.patch(existingStatus._id, {
				status: args.status,
				statusMessage: args.statusMessage,
				lastSeen: Date.now(),
			});
		} else {
			await ctx.db.insert("userStatus", {
				userId,
				status: args.status,
				statusMessage: args.statusMessage,
				lastSeen: Date.now(),
			});
		}
	},
});

export const initializeUserStatus = mutation({
	args: {},
	handler: async (ctx) => {
		try {
			const userId = await getAuthUserId(ctx);
			if (!userId) {
				throw new Error("Not authenticated");
			}

			const existingStatus = await ctx.db
				.query("userStatus")
				.withIndex("by_user", (q) => q.eq("userId", userId))
				.unique();

			if (existingStatus) {
				// Update last seen when user comes online
				await ctx.db.patch(existingStatus._id, {
					status: "online",
					lastSeen: Date.now(),
				});
			} else {
				await ctx.db.insert("userStatus", {
					userId,
					status: "online",
					lastSeen: Date.now(),
				});
			}
		} catch (error) {
			// Log error but don't throw to prevent mutation from getting stuck
			console.error("Error in initializeUserStatus:", error);
		}
	},
});

export const updateLastSeen = mutation({
	args: {},
	handler: async (ctx) => {
		try {
			const userId = await getAuthUserId(ctx);
			if (!userId) {
				return; // Silently return if not authenticated
			}

			const existingStatus = await ctx.db
				.query("userStatus")
				.withIndex("by_user", (q) => q.eq("userId", userId))
				.unique();

			if (existingStatus) {
				await ctx.db.patch(existingStatus._id, {
					lastSeen: Date.now(),
				});
			}
		} catch (error) {
			// Log error but don't throw to prevent mutation from getting stuck
			console.error("Error in updateLastSeen:", error);
		}
	},
});

export const setTyping = mutation({
	args: {
		chatWithUserId: v.optional(v.id("users")),
		groupId: v.optional(v.id("groups")),
		isTyping: v.boolean(),
	},
	handler: async (ctx, args) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) {
			throw new Error("Not authenticated");
		}

		if (args.chatWithUserId) {
			// Direct message typing indicator
			const existingIndicator = await ctx.db
				.query("typingIndicators")
				.withIndex("by_chat", (q) =>
					q.eq("userId", userId).eq("chatWithUserId", args.chatWithUserId),
				)
				.unique();

			if (existingIndicator) {
				await ctx.db.patch(existingIndicator._id, {
					isTyping: args.isTyping,
					lastTypingTime: Date.now(),
				});
			} else {
				await ctx.db.insert("typingIndicators", {
					userId,
					chatWithUserId: args.chatWithUserId,
					isTyping: args.isTyping,
					lastTypingTime: Date.now(),
				});
			}
		} else if (args.groupId) {
			// Group chat typing indicator
			const existingIndicator = await ctx.db
				.query("typingIndicators")
				.withIndex("by_group_chat", (q) =>
					q.eq("userId", userId).eq("groupId", args.groupId),
				)
				.unique();

			if (existingIndicator) {
				await ctx.db.patch(existingIndicator._id, {
					isTyping: args.isTyping,
					lastTypingTime: Date.now(),
				});
			} else {
				await ctx.db.insert("typingIndicators", {
					userId,
					groupId: args.groupId,
					isTyping: args.isTyping,
					lastTypingTime: Date.now(),
				});
			}
		}
	},
});

export const getTypingIndicator = query({
	args: {
		otherUserId: v.id("users"),
	},
	handler: async (ctx, args) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) {
			return null;
		}

		const indicator = await ctx.db
			.query("typingIndicators")
			.withIndex("by_chat", (q) =>
				q.eq("userId", args.otherUserId).eq("chatWithUserId", userId),
			)
			.unique();

		if (!indicator || !indicator.isTyping) {
			return null;
		}

		// Check if typing indicator is recent (within 5 seconds)
		const fiveSecondsAgo = Date.now() - 5000;
		if (indicator.lastTypingTime < fiveSecondsAgo) {
			return null;
		}

		return indicator;
	},
});

export const getGroupTypingIndicators = query({
	args: {
		groupId: v.id("groups"),
	},
	handler: async (ctx, args) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) {
			return [];
		}

		const indicators = await ctx.db
			.query("typingIndicators")
			.filter((q) =>
				q.and(
					q.eq(q.field("groupId"), args.groupId),
					q.neq(q.field("userId"), userId),
					q.eq(q.field("isTyping"), true),
				),
			)
			.collect();

		// Filter out old typing indicators
		const fiveSecondsAgo = Date.now() - 5000;
		const recentIndicators = indicators.filter(
			(i) => i.lastTypingTime >= fiveSecondsAgo,
		);

		// Get user details for each indicator
		const indicatorsWithUsers = await Promise.all(
			recentIndicators.map(async (indicator) => {
				const user = await ctx.db.get(indicator.userId);
				return {
					...indicator,
					user,
				};
			}),
		);

		return indicatorsWithUsers;
	},
});
