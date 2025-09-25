import { v } from "convex/values";

// Reaction validation schemas
export const reactionTypeValidator = v.union(
	v.literal("thumbs_up"),
	v.literal("heart"),
	v.literal("laugh"),
	v.literal("wow"),
	v.literal("sad"),
	v.literal("angry"),
	v.literal("custom"),
);

export const addReactionValidator = v.object({
	messageId: v.id("messages"),
	reactionType: reactionTypeValidator,
	customEmoji: v.optional(v.string()),
});

// User status validation schemas
export const userStatusValidator = v.union(
	v.literal("online"),
	v.literal("away"),
	v.literal("busy"),
	v.literal("invisible"),
	v.literal("offline"),
);

// Group role validation schemas
export const groupRoleValidator = v.union(
	v.literal("admin"),
	v.literal("member"),
);

// Nudge validation schemas
export const nudgeTypeValidator = v.union(
	v.literal("nudge"),
	v.literal("buzz"),
);

export const sendNudgeValidator = v.object({
	toUserId: v.id("users"),
	nudgeType: nudgeTypeValidator,
	conversationId: v.optional(v.string()),
	conversationType: v.union(v.literal("direct"), v.literal("group")),
});

// Emote validation schemas
export const emoteTypeValidator = v.union(v.literal("screen_crack"));

export const sendEmoteValidator = v.object({
	toUserId: v.id("users"),
	emoteType: emoteTypeValidator,
	conversationId: v.optional(v.string()),
	conversationType: v.union(v.literal("direct"), v.literal("group")),
});

export const consumeEmoteValidator = v.object({
	emoteId: v.id("emotes"),
});

// Voice message validation schemas
export const voiceMessageValidator = v.object({
	messageId: v.id("messages"),
	audioFileId: v.id("_storage"),
	duration: v.number(),
	waveformData: v.optional(v.string()),
	transcription: v.optional(v.string()),
	fileSize: v.number(),
	mimeType: v.string(),
});

// Scheduled message validation schemas
export const messageTypeValidator = v.union(
	v.literal("text"),
	v.literal("emoji"),
	v.literal("file"),
);

export const scheduledMessageStatusValidator = v.union(
	v.literal("pending"),
	v.literal("sent"),
	v.literal("cancelled"),
	v.literal("failed"),
);

export const recurringTypeValidator = v.union(
	v.literal("daily"),
	v.literal("weekly"),
	v.literal("monthly"),
);

export const createScheduledMessageValidator = v.object({
	receiverId: v.optional(v.id("users")),
	groupId: v.optional(v.id("groups")),
	content: v.string(),
	messageType: messageTypeValidator,
	scheduledFor: v.number(),
	fileId: v.optional(v.id("_storage")),
	fileName: v.optional(v.string()),
	fileType: v.optional(v.string()),
	fileSize: v.optional(v.number()),
	timezone: v.string(),
	recurring: v.optional(
		v.object({
			type: recurringTypeValidator,
			interval: v.number(),
			endDate: v.optional(v.number()),
		}),
	),
});

// Theme validation schemas
export const messageStyleValidator = v.union(
	v.literal("bubbles"),
	v.literal("classic"),
	v.literal("minimal"),
);

export const fontSizeValidator = v.union(
	v.literal("small"),
	v.literal("medium"),
	v.literal("large"),
);

export const createThemeValidator = v.object({
	themeName: v.string(),
	primaryColor: v.string(),
	accentColor: v.string(),
	backgroundColor: v.optional(v.string()),
	backgroundImage: v.optional(v.id("_storage")),
	backgroundOpacity: v.number(),
	messageStyle: messageStyleValidator,
	fontFamily: v.optional(v.string()),
	fontSize: fontSizeValidator,
	customCSS: v.optional(v.string()),
	isDefault: v.optional(v.boolean()),
	isPublic: v.optional(v.boolean()),
});

export const updateThemeValidator = v.object({
	themeId: v.id("userThemes"),
	themeName: v.optional(v.string()),
	primaryColor: v.optional(v.string()),
	accentColor: v.optional(v.string()),
	backgroundColor: v.optional(v.string()),
	backgroundImage: v.optional(v.id("_storage")),
	backgroundOpacity: v.optional(v.number()),
	messageStyle: v.optional(messageStyleValidator),
	fontFamily: v.optional(v.string()),
	fontSize: v.optional(fontSizeValidator),
	customCSS: v.optional(v.string()),
	isDefault: v.optional(v.boolean()),
	isPublic: v.optional(v.boolean()),
});

// Backup validation schemas
export const conversationTypeValidator = v.union(
	v.literal("direct"),
	v.literal("group"),
);

