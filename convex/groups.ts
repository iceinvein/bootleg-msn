import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const createGroup = mutation({
	args: {
		name: v.string(),
		description: v.optional(v.string()),
		isPrivate: v.boolean(),
		memberIds: v.array(v.id("users")),
	},
	handler: async (ctx, args) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) {
			throw new Error("Not authenticated");
		}

		// Create the group
		const groupId = await ctx.db.insert("groups", {
			name: args.name,
			description: args.description,
			createdBy: userId,
			isPrivate: args.isPrivate,
			memberCount: 1 + args.memberIds.length,
		});

		// Add creator as admin
		await ctx.db.insert("groupMembers", {
			groupId,
			userId,
			role: "admin",
			joinedAt: Date.now(),
		});

		// Add other members
		for (const memberId of args.memberIds) {
			// Check if they're contacts
			const contact = await ctx.db
				.query("contacts")
				.withIndex("by_user_and_contact", (q) =>
					q.eq("userId", userId).eq("contactUserId", memberId),
				)
				.unique();

			if (contact && contact.status === "accepted") {
				await ctx.db.insert("groupMembers", {
					groupId,
					userId: memberId,
					role: "member",
					joinedAt: Date.now(),
				});
			}
		}

		// Send system message
		await ctx.db.insert("groupMessages", {
			senderId: userId,
			groupId,
			content: "Group created",
			messageType: "system",
		});

		return groupId;
	},
});

export const addGroupMembers = mutation({
	args: {
		groupId: v.id("groups"),
		memberIds: v.array(v.id("users")),
	},
	handler: async (ctx, args) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) {
			throw new Error("Not authenticated");
		}

		// Check if user is an admin of the group
		const membership = await ctx.db
			.query("groupMembers")
			.withIndex("by_group_and_user", (q) =>
				q.eq("groupId", args.groupId).eq("userId", userId),
			)
			.unique();

		if (!membership || membership.role !== "admin") {
			throw new Error("Only group admins can add members");
		}

		const group = await ctx.db.get(args.groupId);
		if (!group) {
			throw new Error("Group not found");
		}

		const addedMembers: string[] = [];

		// Add each member
		for (const memberId of args.memberIds) {
			// Check if they're already a member
			const existingMembership = await ctx.db
				.query("groupMembers")
				.withIndex("by_group_and_user", (q) =>
					q.eq("groupId", args.groupId).eq("userId", memberId),
				)
				.unique();

			if (existingMembership) {
				continue; // Skip if already a member
			}

			// Check if they're contacts with the admin
			const contact = await ctx.db
				.query("contacts")
				.withIndex("by_user_and_contact", (q) =>
					q.eq("userId", userId).eq("contactUserId", memberId),
				)
				.unique();

			if (contact && contact.status === "accepted") {
				await ctx.db.insert("groupMembers", {
					groupId: args.groupId,
					userId: memberId,
					role: "member",
					joinedAt: Date.now(),
				});

				// Get the added user's name for the system message
				const addedUser = await ctx.db.get(memberId);
				const addedUserName =
					addedUser?.name || addedUser?.email || "Unknown User";
				addedMembers.push(addedUserName);
			}
		}

		// Send system message if any members were added
		if (addedMembers.length > 0) {
			const adminUser = await ctx.db.get(userId);
			const adminName = adminUser?.name || adminUser?.email || "Admin";

			await ctx.db.insert("groupMessages", {
				senderId: userId,
				groupId: args.groupId,
				content: `${adminName} added ${addedMembers.join(", ")} to the group`,
				messageType: "system",
			});
		}

		return { addedCount: addedMembers.length };
	},
});

export const removeGroupMember = mutation({
	args: {
		groupId: v.id("groups"),
		memberId: v.id("users"),
	},
	handler: async (ctx, args) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) {
			throw new Error("Not authenticated");
		}

		// Check if user is an admin of the group or removing themselves
		const membership = await ctx.db
			.query("groupMembers")
			.withIndex("by_group_and_user", (q) =>
				q.eq("groupId", args.groupId).eq("userId", userId),
			)
			.unique();

		const canRemove =
			membership && (membership.role === "admin" || userId === args.memberId);

		if (!canRemove) {
			throw new Error("You don't have permission to remove this member");
		}

		// Find the member to remove
		const memberToRemove = await ctx.db
			.query("groupMembers")
			.withIndex("by_group_and_user", (q) =>
				q.eq("groupId", args.groupId).eq("userId", args.memberId),
			)
			.unique();

		if (!memberToRemove) {
			throw new Error("Member not found in group");
		}

		// Don't allow removing the last admin
		if (memberToRemove.role === "admin") {
			const adminCount = await ctx.db
				.query("groupMembers")
				.withIndex("by_group", (q) => q.eq("groupId", args.groupId))
				.filter((q) => q.eq(q.field("role"), "admin"))
				.collect();

			if (adminCount.length <= 1) {
				throw new Error("Cannot remove the last admin from the group");
			}
		}

		// Remove the member
		await ctx.db.delete(memberToRemove._id);

		// Send system message
		const removedUser = await ctx.db.get(args.memberId);
		const removedUserName =
			removedUser?.name || removedUser?.email || "Unknown User";

		if (userId === args.memberId) {
			await ctx.db.insert("groupMessages", {
				senderId: userId,
				groupId: args.groupId,
				content: `${removedUserName} left the group`,
				messageType: "system",
			});
		} else {
			const adminUser = await ctx.db.get(userId);
			const adminName = adminUser?.name || adminUser?.email || "Admin";

			await ctx.db.insert("groupMessages", {
				senderId: userId,
				groupId: args.groupId,
				content: `${adminName} removed ${removedUserName} from the group`,
				messageType: "system",
			});
		}
	},
});

