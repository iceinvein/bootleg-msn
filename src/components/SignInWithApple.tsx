import { useState } from "react";
import { AppleLogo } from "@/components/AppleLogo";
import { Button } from "@/components/ui/button";
import { useOAuth } from "@/hooks/useOAuth";

export function SignInWithApple() {
	const { loginWithApple } = useOAuth();
	const [isLoading, setIsLoading] = useState(false);

	const handleAppleSignIn = async () => {
		setIsLoading(true);

		try {
			await loginWithApple();
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
			onClick={handleAppleSignIn}
			disabled={isLoading}
		>
			<AppleLogo className="mr-2 h-4 w-4" />
			{isLoading ? "Opening Apple ID..." : "Sign in with Apple"}
		</Button>
	);
}
