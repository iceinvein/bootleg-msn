import { Resend } from "@convex-dev/resend";
import { v } from "convex/values";
import { components, internal } from "./_generated/api";
import {
	action,
	internalMutation,
	internalQuery,
	mutation,
	query,
} from "./_generated/server";

// Initialize Resend component
export const resend: Resend = new Resend(components.resend, {});

// Generate a random verification token
function generateToken(): string {
	return (
		Math.random().toString(36).substring(2, 15) +
		Math.random().toString(36).substring(2, 15)
	);
}

export const sendVerificationEmail = action({
	args: {
		email: v.string(),
		name: v.optional(v.string()),
	},
	returns: v.object({
		success: v.boolean(),
		emailId: v.string(),
	}),
	handler: async (ctx, args) => {
		// Check if email is already verified
		const existingVerification = await ctx.runQuery(
			internal.emailVerification.getVerificationByEmail,
			{
				email: args.email,
			},
		);

		if (existingVerification?.verified) {
			throw new Error("Email is already verified");
		}

		// Generate verification token
		const token = generateToken();
		const expiresAt = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

		// Store verification record
		await ctx.runMutation(internal.emailVerification.createVerification, {
			email: args.email,
			token,
			expiresAt,
		});

		const siteUrl = process.env.SITE_URL || "http://localhost:5173";
		const verificationUrl = `${siteUrl}/verify-email?token=${token}`;

		// Send verification email using @convex-dev/resend component
		const result = await resend.sendEmail(ctx, {
			from: "Bootleg MSN Messenger <onboarding@resend.dev>",
			to: args.email,
			subject: "Verify your email address",
			html: `
				<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
					<h2 style="color: #0066cc;">Welcome to the bootleg MSN Messenger!</h2>
					<p>Hi ${args.name || "there"},</p>
					<p>Thank you for signing up! Please verify your email address by clicking the button below:</p>
					<div style="text-align: center; margin: 30px 0;">
						<a href="${verificationUrl}" 
							style="background-color: #0066cc; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
							Verify Email Address
						</a>
					</div>
					<p>Or copy and paste this link into your browser:</p>
					<p style="word-break: break-all; color: #666;">${verificationUrl}</p>
					<p>This link will expire in 24 hours.</p>
					<p>If you didn't create an account, you can safely ignore this email.</p>
					<hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
					<p style="color: #666; font-size: 12px;">MSN Messenger Team</p>
				</div>
			`,
		});

		console.log("Verification email sent:", result);

		return {
			success: true,
			emailId: result,
		};
	},
});

export const verifyEmail = mutation({
	args: {
		token: v.string(),
	},
	returns: v.object({
		success: v.boolean(),
		email: v.string(),
	}),
	handler: async (ctx, args) => {
		const verification = await ctx.db
			.query("emailVerifications")
			.withIndex("by_token", (q) => q.eq("token", args.token))
			.unique();

		if (!verification) {
			throw new Error("Invalid verification token");
		}

		if (verification.verified) {
			throw new Error("Email is already verified");
		}

		if (verification.expiresAt < Date.now()) {
			throw new Error("Verification token has expired");
		}

		// Mark as verified
		await ctx.db.patch(verification._id, {
			verified: true,
		});

		return {
			success: true,
			email: verification.email,
		};
	},
});

export const checkEmailVerification = query({
	args: {
		email: v.string(),
	},
	returns: v.boolean(),
	handler: async (ctx, args) => {
		const verification = await ctx.db
			.query("emailVerifications")
			.withIndex("by_email", (q) => q.eq("email", args.email))
			.filter((q) => q.eq(q.field("verified"), true))
			.first();

		return !!verification;
	},
});

// Internal functions
export const createVerification = internalMutation({
	args: {
		email: v.string(),
		token: v.string(),
		expiresAt: v.number(),
	},
	returns: v.id("emailVerifications"),
	handler: async (ctx, args) => {
		// Remove any existing unverified tokens for this email
		const existingVerifications = await ctx.db
			.query("emailVerifications")
			.withIndex("by_email", (q) => q.eq("email", args.email))
			.filter((q) => q.eq(q.field("verified"), false))
			.collect();

		for (const verification of existingVerifications) {
			await ctx.db.delete(verification._id);
		}

		// Create new verification
		return await ctx.db.insert("emailVerifications", {
			email: args.email,
			token: args.token,
			expiresAt: args.expiresAt,
			verified: false,
		});
	},
});

export const getVerificationByEmail = internalQuery({
	args: {
		email: v.string(),
	},
	returns: v.union(
		v.object({
			_id: v.id("emailVerifications"),
			_creationTime: v.number(),
			email: v.string(),
			token: v.string(),
			expiresAt: v.number(),
			verified: v.boolean(),
		}),
		v.null(),
	),
	handler: async (ctx, args) => {
		return await ctx.db
			.query("emailVerifications")
			.withIndex("by_email", (q) => q.eq("email", args.email))
			.first();
	},
});
