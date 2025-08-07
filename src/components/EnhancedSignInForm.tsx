import { useAuthActions } from "@convex-dev/auth/react";
import { useAction, useMutation } from "convex/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { api } from "../../convex/_generated/api";
import { EmailVerificationPage } from "./EmailVerificationPage";
import { SignInWithGitHub } from "./SignInWithGithub";
import { SignInWithGoogle } from "./SignInWithGoogle";
import { SignUpForm } from "./SignUpForm";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

export function EnhancedSignInForm() {
	const { signIn } = useAuthActions();
	const checkEmailVerification = useMutation(
		api.auth.checkEmailVerificationForAuth,
	);
	const resendVerificationEmail = useAction(
		api.emailVerification.resendVerificationEmail,
	);
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [showSignUp, setShowSignUp] = useState(false);
	const [verificationToken, setVerificationToken] = useState<string | null>(
		null,
	);
	const [needsVerification, setNeedsVerification] = useState<string | null>(
		null,
	);
	const [resendCooldown, setResendCooldown] = useState(0);
	const [canResend, setCanResend] = useState(true);

	// Check for verification token in URL
	useEffect(() => {
		const urlParams = new URLSearchParams(window.location.search);
		const token = urlParams.get("token");
		if (token) {
			setVerificationToken(token);
			// Clean up URL
			window.history.replaceState({}, document.title, window.location.pathname);
		}
	}, []);

	// Handle resend cooldown timer
	useEffect(() => {
		let interval: NodeJS.Timeout;
		if (resendCooldown > 0) {
			setCanResend(false);
			interval = setInterval(() => {
				setResendCooldown((prev) => {
					if (prev <= 1) {
						setCanResend(true);
						return 0;
					}
					return prev - 1;
				});
			}, 1000);
		}
		return () => {
			if (interval) {
				clearInterval(interval);
			}
		};
	}, [resendCooldown]);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!email.trim() || !password.trim()) return;

		setIsLoading(true);
		try {
			// First check if email is verified
			const isVerified = await checkEmailVerification({ email: email.trim() });

			if (!isVerified) {
				setNeedsVerification(email.trim());
				toast.error("Please verify your email address before signing in.");
				return;
			}

			// If verified, proceed with normal sign-in
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

	const handleResendVerification = async () => {
		if (!needsVerification || !canResend) return;

		setIsLoading(true);
		try {
			await resendVerificationEmail({ email: needsVerification });
			toast.success("Verification email sent! Please check your inbox.");

			// Start 60-second cooldown
			setResendCooldown(60);
		} catch (error) {
			const errorMessage =
				error instanceof Error
					? error.message
					: "Failed to send verification email";
			toast.error(errorMessage);
		} finally {
			setIsLoading(false);
		}
	};

	if (verificationToken) {
		return (
			<EmailVerificationPage
				token={verificationToken}
				onBackToSignIn={() => setVerificationToken(null)}
				onVerificationSuccess={() => setVerificationToken(null)}
			/>
		);
	}

	if (needsVerification) {
		return (
			<div className="flex min-h-screen items-center justify-center">
				<div className="w-full max-w-md rounded-lg p-8 shadow-xl dark:border-gray-600 dark:bg-gray-800">
					<div className="mb-8 text-center">
						<div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-yellow-100 dark:bg-yellow-900">
							<svg
								className="h-8 w-8 text-yellow-600 dark:text-yellow-400"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<title>Email Verification Required</title>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
								/>
							</svg>
						</div>
						<h1 className="mb-2 font-bold text-2xl">
							Email Verification Required
						</h1>
						<p className="text-gray-600 dark:text-gray-400">
							Please verify your email address{" "}
							<strong>{needsVerification}</strong> before signing in.
						</p>
					</div>

					<div className="space-y-4">
						<div className="rounded-lg bg-yellow-50 p-4 dark:bg-yellow-900/20">
							<p className="text-sm text-yellow-800 dark:text-yellow-200">
								📧 Check your inbox for a verification email. If you don't see
								it, check your spam folder.
							</p>
						</div>

						<Button
							onClick={handleResendVerification}
							disabled={isLoading || !canResend}
							className="w-full"
						>
							{isLoading
								? "Sending..."
								: !canResend
									? `Resend in ${resendCooldown}s`
									: "Resend Verification Email"}
						</Button>

						<Button
							variant="outline"
							onClick={() => setNeedsVerification(null)}
							className="w-full"
						>
							Back to Sign In
						</Button>
					</div>
				</div>
			</div>
		);
	}

	if (showSignUp) {
		return <SignUpForm onBackToSignIn={() => setShowSignUp(false)} />;
	}

	return (
		<div className="flex min-h-screen items-center justify-center">
			<div className="w-full max-w-md rounded-lg p-8 shadow-xl dark:border-gray-600 dark:bg-gray-800">
				<div className="mb-8 text-center">
					<h1 className="mb-2 font-bold text-3xl">
						Welcome to the <br /> bootleg <br /> MSN Messenger
					</h1>
					<p className="text-xs">Sign in to start chatting with friends</p>
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
				<div className="relative mt-4 mb-2 flex items-center">
					<div className="flex-grow border-accent-foreground/50 border-t" />
					<span className="mx-4 flex-shrink text-accent-foreground/50 text-sm">
						or
					</span>
					<div className="flex-grow border-accent-foreground/50 border-t" />
				</div>
				<SignInWithGoogle />
				<SignInWithGitHub />
			</div>
		</div>
	);
}
