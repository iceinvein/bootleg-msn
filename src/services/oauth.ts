/**
 * Cross-platform OAuth service that opens system browser for better UX
 */

import { api } from "@convex/_generated/api";
import { toast } from "sonner";
import { Platform } from "@/utils/platform";

type OAuthProvider = "google" | "github" | "apple";

type TauriEvent = {
	payload: {
		success: boolean;
		error?: string;
	};
};

type AppUrlEvent = {
	url: string;
};

const OAUTH_TIMEOUT = 60000; // 60 seconds

/**
 * Initiates OAuth flow using system browser when available
 */
export async function signInWithProvider(
	provider: OAuthProvider,
	convexSignIn: (provider: string) => Promise<void>,
) {
	// Test if we can import Tauri API
	let isTauriEnvironment = false;
	try {
		const { invoke } = await import("@tauri-apps/api/core");
		isTauriEnvironment = typeof invoke === "function";
	} catch {
		// Tauri API not available
	}

	// Override platform detection if we successfully imported Tauri API
	const shouldUseInApp = isTauriEnvironment
		? false
		: Platform.shouldUseInAppOAuth();

	if (shouldUseInApp) {
		// Fallback to in-app OAuth for web
		return await convexSignIn(provider);
	}

	try {
		if (isTauriEnvironment || Platform.isDesktop()) {
			return await handleDesktopOAuth(provider, convexSignIn);
		}

		if (Platform.isMobile()) {
			return await handleMobileOAuth(provider, convexSignIn);
		}

		// Fallback
		return await convexSignIn(provider);
	} catch (error) {
		toast.error(`Failed to sign in with ${provider}. Please try again.`);
		throw error;
	}
}

/**
 * Handle OAuth for Tauri desktop apps
 */
async function handleDesktopOAuth(
	provider: OAuthProvider,
	convexSignIn: (provider: string) => Promise<void>,
) {
	try {
		const { invoke } = await import("@tauri-apps/api/core");
		const { listen } = await import("@tauri-apps/api/event");

		// Generate OAuth URL through Convex
		const oauthUrl = await getOAuthUrl(provider);

		// Open system browser
		await invoke("open_url", { url: oauthUrl });

		// Listen for OAuth callback
		return new Promise((resolve, reject) => {
			const timeout = setTimeout(() => {
				reject(new Error("OAuth timeout"));
			}, OAUTH_TIMEOUT);

			// Listen for OAuth success/failure events from Tauri
			const unlisten = listen("oauth-result", (event: TauriEvent) => {
				clearTimeout(timeout);
				unlisten.then((fn) => fn());

				if (event.payload.success) {
					resolve(event.payload);
				} else {
					reject(new Error(event.payload.error ?? "OAuth failed"));
				}
			});
		});
	} catch (_error) {
		// Fallback to in-app OAuth
		toast.info("Opening OAuth in app...");
		return await convexSignIn(provider);
	}
}

/**
 * Handle OAuth for Capacitor mobile apps
 */
async function handleMobileOAuth(
	provider: OAuthProvider,
	convexSignIn: (provider: string) => Promise<void>,
) {
	try {
		const { Browser } = await import("@capacitor/browser");
		const { App } = await import("@capacitor/app");

		// Generate OAuth URL
		const oauthUrl = await getOAuthUrl(provider);

		// Open system browser
		await Browser.open({
			url: oauthUrl,
			windowName: "_system",
			presentationStyle: "popover",
		});

		// Listen for app URL scheme callback
		return new Promise((resolve, reject) => {
			const timeout = setTimeout(() => {
				reject(new Error("OAuth timeout"));
			}, OAUTH_TIMEOUT);

			const handleAppUrlOpen = (event: AppUrlEvent) => {
				clearTimeout(timeout);
				App.removeAllListeners();

				const url = event.url;
				if (url.includes("oauth-success")) {
					// Parse success parameters
					const urlParams = new URLSearchParams(url.split("?")[1]);
					resolve({ success: true, token: urlParams.get("token") });
				} else if (url.includes("oauth-error")) {
					const urlParams = new URLSearchParams(url.split("?")[1]);
					reject(new Error(urlParams.get("error") ?? "OAuth failed"));
				}
			};

			App.addListener("appUrlOpen", handleAppUrlOpen);
		});
	} catch (_error) {
		// Fallback to in-app OAuth
		toast.info("Opening OAuth in app...");
		return await convexSignIn(provider);
	}
}

/**
 * Get OAuth URL from Convex backend
 */
async function getOAuthUrl(provider: OAuthProvider): Promise<string> {
	try {
		// Import ConvexHttpClient for action calls
		const { ConvexHttpClient } = await import("convex/browser");
		const client = new ConvexHttpClient(import.meta.env.VITE_CONVEX_URL ?? "");

		// Determine platform for proper redirect URI
		const platform = Platform.isDesktop()
			? "desktop"
			: Platform.isMobile()
				? "mobile"
				: "web";

		// Get OAuth URL from Convex backend
		const oauthUrl = await client.action(api.auth.generateOAuthUrl, {
			provider,
			platform,
		});

		return oauthUrl;
	} catch (error) {
		console.warn("Failed to get OAuth URL from Convex, using fallback:", error);
		// Fallback to direct provider URLs (less secure but functional)
		return getFallbackOAuthUrl(provider);
	}
}

/**
 * Fallback OAuth URL generation (for development/testing)
 */
function getFallbackOAuthUrl(provider: OAuthProvider): string {
	const baseUrl = window.location.origin;
	const redirectUri = Platform.isMobile()
		? "com.bootlegmsn.messenger://oauth-callback"
		: `${baseUrl}/oauth-callback`;

	switch (provider) {
		case "google":
			return `https://accounts.google.com/o/oauth2/v2/auth?client_id=your_google_client_id&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=openid email profile`;
		case "github":
			return `https://github.com/login/oauth/authorize?client_id=your_github_client_id&redirect_uri=${encodeURIComponent(redirectUri)}&scope=user:email`;
		case "apple":
			return `https://appleid.apple.com/auth/authorize?client_id=your_apple_client_id&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=name email`;
		default:
			throw new Error(`Unsupported provider: ${provider}`);
	}
}

/**
 * Show a user-friendly message about OAuth process
 */
export function showOAuthInstructions(provider: OAuthProvider) {
	const providerName = provider.charAt(0).toUpperCase() + provider.slice(1);

	if (Platform.isDesktop()) {
		toast.info(`Opening ${providerName} in your default browser...`, {
			description:
				"Complete the sign-in process in your browser, then return to the app.",
		});
	} else if (Platform.isMobile()) {
		toast.info(`Opening ${providerName} sign-in...`, {
			description: "You'll be redirected back to the app after signing in.",
		});
	}
}

/**
 * Handle OAuth cancellation gracefully
 */
export function handleOAuthCancellation() {
	toast.info("Sign-in cancelled", {
		description: "You can try again anytime.",
	});
}
