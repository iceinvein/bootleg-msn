import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";

interface AddMembersModalProps {
	groupId: Id<"groups">;
	onClose: () => void;
}

export function AddMembersModal({ groupId, onClose }: AddMembersModalProps) {
	const [selectedContacts, setSelectedContacts] = useState<Id<"users">[]>([]);
	const [isLoading, setIsLoading] = useState(false);

	const contacts = useQuery(api.contacts.getContacts);
	const groupMembers = useQuery(api.groups.getGroupMembers, { groupId });
	const addGroupMembers = useMutation(api.groups.addGroupMembers);

	// Filter out contacts who are already group members
	const availableContacts =
		contacts?.filter(
			(contact) =>
				!groupMembers?.some(
					(member) => member.userId === contact.contactUserId,
				),
		) || [];

	const handleContactToggle = (contactId: Id<"users">) => {
		setSelectedContacts((prev) =>
			prev.includes(contactId)
				? prev.filter((id) => id !== contactId)
				: [...prev, contactId],
		);
	};

	const handleAddMembers = async () => {
		if (selectedContacts.length === 0) {
			toast.error("Please select at least one contact to add");
			return;
		}

		setIsLoading(true);
		try {
			const result = await addGroupMembers({
				groupId,
				memberIds: selectedContacts,
			});

			if (result.addedCount > 0) {
				toast.success(
					`Added ${result.addedCount} member${result.addedCount !== 1 ? "s" : ""} to the group`,
				);
				onClose();
			} else {
				toast.info(
					"No new members were added (they may already be in the group)",
				);
			}
		} catch (error) {
			toast.error(
				error instanceof Error ? error.message : "Failed to add members",
			);
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
			<div className="mx-4 flex max-h-[80vh] w-full max-w-md flex-col rounded-lg bg-white shadow-xl">
				<div className="border-gray-200 border-b p-6">
					<h2 className="font-semibold text-gray-900 text-xl">Add Members</h2>
					<p className="mt-1 text-gray-600 text-sm">
						Select contacts to add to the group
					</p>
				</div>

				<div className="flex-1 overflow-y-auto p-6">
					{availableContacts.length === 0 ? (
						<div className="py-8 text-center text-gray-500">
							<div className="mb-4 text-4xl">👥</div>
							<p>No available contacts to add</p>
							<p className="mt-2 text-sm">
								All your contacts are already in this group or you don't have
								any contacts yet.
							</p>
						</div>
					) : (
						<div className="space-y-2">
							{availableContacts.map((contact) => {
								const displayName =
									contact.nickname ||
									contact.user?.name ||
									contact.user?.email ||
									"Unknown User";
								const isSelected = selectedContacts.includes(
									contact.contactUserId,
								);

								return (
									<button
										key={contact._id}
										type="button"
										className={cn(
											"flex w-full items-center space-x-3 rounded-lg border-2 p-3 text-left transition-colors",
											isSelected
												? "border-blue-200 bg-blue-50"
												: "border-transparent bg-gray-50 hover:bg-gray-100",
										)}
										onClick={() => handleContactToggle(contact.contactUserId)}
									>
										<div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-blue-600 font-semibold text-white">
											{displayName[0]?.toUpperCase() || "U"}
										</div>
										<div className="min-w-0 flex-1">
											<div className="truncate font-medium text-gray-900">
												{displayName}
											</div>
											{contact.user?.email && (
												<div className="truncate text-gray-500 text-sm">
													{contact.user.email}
												</div>
											)}
										</div>
										<div
											className={cn(
												"flex h-5 w-5 items-center justify-center rounded-full border-2",
												isSelected
													? "border-blue-500 bg-blue-500"
													: "border-gray-300",
											)}
										>
											{isSelected && (
												<svg
													className="h-3 w-3 text-white"
													fill="currentColor"
													viewBox="0 0 20 20"
													aria-hidden="true"
												>
													<path
														fillRule="evenodd"
														d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
														clipRule="evenodd"
													/>
												</svg>
											)}
										</div>
									</button>
								);
							})}
						</div>
					)}
				</div>

				<div className="flex space-x-3 border-gray-200 border-t p-6">
					<button
						type="button"
						onClick={onClose}
						className="flex-1 rounded-md bg-gray-200 px-4 py-2 font-medium text-gray-700 transition-colors hover:bg-gray-300"
					>
						Cancel
					</button>
					<button
						type="button"
						onClick={handleAddMembers}
						disabled={
							isLoading ||
							selectedContacts.length === 0 ||
							availableContacts.length === 0
						}
						className="flex-1 rounded-md bg-blue-500 px-4 py-2 font-medium text-white transition-colors hover:bg-blue-600 disabled:bg-gray-300"
					>
						{isLoading
							? "Adding..."
							: `Add ${selectedContacts.length} Member${selectedContacts.length !== 1 ? "s" : ""}`}
					</button>
				</div>
			</div>
		</div>
	);
}
