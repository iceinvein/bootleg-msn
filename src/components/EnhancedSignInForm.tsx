import { useAuthActions } from "@convex-dev/auth/react";
import { useState } from "react";
import { toast } from "sonner";
import { SignUpForm } from "./SignUpForm";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

export function EnhancedSignInForm() {
	const { signIn } = useAuthActions();
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [showSignUp, setShowSignUp] = useState(false);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!email.trim() || !password.trim()) return;

		setIsLoading(true);
		try {
			await signIn("password", {
				email: email.trim(),
				password: password.trim(),
				flow: "signIn",
			});
		} catch (error) {
			const errorMessage =
				error instanceof Error ? error.message : "Sign in failed";

			if (errorMessage.includes("User not found")) {
				toast.error("No account found with this email. Please sign up first.");
			} else if (errorMessage.includes("Invalid password")) {
				toast.error("Invalid password. Please try again.");
			} else {
				toast.error(errorMessage);
			}
		} finally {
			setIsLoading(false);
		}
	};

	if (showSignUp) {
		return <SignUpForm onBackToSignIn={() => setShowSignUp(false)} />;
	}

	return (
		<div className="flex min-h-screen items-center justify-center">
			<div className="w-full max-w-md rounded-lg p-8 shadow-xl dark:border-gray-600 dark:bg-gray-800">
				<div className="mb-8 text-center">
					<h1 className="mb-4 font-bold text-3xl">
						Welcome to the <br /> bootleg <br /> MSN Messenger
					</h1>
					<p className="text-sm">Sign in to start chatting with friends</p>
				</div>

				<form onSubmit={handleSubmit} className="space-y-6">
					<div>
						<Label htmlFor="email" className="mb-2">
							Email Address
						</Label>
						<Input
							type="email"
							id="email"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							placeholder="Enter your email"
							className="w-full"
							required
						/>
					</div>

					<div>
						<Label htmlFor="password" className="mb-2">
							Password
						</Label>
						<Input
							type="password"
							id="password"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							placeholder="Enter your password"
							className="w-full"
							required
						/>
					</div>

					<Button
						type="submit"
						disabled={isLoading || !email.trim() || !password.trim()}
						className="w-full"
					>
						{isLoading ? "Signing in..." : "Sign In"}
					</Button>
				</form>

				<div className="mt-6 text-center">
					<Button
						variant="ghost"
						type="button"
						onClick={() => setShowSignUp(true)}
					>
						Don't have an account? Sign up
					</Button>
				</div>
			</div>
		</div>
	);
}
