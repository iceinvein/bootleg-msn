import { useAuthActions } from "@convex-dev/auth/react";
import { Authenticated, AuthLoading, Unauthenticated } from "convex/react";
import { useEffect, useState } from "react";
import { CapacitorIntegration } from "./components/CapacitorIntegration";
import { MessengerApp } from "./components/MessengerApp";
import { MobileProvider } from "./components/MobileProvider";
import { OAuthCallback } from "./components/OAuthCallback";
import { PushSubscriptionInitializer } from "./components/PushSubscriptionInitializer";
import { SignInForm } from "./components/SignInForm";
import { TauriIntegration, TauriStyles } from "./components/TauriIntegration";
import { ThemeProvider } from "./components/theme-provider";
import { UpdateNotification } from "./components/UpdateNotification";
import { Toaster } from "./components/ui/sonner";
import { Platform } from "./utils/platform";

function App() {
	const [isOAuthCallback, setIsOAuthCallback] = useState(false);
	const [oauthData, setOauthData] = useState<{
		code: string;
		state?: string;
		error?: string;
	} | null>(null);
	const { signIn } = useAuthActions();

	useEffect(() => {
		/**
		 * Listen for custom Convex Auth sign-in events
		 * This is triggered after OAuth code exchange to complete the authentication
		 * using ConvexCredentials provider with GitHub access token
		 */
		const handleConvexAuthSignIn = async (event: Event) => {
			const customEvent = event as CustomEvent;
			try {
				const { provider, githubId, accessToken, onComplete } =
					customEvent.detail;

				// Use Convex Auth's signIn with our custom ConvexCredentials provider
				const result = await signIn(provider, {
					githubId,
					accessToken,
				});

				if (result.signingIn) {
					// Successfully signed in - call completion callback
					if (onComplete) {
						onComplete();
					}
				} else {
					console.error("Convex Auth sign-in failed");

					// Still call completion callback to avoid getting stuck
					if (onComplete) {
						onComplete();
					}
				}
			} catch (error) {
				console.error("Convex Auth sign-in error:", error);

				// Still call completion callback to avoid getting stuck
				const { onComplete } = customEvent.detail;
				if (onComplete) {
					onComplete();
				}
			}
		};

		window.addEventListener(
			"convex-auth-signin",
			handleConvexAuthSignIn as EventListener,
		);

		return () => {
			window.removeEventListener(
				"convex-auth-signin",
				handleConvexAuthSignIn as EventListener,
			);
		};
	}, [signIn]);

	useEffect(() => {
		// Only check for OAuth callback on mobile/desktop platforms
		// Web platforms use Convex Auth server-side OAuth
		if (Platform.supportsSystemBrowser()) {
			// Check URL parameters first (for web-based callbacks)
			const urlParams = new URLSearchParams(window.location.search);
			const hasOAuthParams = urlParams.has("code") || urlParams.has("error");

			if (hasOAuthParams) {
				setIsOAuthCallback(true);
				setOauthData({
					code: urlParams.get("code") || "",
					state: urlParams.get("state") || undefined,
					error: urlParams.get("error") || undefined,
				});
			}

			// For Tauri desktop, also listen for deep links
			if (Platform.isDesktop()) {
				const setupDeepLinkListener = async () => {
					try {
						const { onOpenUrl } = await import("@tauri-apps/plugin-deep-link");

						const unlisten = await onOpenUrl((urls) => {
							const url = urls[0];

							// Handle OAuth callbacks (msn-messenger://auth?code=...)
							if (url?.startsWith("msn-messenger://auth")) {
								try {
									const parsedUrl = new URL(url);
									const code = parsedUrl.searchParams.get("code");
									const error = parsedUrl.searchParams.get("error");
									const state = parsedUrl.searchParams.get("state");

									if (code || error) {
										setIsOAuthCallback(true);
										setOauthData({
											code: code || "",
											state: state || undefined,
											error: error || undefined,
										});
									}
								} catch (err) {
									console.error("Failed to parse deep link URL:", err);
								}
							}
						});

						// Clean up listener on unmount
						return unlisten;
					} catch (error) {
						console.error("Failed to set up deep link listener:", error);
					}
				};

				setupDeepLinkListener();
			}
		}
	}, []);

	const handleOAuthComplete = () => {
		setIsOAuthCallback(false);
	};

	return (
		<ThemeProvider defaultTheme="dark">
			<MobileProvider>
				<TauriIntegration>
					<CapacitorIntegration />
					<TauriStyles />
					<main className="min-h-screen">
						{isOAuthCallback ? (
							<OAuthCallback
								onComplete={handleOAuthComplete}
								oauthData={oauthData}
							/>
						) : (
							<>
								<AuthLoading>
									<div className="flex min-h-screen items-center justify-center">
										<div className="h-12 w-12 animate-spin rounded-full border-white border-b-2"></div>
									</div>
								</AuthLoading>

								<Unauthenticated>
									<SignInForm />
								</Unauthenticated>

								<Authenticated>
									<MessengerApp />
									<UpdateNotification />
									{/* Initialize Web Push subscription & persistence when logged in */}
									<PushSubscriptionInitializer />
								</Authenticated>
							</>
						)}

						<Toaster />
					</main>
				</TauriIntegration>
			</MobileProvider>
		</ThemeProvider>
	);
}

export default App;
