/**
 * Unified OAuth hook for Tauri + Convex Auth
 * Based on the React Native pattern from Convex Auth docs
 */

import { api } from "@convex/_generated/api";
import { useAuthActions } from "@convex-dev/auth/react";
import { useConvexAuth } from "convex/react";
import { toast } from "sonner";
import { Platform } from "@/utils/platform";

type OAuthProvider = "github" | "google" | "apple";

export function useOAuth() {
	const { isAuthenticated } = useConvexAuth();
	const { signIn } = useAuthActions();

	/**
	 * Sign in with OAuth provider using direct shell approach (following the guide)
	 */
	async function loginWithProvider(provider: OAuthProvider) {
		try {
			if (Platform.isDesktop()) {
				// Tauri desktop: Use direct shell approach
				const { ConvexHttpClient } = await import("convex/browser");
				const convexUrl = import.meta.env.VITE_CONVEX_URL;
				if (!convexUrl) {
					throw new Error("VITE_CONVEX_URL not configured");
				}

				const client = new ConvexHttpClient(convexUrl);
				const authUrl = await client.query(api.auth.getAuthUrl, { provider });

				// Open OAuth URL in system browser
				try {
					const { open } = await import("@tauri-apps/plugin-shell");
					await open(authUrl);
				} catch (error) {
					console.error("Failed to open OAuth URL via Tauri:", error);
				}

				toast.success(`Opening ${provider} in your browser...`, {
					description: "Complete the sign-in process in your browser.",
				});
			} else {
				// Web: Use standard Convex Auth
				await signIn(provider);
			}
		} catch (error) {
			console.error(`OAuth error for ${provider}:`, error);
			toast.error(`Failed to sign in with ${provider}. Please try again.`);
			throw error;
		}
	}

	return {
		loginWithGitHub: () => loginWithProvider("github"),
		loginWithGoogle: () => loginWithProvider("google"),
		loginWithApple: () => loginWithProvider("apple"),
		isAuthenticated,
	};
}
