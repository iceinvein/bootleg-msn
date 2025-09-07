import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useOAuth } from "@/hooks/useOAuth";
import { GitHubLogo } from "./GitHubLogo";

export function SignInWithGitHub() {
	const { loginWithGitHub } = useOAuth();
	const [isLoading, setIsLoading] = useState(false);

	const handleGitHubSignIn = async () => {
		setIsLoading(true);

		try {
			await loginWithGitHub();
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
			onClick={handleGitHubSignIn}
			disabled={isLoading}
		>
			<GitHubLogo className="mr-2 h-4 w-4" />
			{isLoading ? "Opening GitHub..." : "Sign in with GitHub"}
		</Button>
	);
}
