import { useAuthActions } from "@convex-dev/auth/react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { showOAuthInstructions, signInWithProvider } from "@/services/oauth";
import { Platform } from "@/utils/platform";
import { GitHubLogo } from "./GitHubLogo";

export function SignInWithGitHub() {
	const { signIn } = useAuthActions();
	const [isLoading, setIsLoading] = useState(false);

	const handleGitHubSignIn = async () => {
		setIsLoading(true);

		try {
			// Show instructions for system browser OAuth
			if (Platform.supportsSystemBrowser()) {
				showOAuthInstructions("github");
			}

			await signInWithProvider("github", signIn);
		} catch {
			// Error handling is done in OAuthService
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<Button
			className="w-full"
			variant="outline"
			type="button"
			onClick={handleGitHubSignIn}
			disabled={isLoading}
		>
			<GitHubLogo className="mr-2 h-4 w-4" />
			{isLoading ? "Opening GitHub..." : "Sign in with GitHub"}
		</Button>
	);
}
