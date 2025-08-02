import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { type MutationCtx, mutation, query } from "./_generated/server";

export const sendContactRequest = mutation({
	args: {
		contactEmail: v.string(),
		nickname: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) {
			throw new Error("Not authenticated");
		}

		// Find user by email
		const contactUser = await ctx.db
			.query("users")
			.withIndex("email", (q) => q.eq("email", args.contactEmail))
			.unique();

		if (!contactUser) {
			throw new Error("User not found");
		}

		if (contactUser._id === userId) {
			throw new Error("Cannot add yourself as a contact");
		}

		// Check if any relationship already exists
		const existingContact = await ctx.db
			.query("contacts")
			.withIndex("by_user_and_contact", (q) =>
				q.eq("userId", userId).eq("contactUserId", contactUser._id),
			)
			.unique();

		if (existingContact) {
			if (existingContact.status === "pending") {
				throw new Error("Contact request already sent");
			} else if (existingContact.status === "accepted") {
				throw new Error("Contact already exists");
			} else if (existingContact.status === "blocked") {
				throw new Error("Cannot send request to blocked user");
			}
		}

		// Check if there's a reverse relationship (they sent us a request)
		const reverseContact = await ctx.db
			.query("contacts")
			.withIndex("by_user_and_contact", (q) =>
				q.eq("userId", contactUser._id).eq("contactUserId", userId),
			)
			.unique();

		if (reverseContact && reverseContact.status === "pending") {
			// Auto-accept if they already sent us a request
			await ctx.db.patch(reverseContact._id, {
				status: "accepted",
			});

			// Create our accepted contact
			await ctx.db.insert("contacts", {
				userId,
				contactUserId: contactUser._id,
				status: "accepted",
				nickname: args.nickname,
			});

			// Initialize user statuses
			await initializeUserStatuses(ctx, userId, contactUser._id);

			return { autoAccepted: true };
		}

		// Send new contact request
		await ctx.db.insert("contacts", {
			userId,
			contactUserId: contactUser._id,
			status: "pending",
			nickname: args.nickname,
		});

		return { autoAccepted: false };
	},
});

export const acceptContactRequest = mutation({
	args: {
		contactId: v.id("contacts"),
	},
	handler: async (ctx, args) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) {
			throw new Error("Not authenticated");
		}

		const contactRequest = await ctx.db.get(args.contactId);
		if (!contactRequest || contactRequest.contactUserId !== userId) {
			throw new Error("Contact request not found or unauthorized");
		}

		if (contactRequest.status !== "pending") {
			throw new Error("Contact request is not pending");
		}

		// Accept the request
		await ctx.db.patch(args.contactId, {
			status: "accepted",
		});

		// Create reverse contact relationship
		await ctx.db.insert("contacts", {
			userId,
			contactUserId: contactRequest.userId,
			status: "accepted",
		});

		// Initialize user statuses
		await initializeUserStatuses(ctx, userId, contactRequest.userId);
	},
});

export const rejectContactRequest = mutation({
	args: {
		contactId: v.id("contacts"),
	},
	handler: async (ctx, args) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) {
			throw new Error("Not authenticated");
		}

		const contactRequest = await ctx.db.get(args.contactId);
		if (!contactRequest || contactRequest.contactUserId !== userId) {
			throw new Error("Contact request not found or unauthorized");
		}

		if (contactRequest.status !== "pending") {
			throw new Error("Contact request is not pending");
		}

		// Delete the request
		await ctx.db.delete(args.contactId);
	},
});

export const cancelSentRequest = mutation({
	args: {
		contactId: v.id("contacts"),
	},
	handler: async (ctx, args) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) {
			throw new Error("Not authenticated");
		}

		const contactRequest = await ctx.db.get(args.contactId);
		if (!contactRequest || contactRequest.userId !== userId) {
			throw new Error("Contact request not found or unauthorized");
		}

		if (contactRequest.status !== "pending") {
			throw new Error("Contact request is not pending");
		}

		// Delete the sent request
		await ctx.db.delete(args.contactId);
	},
});

