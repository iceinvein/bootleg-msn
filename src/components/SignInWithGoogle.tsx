import { useAuthActions } from "@convex-dev/auth/react";
import { useState } from "react";
import { GoogleLogo } from "@/components/GoogleLogo";
import { Button } from "@/components/ui/button";
import { showOAuthInstructions, signInWithProvider } from "@/services/oauth";
import { Platform } from "@/utils/platform";

export function SignInWithGoogle() {
	const { signIn } = useAuthActions();
	const [isLoading, setIsLoading] = useState(false);

	const handleGoogleSignIn = async () => {
		setIsLoading(true);

		try {
			// Show instructions for system browser OAuth
			if (Platform.supportsSystemBrowser()) {
				showOAuthInstructions("google");
			}

			await signInWithProvider("google", signIn);
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
			onClick={handleGoogleSignIn}
			disabled={isLoading}
		>
			<GoogleLogo className="mr-2 h-4 w-4" />
			{isLoading ? "Opening Google..." : "Sign in with Google"}
		</Button>
	);
}
