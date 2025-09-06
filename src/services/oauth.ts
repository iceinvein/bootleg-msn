/**
 * Simple OAuth service using standard Convex Auth
 */

import { toast } from "sonner";

type OAuthProvider = "google" | "github" | "apple";

/**
 * Sign in with OAuth provider using standard Convex Auth
 */
export async function signInWithProvider(
	provider: OAuthProvider,
	// biome-ignore lint/suspicious/noExplicitAny: Convex Auth signIn function has complex types
	convexSignIn: any,
) {
	try {
		// Use standard Convex Auth OAuth for all platforms
		return await convexSignIn(provider);
	} catch (error) {
		console.error(`OAuth error for ${provider}:`, error);
		toast.error(`Failed to sign in with ${provider}. Please try again.`);
		throw error;
	}
}

/**
 * Show OAuth instructions for different platforms
 */
export function showOAuthInstructions(provider: OAuthProvider) {
	const providerName = provider.charAt(0).toUpperCase() + provider.slice(1);
	toast.info(`Opening ${providerName} sign-in...`, {
		description: "You'll be redirected to complete the sign-in process.",
	});
}

/**
 * Handle OAuth cancellation gracefully
 */
export function handleOAuthCancellation() {
	toast.info("Sign-in cancelled", {
		description: "You can try again anytime.",
	});
}
