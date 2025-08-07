import { getAuthUserId } from "@convex-dev/auth/server";
import type { Id } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import {
	BACKUP_EXPIRY_DAYS,
	MAX_BACKGROUND_IMAGE_SIZE,
	MAX_VOICE_MESSAGE_DURATION,
	MAX_VOICE_MESSAGE_SIZE,
	MIN_VOICE_MESSAGE_DURATION,
	NUDGE_COOLDOWN_MS,
} from "./validators";

// Authentication helper
export async function getCurrentUser(ctx: QueryCtx | MutationCtx) {
	const userId = await getAuthUserId(ctx);
	if (!userId) {
		throw new Error("Not authenticated");
	}

	const user = await ctx.db.get(userId);
	if (!user) {
		throw new Error("User not found");
	}

	return user;
}

// Check if user can send nudges (cooldown check)
export async function canSendNudge(
	ctx: QueryCtx | MutationCtx,
	fromUserId: Id<"users">,
	toUserId: Id<"users">,
): Promise<boolean> {
	const now = Date.now();
	const cooldownStart = now - NUDGE_COOLDOWN_MS;

	const recentNudge = await ctx.db
		.query("nudges")
		.withIndex("by_sender_and_time", (q) =>
			q.eq("fromUserId", fromUserId).gte("createdAt", cooldownStart),
		)
		.filter((q) => q.eq(q.field("toUserId"), toUserId))
		.first();

	return !recentNudge;
}

// Check if user is in focus mode or DND
export async function isUserInFocusMode(
	ctx: QueryCtx | MutationCtx,
	userId: Id<"users">,
): Promise<boolean> {
	const settings = await ctx.db
		.query("userNotificationSettings")
		.withIndex("by_user", (q) => q.eq("userId", userId))
		.unique();

	if (!settings) {
		return false;
	}

	// Check if focus mode is manually enabled
	if (settings.focusModeEnabled) {
		return true;
	}

	// Check if scheduled focus mode is active
	if (settings.focusModeSchedule?.enabled) {
		const now = new Date();
		const currentTime = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;
		const currentDay = now.getDay();

		const { startTime, endTime, days } = settings.focusModeSchedule;

		if (days.includes(currentDay)) {
			// Simple time comparison (doesn't handle cross-midnight ranges)
			if (startTime <= endTime) {
				return currentTime >= startTime && currentTime <= endTime;
			} else {
				// Handle cross-midnight ranges
				return currentTime >= startTime || currentTime <= endTime;
			}
		}
	}

	// Check quiet hours
	if (settings.quietHours?.enabled) {
		const now = new Date();
		const currentTime = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;

		const { startTime, endTime } = settings.quietHours;

		if (startTime <= endTime) {
			return currentTime >= startTime && currentTime <= endTime;
		} else {
			// Handle cross-midnight ranges
			return currentTime >= startTime || currentTime <= endTime;
		}
	}

	return false;
}

// Check if user is VIP contact
export async function isVipContact(
	ctx: QueryCtx | MutationCtx,
	userId: Id<"users">,
	contactId: Id<"users">,
): Promise<boolean> {
	const settings = await ctx.db
		.query("userNotificationSettings")
		.withIndex("by_user", (q) => q.eq("userId", userId))
		.unique();

	if (!settings) {
		return false;
	}

	return settings.vipContacts.includes(contactId);
}

// Validate voice message file
export function validateVoiceMessage(
	duration: number,
	fileSize: number,
	mimeType: string,
): void {
	if (duration < MIN_VOICE_MESSAGE_DURATION) {
		throw new Error(
			`Voice message too short. Minimum duration is ${MIN_VOICE_MESSAGE_DURATION} second(s)`,
		);
	}

	if (duration > MAX_VOICE_MESSAGE_DURATION) {
		throw new Error(
			`Voice message too long. Maximum duration is ${MAX_VOICE_MESSAGE_DURATION} seconds`,
		);
	}

	if (fileSize > MAX_VOICE_MESSAGE_SIZE) {
		throw new Error(
			`Voice message file too large. Maximum size is ${MAX_VOICE_MESSAGE_SIZE / (1024 * 1024)}MB`,
		);
	}

	const allowedMimeTypes = [
		"audio/webm",
		"audio/mp4",
		"audio/mpeg",
		"audio/wav",
		"audio/ogg",
	];

	if (!allowedMimeTypes.includes(mimeType)) {
		throw new Error(`Unsupported audio format: ${mimeType}`);
	}
}

// Validate background image
export function validateBackgroundImage(
	fileSize: number,
	mimeType: string,
): void {
	if (fileSize > MAX_BACKGROUND_IMAGE_SIZE) {
		throw new Error(
			`Background image too large. Maximum size is ${MAX_BACKGROUND_IMAGE_SIZE / (1024 * 1024)}MB`,
		);
	}

	const allowedMimeTypes = [
		"image/jpeg",
		"image/jpg",
		"image/png",
		"image/gif",
		"image/webp",
	];

	if (!allowedMimeTypes.includes(mimeType)) {
		throw new Error(`Unsupported image format: ${mimeType}`);
	}
}

// Validate hex color
export function validateHexColor(color: string): boolean {
	const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
	return hexColorRegex.test(color);
}

// Validate timezone
export function validateTimezone(timezone: string): boolean {
	try {
		Intl.DateTimeFormat(undefined, { timeZone: timezone });
		return true;
	} catch {
		return false;
	}
}

// Generate backup expiry date
export function getBackupExpiryDate(): number {
	return Date.now() + BACKUP_EXPIRY_DAYS * 24 * 60 * 60 * 1000;
}

