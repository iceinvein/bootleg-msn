import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import {
	getCurrentUser,
	logUserActivity,
	requireAdmin,
	validateTimezone,
} from "./utils";
import {
	DEFAULT_NOTIFICATION_SETTINGS,
	updateNotificationSettingsValidator,
} from "./validators";

// Get user's notification settings
export const getNotificationSettings = query({
	args: {},
	returns: v.object({
		_id: v.optional(v.id("userNotificationSettings")),
		focusModeEnabled: v.boolean(),
		focusModeSchedule: v.optional(
			v.object({
				enabled: v.boolean(),
				startTime: v.string(),
				endTime: v.string(),
				timezone: v.string(),
				days: v.array(v.number()),
			}),
		),
		vipContacts: v.array(v.id("users")),
		notificationGrouping: v.boolean(),
		soundEnabled: v.boolean(),
		vibrationEnabled: v.boolean(),
		desktopNotifications: v.boolean(),
		mentionNotifications: v.boolean(),
		nudgeNotifications: v.boolean(),
		quietHours: v.optional(
			v.object({
				enabled: v.boolean(),
				startTime: v.string(),
				endTime: v.string(),
				timezone: v.string(),
			}),
		),
		createdAt: v.optional(v.number()),
		updatedAt: v.optional(v.number()),
	}),
	handler: async (ctx) => {
		const user = await getCurrentUser(ctx);

		const settings = await ctx.db
			.query("userNotificationSettings")
			.withIndex("by_user", (q) => q.eq("userId", user._id))
			.unique();

		if (!settings) {
			// Return default settings if none exist
			return {
				focusModeEnabled: DEFAULT_NOTIFICATION_SETTINGS.focusModeEnabled,
				vipContacts: [],
				notificationGrouping:
					DEFAULT_NOTIFICATION_SETTINGS.notificationGrouping,
				soundEnabled: DEFAULT_NOTIFICATION_SETTINGS.soundEnabled,
				vibrationEnabled: DEFAULT_NOTIFICATION_SETTINGS.vibrationEnabled,
				desktopNotifications:
					DEFAULT_NOTIFICATION_SETTINGS.desktopNotifications,
				mentionNotifications:
					DEFAULT_NOTIFICATION_SETTINGS.mentionNotifications,
				nudgeNotifications: DEFAULT_NOTIFICATION_SETTINGS.nudgeNotifications,
			};
		}

		return settings;
	},
});

