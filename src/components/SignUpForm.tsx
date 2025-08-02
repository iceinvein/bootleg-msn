import { useAuthActions } from "@convex-dev/auth/react";
import { useState } from "react";
import { toast } from "sonner";

interface SignUpFormProps {
	onBackToSignIn: () => void;
}

export function SignUpForm({ onBackToSignIn }: SignUpFormProps) {
	const { signIn } = useAuthActions();
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [name, setName] = useState("");
	const [isLoading, setIsLoading] = useState(false);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!email.trim() || !password.trim() || !name.trim()) return;

		setIsLoading(true);
		try {
			await signIn("password", {
				email: email.trim(),
				password: password.trim(),
				name: name.trim(),
				flow: "signUp",
			});
			toast.success("Account created successfully! Welcome to MSN Messenger!");
		} catch (error) {
			const errorMessage =
				error instanceof Error ? error.message : "Sign up failed";

			if (errorMessage.includes("already exists")) {
				toast.error(
					"An account with this email already exists. Please sign in instead.",
				);
			} else {
				toast.error(errorMessage);
			}
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100">
			<div className="w-full max-w-md rounded-lg bg-white p-8 shadow-xl">
				<div className="mb-8 text-center">
					<h1 className="mb-2 font-bold text-3xl text-gray-900">
						Join MSN Messenger
					</h1>
					<p className="text-gray-600">Create your account to start chatting</p>
				</div>

				<form onSubmit={handleSubmit} className="space-y-6">
					<div>
						<label
							htmlFor="name"
							className="mb-2 block font-medium text-gray-700 text-sm"
						>
							Full Name
						</label>
						<input
							type="text"
							id="name"
							value={name}
							onChange={(e) => setName(e.target.value)}
							placeholder="Enter your full name"
							className="w-full rounded-md border border-gray-300 px-4 py-3 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
							required
						/>
					</div>

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
							placeholder="Enter your email address"
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
							placeholder="Create a password"
							className="w-full rounded-md border border-gray-300 px-4 py-3 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
							required
							minLength={6}
						/>
					</div>

					<button
						type="submit"
						disabled={
							isLoading || !email.trim() || !password.trim() || !name.trim()
						}
						className="w-full rounded-md bg-blue-500 px-4 py-3 font-medium text-white transition-colors hover:bg-blue-600 disabled:bg-gray-300"
					>
						{isLoading ? "Creating Account..." : "Create Account"}
					</button>
				</form>

				<div className="mt-6 text-center">
					<button
						type="button"
						onClick={onBackToSignIn}
						className="font-medium text-blue-500 text-sm hover:text-blue-600"
					>
						Already have an account? Sign in
					</button>
				</div>

				<div className="mt-6 text-center">
					<p className="text-gray-500 text-xs">
						By creating an account, you can start chatting immediately!
					</p>
				</div>
			</div>
		</div>
	);
}
