/**
 * OAuth callback handler for system browser authentication
 */

import { useAuthActions } from "@convex-dev/auth/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Platform } from "@/utils/platform";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

const VALID_OAUTH_PROVIDERS = ["google", "github", "apple"] as const;
type ValidOAuthProvider = (typeof VALID_OAUTH_PROVIDERS)[number];

const isValidOAuthProvider = (
	provider: string,
): provider is ValidOAuthProvider =>
	VALID_OAUTH_PROVIDERS.includes(provider as ValidOAuthProvider);

type OAuthCallbackProps = {
	onComplete: () => void;
};

export function OAuthCallback({ onComplete }: OAuthCallbackProps) {
	const { signIn } = useAuthActions();
	const [isProcessing, setIsProcessing] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const processOAuthCallback = async () => {
			try {
				const urlParams = new URLSearchParams(window.location.search);
				const code = urlParams.get("code");
				const state = urlParams.get("state");
				const error = urlParams.get("error");
				const providerParam = urlParams.get("provider") || "google"; // Default to google

				if (error) {
					throw new Error(error);
				}

				if (!code) {
					throw new Error("No authorization code received");
				}

				// Validate provider parameter
				const provider: ValidOAuthProvider = isValidOAuthProvider(providerParam)
					? providerParam
					: "google"; // Fallback to google if invalid

				// For desktop apps, emit success event to Tauri
				if (Platform.isDesktop()) {
					try {
						const { emit } = await import("@tauri-apps/api/event");
						await emit("oauth-result", {
							success: true,
							code,
							state,
							provider,
						});

						// Show success message and close window
						toast.success(
							"Authentication successful! You can close this window.",
						);

						// Try to close the window after a delay
						setTimeout(() => {
							window.close();
						}, 2000);

						return;
					} catch {
						// Continue with web flow as fallback
					}
				}

				// For mobile apps, redirect to app scheme
				if (Platform.isMobile()) {
					const appUrl = `com.bootlegmsn.messenger://oauth-callback?success=true&code=${encodeURIComponent(code)}&state=${encodeURIComponent(state || "")}&provider=${provider}`;
					window.location.href = appUrl;
					return;
				}

				// For web, complete the OAuth flow directly
				await signIn(provider, { code, state });

				toast.success("Successfully signed in!");

				// Clean up URL and return to main app
				window.history.replaceState(
					{},
					document.title,
					window.location.pathname,
				);
				onComplete();
			} catch (err) {
				const errorMessage =
					err instanceof Error ? err.message : "OAuth authentication failed";
				setError(errorMessage);

				// For desktop, emit error event
				if (Platform.isDesktop()) {
					try {
						const { emit } = await import("@tauri-apps/api/event");
						await emit("oauth-result", {
							success: false,
							error: errorMessage,
						});
					} catch {
						// Failed to emit Tauri error event
					}
				}

				// For mobile, redirect with error
				if (Platform.isMobile()) {
					const appUrl = `com.bootlegmsn.messenger://oauth-callback?success=false&error=${encodeURIComponent(errorMessage)}`;
					window.location.href = appUrl;
					return;
				}

				toast.error(errorMessage);
			} finally {
				setIsProcessing(false);
			}
		};

		processOAuthCallback();
	}, [signIn, onComplete]);

	const handleRetry = () => {
		// Clean up URL and return to main app
		window.history.replaceState({}, document.title, window.location.pathname);
		onComplete();
	};

	const handleCloseWindow = () => {
		if (Platform.isDesktop()) {
			window.close();
		} else {
			handleRetry();
		}
	};

	if (isProcessing) {
		return (
			<div className="flex min-h-screen items-center justify-center">
				<Card className="w-full max-w-md">
					<CardHeader className="text-center">
						<CardTitle>Processing Authentication</CardTitle>
					</CardHeader>
					<CardContent className="text-center">
						<div className="mb-4">
							<div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
						</div>
						<p className="text-muted-foreground">
							Please wait while we complete your sign-in...
						</p>
					</CardContent>
				</Card>
			</div>
		);
	}

	if (error) {
		return (
			<div className="flex min-h-screen items-center justify-center">
				<Card className="w-full max-w-md">
					<CardHeader className="text-center">
						<CardTitle className="text-red-600">
							Authentication Failed
						</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4 text-center">
						<div className="rounded-lg bg-red-50 p-4 dark:bg-red-900/20">
							<p className="text-red-800 text-sm dark:text-red-200">{error}</p>
						</div>

						<div className="flex gap-2">
							<Button onClick={handleRetry} className="flex-1">
								Back to Sign In
							</Button>

							{Platform.isDesktop() && (
								<Button
									variant="outline"
									onClick={handleCloseWindow}
									className="flex-1"
								>
									Close Window
								</Button>
							)}
						</div>
					</CardContent>
				</Card>
			</div>
		);
	}

	// Success state (mainly for web)
	return (
		<div className="flex min-h-screen items-center justify-center">
			<Card className="w-full max-w-md">
				<CardHeader className="text-center">
					<CardTitle className="text-green-600">
						Authentication Successful!
					</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4 text-center">
					<div className="rounded-lg bg-green-50 p-4 dark:bg-green-900/20">
						<p className="text-green-800 text-sm dark:text-green-200">
							You have been successfully signed in.
							{Platform.isDesktop()
								? " You can close this window."
								: " Redirecting..."}
						</p>
					</div>

					{Platform.isDesktop() ? (
						<Button onClick={handleCloseWindow} className="w-full">
							Close Window
						</Button>
					) : (
						<Button onClick={onComplete} className="w-full">
							Continue to App
						</Button>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
