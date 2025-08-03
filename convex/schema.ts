import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const applicationTables = {
	contacts: defineTable({
		userId: v.id("users"),
		contactUserId: v.id("users"),
		status: v.string(),
		nickname: v.optional(v.string()),
	})
		.index("by_user", ["userId"])
		.index("by_contact", ["contactUserId"])
		.index("by_user_and_contact", ["userId", "contactUserId"]),

	contactRequests: defineTable({
		fromUserId: v.id("users"),
		toUserId: v.id("users"),
		status: v.union(
			v.literal("pending"),
			v.literal("accepted"),
			v.literal("rejected"),
		),
		message: v.optional(v.string()),
	})
		.index("by_from_user", ["fromUserId"])
		.index("by_to_user", ["toUserId"])
		.index("by_status", ["status"]),

	messages: defineTable({
		senderId: v.id("users"),
		receiverId: v.optional(v.id("users")),
		groupId: v.optional(v.id("groups")),
		content: v.string(),
		messageType: v.union(
			v.literal("text"),
			v.literal("emoji"),
			v.literal("file"),
			v.literal("system"),
		),
		fileId: v.optional(v.id("_storage")),
		fileName: v.optional(v.string()),
		fileType: v.optional(v.string()),
		fileSize: v.optional(v.number()),
		isRead: v.boolean(),
		isEdited: v.optional(v.boolean()),
		editedAt: v.optional(v.number()),
		isDeleted: v.optional(v.boolean()),
		deletedAt: v.optional(v.number()),
	})
		.index("by_sender", ["senderId"])
		.index("by_receiver", ["receiverId"])
		.index("by_conversation", ["senderId", "receiverId"])
		.index("by_unread", ["receiverId", "isRead"])
		.index("by_group", ["groupId"]),

	userStatus: defineTable({
		userId: v.id("users"),
		status: v.union(
			v.literal("online"),
			v.literal("away"),
			v.literal("busy"),
			v.literal("invisible"),
			v.literal("offline"),
		),
		statusMessage: v.optional(v.string()),
		lastSeen: v.number(),
	})
		.index("by_user", ["userId"])
		.index("by_status", ["status"]),

	groups: defineTable({
		name: v.string(),
		description: v.optional(v.string()),
		createdBy: v.id("users"),
		isPrivate: v.boolean(),
		memberCount: v.optional(v.number()),
	})
		.index("by_creator", ["createdBy"])
		.index("by_privacy", ["isPrivate"]),

	groupMembers: defineTable({
		groupId: v.id("groups"),
		userId: v.id("users"),
		role: v.union(v.literal("admin"), v.literal("member")),
		joinedAt: v.number(),
	})
		.index("by_group", ["groupId"])
		.index("by_user", ["userId"])
		.index("by_group_and_user", ["groupId", "userId"]),

	groupMessages: defineTable({
		groupId: v.id("groups"),
		senderId: v.id("users"),
		content: v.string(),
		messageType: v.union(
			v.literal("text"),
			v.literal("emoji"),
			v.literal("file"),
			v.literal("system"),
		),
		fileId: v.optional(v.id("_storage")),
		fileName: v.optional(v.string()),
		fileType: v.optional(v.string()),
		fileSize: v.optional(v.number()),
		isEdited: v.optional(v.boolean()),
		editedAt: v.optional(v.number()),
		isDeleted: v.optional(v.boolean()),
		deletedAt: v.optional(v.number()),
	})
		.index("by_group", ["groupId"])
		.index("by_sender", ["senderId"]),

	groupMessageReads: defineTable({
		groupId: v.id("groups"),
		messageId: v.id("groupMessages"),
		userId: v.id("users"),
		readAt: v.number(),
	})
		.index("by_group_and_user", ["groupId", "userId"])
		.index("by_message", ["messageId"])
		.index("by_user", ["userId"]),

	emailVerifications: defineTable({
		email: v.string(),
		token: v.string(),
		verified: v.boolean(),
		expiresAt: v.number(),
	})
		.index("by_email", ["email"])
		.index("by_token", ["token"]),

	typingIndicators: defineTable({
		userId: v.id("users"),
		chatWithUserId: v.optional(v.id("users")),
		groupId: v.optional(v.id("groups")),
		isTyping: v.boolean(),
		lastTypingTime: v.number(),
	})
		.index("by_chat", ["userId", "chatWithUserId"])
		.index("by_group_chat", ["userId", "groupId"]),

	deploymentInfo: defineTable({
		version: v.string(),
		timestamp: v.number(),
	}).index("by_timestamp", ["timestamp"]),
};

export default defineSchema({
	...authTables,
	...applicationTables,
});
