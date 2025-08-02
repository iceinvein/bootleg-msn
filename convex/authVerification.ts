import { v } from "convex/values";
import { mutation } from "./_generated/server";

export const verifyEmailForAuth = mutation({
	args: {
		email: v.string(),
	},
	handler: async (ctx, args) => {
		// Check if email is verified
		const verification = await ctx.db
			.query("emailVerifications")
			.withIndex("by_email", (q) => q.eq("email", args.email))
			.filter((q) => q.eq(q.field("verified"), true))
			.first();

		if (!verification) {
			throw new Error(
				"Email not verified. Please verify your email before signing in.",
			);
		}

		// Find or create user
		let user = await ctx.db
			.query("users")
			.withIndex("email", (q) => q.eq("email", args.email))
			.unique();

		if (!user) {
			// Create new user if they don't exist
			const userId = await ctx.db.insert("users", {
				email: args.email,
				emailVerificationTime: Date.now(),
			});
			user = await ctx.db.get(userId);

			if (!user) {
				throw new Error("Failed to create user");
			}
		}

		return user._id;
	},
});
