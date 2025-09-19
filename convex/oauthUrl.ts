/**
 * OAuth URL generation for system browser authentication
 * This generates the proper OAuth URL without triggering any redirects
 */

import { v } from "convex/values";
import { query } from "./_generated/server";

/**
 * Get OAuth URL for system browser authentication
 * This is the query that should be called from the frontend
 */
export const getAuthUrl = query({
	args: {
		provider: v.string(),
	},
	handler: async (_ctx, { provider }) => {
		// Get the Convex site URL (this is where OAuth callbacks are handled)
		const convexUrl = process.env.CONVEX_URL;
		if (!convexUrl) {
			throw new Error("CONVEX_URL not configured");
		}

		// Convert CONVEX_URL to site URL for OAuth callbacks
		// e.g., https://lovely-parrot-393.convex.cloud -> https://lovely-parrot-393.convex.site
		const siteUrl = convexUrl.replace(".convex.cloud", ".convex.site");

		// Generate the OAuth URL that Convex Auth expects
		// This will redirect to our deep link after OAuth completion
		const oauthUrl = `${siteUrl}/api/auth/signin/${provider}?callbackUrl=${encodeURIComponent("msn-messenger://auth")}`;

		return oauthUrl;
	},
});