// Update user's notification settings
export const updateNotificationSettings = mutation({
	args: updateNotificationSettingsValidator,
	returns: v.id("userNotificationSettings"),
	handler: async (ctx, args) => {
		const user = await getCurrentUser(ctx);

		// Validate timezone if provided
		if (
			args.focusModeSchedule?.timezone &&
			!validateTimezone(args.focusModeSchedule.timezone)
		) {
			throw new Error("Invalid timezone in focus mode schedule");
		}

		if (
			args.quietHours?.timezone &&
			!validateTimezone(args.quietHours.timezone)
		) {
			throw new Error("Invalid timezone in quiet hours");
		}

		// Validate time format (HH:MM)
		const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
		if (
			args.focusModeSchedule?.startTime &&
			!timeRegex.test(args.focusModeSchedule.startTime)
		) {
			throw new Error("Invalid start time format in focus mode schedule");
		}
		if (
			args.focusModeSchedule?.endTime &&
			!timeRegex.test(args.focusModeSchedule.endTime)
		) {
			throw new Error("Invalid end time format in focus mode schedule");
		}
		if (
			args.quietHours?.startTime &&
			!timeRegex.test(args.quietHours.startTime)
		) {
			throw new Error("Invalid start time format in quiet hours");
		}
		if (args.quietHours?.endTime && !timeRegex.test(args.quietHours.endTime)) {
			throw new Error("Invalid end time format in quiet hours");
		}

		// Validate days array (0-6 for Sunday-Saturday)
		if (args.focusModeSchedule?.days) {
			const validDays = args.focusModeSchedule.days.every(
				(day) => day >= 0 && day <= 6,
			);
			if (!validDays) {
				throw new Error("Invalid days in focus mode schedule");
			}
		}

		const existingSettings = await ctx.db
			.query("userNotificationSettings")
			.withIndex("by_user", (q) => q.eq("userId", user._id))
			.unique();

		const now = Date.now();

		if (existingSettings) {
			// Update existing settings
			const updates: Partial<typeof existingSettings> = { updatedAt: now };

			if (args.focusModeEnabled !== undefined)
				updates.focusModeEnabled = args.focusModeEnabled;
			if (args.focusModeSchedule !== undefined)
				updates.focusModeSchedule = args.focusModeSchedule;
			if (args.vipContacts !== undefined)
				updates.vipContacts = args.vipContacts;
			if (args.notificationGrouping !== undefined)
				updates.notificationGrouping = args.notificationGrouping;
			if (args.soundEnabled !== undefined)
				updates.soundEnabled = args.soundEnabled;
			if (args.vibrationEnabled !== undefined)
				updates.vibrationEnabled = args.vibrationEnabled;
			if (args.desktopNotifications !== undefined)
				updates.desktopNotifications = args.desktopNotifications;
			if (args.mentionNotifications !== undefined)
				updates.mentionNotifications = args.mentionNotifications;
			if (args.nudgeNotifications !== undefined)
				updates.nudgeNotifications = args.nudgeNotifications;
			if (args.quietHours !== undefined) updates.quietHours = args.quietHours;

			await ctx.db.patch(existingSettings._id, updates);

			await logUserActivity(ctx, user._id, "update_notification_settings");

			return existingSettings._id;
		} else {
			// Create new settings
			const settingsId = await ctx.db.insert("userNotificationSettings", {
				userId: user._id,
				focusModeEnabled:
					args.focusModeEnabled ??
					DEFAULT_NOTIFICATION_SETTINGS.focusModeEnabled,
				focusModeSchedule: args.focusModeSchedule,
				vipContacts: args.vipContacts ?? [],
				notificationGrouping:
					args.notificationGrouping ??
					DEFAULT_NOTIFICATION_SETTINGS.notificationGrouping,
				soundEnabled:
					args.soundEnabled ?? DEFAULT_NOTIFICATION_SETTINGS.soundEnabled,
				vibrationEnabled:
					args.vibrationEnabled ??
					DEFAULT_NOTIFICATION_SETTINGS.vibrationEnabled,
				desktopNotifications:
					args.desktopNotifications ??
					DEFAULT_NOTIFICATION_SETTINGS.desktopNotifications,
				mentionNotifications:
					args.mentionNotifications ??
					DEFAULT_NOTIFICATION_SETTINGS.mentionNotifications,
				nudgeNotifications:
					args.nudgeNotifications ??
					DEFAULT_NOTIFICATION_SETTINGS.nudgeNotifications,
				quietHours: args.quietHours,
				createdAt: now,
				updatedAt: now,
			});

			await logUserActivity(ctx, user._id, "create_notification_settings");

			return settingsId;
		}
	},
});

// Toggle focus mode
export const toggleFocusMode = mutation({
	args: { enabled: v.boolean() },
	returns: v.null(),
	handler: async (ctx, args) => {
		const user = await getCurrentUser(ctx);

		const existingSettings = await ctx.db
			.query("userNotificationSettings")
			.withIndex("by_user", (q) => q.eq("userId", user._id))
			.unique();

		const now = Date.now();

		if (existingSettings) {
			await ctx.db.patch(existingSettings._id, {
				focusModeEnabled: args.enabled,
				updatedAt: now,
			});
		} else {
			await ctx.db.insert("userNotificationSettings", {
				userId: user._id,
				focusModeEnabled: args.enabled,
				vipContacts: [],
				notificationGrouping:
					DEFAULT_NOTIFICATION_SETTINGS.notificationGrouping,
				soundEnabled: DEFAULT_NOTIFICATION_SETTINGS.soundEnabled,
				vibrationEnabled: DEFAULT_NOTIFICATION_SETTINGS.vibrationEnabled,
				desktopNotifications:
					DEFAULT_NOTIFICATION_SETTINGS.desktopNotifications,
				mentionNotifications:
					DEFAULT_NOTIFICATION_SETTINGS.mentionNotifications,
				nudgeNotifications: DEFAULT_NOTIFICATION_SETTINGS.nudgeNotifications,
				createdAt: now,
				updatedAt: now,
			});
		}

		await logUserActivity(
			ctx,
			user._id,
			"toggle_focus_mode",
			`Focus mode ${args.enabled ? "enabled" : "disabled"}`,
		);
	},
});

