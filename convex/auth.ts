import Apple from "@auth/core/providers/apple";
import Github from "@auth/core/providers/github";
import Google from "@auth/core/providers/google";
import { ConvexCredentials } from "@convex-dev/auth/providers/ConvexCredentials";
import { Password } from "@convex-dev/auth/providers/Password";
import { convexAuth, getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { action, mutation, query } from "./_generated/server";

/**
 * Custom ConvexCredentials provider for GitHub Desktop OAuth
 * This provider validates GitHub access tokens and creates Convex Auth sessions
 * Used after OAuth code exchange to complete the authentication flow
 */
const GitHubDesktop = ConvexCredentials({
	id: "github-desktop",
	authorize: async (credentials, ctx) => {
		// Validate required credentials from the OAuth flow
		if (!credentials.githubId || !credentials.accessToken) {
			throw new Error("Missing GitHub credentials");
		}

		// Verify the GitHub access token by fetching user data
		const userResponse = await fetch("https://api.github.com/user", {
			headers: {
				Authorization: `Bearer ${credentials.accessToken}`,
				Accept: "application/vnd.github.v3+json",
			},
		});

		if (!userResponse.ok) {
			throw new Error("Invalid GitHub access token");
		}

		const userData = await userResponse.json();

		// Get user's primary email (may be private)
		const emailResponse = await fetch("https://api.github.com/user/emails", {
			headers: {
				Authorization: `Bearer ${credentials.accessToken}`,
				Accept: "application/vnd.github.v3+json",
			},
		});

		const emailData = await emailResponse.json();
		const primaryEmail =
			emailData.find((email: any) => email.primary)?.email || userData.email;

		// Create or link the user account using Convex Auth's createAccount
		const { createAccount } = await import("@convex-dev/auth/server");

		const result = await createAccount(ctx, {
			provider: "github-desktop",
			account: {
				id: userData.id.toString(),
			},
			profile: {
				id: userData.id.toString(),
				name: userData.name,
				email: primaryEmail,
				image: userData.avatar_url,
			},
		});

		return { userId: result.user._id };
	},
});

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
	providers: [
		Password,
		Google,
		Github({
			clientId: process.env.AUTH_GITHUB_ID,
			clientSecret: process.env.AUTH_GITHUB_SECRET,
		}),
		GitHubDesktop,
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
		async redirect({ redirectTo }) {
			// Allow deep link redirects for mobile/desktop apps
			if (redirectTo.startsWith("msn-messenger://")) {
				return redirectTo;
			}

			// Default behavior for web - return relative paths as-is
			if (redirectTo.startsWith("/")) {
				return redirectTo;
			}
			// For absolute URLs, validate they're from the same origin
			try {
				const urlObj = new URL(redirectTo);
				const siteUrl = process.env.SITE_URL || "http://localhost:5173";
				const siteOrigin = new URL(siteUrl).origin;
				if (urlObj.origin === siteOrigin) {
					return redirectTo;
				}
			} catch {
				// Invalid URL, fall back to default
			}
			// Default fallback
			return "/";
		},
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

/**
 * Get OAuth URL for system browser authentication
 * This is the query referenced in the guide: auth:getAuthUrl
 */
export const getAuthUrl = query({
	args: { provider: v.string() },
	handler: async (_ctx, { provider }) => {
		// For desktop/mobile, we need to use direct GitHub OAuth with deep link
		// because Convex Auth's OAuth flow doesn't support custom redirect URIs properly

		if (provider === "github") {
			const githubClientId = process.env.AUTH_GITHUB_DESKTOP_ID;
			if (!githubClientId) {
				throw new Error("AUTH_GITHUB_DESKTOP_ID not configured");
			}

			const redirectUri = "msn-messenger://auth";
			const scope = "user:email";
			const state = Math.random().toString(36).substring(7); // Simple state for CSRF protection

			const oauthUrl = `https://github.com/login/oauth/authorize?client_id=${githubClientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}&state=${state}`;

			return oauthUrl;
		}

		throw new Error(`Provider ${provider} not supported yet`);
	},
});

/**
 * Exchange OAuth code for GitHub access token and user data
 * This is called after the deep link callback with the OAuth code
 * Returns user data and credentials for ConvexCredentials provider
 */
export const exchangeOAuthCode = action({
	args: {
		provider: v.string(),
		code: v.string(),
		state: v.optional(v.string()),
	},
	handler: async (_ctx, { provider, code }): Promise<any> => {
		if (provider === "github") {
			try {
				// Exchange code for access token
				const clientId = process.env.AUTH_GITHUB_DESKTOP_ID;
				const clientSecret = process.env.AUTH_GITHUB_DESKTOP_SECRET;

				if (!clientId || !clientSecret) {
					throw new Error("GitHub OAuth credentials not configured");
				}

				// Exchange code for access token
				const tokenResponse = await fetch(
					"https://github.com/login/oauth/access_token",
					{
						method: "POST",
						headers: {
							Accept: "application/json",
							"Content-Type": "application/x-www-form-urlencoded",
						},
						body: new URLSearchParams({
							client_id: clientId,
							client_secret: clientSecret,
							code: code,
						}),
					},
				);

				const tokenData = await tokenResponse.json();

				if (tokenData.error) {
					throw new Error(`GitHub OAuth error: ${tokenData.error_description}`);
				}

				// Get user info from GitHub
				const userResponse = await fetch("https://api.github.com/user", {
					headers: {
						Authorization: `Bearer ${tokenData.access_token}`,
						Accept: "application/vnd.github.v3+json",
					},
				});

				const userData = await userResponse.json();

				// Get user email (might be private)
				const emailResponse = await fetch(
					"https://api.github.com/user/emails",
					{
						headers: {
							Authorization: `Bearer ${tokenData.access_token}`,
							Accept: "application/vnd.github.v3+json",
						},
					},
				);

				const emailData = await emailResponse.json();
				const primaryEmail =
					emailData.find((email: any) => email.primary)?.email ||
					userData.email;

				// Return the user data and access token
				// The frontend will use signIn("github-desktop", { githubId, accessToken })
				return {
					success: true,
					user: {
						id: userData.id,
						login: userData.login,
						name: userData.name,
						email: primaryEmail,
						avatar_url: userData.avatar_url,
					},
					githubId: userData.id.toString(),
					accessToken: tokenData.access_token,
				};
			} catch (error) {
				console.error("OAuth code exchange failed:", error);
				throw new Error(`OAuth code exchange failed: ${error}`);
			}
		}

		throw new Error(`Provider ${provider} not supported yet`);
	},
});
