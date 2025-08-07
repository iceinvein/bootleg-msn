import Google from "@auth/core/providers/google";
import { Password } from "@convex-dev/auth/providers/Password";
import { convexAuth, getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
	providers: [Password, Google],
});

// Custom mutation to check email verification before allowing sign-in
export const checkEmailVerificationForAuth = mutation({
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

export const loggedInUser = query({
	args: {},
	returns: v.union(
		v.object({
			_id: v.id("users"),
			_creationTime: v.number(),
			name: v.optional(v.string()),
			email: v.optional(v.string()),
			emailVerificationTime: v.optional(v.number()),
			image: v.optional(v.string()),
			isAnonymous: v.optional(v.boolean()),
		}),
		v.null(),
	),
	handler: async (ctx) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) {
			return null;
		}
		const user = await ctx.db.get(userId);
		if (!user) {
			return null;
		}
		return user;
	},
});

export const getUserById = query({
	args: { userId: v.id("users") },
	returns: v.union(
		v.object({
			_id: v.id("users"),
			_creationTime: v.number(),
			name: v.optional(v.string()),
			email: v.optional(v.string()),
			emailVerificationTime: v.optional(v.number()),
			image: v.optional(v.string()),
			isAnonymous: v.optional(v.boolean()),
		}),
		v.null(),
	),
	handler: async (ctx, args) => {
		return await ctx.db.get(args.userId);
	},
});

export const updateUserName = mutation({
	args: { name: v.string() },
	returns: v.null(),
	handler: async (ctx, args) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) {
			throw new Error("Not authenticated");
		}

		await ctx.db.patch(userId, {
			name: args.name,
		});
	},
});