// Add/remove VIP contact
export const toggleVipContact = mutation({
	args: {
		contactId: v.id("users"),
		isVip: v.boolean(),
	},
	returns: v.null(),
	handler: async (ctx, args) => {
		const user = await getCurrentUser(ctx);

		const existingSettings = await ctx.db
			.query("userNotificationSettings")
			.withIndex("by_user", (q) => q.eq("userId", user._id))
			.unique();

		const now = Date.now();

		if (existingSettings) {
			let vipContacts = [...existingSettings.vipContacts];

			if (args.isVip) {
				// Add to VIP list if not already there
				if (!vipContacts.includes(args.contactId)) {
					vipContacts.push(args.contactId);
				}
			} else {
				// Remove from VIP list
				vipContacts = vipContacts.filter((id) => id !== args.contactId);
			}

			await ctx.db.patch(existingSettings._id, {
				vipContacts,
				updatedAt: now,
			});
		} else if (args.isVip) {
			// Create new settings with VIP contact
			await ctx.db.insert("userNotificationSettings", {
				userId: user._id,
				focusModeEnabled: DEFAULT_NOTIFICATION_SETTINGS.focusModeEnabled,
				vipContacts: [args.contactId],
				notificationGrouping:
					DEFAULT_NOTIFICATION_SETTINGS.notificationGrouping,
				soundEnabled: DEFAULT_NOTIFICATION_SETTINGS.soundEnabled,
				vibrationEnabled: DEFAULT_NOTIFICATION_SETTINGS.vibrationEnabled,
				desktopNotifications:
					DEFAULT_NOTIFICATION_SETTINGS.desktopNotifications,
				mentionNotifications:
					DEFAULT_NOTIFICATION_SETTINGS.mentionNotifications,
				nudgeNotifications: DEFAULT_NOTIFICATION_SETTINGS.nudgeNotifications,
				createdAt: now,
				updatedAt: now,
			});
		}

		await logUserActivity(
			ctx,
			user._id,
			"toggle_vip_contact",
			`${args.isVip ? "Added" : "Removed"} VIP contact`,
			{
				contactId: args.contactId,
			},
		);
	},
});

// Get users currently in focus mode (admin only)
export const getUsersInFocusMode = query({
	args: {},
	returns: v.array(
		v.object({
			userId: v.id("users"),
			focusModeEnabled: v.boolean(),
			user: v.object({
				_id: v.id("users"),
				name: v.optional(v.string()),
				email: v.optional(v.string()),
			}),
		}),
	),
	handler: async (ctx) => {
		const user = await getCurrentUser(ctx);

		// Require admin access
		await requireAdmin(ctx, user._id);

		const usersInFocusMode = await ctx.db
			.query("userNotificationSettings")
			.withIndex("by_focus_mode", (q) => q.eq("focusModeEnabled", true))
			.collect();

		const usersWithDetails = await Promise.all(
			usersInFocusMode.map(async (settings) => {
				const userData = await ctx.db.get(settings.userId);
				if (!userData) {
					throw new Error(`User not found: ${settings.userId}`);
				}
				return {
					userId: settings.userId,
					focusModeEnabled: settings.focusModeEnabled,
					user: {
						_id: userData._id,
						name: userData.name,
						email: userData.email,
					},
				};
			}),
		);

		return usersWithDetails;
	},
});
