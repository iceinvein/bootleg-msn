import { useAuthActions } from "@convex-dev/auth/react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

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
		<div className="flex min-h-screen items-center justify-center">
			<div className="w-full max-w-md rounded-lg p-8 shadow-xl dark:border-gray-600 dark:bg-gray-800">
				<div className="mb-8 text-center">
					<h1 className="mb-2 font-bold text-3xl">Join MSN Messenger</h1>
					<p>Create your account to start chatting</p>
				</div>

				<form onSubmit={handleSubmit} className="space-y-6">
					<div>
						<Label htmlFor="name" className="mb-2">
							Full Name
						</Label>
						<Input
							id="name"
							value={name}
							onChange={(e) => setName(e.target.value)}
							placeholder="Enter your full name"
							className="w-full"
							required
						/>
					</div>

					<div>
						<Label htmlFor="email" className="mb-2">
							Email Address
						</Label>
						<Input
							type="email"
							id="email"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							placeholder="Enter your email address"
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
							placeholder="Create a password"
							className="w-full"
							required
							minLength={6}
						/>
					</div>

					<Button
						type="submit"
						disabled={
							isLoading || !email.trim() || !password.trim() || !name.trim()
						}
						className="w-full"
					>
						{isLoading ? "Creating Account..." : "Create Account"}
					</Button>
				</form>

				<div className="mt-6 text-center">
					<Button variant="ghost" type="button" onClick={onBackToSignIn}>
						Already have an account? Sign in
					</Button>
				</div>

				<div className="mt-6 text-center">
					<p className="text-xs">
						By creating an account, you can start chatting immediately!
					</p>
				</div>
			</div>
		</div>
	);
}
