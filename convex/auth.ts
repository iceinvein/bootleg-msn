import Apple from "@auth/core/providers/apple";
import Github from "@auth/core/providers/github";
import Google from "@auth/core/providers/google";
import { Password } from "@convex-dev/auth/providers/Password";
import { convexAuth, getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
	providers: [
		Password,
		Google,
		Github,
		Apple({
			profile: (appleInfo) => {
				const name = appleInfo.user
					? `${appleInfo.user.name.firstName} ${appleInfo.user.name.lastName}`
					: undefined;
				return {
					id: appleInfo.sub,
					name: name,
					email: appleInfo.email,
				};
			},
		}),
	],
	callbacks: {
		async createOrUpdateUser(ctx, args) {
			// Define proper type for user updates
			type UserUpdates = {
				name?: string;
				image?: string;
			};

			// Check if user already exists with this email
			if (args.existingUserId) {
				// User already exists, update their info
				const existingUser = await ctx.db.get(args.existingUserId);
				if (existingUser) {
					// Update user with new provider info if needed
					const updates: UserUpdates = {};
					if (
						args.profile?.name &&
						typeof args.profile.name === "string" &&
						!existingUser.name
					) {
						updates.name = args.profile.name;
					}
					if (
						args.profile?.image &&
						typeof args.profile.image === "string" &&
						!existingUser.image
					) {
						updates.image = args.profile.image;
					}

					if (Object.keys(updates).length > 0) {
						await ctx.db.patch(args.existingUserId, updates);
					}

					return args.existingUserId;
				}
			}

			// Check for existing user with same email for account linking
			if (args.profile?.email && typeof args.profile.email === "string") {
				const userEmail = args.profile.email;
				const existingUserWithEmail = await ctx.db
					.query("users")
					.filter((q) => q.eq(q.field("email"), userEmail))
					.first();

				if (existingUserWithEmail) {
					// Link this OAuth provider to existing account
					const updates: UserUpdates = {};
					if (
						args.profile.name &&
						typeof args.profile.name === "string" &&
						!existingUserWithEmail.name
					) {
						updates.name = args.profile.name;
					}
					if (
						args.profile.image &&
						typeof args.profile.image === "string" &&
						!existingUserWithEmail.image
					) {
						updates.image = args.profile.image;
					}

					if (Object.keys(updates).length > 0) {
						await ctx.db.patch(existingUserWithEmail._id, updates);
					}

					return existingUserWithEmail._id;
				}
			}

			// Create new user if no existing account found
			const userId = await ctx.db.insert("users", {
				name: args.profile?.name,
				email: args.profile?.email,
				image: args.profile?.image,
				emailVerificationTime: args.profile?.emailVerified
					? Date.now()
					: undefined,
			});

			return userId;
		},
	},
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

// Check if user has multiple authentication methods linked
export const getUserAuthMethods = query({
	args: {},
	returns: v.object({
		hasPassword: v.boolean(),
		hasOAuth: v.boolean(),
		oauthProviders: v.array(v.string()),
		accountLinked: v.boolean(),
	}),
	handler: async (ctx) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) {
			throw new Error("Not authenticated");
		}

		// Get user's auth accounts using filter instead of withIndex
		const authAccounts = await ctx.db
			.query("authAccounts")
			.filter((q) => q.eq(q.field("userId"), userId))
			.collect();

		const hasPassword = authAccounts.some(
			(account) => account.provider === "password",
		);
		const oauthAccounts = authAccounts.filter(
			(account) => account.provider !== "password",
		);
		const hasOAuth = oauthAccounts.length > 0;
		const oauthProviders = oauthAccounts.map((account) => account.provider);
		const accountLinked = hasPassword && hasOAuth;

		return {
			hasPassword,
			hasOAuth,
			oauthProviders,
			accountLinked,
		};
	},
});

// OAuth URL generation and callback handling is now managed by Convex Auth automatically
// The built-in providers handle redirects to: https://your-deployment.convex.site/api/auth/callback/{provider}
