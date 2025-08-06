import { useAuthActions } from "@convex-dev/auth/react";
import { useMutation } from "convex/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { api } from "../../convex/_generated/api";
import { Button } from "./ui/button";

interface EmailVerificationPageProps {
	token: string;
	onBackToSignIn: () => void;
	onVerificationSuccess?: () => void;
}

export function EmailVerificationPage({
	token,
	onBackToSignIn,
	onVerificationSuccess,
}: EmailVerificationPageProps) {
	const { signIn } = useAuthActions();
	const verifyEmail = useMutation(api.emailVerification.verifyEmail);
	const updateUserName = useMutation(api.auth.updateUserName);
	const [isVerifying, setIsVerifying] = useState(true);
	const [verificationStatus, setVerificationStatus] = useState<
		"loading" | "success" | "error"
	>("loading");
	const [errorMessage, setErrorMessage] = useState("");
	const [isCreatingAccount, setIsCreatingAccount] = useState(false);

	useEffect(() => {
		const handleVerification = async () => {
			try {
				const result = await verifyEmail({ token });
				if (result.success) {
					setVerificationStatus("success");
					toast.success("Email verified successfully!");

					// Try to create the account with stored data
					const pendingSignUp = localStorage.getItem("pendingSignUp");
					if (pendingSignUp) {
						const userData = JSON.parse(pendingSignUp);
						setIsCreatingAccount(true);

						try {
							await signIn("password", {
								email: userData.email,
								password: userData.password,
								name: userData.name,
								flow: "signUp",
							});

							// Update user name after account creation
							// The signIn might not save the name, so we explicitly update it
							try {
								await updateUserName({ name: userData.name });
							} catch (nameError) {
								console.warn("Failed to update user name:", nameError);
								// Don't fail the entire signup process for this
							}

							// Clear stored data
							localStorage.removeItem("pendingSignUp");
							toast.success(
								"Account created successfully! Welcome to MSN Messenger!",
							);

							// Call success callback after a brief delay to show success message
							setTimeout(() => {
								// Clear the URL and navigate to root
								window.history.replaceState({}, document.title, "/");
								if (onVerificationSuccess) {
									onVerificationSuccess();
								}
							}, 1500);
						} catch (signUpError) {
							console.error("Sign up error:", signUpError);
							toast.error(
								"Email verified, but failed to create account. Please try signing in.",
							);
						} finally {
							setIsCreatingAccount(false);
						}
					}
				}
			} catch (error) {
				console.error("Verification error:", error);
				setVerificationStatus("error");
				const errorMsg =
					error instanceof Error ? error.message : "Verification failed";
				setErrorMessage(errorMsg);

				if (errorMsg.includes("Invalid verification token")) {
					toast.error("Invalid or expired verification link.");
				} else if (errorMsg.includes("already verified")) {
					toast.error("This email is already verified. Please sign in.");
				} else {
					toast.error("Verification failed. Please try again.");
				}
			} finally {
				setIsVerifying(false);
			}
		};

		if (token) {
			handleVerification();
		}
	}, [token, verifyEmail, signIn, updateUserName, onVerificationSuccess]);

	if (isVerifying) {
		return (
			<div className="flex min-h-screen items-center justify-center">
				<div className="w-full max-w-md rounded-lg p-8 shadow-xl dark:border-gray-600 dark:bg-gray-800">
					<div className="text-center">
						<div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-blue-500 border-b-2"></div>
						<h1 className="mb-2 font-bold text-2xl">Verifying Your Email</h1>
						<p className="text-gray-600 dark:text-gray-400">
							Please wait while we verify your email address...
						</p>
					</div>
				</div>
			</div>
		);
	}

	if (verificationStatus === "success") {
		if (isCreatingAccount) {
			return (
				<div className="flex min-h-screen items-center justify-center">
					<div className="w-full max-w-md rounded-lg p-8 shadow-xl dark:border-gray-600 dark:bg-gray-800">
						<div className="text-center">
							<div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-green-500 border-b-2"></div>
							<h1 className="mb-2 font-bold text-2xl">Creating Your Account</h1>
							<p className="text-gray-600 dark:text-gray-400">
								Email verified! Setting up your MSN Messenger account...
							</p>
						</div>
					</div>
				</div>
			);
		}

		return (
			<div className="flex min-h-screen items-center justify-center">
				<div className="w-full max-w-md rounded-lg p-8 shadow-xl dark:border-gray-600 dark:bg-gray-800">
					<div className="text-center">
						<div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
							<svg
								className="h-8 w-8 text-green-600 dark:text-green-400"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<title>Email verification successful</title>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M5 13l4 4L19 7"
								/>
							</svg>
						</div>
						<h1 className="mb-2 font-bold text-2xl">Email Verified!</h1>
						<p className="mb-6 text-gray-600 dark:text-gray-400">
							Your email has been successfully verified and your account has
							been created.
						</p>

						<div className="space-y-4">
							<div className="rounded-lg bg-green-50 p-4 dark:bg-green-900/20">
								<p className="text-green-800 text-sm dark:text-green-200">
									🎉 Welcome to MSN Messenger! You should be automatically
									signed in shortly.
								</p>
							</div>

							<Button
								onClick={() => {
									// Clear the URL and navigate to root
									window.history.replaceState({}, document.title, "/");
									if (onVerificationSuccess) {
										onVerificationSuccess();
									} else {
										onBackToSignIn();
									}
								}}
								className="w-full"
							>
								Continue to Messenger
							</Button>
						</div>
					</div>
				</div>
			</div>
		);
	}

	// Error state
	return (
		<div className="flex min-h-screen items-center justify-center">
			<div className="w-full max-w-md rounded-lg p-8 shadow-xl dark:border-gray-600 dark:bg-gray-800">
				<div className="text-center">
					<div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900">
						<svg
							className="h-8 w-8 text-red-600 dark:text-red-400"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<title>Email verification failed</title>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M6 18L18 6M6 6l12 12"
							/>
						</svg>
					</div>
					<h1 className="mb-2 font-bold text-2xl">Verification Failed</h1>
					<p className="mb-6 text-gray-600 dark:text-gray-400">
						{errorMessage || "We couldn't verify your email address."}
					</p>

					<div className="space-y-4">
						<div className="rounded-lg bg-red-50 p-4 dark:bg-red-900/20">
							<p className="text-red-800 text-sm dark:text-red-200">
								The verification link may have expired or been used already.
							</p>
						</div>

						<Button onClick={onBackToSignIn} className="w-full">
							Back to Sign In
						</Button>
					</div>
				</div>
			</div>
		</div>
	);
}