export const getUserGroups = query({
	handler: async (ctx) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) {
			return [];
		}

		const currentUser = await ctx.db.get(userId);
		const userEmail = currentUser?.email || "";

		const memberships = await ctx.db
			.query("groupMembers")
			.withIndex("by_user", (q) => q.eq("userId", userId))
			.collect();

		const groups = await Promise.all(
			memberships.map(async (membership) => {
				const group = await ctx.db.get(membership.groupId);
				if (!group) return null;

				// Get member count
				const memberCount = await ctx.db
					.query("groupMembers")
					.withIndex("by_group", (q) => q.eq("groupId", group._id))
					.collect();

				// Get unread count from unified messages system
				const allGroupMessages = await ctx.db
					.query("messages")
					.withIndex("by_group", (q) => q.eq("groupId", group._id))
					.collect();

				// Only consider messages sent after the user joined the group
				const groupMessagesAfterJoin = allGroupMessages.filter(
					(msg) => msg._creationTime >= membership.joinedAt,
				);

				// Count unread messages, excluding system messages about the user joining
				const userUnreadCount = groupMessagesAfterJoin.filter(
					(msg) =>
						msg.senderId !== userId &&
						!msg.isRead &&
						!(
							msg.messageType === "system" &&
							msg.content.includes(`added ${userEmail}`)
						),
				).length;

				// Get the last message timestamp
				const lastMessage = groupMessagesAfterJoin.sort(
					(a, b) => b._creationTime - a._creationTime,
				)[0];
				const lastMessageTime = lastMessage?._creationTime;

				return {
					...group,
					memberCount: memberCount.length,
					unreadCount: userUnreadCount,
					userRole: membership.role,
					lastMessageTime,
				};
			}),
		);

		return groups.filter(Boolean);
	},
});

export const getGroupMembers = query({
	args: { groupId: v.id("groups") },
	handler: async (ctx, args) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) {
			return [];
		}

		// Check if user is a member of the group
		const membership = await ctx.db
			.query("groupMembers")
			.withIndex("by_group_and_user", (q) =>
				q.eq("groupId", args.groupId).eq("userId", userId),
			)
			.unique();

		if (!membership) {
			return [];
		}

		const members = await ctx.db
			.query("groupMembers")
			.withIndex("by_group", (q) => q.eq("groupId", args.groupId))
			.collect();

		const membersWithDetails = await Promise.all(
			members.map(async (member) => {
				const user = await ctx.db.get(member.userId);

				// Get user status
				const status = await ctx.db
					.query("userStatus")
					.withIndex("by_user", (q) => q.eq("userId", member.userId))
					.unique();

				return {
					...member,
					user,
					status: status?.status || "offline",
					statusMessage: status?.statusMessage,
				};
			}),
		);

		return membersWithDetails;
	},
});

export const getGroupMessages = query({
	args: { groupId: v.id("groups") },
	handler: async (ctx, args) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) {
			return [];
		}

		// Check if user is a member of the group
		const membership = await ctx.db
			.query("groupMembers")
			.withIndex("by_group_and_user", (q) =>
				q.eq("groupId", args.groupId).eq("userId", userId),
			)
			.unique();

		if (!membership) {
			return [];
		}

		const messages = await ctx.db
			.query("groupMessages")
			.withIndex("by_group", (q) => q.eq("groupId", args.groupId))
			.order("asc")
			.collect();

		// Only show messages from after the user joined the group
		const messagesAfterJoin = messages.filter(
			(msg) => msg._creationTime >= membership.joinedAt,
		);

		const messagesWithSenders = await Promise.all(
			messagesAfterJoin.map(async (message) => {
				const sender = await ctx.db.get(message.senderId);
				return {
					...message,
					sender,
				};
			}),
		);

		return messagesWithSenders;
	},
});

