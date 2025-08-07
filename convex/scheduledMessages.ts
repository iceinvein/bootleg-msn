import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { internalMutation, mutation, query } from "./_generated/server";
import {
	getCurrentUser,
	logUserActivity,
	validateScheduledTime,
} from "./utils";
import {
	createScheduledMessageValidator,
	messageTypeValidator,
	recurringTypeValidator,
	scheduledMessageStatusValidator,
} from "./validators";

// Create a scheduled message
export const createScheduledMessage = mutation({
	args: createScheduledMessageValidator,
	returns: v.id("scheduledMessages"),
	handler: async (ctx, args) => {
		const user = await getCurrentUser(ctx);

		// Validate scheduled time
		validateScheduledTime(args.scheduledFor, args.timezone);

		// Ensure either receiverId or groupId is provided, but not both
		if (!args.receiverId && !args.groupId) {
			throw new Error("Either receiverId or groupId must be provided");
		}
		if (args.receiverId && args.groupId) {
			throw new Error("Cannot specify both receiverId and groupId");
		}

		// Create the scheduled message
		const scheduledMessageId = await ctx.db.insert("scheduledMessages", {
			senderId: user._id,
			receiverId: args.receiverId,
			groupId: args.groupId,
			content: args.content,
			messageType: args.messageType,
			scheduledFor: args.scheduledFor,
			status: "pending",
			fileId: args.fileId,
			fileName: args.fileName,
			fileType: args.fileType,
			fileSize: args.fileSize,
			timezone: args.timezone,
			recurring: args.recurring,
			createdAt: Date.now(),
		});

		await logUserActivity(
			ctx,
			user._id,
			"create_scheduled_message",
			`Scheduled message for ${new Date(args.scheduledFor).toISOString()}`,
			{
				messageId: scheduledMessageId,
			},
		);

		return scheduledMessageId;
	},
});

// Get scheduled messages for the current user
export const getScheduledMessages = query({
	args: {
		status: v.optional(scheduledMessageStatusValidator),
		limit: v.optional(v.number()),
	},
	returns: v.array(
		v.object({
			_id: v.id("scheduledMessages"),
			receiverId: v.optional(v.id("users")),
			groupId: v.optional(v.id("groups")),
			content: v.string(),
			messageType: messageTypeValidator,
			scheduledFor: v.number(),
			status: scheduledMessageStatusValidator,
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
			createdAt: v.number(),
			lastAttemptAt: v.optional(v.number()),
			failureReason: v.optional(v.string()),
			recipient: v.optional(
				v.object({
					_id: v.id("users"),
					name: v.optional(v.string()),
					image: v.optional(v.string()),
				}),
			),
			group: v.optional(
				v.object({
					_id: v.id("groups"),
					name: v.string(),
				}),
			),
		}),
	),
	handler: async (ctx, args) => {
		const user = await getCurrentUser(ctx);
		const limit = args.limit || 50;

		let query = ctx.db
			.query("scheduledMessages")
			.withIndex("by_sender", (q) => q.eq("senderId", user._id));

		if (args.status) {
			query = ctx.db
				.query("scheduledMessages")
				.withIndex("by_sender", (q) => q.eq("senderId", user._id))
				.filter((q) => q.eq(q.field("status"), args.status));
		}

		const scheduledMessages = await query.order("desc").take(limit);

		// Get recipient/group details for each message
		const messagesWithDetails = await Promise.all(
			scheduledMessages.map(async (message) => {
				let recipient:
					| {
							_id: Id<"users">;
							name?: string;
							image?: string;
					  }
					| undefined;
				let group:
					| {
							_id: Id<"groups">;
							name: string;
					  }
					| undefined;

				if (message.receiverId) {
					const user = await ctx.db.get(message.receiverId);
					if (user) {
						recipient = {
							_id: user._id,
							name: user.name,
							image: user.image,
						};
					}
				}

				if (message.groupId) {
					const groupData = await ctx.db.get(message.groupId);
					if (groupData) {
						group = {
							_id: groupData._id,
							name: groupData.name,
						};
					}
				}

				return {
					...message,
					recipient,
					group,
				};
			}),
		);

		return messagesWithDetails;
	},
});

