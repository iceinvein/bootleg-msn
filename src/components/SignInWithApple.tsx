import { useAuthActions } from "@convex-dev/auth/react";
import { AppleLogo } from "@/components/AppleLogo";
import { Button } from "@/components/ui/button";

export function SignInWithApple() {
	const { signIn } = useAuthActions();
	return (
		<Button
			className="mt-4 w-full"
			variant="outline"
			type="button"
			onClick={() => void signIn("apple")}
		>
			<AppleLogo className="mr-2 h-4 w-4" /> Sign in with Apple
		</Button>
	);
}