export const sendGroupMessage = mutation({
	args: {
		groupId: v.id("groups"),
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

		// Check if user is a member of the group
		const membership = await ctx.db
			.query("groupMembers")
			.withIndex("by_group_and_user", (q) =>
				q.eq("groupId", args.groupId).eq("userId", userId),
			)
			.unique();

		if (!membership) {
			throw new Error("You are not a member of this group");
		}

		await ctx.db.insert("groupMessages", {
			senderId: userId,
			groupId: args.groupId,
			content: args.content,
			messageType: args.messageType || "text",
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

export const markGroupMessagesAsRead = mutation({
	args: {
		groupId: v.id("groups"),
	},
	handler: async (ctx, args) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) {
			throw new Error("Not authenticated");
		}

		// Check if user is a member of the group and get join time
		const membership = await ctx.db
			.query("groupMembers")
			.withIndex("by_group_and_user", (q) =>
				q.eq("groupId", args.groupId).eq("userId", userId),
			)
			.unique();

		if (!membership) {
			throw new Error("You are not a member of this group");
		}

		const allMessages = await ctx.db
			.query("groupMessages")
			.withIndex("by_group", (q) => q.eq("groupId", args.groupId))
			.collect();

		const existingReads = await ctx.db
			.query("groupMessageReads")
			.withIndex("by_group_and_user", (q) =>
				q.eq("groupId", args.groupId).eq("userId", userId),
			)
			.collect();

		const readMessageIds = new Set(existingReads.map((read) => read.messageId));

		// Only mark messages as read that were sent after the user joined
		const messagesAfterJoin = allMessages.filter(
			(msg) => msg._creationTime >= membership.joinedAt,
		);

		// Get current user's email for system message filtering
		const currentUser = await ctx.db.get(userId);
		const userEmail = currentUser?.email || "";

		for (const message of messagesAfterJoin) {
			if (
				message.senderId !== userId &&
				!readMessageIds.has(message._id) &&
				!(
					message.messageType === "system" &&
					message.content.includes(`added ${userEmail}`)
				)
			) {
				await ctx.db.insert("groupMessageReads", {
					groupId: args.groupId,
					messageId: message._id,
					userId,
					readAt: Date.now(),
				});
			}
		}
	},
});

export const editGroupMessage = mutation({
	args: {
		messageId: v.id("groupMessages"),
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

		// Check if user is still a member of the group
		const membership = await ctx.db
			.query("groupMembers")
			.withIndex("by_group_and_user", (q) =>
				q.eq("groupId", message.groupId).eq("userId", userId),
			)
			.unique();

		if (!membership) {
			throw new Error("You are not a member of this group");
		}

		await ctx.db.patch(args.messageId, {
			content: args.newContent.trim(),
			isEdited: true,
			editedAt: Date.now(),
		});
	},
});

export const deleteGroupMessage = mutation({
	args: {
		messageId: v.id("groupMessages"),
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

		// Check if user is still a member of the group
		const membership = await ctx.db
			.query("groupMembers")
			.withIndex("by_group_and_user", (q) =>
				q.eq("groupId", message.groupId).eq("userId", userId),
			)
			.unique();

		if (!membership) {
			throw new Error("You are not a member of this group");
		}

		// Mark as deleted instead of actually deleting
		await ctx.db.patch(args.messageId, {
			isDeleted: true,
			deletedAt: Date.now(),
			content: "This message was deleted",
		});
	},
});

export const updateGroupDetails = mutation({
	args: {
		groupId: v.id("groups"),
		name: v.optional(v.string()),
		description: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) throw new Error("Not authenticated");

		// Only admins can update group details
		const membership = await ctx.db
			.query("groupMembers")
			.withIndex("by_group_and_user", (q) =>
				q.eq("groupId", args.groupId).eq("userId", userId),
			)
			.unique();
		if (!membership || membership.role !== "admin") {
			throw new Error("Only group admins can update group details");
		}

		const group = await ctx.db.get(args.groupId);
		if (!group) throw new Error("Group not found");

		const updates: { name?: string; description?: string | undefined } = {};
		if (typeof args.name === "string") {
			const trimmed = args.name.trim();
			if (!trimmed) throw new Error("Group name cannot be empty");
			updates.name = trimmed;
		}
		if (typeof args.description !== "undefined") {
			const trimmed = args.description?.trim() ?? "";
			updates.description = trimmed.length > 0 ? trimmed : undefined;
		}

		if (Object.keys(updates).length === 0) return;

		await ctx.db.patch(args.groupId, updates);
	},
});

export const leaveGroup = mutation({
	args: {
		groupId: v.id("groups"),
	},
	handler: async (ctx, args) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) {
			throw new Error("Not authenticated");
		}

		const membership = await ctx.db
			.query("groupMembers")
			.withIndex("by_group_and_user", (q) =>
				q.eq("groupId", args.groupId).eq("userId", userId),
			)
			.unique();

		if (!membership) {
			throw new Error("You are not a member of this group");
		}

		// Check if user is the last admin
		if (membership.role === "admin") {
			const adminCount = await ctx.db
				.query("groupMembers")
				.withIndex("by_group", (q) => q.eq("groupId", args.groupId))
				.filter((q) => q.eq(q.field("role"), "admin"))
				.collect();

			if (adminCount.length <= 1) {
				throw new Error(
					"Cannot leave group: you are the last admin. Please promote another member to admin first.",
				);
			}
		}

		await ctx.db.delete(membership._id);

		// Send system message
		const user = await ctx.db.get(userId);
		const userName = user?.name || user?.email || "Unknown User";

		await ctx.db.insert("groupMessages", {
			senderId: userId,
			groupId: args.groupId,
			content: `${userName} left the group`,
			messageType: "system",
		});
	},
});
