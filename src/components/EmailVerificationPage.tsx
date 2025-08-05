import { api } from "@convex/_generated/api";
import { useMutation } from "convex/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface EmailVerificationPageProps {
	token: string;
	onVerified: () => void;
}

export function EmailVerificationPage({
	token,
	onVerified,
}: EmailVerificationPageProps) {
	const [isVerifying, setIsVerifying] = useState(true);
	const [verificationResult, setVerificationResult] = useState<{
		success: boolean;
		email?: string;
		error?: string;
	} | null>(null);

	const verifyEmail = useMutation(api.emailVerification.verifyEmail);

	useEffect(() => {
		const handleVerification = async () => {
			try {
				const result = await verifyEmail({ token });
				setVerificationResult({
					success: true,
					email: result.email,
				});
				toast.success("Email verified successfully! You can now sign in.");
				setTimeout(() => {
					onVerified();
				}, 2000);
			} catch (error) {
				setVerificationResult({
					success: false,
					error: error instanceof Error ? error.message : "Verification failed",
				});
				toast.error(
					error instanceof Error ? error.message : "Verification failed",
				);
			} finally {
				setIsVerifying(false);
			}
		};

		if (token) {
			handleVerification();
		}
	}, [token, verifyEmail, onVerified]);

	if (isVerifying) {
		return (
			<div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100">
				<div className="mx-4 w-full max-w-md rounded-lg bg-white p-8 text-center shadow-xl">
					<div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-blue-500 border-b-2"></div>
					<h2 className="mb-2 font-semibold text-gray-900 text-xl">
						Verifying Your Email
					</h2>
					<p className="text-gray-600">
						Please wait while we verify your email address...
					</p>
				</div>
			</div>
		);
	}

	return (
		<div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100">
			<div className="mx-4 w-full max-w-md rounded-lg bg-white p-8 text-center shadow-xl">
				{verificationResult?.success ? (
					<>
						<div className="mb-4 text-4xl">✅</div>
						<h2 className="mb-4 font-semibold text-green-600 text-xl">
							Email Verified Successfully!
						</h2>
						<p className="mb-6 text-gray-600">
							Your email address <strong>{verificationResult.email}</strong> has
							been verified.
						</p>
						<p className="text-gray-500 text-sm">
							Redirecting you to sign in...
						</p>
					</>
				) : (
					<>
						<div className="mb-4 text-4xl">❌</div>
						<h2 className="mb-4 font-semibold text-red-600 text-xl">
							Verification Failed
						</h2>
						<p className="mb-6 text-gray-600">
							{verificationResult?.error ||
								"Unable to verify your email address."}
						</p>
						<button
							type="button"
							onClick={onVerified}
							className="w-full rounded-md bg-blue-500 px-4 py-2 font-medium text-white transition-colors hover:bg-blue-600"
						>
							Back to Sign In
						</button>
					</>
				)}
			</div>
		</div>
	);
}
