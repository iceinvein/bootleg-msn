import { useMutation } from "convex/react";
import { useState } from "react";
import { toast } from "sonner";
import { api } from "../../convex/_generated/api";

interface AddContactModalProps {
	onClose: () => void;
}

export function AddContactModal({ onClose }: AddContactModalProps) {
	const [email, setEmail] = useState("");
	const [nickname, setNickname] = useState("");
	const [isLoading, setIsLoading] = useState(false);

	const sendContactRequest = useMutation(api.contacts.sendContactRequest);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!email.trim()) return;

		setIsLoading(true);
		try {
			const result = await sendContactRequest({
				contactEmail: email.trim(),
				nickname: nickname.trim() || undefined,
			});

			if (result.autoAccepted) {
				toast.success("Contact added! They had already sent you a request.");
			} else {
				toast.success("Contact request sent! Waiting for them to accept.");
			}
			onClose();
		} catch (error) {
			toast.error(
				error instanceof Error
					? error.message
					: "Failed to send contact request",
			);
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
			<div className="mx-4 w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
				<div className="mb-4 flex items-center justify-between">
					<h2 className="font-semibold text-gray-900 text-xl">
						Send Contact Request
					</h2>
					<button
						type="button"
						onClick={onClose}
						className="font-bold text-gray-400 text-xl hover:text-gray-600"
					>
						×
					</button>
				</div>

				<form onSubmit={handleSubmit} className="space-y-4">
					<div>
						<label
							htmlFor="email"
							className="mb-1 block font-medium text-gray-700 text-sm"
						>
							Email Address
						</label>
						<input
							type="email"
							id="email"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							placeholder="friend@example.com"
							className="w-full rounded-md border border-gray-300 px-3 py-2 text-black focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
							required
						/>
					</div>

					<div>
						<label
							htmlFor="nickname"
							className="mb-1 block font-medium text-gray-700 text-sm"
						>
							Nickname (optional)
						</label>
						<input
							type="text"
							id="nickname"
							value={nickname}
							onChange={(e) => setNickname(e.target.value)}
							placeholder="Best Friend"
							className="w-full rounded-md border border-gray-300 px-3 py-2 text-black focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
						/>
					</div>

					<div className="flex space-x-3 pt-4">
						<button
							type="button"
							onClick={onClose}
							className="flex-1 rounded-md bg-gray-200 px-4 py-2 font-medium text-gray-800 transition-colors hover:bg-gray-300"
						>
							Cancel
						</button>
						<button
							type="submit"
							disabled={isLoading || !email.trim()}
							className="flex-1 rounded-md bg-blue-500 px-4 py-2 font-medium text-white transition-colors hover:bg-blue-600 disabled:bg-gray-300"
						>
							{isLoading ? "Sending..." : "Send Request"}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}
