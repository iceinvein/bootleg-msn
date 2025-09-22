import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { api } from "./_generated/api";
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
			// Check if user is a member of the group
			const groupId = args.groupId; // TypeScript now knows this is not undefined
			const membership = await ctx.db
				.query("groupMembers")
				.withIndex("by_group_and_user", (q) =>
					q.eq("groupId", groupId).eq("userId", userId),
				)
				.unique();

			if (!membership) {
				return [];
			}

			// Get group messages
			const allMessages = await ctx.db
				.query("messages")
				.withIndex("by_group", (q) => q.eq("groupId", groupId))
				.order("asc")
				.collect();

			// Only show messages from after the user joined the group
			messages = allMessages.filter(
				(msg) => msg._creationTime >= membership.joinedAt,
			);
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

		// Schedule push notifications depending on conversation type
		// Suppress for system messages (only send for text/emoji/file)
		const isSystem = args.messageType === "system";
		if (!isSystem) {
			if (args.receiverId) {
				await ctx.scheduler.runAfter(0, api.push.notifyNewDirectMessage, {
					senderId: userId,
					receiverId: args.receiverId,
					content: args.content,
				});
			} else if (args.groupId) {
				await ctx.scheduler.runAfter(0, api.push.notifyNewGroupMessage, {
					senderId: userId,
					groupId: args.groupId,
					content: args.content,
				});
			}
		}
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

			// Check if user is a member of the group and get join time
			const membership = await ctx.db
				.query("groupMembers")
				.withIndex("by_group_and_user", (q) =>
					q.eq("groupId", groupId).eq("userId", userId),
				)
				.unique();

			if (!membership) {
				throw new Error("You are not a member of this group");
			}

			// Get current user's email for system message filtering
			const currentUser = await ctx.db.get(userId);
			const userEmail = currentUser?.email || "";

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

			// Only mark messages as read that were sent after the user joined
			// and exclude system messages about the user joining
			const messagesToMarkAsRead = unreadMessages.filter(
				(msg) =>
					msg._creationTime >= membership.joinedAt &&
					!(
						msg.messageType === "system" &&
						msg.content.includes(`added ${userEmail}`)
					),
			);

			await Promise.all(
				messagesToMarkAsRead.map((message) =>
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
		if (!message) {
			throw new Error("Message not found");
		}

		// Only the sender can edit their message
		if (message.senderId !== userId) {
			throw new Error("You can only edit your own messages");
		}

		// Don't allow editing deleted messages
		if (message.isDeleted) {
			throw new Error("Cannot edit deleted messages");
		}

		// Don't allow editing file messages
		if (message.messageType === "file") {
			throw new Error("Cannot edit file messages");
		}

		// Don't allow editing system messages
		if (message.messageType === "system") {
			throw new Error("Cannot edit system messages");
		}

		await ctx.db.patch(args.messageId, {
			content: args.newContent.trim(),
			isEdited: true,
			editedAt: Date.now(),
		});
	},
});

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
		if (!message) {
			throw new Error("Message not found");
		}

		// Only the sender can delete their message
		if (message.senderId !== userId) {
			throw new Error("You can only delete your own messages");
		}

		// Mark as deleted instead of actually deleting
		await ctx.db.patch(args.messageId, {
			isDeleted: true,
			deletedAt: Date.now(),
		});
	},
});

// Get unread count for a group (respecting join time and excluding self-join system messages)
export const getGroupUnreadCount = query({
	args: {
		groupId: v.id("groups"),
	},
	handler: async (ctx, args) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) {
			return 0;
		}

		// Check if user is a member of the group
		const membership = await ctx.db
			.query("groupMembers")
			.withIndex("by_group_and_user", (q) =>
				q.eq("groupId", args.groupId).eq("userId", userId),
			)
			.unique();

		if (!membership) {
			return 0;
		}

		// Get current user's email for system message filtering
		const currentUser = await ctx.db.get(userId);
		const userEmail = currentUser?.email || "";

		// Get all messages in the group
		const allMessages = await ctx.db
			.query("messages")
			.withIndex("by_group", (q) => q.eq("groupId", args.groupId))
			.collect();

		// Filter messages that should count towards unread count
		const unreadMessages = allMessages.filter(
			(msg) =>
				msg.senderId !== userId && // Not sent by current user
				!msg.isRead && // Not read
				msg._creationTime >= membership.joinedAt && // After user joined
				!(
					msg.messageType === "system" &&
					msg.content.includes(`added ${userEmail}`)
				), // Exclude self-join system messages
		);

		return unreadMessages.length;
	},
});

// Get all messages for the current user (both direct and group messages)
// This is used for real-time notification detection
export const getAllUserMessages = query({
	args: {},
	handler: async (ctx) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) {
			return [];
		}

		// Get all direct messages where user is sender or receiver
		const directMessages = await ctx.db
			.query("messages")
			.filter((q) =>
				q.or(
					q.eq(q.field("senderId"), userId),
					q.eq(q.field("receiverId"), userId),
				),
			)
			.order("desc")
			.take(100); // Limit to recent messages for performance

		// Get all group messages from groups the user is a member of
		const userGroupMemberships = await ctx.db
			.query("groupMembers")
			.withIndex("by_user", (q) => q.eq("userId", userId))
			.collect();

		const groupIds = userGroupMemberships.map(
			(membership) => membership.groupId,
		);

		let groupMessages: Doc<"messages">[] = [];
		for (const groupId of groupIds) {
			const messages = await ctx.db
				.query("messages")
				.withIndex("by_group", (q) => q.eq("groupId", groupId))
				.order("desc")
				.take(50); // Limit per group for performance
			groupMessages = groupMessages.concat(messages);
		}

		// Combine and sort all messages by creation time
		const allMessages = [...directMessages, ...groupMessages]
			.sort((a, b) => b._creationTime - a._creationTime)
			.slice(0, 200); // Final limit for performance

		// Get sender details for each message and add isFromMe flag
		const messagesWithSenders = await Promise.all(
			allMessages.map(async (message) => {
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
