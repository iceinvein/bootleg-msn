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

		// Check if user already reacted to this message
		const existingReaction = await ctx.db
			.query("messageReactions")
			.withIndex("by_message_and_user", (q) =>
				q.eq("messageId", args.messageId).eq("userId", user._id),
			)
			.unique();

		if (existingReaction) {
			// Update existing reaction
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

// Add reaction to a group message
export const addGroupMessageReaction = mutation({
	args: addGroupReactionValidator,
	returns: v.id("groupMessageReactions"),
	handler: async (ctx, args) => {
		const user = await getCurrentUser(ctx);

		// Check if user already reacted to this message
		const existingReaction = await ctx.db
			.query("groupMessageReactions")
			.withIndex("by_message_and_user", (q) =>
				q.eq("messageId", args.messageId).eq("userId", user._id),
			)
			.unique();

		if (existingReaction) {
			// Update existing reaction
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

// Remove reaction from a group message
export const removeGroupMessageReaction = mutation({
	args: { messageId: v.id("groupMessages") },
	returns: v.null(),
	handler: async (ctx, args) => {
		const user = await getCurrentUser(ctx);

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

// Get reactions for a group message
export const getGroupMessageReactions = query({
	args: { messageId: v.id("groupMessages") },
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
