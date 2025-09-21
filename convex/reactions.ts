import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getCurrentUser, logUserActivity } from "./utils";
import {
	addGroupReactionValidator,
	addReactionValidator,
	reactionTypeValidator,
} from "./validators";

// Add reaction to a direct message
export const addMessageReaction = mutation({
	args: addReactionValidator,
	returns: v.id("messageReactions"),
	handler: async (ctx, args) => {
		const user = await getCurrentUser(ctx);

		// Verify the message exists and user has access to it
		const message = await ctx.db.get(args.messageId);
		if (!message) {
			throw new Error("Message not found");
		}

		// Check if user has access to this message (sender or receiver)
		if (message.senderId !== user._id && message.receiverId !== user._id) {
			throw new Error(
				"Access denied: You can only react to messages you're part of",
			);
		}

		// Validate custom emoji if provided
		if (args.reactionType === "custom" && !args.customEmoji) {
			throw new Error(
				"Custom emoji is required when reaction type is 'custom'",
			);
		}

		// Check if user already reacted to this message
		const existingReaction = await ctx.db
			.query("messageReactions")
			.withIndex("by_message_and_user", (q) =>
				q.eq("messageId", args.messageId).eq("userId", user._id),
			)
			.unique();

		if (existingReaction) {
			// Update existing reaction if it's different
			if (
				existingReaction.reactionType !== args.reactionType ||
				existingReaction.customEmoji !== args.customEmoji
			) {
				await ctx.db.patch(existingReaction._id, {
					reactionType: args.reactionType,
					customEmoji: args.customEmoji,
					createdAt: Date.now(),
				});

				await logUserActivity(
					ctx,
					user._id,
					"update_message_reaction",
					undefined,
					{
						messageId: args.messageId,
					},
				);
			}

			return existingReaction._id;
		}

		// Create new reaction
		const reactionId = await ctx.db.insert("messageReactions", {
			messageId: args.messageId,
			userId: user._id,
			reactionType: args.reactionType,
			customEmoji: args.customEmoji,
			createdAt: Date.now(),
		});

		await logUserActivity(ctx, user._id, "add_message_reaction", undefined, {
			messageId: args.messageId,
		});

		return reactionId;
	},
});

// FUTURE: GROUP_CHAT_REACTIONS - Group message reactions system
// Add reaction to a group message
export const addGroupMessageReaction = mutation({
	args: addGroupReactionValidator,
	returns: v.id("groupMessageReactions"),
	handler: async (ctx, args) => {
		const user = await getCurrentUser(ctx);

		// Verify the message exists
		const message = await ctx.db.get(args.messageId);
		if (!message) {
			throw new Error("Message not found");
		}

		// Check if user is a member of the group
		if (!message.groupId) {
			throw new Error("Message is not a group message");
		}

		const groupId = message.groupId; // TypeScript now knows this is not undefined
		const membership = await ctx.db
			.query("groupMembers")
			.withIndex("by_group_and_user", (q) =>
				q.eq("groupId", groupId).eq("userId", user._id),
			)
			.unique();

		if (!membership) {
			throw new Error(
				"Access denied: You must be a group member to react to messages",
			);
		}

		// Validate custom emoji if provided
		if (args.reactionType === "custom" && !args.customEmoji) {
			throw new Error(
				"Custom emoji is required when reaction type is 'custom'",
			);
		}

		// Check if user already reacted to this message
		const existingReaction = await ctx.db
			.query("groupMessageReactions")
			.withIndex("by_message_and_user", (q) =>
				q.eq("messageId", args.messageId).eq("userId", user._id),
			)
			.unique();

		if (existingReaction) {
			// Update existing reaction if it's different
			if (
				existingReaction.reactionType !== args.reactionType ||
				existingReaction.customEmoji !== args.customEmoji
			) {
				await ctx.db.patch(existingReaction._id, {
					reactionType: args.reactionType,
					customEmoji: args.customEmoji,
					createdAt: Date.now(),
				});

				await logUserActivity(
					ctx,
					user._id,
					"update_group_message_reaction",
					undefined,
					{
						messageId: args.messageId,
					},
				);
			}

			return existingReaction._id;
		}

		// Create new reaction
		const reactionId = await ctx.db.insert("groupMessageReactions", {
			messageId: args.messageId,
			userId: user._id,
			reactionType: args.reactionType,
			customEmoji: args.customEmoji,
			createdAt: Date.now(),
		});

		await logUserActivity(
			ctx,
			user._id,
			"add_group_message_reaction",
			undefined,
			{
				messageId: args.messageId,
			},
		);

		return reactionId;
	},
});