export const getPendingRequests = query({
	args: {},
	handler: async (ctx) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) {
			return [];
		}

		const pendingRequests = await ctx.db
			.query("contacts")
			.withIndex("by_contact", (q) => q.eq("contactUserId", userId))
			.filter((q) => q.eq(q.field("status"), "pending"))
			.collect();

		const requestsWithDetails = await Promise.all(
			pendingRequests.map(async (request) => {
				const user = await ctx.db.get(request.userId);
				return {
					...request,
					user,
				};
			}),
		);

		return requestsWithDetails;
	},
});

export const getSentRequests = query({
	args: {},
	handler: async (ctx) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) {
			return [];
		}

		const sentRequests = await ctx.db
			.query("contacts")
			.withIndex("by_user", (q) => q.eq("userId", userId))
			.filter((q) => q.eq(q.field("status"), "pending"))
			.collect();

		const requestsWithDetails = await Promise.all(
			sentRequests.map(async (request) => {
				const user = await ctx.db.get(request.contactUserId);
				return {
					...request,
					user,
				};
			}),
		);

		return requestsWithDetails;
	},
});

export const getContacts = query({
	args: {},
	handler: async (ctx) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) {
			return [];
		}

		const contacts = await ctx.db
			.query("contacts")
			.withIndex("by_user", (q) => q.eq("userId", userId))
			.filter((q) => q.eq(q.field("status"), "accepted"))
			.collect();

		const contactsWithDetails = await Promise.all(
			contacts.map(async (contact) => {
				const user = await ctx.db.get(contact.contactUserId);
				const status = await ctx.db
					.query("userStatus")
					.withIndex("by_user", (q) => q.eq("userId", contact.contactUserId))
					.unique();

				// Get unread message count
				const unreadCount = await ctx.db
					.query("messages")
					.withIndex("by_receiver", (q) => q.eq("receiverId", userId))
					.filter((q) =>
						q.and(
							q.eq(q.field("senderId"), contact.contactUserId),
							q.eq(q.field("isRead"), false),
						),
					)
					.collect();

				// Determine if user is actually online (last seen within 5 minutes)
				const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
				let actualStatus = status?.status || "offline";

				if (
					status &&
					status.status !== "offline" &&
					status.lastSeen < fiveMinutesAgo
				) {
					actualStatus = "offline";
				}

				return {
					...contact,
					user,
					status: actualStatus,
					statusMessage: status?.statusMessage,
					lastSeen: status?.lastSeen,
					unreadCount: unreadCount.length,
				};
			}),
		);

		return contactsWithDetails;
	},
});

export const removeContact = mutation({
	args: {
		contactId: v.id("contacts"),
	},
	handler: async (ctx, args) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) {
			throw new Error("Not authenticated");
		}

		const contact = await ctx.db.get(args.contactId);
		if (!contact || contact.userId !== userId) {
			throw new Error("Contact not found or unauthorized");
		}

		await ctx.db.delete(args.contactId);

		// Also remove the reverse contact relationship
		const reverseContact = await ctx.db
			.query("contacts")
			.withIndex("by_user_and_contact", (q) =>
				q.eq("userId", contact.contactUserId).eq("contactUserId", userId),
			)
			.unique();

		if (reverseContact) {
			await ctx.db.delete(reverseContact._id);
		}
	},
});

// Helper function to initialize user statuses
async function initializeUserStatuses(
	ctx: MutationCtx,
	userId1: Id<"users">,
	userId2: Id<"users">,
) {
	// Initialize user status for the first user if they don't have one
	const user1Status = await ctx.db
		.query("userStatus")
		.withIndex("by_user", (q) => q.eq("userId", userId1))
		.unique();

	if (!user1Status) {
		await ctx.db.insert("userStatus", {
			userId: userId1,
			status: "online",
			lastSeen: Date.now(),
		});
	}

	// Initialize user status for the second user if they don't have one
	const user2Status = await ctx.db
		.query("userStatus")
		.withIndex("by_user", (q) => q.eq("userId", userId2))
		.unique();

	if (!user2Status) {
		await ctx.db.insert("userStatus", {
			userId: userId2,
			status: "offline",
			lastSeen: Date.now(),
		});
	}
}
