import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { toast } from "sonner";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";

interface CreateGroupModalProps {
	onClose: () => void;
}

export function CreateGroupModal({ onClose }: CreateGroupModalProps) {
	const [groupName, setGroupName] = useState("");
	const [description, setDescription] = useState("");
	const [isPrivate, setIsPrivate] = useState(false);
	const [selectedContacts, setSelectedContacts] = useState<Id<"users">[]>([]);
	const [isLoading, setIsLoading] = useState(false);

	const contacts = useQuery(api.contacts.getContacts);
	const createGroup = useMutation(api.groups.createGroup);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!groupName.trim()) return;

		setIsLoading(true);
		try {
			await createGroup({
				name: groupName.trim(),
				description: description.trim() || undefined,
				isPrivate,
				memberIds: selectedContacts,
			});

			toast.success("Group created successfully!");
			onClose();
		} catch (error) {
			toast.error(
				error instanceof Error ? error.message : "Failed to create group",
			);
		} finally {
			setIsLoading(false);
		}
	};

	const toggleContact = (userId: Id<"users">) => {
		setSelectedContacts((prev) =>
			prev.includes(userId)
				? prev.filter((id) => id !== userId)
				: [...prev, userId],
		);
	};

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
			<div className="mx-4 max-h-96 w-full max-w-md overflow-y-auto rounded-lg bg-white p-6 shadow-xl">
				<div className="mb-4 flex items-center justify-between">
					<h2 className="font-semibold text-gray-900 text-xl">
						Create Group Chat
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
							htmlFor="groupName"
							className="mb-1 block font-medium text-gray-700 text-sm"
						>
							Group Name
						</label>
						<input
							type="text"
							id="groupName"
							value={groupName}
							onChange={(e) => setGroupName(e.target.value)}
							placeholder="Enter group name"
							className="w-full rounded-md border border-gray-300 px-3 py-2 text-black focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
							required
						/>
					</div>

					<div>
						<label
							htmlFor="description"
							className="mb-1 block font-medium text-gray-700 text-sm"
						>
							Description (optional)
						</label>
						<textarea
							id="description"
							value={description}
							onChange={(e) => setDescription(e.target.value)}
							placeholder="Enter group description"
							rows={2}
							className="w-full resize-none rounded-md border border-gray-300 px-3 py-2 text-black focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
						/>
					</div>

					<div className="flex items-center">
						<input
							type="checkbox"
							id="isPrivate"
							checked={isPrivate}
							onChange={(e) => setIsPrivate(e.target.checked)}
							className="mr-2"
						/>
						<label htmlFor="isPrivate" className="text-gray-700 text-sm">
							Private group
						</label>
					</div>

					<fieldset>
						<legend className="mb-2 block font-medium text-gray-700 text-sm">
							Add Contacts ({selectedContacts.length} selected)
						</legend>
						<div className="max-h-32 overflow-y-auto rounded-md border border-gray-200">
							{contacts && contacts.length > 0 ? (
								contacts.map((contact) => {
									const displayName =
										contact.nickname ||
										contact.user?.name ||
										contact.user?.email ||
										"Anonymous User";

									return (
										<div
											key={contact._id}
											className="flex items-center p-2 hover:bg-gray-50"
										>
											<input
												type="checkbox"
												id={`contact-${contact._id}`}
												checked={selectedContacts.includes(
													contact.contactUserId,
												)}
												onChange={() => toggleContact(contact.contactUserId)}
												className="mr-3"
											/>
											<div className="flex flex-1 items-center space-x-2">
												<div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-blue-600 font-semibold text-white text-xs">
													{displayName[0]?.toUpperCase() || "U"}
												</div>
												<label
													htmlFor={`contact-${contact._id}`}
													className="flex-1 cursor-pointer text-gray-700 text-sm"
												>
													{displayName}
												</label>
											</div>
										</div>
									);
								})
							) : (
								<div className="p-4 text-center text-gray-500 text-sm">
									No contacts available
								</div>
							)}
						</div>
					</fieldset>

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
							disabled={isLoading || !groupName.trim()}
							className="flex-1 rounded-md bg-blue-500 px-4 py-2 font-medium text-white transition-colors hover:bg-blue-600 disabled:bg-gray-300"
						>
							{isLoading ? "Creating..." : "Create Group"}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}
