import { useAuthActions } from "@convex-dev/auth/react";
import { useState } from "react";
import { toast } from "sonner";
import { SignUpForm } from "./SignUpForm";

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
		<div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100">
			<div className="w-full max-w-md rounded-lg bg-white p-8 shadow-xl">
				<div className="mb-8 text-center">
					<h1 className="mb-2 font-bold text-3xl text-gray-900">
						Welcome to MSN Messenger
					</h1>
					<p className="text-gray-600">
						Sign in to start chatting with friends
					</p>
				</div>

				<form onSubmit={handleSubmit} className="space-y-6">
					<div>
						<label
							htmlFor="email"
							className="mb-2 block font-medium text-gray-700 text-sm"
						>
							Email Address
						</label>
						<input
							type="email"
							id="email"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							placeholder="Enter your email"
							className="w-full rounded-md border border-gray-300 px-4 py-3 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
							required
						/>
					</div>

					<div>
						<label
							htmlFor="password"
							className="mb-2 block font-medium text-gray-700 text-sm"
						>
							Password
						</label>
						<input
							type="password"
							id="password"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							placeholder="Enter your password"
							className="w-full rounded-md border border-gray-300 px-4 py-3 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
							required
						/>
					</div>

					<button
						type="submit"
						disabled={isLoading || !email.trim() || !password.trim()}
						className="w-full rounded-md bg-blue-500 px-4 py-3 font-medium text-white transition-colors hover:bg-blue-600 disabled:bg-gray-300"
					>
						{isLoading ? "Signing in..." : "Sign In"}
					</button>
				</form>

				<div className="mt-6 text-center">
					<button
						type="button"
						onClick={() => setShowSignUp(true)}
						className="font-medium text-blue-500 text-sm hover:text-blue-600"
					>
						Don't have an account? Sign up
					</button>
				</div>
			</div>
		</div>
	);
}