// Cancel a scheduled message
export const cancelScheduledMessage = mutation({
	args: { messageId: v.id("scheduledMessages") },
	returns: v.null(),
	handler: async (ctx, args) => {
		const user = await getCurrentUser(ctx);

		const scheduledMessage = await ctx.db.get(args.messageId);
		if (!scheduledMessage) {
			throw new Error("Scheduled message not found");
		}

		if (scheduledMessage.senderId !== user._id) {
			throw new Error("Not authorized to cancel this message");
		}

		if (scheduledMessage.status !== "pending") {
			throw new Error("Can only cancel pending messages");
		}

		await ctx.db.patch(args.messageId, {
			status: "cancelled",
		});

		await logUserActivity(
			ctx,
			user._id,
			"cancel_scheduled_message",
			undefined,
			{
				messageId: args.messageId,
			},
		);
	},
});

// Update a scheduled message
export const updateScheduledMessage = mutation({
	args: {
		messageId: v.id("scheduledMessages"),
		content: v.optional(v.string()),
		scheduledFor: v.optional(v.number()),
		timezone: v.optional(v.string()),
		recurring: v.optional(
			v.object({
				type: recurringTypeValidator,
				interval: v.number(),
				endDate: v.optional(v.number()),
			}),
		),
	},
	returns: v.null(),
	handler: async (ctx, args) => {
		const user = await getCurrentUser(ctx);

		const scheduledMessage = await ctx.db.get(args.messageId);
		if (!scheduledMessage) {
			throw new Error("Scheduled message not found");
		}

		if (scheduledMessage.senderId !== user._id) {
			throw new Error("Not authorized to update this message");
		}

		if (scheduledMessage.status !== "pending") {
			throw new Error("Can only update pending messages");
		}

		// Validate new scheduled time if provided
		if (args.scheduledFor) {
			const timezone = args.timezone || scheduledMessage.timezone;
			validateScheduledTime(args.scheduledFor, timezone);
		}

		// Update the message
		const updates: Partial<{
			content: string;
			scheduledFor: number;
			timezone: string;
			recurring: {
				type: "daily" | "weekly" | "monthly";
				interval: number;
				endDate?: number;
			};
		}> = {};
		if (args.content !== undefined) updates.content = args.content;
		if (args.scheduledFor !== undefined)
			updates.scheduledFor = args.scheduledFor;
		if (args.timezone !== undefined) updates.timezone = args.timezone;
		if (args.recurring !== undefined) updates.recurring = args.recurring;

		await ctx.db.patch(args.messageId, updates);

		await logUserActivity(
			ctx,
			user._id,
			"update_scheduled_message",
			undefined,
			{
				messageId: args.messageId,
			},
		);
	},
});

// Internal function to get pending messages ready to send
export const getPendingMessages = internalMutation({
	args: { currentTime: v.number() },
	returns: v.array(
		v.object({
			_id: v.id("scheduledMessages"),
			senderId: v.id("users"),
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
		}),
	),
	handler: async (ctx, args) => {
		return await ctx.db
			.query("scheduledMessages")
			.withIndex("by_pending_and_time", (q) =>
				q.eq("status", "pending").lte("scheduledFor", args.currentTime),
			)
			.collect();
	},
});

// Internal function to mark message as sent
export const markMessageAsSent = internalMutation({
	args: {
		messageId: v.id("scheduledMessages"),
		actualMessageId: v.optional(v.string()),
	},
	returns: v.null(),
	handler: async (ctx, args) => {
		await ctx.db.patch(args.messageId, {
			status: "sent",
			lastAttemptAt: Date.now(),
		});
	},
});

// Internal function to mark message as failed
export const markMessageAsFailed = internalMutation({
	args: {
		messageId: v.id("scheduledMessages"),
		failureReason: v.string(),
	},
	returns: v.null(),
	handler: async (ctx, args) => {
		await ctx.db.patch(args.messageId, {
			status: "failed",
			lastAttemptAt: Date.now(),
			failureReason: args.failureReason,
		});
	},
});
