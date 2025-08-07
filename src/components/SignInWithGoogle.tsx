import { useAuthActions } from "@convex-dev/auth/react";
import { GoogleLogo } from "@/components/GoogleLogo";
import { Button } from "@/components/ui/button";

export function SignInWithGoogle() {
	const { signIn } = useAuthActions();
	return (
		<Button
			className="mt-4 w-full"
			variant="outline"
			type="button"
			onClick={() => void signIn("google")}
		>
			<GoogleLogo className="mr-2 h-4 w-4" /> Sign in with Google
		</Button>
	);
}
