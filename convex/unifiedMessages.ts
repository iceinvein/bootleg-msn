import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import type { Doc } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";

// Get messages for either a direct conversation or group chat
export const getMessages = query({
	args: {
		otherUserId: v.optional(v.id("users")),
		groupId: v.optional(v.id("groups")),
	},
	handler: async (ctx, args) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) {
			return [];
		}

		let messages: Doc<"messages">[];

		if (args.groupId) {
			// Get group messages
			messages = await ctx.db
				.query("messages")
				.withIndex("by_group", (q) => q.eq("groupId", args.groupId))
				.order("asc")
				.collect();
		} else if (args.otherUserId) {
			// Get direct messages between two users
			const otherUserId = args.otherUserId; // TypeScript now knows this is not undefined

			const sentMessages = await ctx.db
				.query("messages")
				.withIndex("by_conversation", (q) =>
					q.eq("senderId", userId).eq("receiverId", otherUserId),
				)
				.collect();

			const receivedMessages = await ctx.db
				.query("messages")
				.withIndex("by_conversation", (q) =>
					q.eq("senderId", otherUserId).eq("receiverId", userId),
				)
				.collect();

			messages = [...sentMessages, ...receivedMessages].sort(
				(a, b) => a._creationTime - b._creationTime,
			);
		} else {
			return [];
		}

		// Get sender details for each message
		const messagesWithSenders = await Promise.all(
			messages.map(async (message) => {
				const sender = await ctx.db.get(message.senderId);
				return {
					...message,
					sender,
					isFromMe: message.senderId === userId,
				};
			}),
		);

		return messagesWithSenders;
	},
});

// Send a message (works for both direct and group messages)
export const sendMessage = mutation({
	args: {
		content: v.string(),
		messageType: v.optional(
			v.union(
				v.literal("text"),
				v.literal("emoji"),
				v.literal("file"),
				v.literal("system"),
			),
		),
		receiverId: v.optional(v.id("users")),
		groupId: v.optional(v.id("groups")),
		fileId: v.optional(v.id("_storage")),
		fileName: v.optional(v.string()),
		fileType: v.optional(v.string()),
		fileSize: v.optional(v.number()),
	},
	handler: async (ctx, args) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) {
			throw new Error("Not authenticated");
		}

		// Validate that either receiverId or groupId is provided, but not both
		if (!args.receiverId && !args.groupId) {
			throw new Error("Either receiverId or groupId must be provided");
		}
		if (args.receiverId && args.groupId) {
			throw new Error("Cannot specify both receiverId and groupId");
		}

		// If it's a group message, verify user is a member
		if (args.groupId) {
			const groupId = args.groupId; // TypeScript now knows this is not undefined

			const membership = await ctx.db
				.query("groupMembers")
				.withIndex("by_group_and_user", (q) =>
					q.eq("groupId", groupId).eq("userId", userId),
				)
				.unique();

			if (!membership) {
				throw new Error("You are not a member of this group");
			}
		}

		await ctx.db.insert("messages", {
			senderId: userId,
			receiverId: args.receiverId,
			groupId: args.groupId,
			content: args.content,
			messageType: args.messageType || "text",
			fileId: args.fileId,
			fileName: args.fileName,
			fileType: args.fileType,
			fileSize: args.fileSize,
			isRead: false,
		});
	},
});

// Mark messages as read
export const markMessagesAsRead = mutation({
	args: {
		otherUserId: v.optional(v.id("users")),
		groupId: v.optional(v.id("groups")),
	},
	handler: async (ctx, args) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) {
			throw new Error("Not authenticated");
		}

		if (args.groupId) {
			// Mark group messages as read
			const groupId = args.groupId; // TypeScript now knows this is not undefined

			const unreadMessages = await ctx.db
				.query("messages")
				.withIndex("by_group", (q) => q.eq("groupId", groupId))
				.filter((q) =>
					q.and(
						q.neq(q.field("senderId"), userId),
						q.eq(q.field("isRead"), false),
					),
				)
				.collect();

			await Promise.all(
				unreadMessages.map((message) =>
					ctx.db.patch(message._id, { isRead: true }),
				),
			);
		} else if (args.otherUserId) {
			// Mark direct messages as read
			const otherUserId = args.otherUserId; // TypeScript now knows this is not undefined

			const unreadMessages = await ctx.db
				.query("messages")
				.withIndex("by_unread", (q) =>
					q.eq("receiverId", userId).eq("isRead", false),
				)
				.filter((q) => q.eq(q.field("senderId"), otherUserId))
				.collect();

			await Promise.all(
				unreadMessages.map((message) =>
					ctx.db.patch(message._id, { isRead: true }),
				),
			);
		}
	},
});

// Edit a message
export const editMessage = mutation({
	args: {
		messageId: v.id("messages"),
		newContent: v.string(),
	},
	handler: async (ctx, args) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) {
			throw new Error("Not authenticated");
		}

		const message = await ctx.db.get(args.messageId);
		if (!message || message.senderId !== userId) {
			throw new Error("Message not found or unauthorized");
		}

		await ctx.db.patch(args.messageId, {
			content: args.newContent,
			isEdited: true,
			editedAt: Date.now(),
		});
	},
});

// Delete a message
export const deleteMessage = mutation({
	args: {
		messageId: v.id("messages"),
	},
	handler: async (ctx, args) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) {
			throw new Error("Not authenticated");
		}

		const message = await ctx.db.get(args.messageId);
		if (!message || message.senderId !== userId) {
			throw new Error("Message not found or unauthorized");
		}

		await ctx.db.patch(args.messageId, {
			isDeleted: true,
			deletedAt: Date.now(),
		});
	},
});
