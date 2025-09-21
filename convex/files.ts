import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const generateUploadUrl = mutation({
	args: {},
	handler: async (ctx) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) {
			throw new Error("Not authenticated");
		}
		return await ctx.storage.generateUploadUrl();
	},
});

export const getFileUrl = query({
	args: { fileId: v.id("_storage") },
	handler: async (ctx, args) => {
		return await ctx.storage.getUrl(args.fileId);
	},
});

export const getFileMetadata = query({
	args: { fileId: v.id("_storage") },
	handler: async (ctx, args) => {
		return await ctx.db.system.get(args.fileId);
	},
});

export const sendFileMessage = mutation({
	args: {
		receiverId: v.optional(v.id("users")),
		groupId: v.optional(v.id("groups")),
		fileId: v.id("_storage"),
		fileName: v.string(),
		fileType: v.string(),
		fileSize: v.number(),
	},
	handler: async (ctx, args) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) {
			throw new Error("Not authenticated");
		}

		// Validate that either receiverId or groupId is provided, but not both
		if (
			(!args.receiverId && !args.groupId) ||
			(args.receiverId && args.groupId)
		) {
			throw new Error(
				"Must specify either receiverId or groupId, but not both",
			);
		}

		// If it's a group message, check membership
		if (args.groupId) {
			const groupId = args.groupId; // Extract to a const for better type narrowing
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

		// If it's a direct message, check if users are contacts
		if (args.receiverId) {
			const receiverId = args.receiverId; // Extract to a const for better type narrowing
			const contact = await ctx.db
				.query("contacts")
				.withIndex("by_user_and_contact", (q) =>
					q.eq("userId", userId).eq("contactUserId", receiverId),
				)
				.unique();

			if (!contact || contact.status !== "accepted") {
				throw new Error("You can only send files to your contacts");
			}
		}

		// Create the file message
		if (args.groupId) {
			await ctx.db.insert("messages", {
				senderId: userId,
				groupId: args.groupId,
				content: args.fileName,
				messageType: "file",
				fileId: args.fileId,
				fileName: args.fileName,
				fileType: args.fileType,
				fileSize: args.fileSize,
				isRead: false,
			});
		} else if (args.receiverId) {
			await ctx.db.insert("messages", {
				senderId: userId,
				receiverId: args.receiverId,
				content: args.fileName,
				messageType: "file",
				fileId: args.fileId,
				fileName: args.fileName,
				fileType: args.fileType,
				fileSize: args.fileSize,
				isRead: false,
			});
		}

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
