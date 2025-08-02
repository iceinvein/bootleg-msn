import { Anonymous } from "@convex-dev/auth/providers/Anonymous";
import { Password } from "@convex-dev/auth/providers/Password";
import { convexAuth, getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
	providers: [Password, Anonymous],
});

export const loggedInUser = query({
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
	handler: async (ctx, args) => {
		return await ctx.db.get(args.userId);
	},
});

export const updateUserName = mutation({
	args: { name: v.string() },
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