// Remove reaction from a direct message
export const removeMessageReaction = mutation({
	args: { messageId: v.id("messages") },
	returns: v.null(),
	handler: async (ctx, args) => {
		const user = await getCurrentUser(ctx);

		// Verify the message exists
		const message = await ctx.db.get(args.messageId);
		if (!message) {
			throw new Error("Message not found");
		}

		// Check if user has access to this message (sender or receiver)
		if (message.senderId !== user._id && message.receiverId !== user._id) {
			throw new Error(
				"Access denied: You can only remove reactions from messages you're part of",
			);
		}

		const reaction = await ctx.db
			.query("messageReactions")
			.withIndex("by_message_and_user", (q) =>
				q.eq("messageId", args.messageId).eq("userId", user._id),
			)
			.unique();

		if (reaction) {
			await ctx.db.delete(reaction._id);

			await logUserActivity(
				ctx,
				user._id,
				"remove_message_reaction",
				undefined,
				{
					messageId: args.messageId,
				},
			);
		}
	},
});

// FUTURE: GROUP_CHAT_REACTIONS - Group message reactions system
// Remove reaction from a group message
export const removeGroupMessageReaction = mutation({
	args: { messageId: v.id("messages") },
	returns: v.null(),
	handler: async (ctx, args) => {
		const user = await getCurrentUser(ctx);

		// Verify the message exists
		const message = await ctx.db.get(args.messageId);
		if (!message) {
			throw new Error("Message not found");
		}

		// Check if user is a member of the group
		if (!message.groupId) {
			throw new Error("Message is not a group message");
		}

		const groupId = message.groupId; // TypeScript now knows this is not undefined
		const membership = await ctx.db
			.query("groupMembers")
			.withIndex("by_group_and_user", (q) =>
				q.eq("groupId", groupId).eq("userId", user._id),
			)
			.unique();

		if (!membership) {
			throw new Error(
				"Access denied: You must be a group member to remove reactions",
			);
		}

		const reaction = await ctx.db
			.query("groupMessageReactions")
			.withIndex("by_message_and_user", (q) =>
				q.eq("messageId", args.messageId).eq("userId", user._id),
			)
			.unique();

		if (reaction) {
			await ctx.db.delete(reaction._id);

			await logUserActivity(
				ctx,
				user._id,
				"remove_group_message_reaction",
				undefined,
				{
					messageId: args.messageId,
				},
			);
		}
	},
});

// Get reactions for a direct message
export const getMessageReactions = query({
	args: { messageId: v.id("messages") },
	returns: v.array(
		v.object({
			_id: v.id("messageReactions"),
			userId: v.id("users"),
			reactionType: reactionTypeValidator,
			customEmoji: v.optional(v.string()),
			createdAt: v.number(),
			user: v.object({
				_id: v.id("users"),
				name: v.optional(v.string()),
				image: v.optional(v.string()),
			}),
		}),
	),
	handler: async (ctx, args) => {
		const reactions = await ctx.db
			.query("messageReactions")
			.withIndex("by_message", (q) => q.eq("messageId", args.messageId))
			.collect();

		// Get user details for each reaction
		const reactionsWithUsers = await Promise.all(
			reactions.map(async (reaction) => {
				const user = await ctx.db.get(reaction.userId);
				if (!user) {
					throw new Error("User not found for reaction");
				}
				return {
					...reaction,
					user: {
						_id: user._id,
						name: user.name,
						image: user.image,
					},
				};
			}),
		);

		return reactionsWithUsers;
	},
});

// FUTURE: GROUP_CHAT_REACTIONS - Group message reactions system
// Get reactions for a group message
export const getGroupMessageReactions = query({
	args: { messageId: v.id("messages") },
	returns: v.array(
		v.object({
			_id: v.id("groupMessageReactions"),
			userId: v.id("users"),
			reactionType: reactionTypeValidator,
			customEmoji: v.optional(v.string()),
			createdAt: v.number(),
			user: v.object({
				_id: v.id("users"),
				name: v.optional(v.string()),
				image: v.optional(v.string()),
			}),
		}),
	),
	handler: async (ctx, args) => {
		const reactions = await ctx.db
			.query("groupMessageReactions")
			.withIndex("by_message", (q) => q.eq("messageId", args.messageId))
			.collect();

		// Get user details for each reaction
		const reactionsWithUsers = await Promise.all(
			reactions.map(async (reaction) => {
				const user = await ctx.db.get(reaction.userId);
				if (!user) {
					throw new Error("User not found for reaction");
				}
				return {
					...reaction,
					user: {
						_id: user._id,
						name: user.name,
						image: user.image,
					},
				};
			}),
		);

		return reactionsWithUsers;
	},
});