export const backupFormatValidator = v.union(
	v.literal("json"),
	v.literal("html"),
	v.literal("txt"),
);

export const backupStatusValidator = v.union(
	v.literal("processing"),
	v.literal("ready"),
	v.literal("expired"),
	v.literal("failed"),
);

export const createBackupValidator = v.object({
	backupName: v.string(),
	conversationType: conversationTypeValidator,
	conversationId: v.string(),
	format: backupFormatValidator,
	includeFiles: v.boolean(),
	dateRange: v.object({
		start: v.optional(v.number()),
		end: v.optional(v.number()),
	}),
});

// Notification settings validation schemas
export const updateNotificationSettingsValidator = v.object({
	focusModeEnabled: v.optional(v.boolean()),
	focusModeSchedule: v.optional(
		v.object({
			enabled: v.boolean(),
			startTime: v.string(),
			endTime: v.string(),
			timezone: v.string(),
			days: v.array(v.number()),
		}),
	),
	vipContacts: v.optional(v.array(v.id("users"))),
	notificationGrouping: v.optional(v.boolean()),
	soundEnabled: v.optional(v.boolean()),
	vibrationEnabled: v.optional(v.boolean()),
	desktopNotifications: v.optional(v.boolean()),
	mentionNotifications: v.optional(v.boolean()),
	nudgeNotifications: v.optional(v.boolean()),
	quietHours: v.optional(
		v.object({
			enabled: v.boolean(),
			startTime: v.string(),
			endTime: v.string(),
			timezone: v.string(),
		}),
	),
});

// Search validation schemas
export const searchMessagesValidator = v.object({
	query: v.string(),
	conversationType: v.optional(conversationTypeValidator),
	conversationId: v.optional(v.string()),
	messageType: v.optional(v.string()),
	hasAttachment: v.optional(v.boolean()),
	dateRange: v.optional(
		v.object({
			start: v.optional(v.number()),
			end: v.optional(v.number()),
		}),
	),
	limit: v.optional(v.number()),
	offset: v.optional(v.number()),
});

// Shared theme validation schemas
export const createSharedThemeValidator = v.object({
	themeName: v.string(),
	description: v.optional(v.string()),
	primaryColor: v.string(),
	accentColor: v.string(),
	backgroundColor: v.optional(v.string()),
	backgroundImage: v.optional(v.id("_storage")),
	backgroundOpacity: v.number(),
	messageStyle: messageStyleValidator,
	fontFamily: v.optional(v.string()),
	fontSize: fontSizeValidator,
	customCSS: v.optional(v.string()),
	tags: v.array(v.string()),
});

// Activity log validation schemas
export const logActivityValidator = v.object({
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
});

// Utility validators for common patterns
export const paginationValidator = v.object({
	limit: v.optional(v.number()),
	offset: v.optional(v.number()),
});

export const dateRangeValidator = v.object({
	start: v.optional(v.number()),
	end: v.optional(v.number()),
});

// Color validation helper (hex color format)
export const hexColorValidator = v.string(); // Could be enhanced with regex validation

// Timezone validation helper
export const timezoneValidator = v.string(); // Could be enhanced with IANA timezone validation

// File size limits (in bytes)
export const MAX_VOICE_MESSAGE_SIZE = 10 * 1024 * 1024; // 10MB
export const MAX_BACKGROUND_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
export const MAX_BACKUP_SIZE = 100 * 1024 * 1024; // 100MB

// Voice message duration limits (in seconds)
export const MAX_VOICE_MESSAGE_DURATION = 120; // 2 minutes
export const MIN_VOICE_MESSAGE_DURATION = 1; // 1 second

// Theme limits
export const MAX_THEME_NAME_LENGTH = 50;
export const MAX_THEME_DESCRIPTION_LENGTH = 200;
export const MAX_CUSTOM_CSS_LENGTH = 10000;

// Search limits
export const MAX_SEARCH_QUERY_LENGTH = 200;
export const MAX_SEARCH_RESULTS = 100;
export const DEFAULT_SEARCH_LIMIT = 20;

// Backup limits
export const MAX_BACKUP_NAME_LENGTH = 100;
export const BACKUP_EXPIRY_DAYS = 7;

// Nudge cooldown (in milliseconds)
export const NUDGE_COOLDOWN_MS = 30 * 1000; // 30 seconds

// Notification settings defaults
export const DEFAULT_NOTIFICATION_SETTINGS = {
	focusModeEnabled: false,
	notificationGrouping: true,
	soundEnabled: true,
	vibrationEnabled: true,
	desktopNotifications: true,
	mentionNotifications: true,
	nudgeNotifications: true,
};
