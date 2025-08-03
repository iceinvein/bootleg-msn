import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const sendMessage = mutation({
	args: {
		receiverId: v.id("users"),
		content: v.string(),
		messageType: v.optional(
			v.union(v.literal("text"), v.literal("emoji"), v.literal("system")),
		),
	},
	handler: async (ctx, args) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) {
			throw new Error("Not authenticated");
		}

		// Check if users are contacts and relationship is accepted
		const contact = await ctx.db
			.query("contacts")
			.withIndex("by_user_and_contact", (q) =>
				q.eq("userId", userId).eq("contactUserId", args.receiverId),
			)
			.unique();

		if (!contact || contact.status !== "accepted") {
			throw new Error(
				"Cannot send message: users are not connected or contact request is pending",
			);
		}

		await ctx.db.insert("messages", {
			senderId: userId,
			receiverId: args.receiverId,
			content: args.content,
			messageType: args.messageType || "text",
			isRead: false,
		});

		// Update last seen for sender
		const existingStatus = await ctx.db
			.query("userStatus")
			.withIndex("by_user", (q) => q.eq("userId", userId))
			.unique();

		if (existingStatus) {
			await ctx.db.patch(existingStatus._id, {
				lastSeen: Date.now(),
			});
		}
	},
});

export const getConversation = query({
	args: {
		otherUserId: v.id("users"),
	},
	handler: async (ctx, args) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) {
			return [];
		}

		// Check if users are contacts and relationship is accepted
		const contact = await ctx.db
			.query("contacts")
			.withIndex("by_user_and_contact", (q) =>
				q.eq("userId", userId).eq("contactUserId", args.otherUserId),
			)
			.unique();

		if (!contact || contact.status !== "accepted") {
			return [];
		}

		const messages = await ctx.db
			.query("messages")
			.filter((q) =>
				q.or(
					q.and(
						q.eq(q.field("senderId"), userId),
						q.eq(q.field("receiverId"), args.otherUserId),
					),
					q.and(
						q.eq(q.field("senderId"), args.otherUserId),
						q.eq(q.field("receiverId"), userId),
					),
				),
			)
			.order("asc")
			.collect();

		return messages;
	},
});

export const markMessagesAsRead = mutation({
	args: {
		senderId: v.id("users"),
	},
	handler: async (ctx, args) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) {
			throw new Error("Not authenticated");
		}

		const unreadMessages = await ctx.db
			.query("messages")
			.withIndex("by_receiver", (q) => q.eq("receiverId", userId))
			.filter((q) =>
				q.and(
					q.eq(q.field("senderId"), args.senderId),
					q.eq(q.field("isRead"), false),
				),
			)
			.collect();

		for (const message of unreadMessages) {
			await ctx.db.patch(message._id, { isRead: true });
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
			content: "This message was deleted",
		});
	},
});