// Get reaction summary for a direct message (grouped by reaction type with counts)
export const getMessageReactionSummary = query({
	args: { messageId: v.id("messages") },
	returns: v.array(
		v.object({
			reactionType: reactionTypeValidator,
			customEmoji: v.optional(v.string()),
			count: v.number(),
			users: v.array(
				v.object({
					_id: v.id("users"),
					name: v.optional(v.string()),
					image: v.optional(v.string()),
				}),
			),
			hasCurrentUserReacted: v.boolean(),
		}),
	),
	handler: async (ctx, args) => {
		const user = await getCurrentUser(ctx);
		const reactions = await ctx.db
			.query("messageReactions")
			.withIndex("by_message", (q) => q.eq("messageId", args.messageId))
			.collect();

		// Group reactions by type
		const reactionGroups = new Map<string, typeof reactions>();
		for (const reaction of reactions) {
			const key = reaction.customEmoji || reaction.reactionType;
			const existingGroup = reactionGroups.get(key);
			if (existingGroup) {
				existingGroup.push(reaction);
			} else {
				reactionGroups.set(key, [reaction]);
			}
		}

		// Build summary with user details
		const summary = await Promise.all(
			Array.from(reactionGroups.entries()).map(
				async ([_key, groupReactions]) => {
					const users = await Promise.all(
						groupReactions.map(async (reaction) => {
							const reactionUser = await ctx.db.get(reaction.userId);
							if (!reactionUser) {
								throw new Error("User not found for reaction");
							}
							return {
								_id: reactionUser._id,
								name: reactionUser.name,
								image: reactionUser.image,
							};
						}),
					);

					const hasCurrentUserReacted = groupReactions.some(
						(reaction) => reaction.userId === user._id,
					);

					return {
						reactionType: groupReactions[0].reactionType,
						customEmoji: groupReactions[0].customEmoji,
						count: groupReactions.length,
						users,
						hasCurrentUserReacted,
					};
				},
			),
		);

		// Sort by count (descending) then by creation time
		return summary.sort((a, b) => b.count - a.count);
	},
});

// FUTURE: GROUP_CHAT_REACTIONS - Group message reactions system
// Get reaction summary for a group message (grouped by reaction type with counts)
export const getGroupMessageReactionSummary = query({
	args: { messageId: v.id("messages") },
	returns: v.array(
		v.object({
			reactionType: reactionTypeValidator,
			customEmoji: v.optional(v.string()),
			count: v.number(),
			users: v.array(
				v.object({
					_id: v.id("users"),
					name: v.optional(v.string()),
					image: v.optional(v.string()),
				}),
			),
			hasCurrentUserReacted: v.boolean(),
		}),
	),
	handler: async (ctx, args) => {
		const user = await getCurrentUser(ctx);
		const reactions = await ctx.db
			.query("groupMessageReactions")
			.withIndex("by_message", (q) => q.eq("messageId", args.messageId))
			.collect();

		// Group reactions by type
		const reactionGroups = new Map<string, typeof reactions>();
		for (const reaction of reactions) {
			const key = reaction.customEmoji || reaction.reactionType;
			const existingGroup = reactionGroups.get(key);
			if (existingGroup) {
				existingGroup.push(reaction);
			} else {
				reactionGroups.set(key, [reaction]);
			}
		}

		// Build summary with user details
		const summary = await Promise.all(
			Array.from(reactionGroups.entries()).map(
				async ([_key, groupReactions]) => {
					const users = await Promise.all(
						groupReactions.map(async (reaction) => {
							const reactionUser = await ctx.db.get(reaction.userId);
							if (!reactionUser) {
								throw new Error("User not found for reaction");
							}
							return {
								_id: reactionUser._id,
								name: reactionUser.name,
								image: reactionUser.image,
							};
						}),
					);

					const hasCurrentUserReacted = groupReactions.some(
						(reaction) => reaction.userId === user._id,
					);

					return {
						reactionType: groupReactions[0].reactionType,
						customEmoji: groupReactions[0].customEmoji,
						count: groupReactions.length,
						users,
						hasCurrentUserReacted,
					};
				},
			),
		);

		// Sort by count (descending) then by creation time
		return summary.sort((a, b) => b.count - a.count);
	},
});

// Check if current user has reacted to a message
export const hasUserReactedToMessage = query({
	args: { messageId: v.id("messages") },
	returns: v.union(reactionTypeValidator, v.null()),
	handler: async (ctx, args) => {
		const user = await getCurrentUser(ctx);

		const reaction = await ctx.db
			.query("messageReactions")
			.withIndex("by_message_and_user", (q) =>
				q.eq("messageId", args.messageId).eq("userId", user._id),
			)
			.unique();

		return reaction ? reaction.reactionType : null;
	},
});

// FUTURE: GROUP_CHAT_REACTIONS - Group message reactions system
// Check if current user has reacted to a group message
export const hasUserReactedToGroupMessage = query({
	args: { messageId: v.id("messages") },
	returns: v.union(reactionTypeValidator, v.null()),
	handler: async (ctx, args) => {
		const user = await getCurrentUser(ctx);

		const reaction = await ctx.db
			.query("groupMessageReactions")
			.withIndex("by_message_and_user", (q) =>
				q.eq("messageId", args.messageId).eq("userId", user._id),
			)
			.unique();

		return reaction ? reaction.reactionType : null;
	},
});