// Check if user has access to conversation
export async function hasConversationAccess(
	ctx: QueryCtx | MutationCtx,
	userId: Id<"users">,
	conversationType: "direct" | "group",
	conversationId: string,
): Promise<boolean> {
	if (conversationType === "direct") {
		// For direct messages, conversationId should be the other user's ID
		const contact = await ctx.db
			.query("contacts")
			.withIndex("by_user_and_contact", (q) =>
				q
					.eq("userId", userId)
					.eq("contactUserId", conversationId as Id<"users">),
			)
			.unique();
		return !!contact && contact.status === "accepted";
	} else {
		// For group messages, check if user is a member
		const membership = await ctx.db
			.query("groupMembers")
			.withIndex("by_group_and_user", (q) =>
				q.eq("groupId", conversationId as Id<"groups">).eq("userId", userId),
			)
			.unique();
		return !!membership;
	}
}

// Get conversation participants
export async function getConversationParticipants(
	ctx: QueryCtx | MutationCtx,
	conversationType: "direct" | "group",
	conversationId: string,
): Promise<Id<"users">[]> {
	if (conversationType === "direct") {
		// For direct messages, return both users
		return [conversationId as Id<"users">]; // This would need the current user ID as well
	} else {
		// For group messages, get all members
		const members = await ctx.db
			.query("groupMembers")
			.withIndex("by_group", (q) =>
				q.eq("groupId", conversationId as Id<"groups">),
			)
			.collect();
		return members.map((member) => member.userId);
	}
}

// Sanitize CSS for themes
export function sanitizeCSS(css: string): string {
	// Basic CSS sanitization - remove potentially dangerous properties
	const dangerousProperties = [
		"javascript:",
		"expression(",
		"@import",
		"behavior:",
		"-moz-binding",
		"position:fixed",
		"position:absolute",
	];

	let sanitized = css;
	dangerousProperties.forEach((prop) => {
		const regex = new RegExp(prop.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi");
		sanitized = sanitized.replace(regex, "");
	});

	return sanitized;
}

// Generate search vector (placeholder for future full-text search)
export function generateSearchVector(content: string): string {
	// Simple implementation - could be enhanced with proper text processing
	return content
		.toLowerCase()
		.replace(/[^\w\s]/g, " ")
		.split(/\s+/)
		.filter((word) => word.length > 2)
		.join(" ");
}

// Check if scheduled message time is valid
export function validateScheduledTime(
	scheduledFor: number,
	timezone: string,
): void {
	const now = Date.now();
	const minFutureTime = now + 60 * 1000; // At least 1 minute in the future
	const maxFutureTime = now + 365 * 24 * 60 * 60 * 1000; // At most 1 year in the future

	if (scheduledFor <= minFutureTime) {
		throw new Error("Scheduled time must be at least 1 minute in the future");
	}

	if (scheduledFor > maxFutureTime) {
		throw new Error("Scheduled time cannot be more than 1 year in the future");
	}

	if (!validateTimezone(timezone)) {
		throw new Error("Invalid timezone");
	}
}

// Format file size for display
export function formatFileSize(bytes: number): string {
	if (bytes === 0) return "0 Bytes";

	const k = 1024;
	const sizes = ["Bytes", "KB", "MB", "GB"];
	const i = Math.floor(Math.log(bytes) / Math.log(k));

	return `${parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
}

// Format duration for display
export function formatDuration(seconds: number): string {
	const minutes = Math.floor(seconds / 60);
	const remainingSeconds = Math.floor(seconds % 60);

	if (minutes > 0) {
		return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
	} else {
		return `0:${remainingSeconds.toString().padStart(2, "0")}`;
	}
}

// Rate limiting helper
export async function checkRateLimit(
	ctx: QueryCtx | MutationCtx,
	userId: Id<"users">,
	action: string,
	windowMs: number,
	maxRequests: number,
): Promise<boolean> {
	const windowStart = Date.now() - windowMs;

	const recentActions = await ctx.db
		.query("userActivityLogs")
		.withIndex("by_user_and_date", (q) =>
			q.eq("userId", userId).gte("createdAt", windowStart),
		)
		.filter((q) => q.eq(q.field("action"), action))
		.collect();

	return recentActions.length < maxRequests;
}

// Check if user is admin (based on email domain or specific emails)
export async function isUserAdmin(
	ctx: QueryCtx | MutationCtx,
	userId: Id<"users">,
): Promise<boolean> {
	const user = await ctx.db.get(userId);
	if (!user?.email) {
		return false;
	}

	// Define admin emails or domains here
	const adminEmails = [
		"admin@bootlegmsn.com",
		"developer@bootlegmsn.com",
		// Add more admin emails as needed
	];

	const adminDomains = [
		"@bootlegmsn.com",
		// Add more admin domains as needed
	];

	// Check if user email is in admin list
	if (adminEmails.includes(user.email)) {
		return true;
	}

	// Check if user email domain is in admin domains
	return adminDomains.some((domain) => user.email?.endsWith(domain) ?? false);
}

// Require admin access - throws error if not admin
export async function requireAdmin(
	ctx: QueryCtx | MutationCtx,
	userId: Id<"users">,
): Promise<void> {
	const isAdmin = await isUserAdmin(ctx, userId);
	if (!isAdmin) {
		throw new Error("Admin access required");
	}
}

// Log user activity
export async function logUserActivity(
	ctx: MutationCtx,
	userId: Id<"users">,
	action: string,
	details?: string,
	metadata?: {
		messageId?: string;
		groupId?: string;
		contactId?: string;
		feature?: string;
	},
): Promise<void> {
	await ctx.db.insert("userActivityLogs", {
		userId,
		action,
		details,
		metadata,
		createdAt: Date.now(),
	});
}
