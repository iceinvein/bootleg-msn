import { api } from "@convex/_generated/api";
import { useMutation } from "convex/react";
import { useState } from "react";
import { toast } from "sonner";

type SetNameModalProps = {
	onClose: () => void;
	currentName?: string;
};

export function SetNameModal({ onClose, currentName }: SetNameModalProps) {
	const [name, setName] = useState(currentName || "");
	const [isLoading, setIsLoading] = useState(false);

	const updateUserName = useMutation(api.auth.updateUserName);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!name.trim()) return;

		setIsLoading(true);
		try {
			await updateUserName({ name: name.trim() });
			toast.success("Name updated successfully!");
			onClose();
		} catch (error) {
			toast.error(
				error instanceof Error ? error.message : "Failed to update name",
			);
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
			<div className="mx-4 w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
				<div className="mb-4 flex items-center justify-between">
					<h2 className="font-semibold text-gray-900 text-xl">Set Your Name</h2>
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
							htmlFor="name"
							className="mb-1 block font-medium text-gray-700 text-sm"
						>
							Display Name
						</label>
						<input
							type="text"
							id="name"
							value={name}
							onChange={(e) => setName(e.target.value)}
							placeholder="Enter your name"
							className="w-full rounded-md border border-gray-300 px-3 py-2 text-black focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
							required
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
							disabled={isLoading || !name.trim()}
							className="flex-1 rounded-md bg-blue-500 px-4 py-2 font-medium text-white transition-colors hover:bg-blue-600 disabled:bg-gray-300"
						>
							{isLoading ? "Saving..." : "Save Name"}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}
