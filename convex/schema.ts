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

	// Message reactions and emotions
	messageReactions: defineTable({
		messageId: v.id("messages"),
		userId: v.id("users"),
		reactionType: v.union(
			v.literal("thumbs_up"),
			v.literal("heart"),
			v.literal("laugh"),
			v.literal("wow"),
			v.literal("sad"),
			v.literal("angry"),
			v.literal("custom"),
		),
		customEmoji: v.optional(v.string()),
		createdAt: v.number(),
	})
		.index("by_message", ["messageId"])
		.index("by_user", ["userId"])
		.index("by_message_and_user", ["messageId", "userId"])
		.index("by_reaction_type", ["reactionType"])
		.index("by_created_at", ["createdAt"]),

	// Group message reactions
	groupMessageReactions: defineTable({
		messageId: v.id("groupMessages"),
		userId: v.id("users"),
		reactionType: v.union(
			v.literal("thumbs_up"),
			v.literal("heart"),
			v.literal("laugh"),
			v.literal("wow"),
			v.literal("sad"),
			v.literal("angry"),
			v.literal("custom"),
		),
		customEmoji: v.optional(v.string()),
		createdAt: v.number(),
	})
		.index("by_message", ["messageId"])
		.index("by_user", ["userId"])
		.index("by_message_and_user", ["messageId", "userId"])
		.index("by_reaction_type", ["reactionType"])
		.index("by_created_at", ["createdAt"]),

	// Nudges and buzzes
	nudges: defineTable({
		fromUserId: v.id("users"),
		toUserId: v.id("users"),
		nudgeType: v.union(v.literal("nudge"), v.literal("buzz")),
		conversationId: v.optional(v.string()), // "user_id" or "group_id"
		conversationType: v.union(v.literal("direct"), v.literal("group")),
		createdAt: v.number(),
	})
		.index("by_recipient", ["toUserId"])
		.index("by_sender", ["fromUserId"])
		.index("by_conversation", ["conversationId"])
		.index("by_recipient_and_time", ["toUserId", "createdAt"])
		.index("by_sender_and_time", ["fromUserId", "createdAt"]),

	// Voice messages
	voiceMessages: defineTable({
		messageId: v.id("messages"),
		audioFileId: v.id("_storage"),
		duration: v.number(), // in seconds
		waveformData: v.optional(v.string()), // JSON array of amplitude values
		transcription: v.optional(v.string()),
		fileSize: v.number(),
		mimeType: v.string(),
	})
		.index("by_message", ["messageId"])
		.index("by_duration", ["duration"]),

	// Group voice messages
	groupVoiceMessages: defineTable({
		messageId: v.id("groupMessages"),
		audioFileId: v.id("_storage"),
		duration: v.number(), // in seconds
		waveformData: v.optional(v.string()), // JSON array of amplitude values
		transcription: v.optional(v.string()),
		fileSize: v.number(),
		mimeType: v.string(),
	})
		.index("by_message", ["messageId"])
		.index("by_duration", ["duration"]),

	// Scheduled messages
	scheduledMessages: defineTable({
		senderId: v.id("users"),
		receiverId: v.optional(v.id("users")),
		groupId: v.optional(v.id("groups")),
		content: v.string(),
		messageType: v.union(
			v.literal("text"),
			v.literal("emoji"),
			v.literal("file"),
		),
		scheduledFor: v.number(),
		status: v.union(
			v.literal("pending"),
			v.literal("sent"),
			v.literal("cancelled"),
			v.literal("failed"),
		),
		fileId: v.optional(v.id("_storage")),
		fileName: v.optional(v.string()),
		fileType: v.optional(v.string()),
		fileSize: v.optional(v.number()),
		timezone: v.string(),
		recurring: v.optional(
			v.object({
				type: v.union(
					v.literal("daily"),
					v.literal("weekly"),
					v.literal("monthly"),
				),
				interval: v.number(),
				endDate: v.optional(v.number()),
			}),
		),
		createdAt: v.number(),
		lastAttemptAt: v.optional(v.number()),
		failureReason: v.optional(v.string()),
	})
		.index("by_sender", ["senderId"])
		.index("by_scheduled_time", ["scheduledFor"])
		.index("by_status", ["status"])
		.index("by_pending_and_time", ["status", "scheduledFor"])
		.index("by_receiver", ["receiverId"])
		.index("by_group", ["groupId"]),

	// User themes and personalization
	userThemes: defineTable({
		userId: v.id("users"),
		themeName: v.string(),
		primaryColor: v.string(),
		accentColor: v.string(),
		backgroundColor: v.optional(v.string()),
		backgroundImage: v.optional(v.id("_storage")),
		backgroundOpacity: v.number(),
		messageStyle: v.union(
			v.literal("bubbles"),
			v.literal("classic"),
			v.literal("minimal"),
		),
		fontFamily: v.optional(v.string()),
		fontSize: v.union(
			v.literal("small"),
			v.literal("medium"),
			v.literal("large"),
		),
		customCSS: v.optional(v.string()),
		isDefault: v.boolean(),
		isPublic: v.boolean(),
		createdAt: v.number(),
		updatedAt: v.number(),
	})
		.index("by_user", ["userId"])
		.index("by_public", ["isPublic"])
		.index("by_user_and_default", ["userId", "isDefault"]),

	// Conversation backups
	conversationBackups: defineTable({
		userId: v.id("users"),
		backupName: v.string(),
		conversationType: v.union(v.literal("direct"), v.literal("group")),
		conversationId: v.string(),
		format: v.union(v.literal("json"), v.literal("html"), v.literal("txt")),
		fileId: v.id("_storage"),
		includeFiles: v.boolean(),
		dateRange: v.object({
			start: v.optional(v.number()),
			end: v.optional(v.number()),
		}),
		status: v.union(
			v.literal("processing"),
			v.literal("ready"),
			v.literal("expired"),
			v.literal("failed"),
		),
		fileSize: v.optional(v.number()),
		messageCount: v.optional(v.number()),
		expiresAt: v.number(),
		createdAt: v.number(),
		completedAt: v.optional(v.number()),
	})
		.index("by_user", ["userId"])
		.index("by_status", ["status"])
		.index("by_expiry", ["expiresAt"])
		.index("by_user_and_status", ["userId", "status"])
		.index("by_conversation", ["conversationId"]),

	// Focus modes and notification preferences
	userNotificationSettings: defineTable({
		userId: v.id("users"),
		focusModeEnabled: v.boolean(),
		focusModeSchedule: v.optional(
			v.object({
				enabled: v.boolean(),
				startTime: v.string(), // "HH:MM" format
				endTime: v.string(),
				timezone: v.string(),
				days: v.array(v.number()), // 0-6 for Sunday-Saturday
			}),
		),
		vipContacts: v.array(v.id("users")),
		notificationGrouping: v.boolean(),
		soundEnabled: v.boolean(),
		vibrationEnabled: v.boolean(),
		desktopNotifications: v.boolean(),
		mentionNotifications: v.boolean(),
		nudgeNotifications: v.boolean(),
		accountLinkingNotificationShown: v.optional(v.boolean()),
		quietHours: v.optional(
			v.object({
				enabled: v.boolean(),
				startTime: v.string(),
				endTime: v.string(),
				timezone: v.string(),
			}),
		),
		createdAt: v.number(),
		updatedAt: v.number(),
	})
		.index("by_user", ["userId"])
		.index("by_focus_mode", ["focusModeEnabled"]),

	// Message search index (for full-text search)
	messageSearchIndex: defineTable({
		messageId: v.id("messages"),
		groupMessageId: v.optional(v.id("groupMessages")),
		content: v.string(),
		senderId: v.id("users"),
		receiverId: v.optional(v.id("users")),
		groupId: v.optional(v.id("groups")),
		messageType: v.string(),
		hasAttachment: v.boolean(),
		fileName: v.optional(v.string()),
		fileType: v.optional(v.string()),
		createdAt: v.number(),
		searchVector: v.optional(v.string()), // For future full-text search implementation
	})
		.index("by_content", ["content"])
		.index("by_sender", ["senderId"])
		.index("by_receiver", ["receiverId"])
		.index("by_group", ["groupId"])
		.index("by_date", ["createdAt"])
		.index("by_type", ["messageType"])
		.index("by_has_attachment", ["hasAttachment"])
		.index("by_sender_and_date", ["senderId", "createdAt"])
		.index("by_receiver_and_date", ["receiverId", "createdAt"])
		.index("by_group_and_date", ["groupId", "createdAt"]),

	// Shared themes (for theme sharing between users)
	sharedThemes: defineTable({
		creatorId: v.id("users"),
		themeName: v.string(),
		description: v.optional(v.string()),
		primaryColor: v.string(),
		accentColor: v.string(),
		backgroundColor: v.optional(v.string()),
		backgroundImage: v.optional(v.id("_storage")),
		backgroundOpacity: v.number(),
		messageStyle: v.union(
			v.literal("bubbles"),
			v.literal("classic"),
			v.literal("minimal"),
		),
		fontFamily: v.optional(v.string()),
		fontSize: v.union(
			v.literal("small"),
			v.literal("medium"),
			v.literal("large"),
		),
		customCSS: v.optional(v.string()),
		downloadCount: v.number(),
		rating: v.optional(v.number()),
		tags: v.array(v.string()),
		isApproved: v.boolean(),
		createdAt: v.number(),
		updatedAt: v.number(),
	})
		.index("by_creator", ["creatorId"])
		.index("by_approved", ["isApproved"])
		.index("by_rating", ["rating"])
		.index("by_downloads", ["downloadCount"])
		.index("by_created_at", ["createdAt"]),

	// User activity logs (for analytics and debugging)
	userActivityLogs: defineTable({
		userId: v.id("users"),
		action: v.string(),
		details: v.optional(v.string()),
		metadata: v.optional(
			v.object({
				messageId: v.optional(v.string()),
				groupId: v.optional(v.string()),
				contactId: v.optional(v.string()),
				feature: v.optional(v.string()),
			}),
		),
		ipAddress: v.optional(v.string()),
		userAgent: v.optional(v.string()),
		createdAt: v.number(),
	})
		.index("by_user", ["userId"])
		.index("by_action", ["action"])
		.index("by_user_and_date", ["userId", "createdAt"])
		.index("by_date", ["createdAt"]),
};

export default defineSchema({
	...authTables,
	...applicationTables,
});
