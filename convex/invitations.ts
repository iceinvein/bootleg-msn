import { getAuthUserId } from "@convex-dev/auth/server";
import { Resend } from "@convex-dev/resend";
import { ConvexError, v } from "convex/values";
import { components, internal } from "./_generated/api";
import {
	action,
	internalMutation,
	internalQuery,
	mutation,
	query,
} from "./_generated/server";

// Initialize Resend component
export const resend: Resend = new Resend(components.resend, {
	testMode: process.env.VITE_RESEND_TEST_MODE === "true",
});

// Generate a random invitation token
function generateInvitationToken(): string {
	return (
		Math.random().toString(36).substring(2, 15) +
		Math.random().toString(36).substring(2, 15) +
		Math.random().toString(36).substring(2, 15)
	);
}

// Send invitation to someone who hasn't signed up yet
export const sendInvitation = action({
	args: {
		inviteeEmail: v.string(),
		inviteeName: v.optional(v.string()),
		message: v.optional(v.string()),
	},
	returns: v.object({
		success: v.boolean(),
		invitationId: v.string(),
		emailId: v.string(),
	}),
	handler: async (
		ctx,
		args,
	): Promise<{
		success: boolean;
		invitationId: string;
		emailId: string;
	}> => {
		const userId = await getAuthUserId(ctx);
		if (!userId) {
			throw new ConvexError("Not authenticated");
		}

		// Validate email format
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(args.inviteeEmail)) {
			throw new ConvexError("Invalid email address");
		}

		// Check if user already exists
		const existingUser = await ctx.runQuery(
			internal.invitations.getUserByEmail,
			{
				email: args.inviteeEmail,
			},
		);

		if (existingUser) {
			throw new ConvexError(
				"User already has an account. Try sending a contact request instead.",
			);
		}

		// Check if there's already a pending invitation from this user to this email
		const existingInvitation = await ctx.runQuery(
			internal.invitations.getInvitationByInviterAndEmail,
			{
				inviterUserId: userId,
				inviteeEmail: args.inviteeEmail,
			},
		);

		let invitationId: string;
		let token: string;

		if (existingInvitation && existingInvitation.status === "pending") {
			// Update existing pending invitation
			token = generateInvitationToken();
			const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days

			invitationId = await ctx.runMutation(
				internal.invitations.updateInvitation,
				{
					invitationId: existingInvitation._id,
					token,
					message: args.message,
					inviteeName: args.inviteeName,
					expiresAt,
				},
			);
		} else {
			// Create new invitation
			token = generateInvitationToken();
			const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days

			invitationId = await ctx.runMutation(
				internal.invitations.createInvitation,
				{
					inviterUserId: userId,
					inviteeEmail: args.inviteeEmail,
					inviteeName: args.inviteeName,
					token,
					message: args.message,
					expiresAt,
				},
			);
		}

		// Get inviter details for email
		const inviter = await ctx.runQuery(internal.invitations.getUserById, {
			userId,
		});

		if (!inviter) {
			throw new ConvexError("Inviter not found");
		}

		// Send invitation email
		const siteUrl = process.env.SITE_URL || "http://localhost:5173";
		const invitationUrl = `${siteUrl}/signup?invitation=${token}`;

		// Use inviter's name if available, otherwise fall back to email
		const inviterDisplayName = inviter.name || inviter.email;

		const fromEmail =
			process.env.SEND_EMAIL_ADDRESS || "hello@mail.bootleg-msn.online";
		const emailResult = await resend.sendEmail(ctx, {
			from: `Bootleg MSN Messenger <${fromEmail}>`,
			to: args.inviteeEmail,
			subject: `${inviterDisplayName} invited you to join MSN Messenger`,
			html: `
				<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
					<h2 style="color: #0066cc;">You're invited to join MSN Messenger!</h2>
					<p>Hi ${args.inviteeName || "there"},</p>
					<p><strong>${inviterDisplayName}</strong> (${inviter.email}) has invited you to join MSN Messenger so you can chat together.</p>
					${args.message ? `<div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;"><p style="margin: 0; font-style: italic;">"${args.message}"</p></div>` : ""}
					<p>MSN Messenger is a modern take on the classic instant messaging experience. Connect with friends, share files, and stay in touch!</p>
					<div style="text-align: center; margin: 30px 0;">
						<a href="${invitationUrl}" 
							style="background-color: #0066cc; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
							Join MSN Messenger
						</a>
					</div>
					<p>Or copy and paste this link into your browser:</p>
					<p style="word-break: break-all; color: #666;">${invitationUrl}</p>
					<p>This invitation will expire in 7 days.</p>
					<p>If you don't want to join, you can safely ignore this email.</p>
					<hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
					<p style="color: #666; font-size: 12px;">MSN Messenger Team</p>
				</div>
			`,
		});

		return {
			success: true,
			invitationId,
			emailId: emailResult,
		};
	},
});

// Get invitations sent by the current user
export const getSentInvitations = query({
	args: {},
	handler: async (ctx) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) {
			return [];
		}

		const invitations = await ctx.db
			.query("invitations")
			.withIndex("by_inviter", (q) => q.eq("inviterUserId", userId))
			.order("desc")
			.collect();

		return invitations;
	},
});

// Cancel a sent invitation
export const cancelInvitation = mutation({
	args: {
		invitationId: v.id("invitations"),
	},
	handler: async (ctx, args) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) {
			throw new ConvexError("Not authenticated");
		}

		const invitation = await ctx.db.get(args.invitationId);
		if (!invitation) {
			throw new ConvexError("Invitation not found");
		}

		if (invitation.inviterUserId !== userId) {
			throw new ConvexError("You can only cancel your own invitations");
		}

		if (invitation.status !== "pending") {
			throw new ConvexError("Can only cancel pending invitations");
		}

		await ctx.db.patch(args.invitationId, {
			status: "cancelled",
		});
	},
});

// Get invitation by token (for signup process) - read-only version
export const getInvitationByToken = query({
	args: {
		token: v.string(),
	},
	handler: async (ctx, args) => {
		const invitation = await ctx.db
			.query("invitations")
			.withIndex("by_token", (q) => q.eq("token", args.token))
			.unique();

		if (!invitation) {
			return null;
		}

		// Check if invitation is expired (but don't modify it in a query)
		if (invitation.expiresAt < Date.now()) {
			return null;
		}

		if (invitation.status !== "pending") {
			return null;
		}

		// Get inviter details
		const inviter = await ctx.db.get(invitation.inviterUserId);

		return {
			...invitation,
			inviter,
		};
	},
});

// Accept invitation (called during signup)
export const acceptInvitation = mutation({
	args: {
		token: v.string(),
	},
	handler: async (ctx, args) => {
		const newUserId = await getAuthUserId(ctx);
		if (!newUserId) {
			throw new ConvexError("Not authenticated");
		}
		const invitation = await ctx.db
			.query("invitations")
			.withIndex("by_token", (q) => q.eq("token", args.token))
			.unique();

		if (!invitation) {
			throw new ConvexError("Invitation not found");
		}

		if (invitation.status !== "pending") {
			throw new ConvexError("Invitation is no longer valid");
		}

		if (invitation.expiresAt < Date.now()) {
			await ctx.db.patch(invitation._id, {
				status: "expired",
			});
			throw new ConvexError("Invitation has expired");
		}

		// Mark invitation as accepted
		await ctx.db.patch(invitation._id, {
			status: "accepted",
			acceptedAt: Date.now(),
		});

		// Create mutual contact relationship
		await ctx.db.insert("contacts", {
			userId: invitation.inviterUserId,
			contactUserId: newUserId,
			status: "accepted",
			nickname: invitation.inviteeName,
		});

		await ctx.db.insert("contacts", {
			userId: newUserId,
			contactUserId: invitation.inviterUserId,
			status: "accepted",
		});

		// Initialize user statuses if they don't exist
		const inviterStatus = await ctx.db
			.query("userStatus")
			.withIndex("by_user", (q) => q.eq("userId", invitation.inviterUserId))
			.unique();

		if (!inviterStatus) {
			await ctx.db.insert("userStatus", {
				userId: invitation.inviterUserId,
				status: "offline",
				lastSeen: Date.now(),
			});
		}

		const newUserStatus = await ctx.db
			.query("userStatus")
			.withIndex("by_user", (q) => q.eq("userId", newUserId))
			.unique();

		if (!newUserStatus) {
			await ctx.db.insert("userStatus", {
				userId: newUserId,
				status: "online",
				lastSeen: Date.now(),
			});
		}

		return {
			success: true,
			inviterUserId: invitation.inviterUserId,
		};
	},
});

// Internal functions
export const getUserByEmail = internalQuery({
	args: {
		email: v.string(),
	},
	handler: async (ctx, args) => {
		return await ctx.db
			.query("users")
			.withIndex("email", (q) => q.eq("email", args.email))
			.unique();
	},
});

export const getUserById = internalQuery({
	args: {
		userId: v.id("users"),
	},
	handler: async (ctx, args) => {
		return await ctx.db.get(args.userId);
	},
});

export const getInvitationByInviterAndEmail = internalQuery({
	args: {
		inviterUserId: v.id("users"),
		inviteeEmail: v.string(),
	},
	handler: async (ctx, args) => {
		return await ctx.db
			.query("invitations")
			.withIndex("by_inviter_and_email", (q) =>
				q
					.eq("inviterUserId", args.inviterUserId)
					.eq("inviteeEmail", args.inviteeEmail),
			)
			.filter((q) => q.eq(q.field("status"), "pending"))
			.unique();
	},
});

export const createInvitation = internalMutation({
	args: {
		inviterUserId: v.id("users"),
		inviteeEmail: v.string(),
		inviteeName: v.optional(v.string()),
		token: v.string(),
		message: v.optional(v.string()),
		expiresAt: v.number(),
	},
	handler: async (ctx, args) => {
		const invitationId = await ctx.db.insert("invitations", {
			inviterUserId: args.inviterUserId,
			inviteeEmail: args.inviteeEmail,
			inviteeName: args.inviteeName,
			token: args.token,
			status: "pending",
			message: args.message,
			expiresAt: args.expiresAt,
			createdAt: Date.now(),
		});

		return invitationId;
	},
});

export const updateInvitation = internalMutation({
	args: {
		invitationId: v.id("invitations"),
		token: v.string(),
		message: v.optional(v.string()),
		inviteeName: v.optional(v.string()),
		expiresAt: v.number(),
	},
	handler: async (ctx, args) => {
		await ctx.db.patch(args.invitationId, {
			token: args.token,
			message: args.message,
			inviteeName: args.inviteeName,
			expiresAt: args.expiresAt,
			createdAt: Date.now(), // Update creation time for resent invitations
		});

		return args.invitationId;
	},
});
