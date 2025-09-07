import { useState } from "react";
import { GoogleLogo } from "@/components/GoogleLogo";
import { Button } from "@/components/ui/button";
import { useOAuth } from "@/hooks/useOAuth";

export function SignInWithGoogle() {
	const { loginWithGoogle } = useOAuth();
	const [isLoading, setIsLoading] = useState(false);

	const handleGoogleSignIn = async () => {
		setIsLoading(true);

		try {
			await loginWithGoogle();
		} catch {
			// Error handling is done in useOAuth hook
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
