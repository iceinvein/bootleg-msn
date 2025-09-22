/**
 * OAuth callback handler - now simplified since deep link handling is in useOAuth hook
 */

import { api } from "@convex/_generated/api";
import { ConvexHttpClient } from "convex/browser";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { getAuthErrorMessage, logAuthError } from "@/utils/authErrorHandler";

type OAuthCallbackProps = {
	onComplete: () => void;
	oauthData?: { code: string; state?: string; error?: string } | null;
};

/**
 * Simplified OAuth callback component
 * Deep link handling is now done in the useOAuth hook
 */
export function OAuthCallback({ onComplete, oauthData }: OAuthCallbackProps) {
	const [isProcessing, setIsProcessing] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const processOAuth = async () => {
			if (!oauthData) {
				setError("No OAuth data received");
				setIsProcessing(false);
				return;
			}

			if (oauthData.error) {
				const errorMsg = getAuthErrorMessage(
					new Error(`OAuth failed: ${oauthData.error}`),
				);
				setError(errorMsg);
				setIsProcessing(false);
				return;
			}

			// Check if we have an OAuth code from GitHub
			if (!oauthData.code) {
				setError(
					"No authorization code received from the provider. Please try signing in again.",
				);
				setIsProcessing(false);
				return;
			}

			try {
				// Process the OAuth code from GitHub
				const convexUrl = import.meta.env.VITE_CONVEX_URL;
				if (!convexUrl) {
					throw new Error("VITE_CONVEX_URL not configured");
				}

				const client = new ConvexHttpClient(convexUrl);

				const result = await client.action(api.auth.exchangeOAuthCode, {
					provider: "github",
					code: oauthData.code,
					state: oauthData.state || undefined,
				});

				if (result.success) {
					// Show success message to user
					toast.success(`Welcome ${result.user.name || result.user.login}!`);

					// Trigger Convex Auth sign-in event (Convex Auth handles persistence)
					window.dispatchEvent(
						new CustomEvent("convex-auth-signin", {
							detail: {
								provider: "github-desktop",
								githubId: result.githubId,
								accessToken: result.accessToken,
								onComplete: () => {
									setIsProcessing(false);
									onComplete();
								},
							},
						}),
					);
				} else {
					setError("Failed to complete authentication. Please try again.");
					setIsProcessing(false);
				}
			} catch (actionError) {
				logAuthError(actionError, "OAuthCallback");
				setError(getAuthErrorMessage(actionError));
				setIsProcessing(false);
			}
		};

		processOAuth();
	}, [oauthData, onComplete]);

	if (error) {
		return (
			<div className="flex min-h-screen items-center justify-center">
				<div className="text-center">
					<h2 className="mb-2 font-semibold text-lg text-red-500">
						Authentication Failed
					</h2>
					<p className="mb-4 text-muted-foreground">{error}</p>
					<button
						type="button"
						onClick={onComplete}
						className="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
					>
						Try Again
					</button>
				</div>
			</div>
		);
	}

	return (
		<div className="flex min-h-screen items-center justify-center">
			<div className="text-center">
				<h2 className="mb-2 font-semibold text-lg">Completing sign-in...</h2>
				<p className="mb-4 text-muted-foreground">
					{isProcessing
						? "Finalizing authentication with Convex Auth..."
						: "Authentication complete!"}
				</p>
				<p className="mb-4 text-muted-foreground text-sm">
					Please wait while we complete your sign-in process.
				</p>
				<div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"></div>
			</div>
		</div>
	);
}
