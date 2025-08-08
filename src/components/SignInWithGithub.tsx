import { useAuthActions } from "@convex-dev/auth/react";
import { Button } from "@/components/ui/button";
import { GitHubLogo } from "./GitHubLogo";

export function SignInWithGitHub() {
	const { signIn } = useAuthActions();
	return (
		<Button
			className="w-full"
			variant="outline"
			type="button"
			onClick={() => void signIn("github")}
		>
			<GitHubLogo className="mr-2 h-4 w-4" /> Sign in with GitHub
		</Button>
	);
}
