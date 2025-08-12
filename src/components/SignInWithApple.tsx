import { useAuthActions } from "@convex-dev/auth/react";
import { useState } from "react";
import { AppleLogo } from "@/components/AppleLogo";
import { Button } from "@/components/ui/button";
import { showOAuthInstructions, signInWithProvider } from "@/services/oauth";
import { Platform } from "@/utils/platform";

export function SignInWithApple() {
	const { signIn } = useAuthActions();
	const [isLoading, setIsLoading] = useState(false);

	const handleAppleSignIn = async () => {
		setIsLoading(true);

		try {
			// Show instructions for system browser OAuth
			if (Platform.supportsSystemBrowser()) {
				showOAuthInstructions("apple");
			}

			await signInWithProvider("apple", signIn);
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
			onClick={handleAppleSignIn}
			disabled={isLoading}
		>
			<AppleLogo className="mr-2 h-4 w-4" />
			{isLoading ? "Opening Apple ID..." : "Sign in with Apple"}
		</Button>
	);
}
