import { api } from "@convex/_generated/api";
import { useAction } from "convex/react";
import { useState } from "react";
import { toast } from "sonner";

interface EmailVerificationModalProps {
	email: string;
	onClose: () => void;
	onVerified: () => void;
}

export function EmailVerificationModal({
	email,
	onClose,
}: EmailVerificationModalProps) {
	const [isResending, setIsResending] = useState(false);
	const sendVerificationEmail = useAction(
		api.emailVerification.sendVerificationEmail,
	);

	const handleResendEmail = async () => {
		setIsResending(true);
		try {
			await sendVerificationEmail({ email });
			toast.success("Verification email sent! Please check your inbox.");
		} catch (error) {
			toast.error(
				error instanceof Error
					? error.message
					: "Failed to send verification email",
			);
		} finally {
			setIsResending(false);
		}
	};

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
			<div className="mx-4 w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
				<div className="text-center">
					<div className="mb-4 text-4xl">📧</div>
					<h2 className="mb-4 font-semibold text-gray-900 text-xl">
						Verify Your Email
					</h2>
					<p className="mb-6 text-gray-600">
						We've sent a verification link to:
					</p>
					<p className="mb-6 font-medium text-blue-600">{email}</p>
					<p className="mb-6 text-gray-500 text-sm">
						Please check your email and click the verification link to complete
						your registration.
					</p>

					<div className="space-y-3">
						<button
							type="button"
							onClick={handleResendEmail}
							disabled={isResending}
							className="w-full rounded-md bg-blue-500 px-4 py-2 font-medium text-white transition-colors hover:bg-blue-600 disabled:bg-gray-300"
						>
							{isResending ? "Sending..." : "Resend Verification Email"}
						</button>

						<button
							type="button"
							onClick={onClose}
							className="w-full rounded-md bg-gray-200 px-4 py-2 font-medium text-gray-800 transition-colors hover:bg-gray-300"
						>
							Close
						</button>
					</div>

					<p className="mt-4 text-gray-400 text-xs">
						Didn't receive the email? Check your spam folder or try resending.
					</p>
				</div>
			</div>
		</div>
	);
}
