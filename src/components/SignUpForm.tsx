import { useAction } from "convex/react";
import { useState } from "react";
import { toast } from "sonner";
import { api } from "../../convex/_generated/api";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

interface SignUpFormProps {
	onBackToSignIn: () => void;
}

export function SignUpForm({ onBackToSignIn }: SignUpFormProps) {
	const sendVerificationEmail = useAction(
		api.emailVerification.sendVerificationEmail,
	);
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [name, setName] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [emailSent, setEmailSent] = useState(false);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!email.trim() || !password.trim() || !name.trim()) return;

		setIsLoading(true);
		try {
			// Store user data temporarily in localStorage for after verification
			localStorage.setItem(
				"pendingSignUp",
				JSON.stringify({
					email: email.trim(),
					password: password.trim(),
					name: name.trim(),
				}),
			);

			await sendVerificationEmail({
				email: email.trim(),
				name: name.trim(),
			});

			setEmailSent(true);
			toast.success("Verification email sent! Please check your inbox.");
		} catch (error) {
			const errorMessage =
				error instanceof Error
					? error.message
					: "Failed to send verification email";

			if (errorMessage.includes("already verified")) {
				toast.error("This email is already verified. Please sign in instead.");
			} else {
				toast.error(errorMessage);
			}
		} finally {
			setIsLoading(false);
		}
	};

	if (emailSent) {
		return (
			<div className="flex min-h-screen items-center justify-center">
				<div className="w-full max-w-md rounded-lg p-8 shadow-xl dark:border-gray-600 dark:bg-gray-800">
					<div className="mb-8 text-center">
						<div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
							<svg
								className="h-8 w-8 text-blue-600 dark:text-blue-400"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<title>Verification email sent</title>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
								/>
							</svg>
						</div>
						<h1 className="mb-2 font-bold text-2xl">Check Your Email</h1>
						<p className="text-gray-600 dark:text-gray-400">
							We've sent a verification link to <strong>{email}</strong>
						</p>
					</div>

					<div className="space-y-4 text-center">
						<p className="text-gray-600 text-sm dark:text-gray-400">
							Click the link in your email to verify your account and complete
							the sign-up process.
						</p>

						<div className="rounded-lg bg-blue-50 p-4 dark:bg-blue-900/20">
							<p className="text-blue-800 text-xs dark:text-blue-200">
								💡 Don't see the email? Check your spam folder or wait a few
								minutes for it to arrive.
							</p>
						</div>

						<Button
							variant="outline"
							onClick={() => {
								setEmailSent(false);
								setEmail("");
								setPassword("");
								setName("");
							}}
							className="w-full"
						>
							Try Different Email
						</Button>

						<Button variant="ghost" type="button" onClick={onBackToSignIn}>
							Back to Sign In
						</Button>
					</div>
				</div>
			</div>
		);
	}

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
						{isLoading ? "Sending Verification Email..." : "Create Account"}
					</Button>
				</form>

				<div className="mt-6 text-center">
					<Button variant="ghost" type="button" onClick={onBackToSignIn}>
						Already have an account? Sign in
					</Button>
				</div>

				<div className="mt-6 text-center">
					<p className="text-gray-600 text-xs dark:text-gray-400">
						By creating an account, you agree to verify your email address
						first.
					</p>
				</div>
			</div>
		</div>
	);
}
