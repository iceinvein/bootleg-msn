import { useMutation } from "convex/react";
import { useState } from "react";
import { toast } from "sonner";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";

interface Contact {
	_id: Id<"contacts">;
	user: {
		_id: Id<"users">;
		name?: string;
		email?: string;
	};
	status: string;
	statusMessage?: string;
	unreadCount: number;
	nickname?: string;
}

interface Group {
	_id: Id<"groups">;
	name: string;
	description?: string;
	memberCount: number;
	unreadCount: number;
	userRole: "admin" | "member";
}

interface ContactListProps {
	contacts: Contact[];
	groups: Group[];
	activeChatUserId: Id<"users"> | null;
	activeGroupId: Id<"groups"> | null;
	onSelectContact: (userId: Id<"users">) => void;
	onSelectGroup: (groupId: Id<"groups">) => void;
}

const statusEmojis = {
	online: "🟢",
	away: "🟡",
	busy: "🔴",
	invisible: "⚫",
	offline: "⚪",
};

export function ContactList({
	contacts,
	groups,
	activeChatUserId,
	activeGroupId,
	onSelectContact,
	onSelectGroup,
}: ContactListProps) {
	const [showDeleteConfirm, setShowDeleteConfirm] =
		useState<Id<"contacts"> | null>(null);
	const removeContact = useMutation(api.contacts.removeContact);

	const onlineContacts = contacts.filter((c) => c.status === "online");
	const awayContacts = contacts.filter((c) => c.status === "away");
	const busyContacts = contacts.filter((c) => c.status === "busy");
	const offlineContacts = contacts.filter((c) =>
		["invisible", "offline"].includes(c.status),
	);

	const handleDeleteContact = async (contactId: Id<"contacts">) => {
		try {
			await removeContact({ contactId });
			toast.success("Contact removed successfully!");
			setShowDeleteConfirm(null);
		} catch (error) {
			toast.error(
				error instanceof Error ? error.message : "Failed to remove contact",
			);
		}
	};

	const ContactGroup = ({
		title,
		contacts,
	}: {
		title: string;
		contacts: Contact[];
	}) => {
		if (contacts.length === 0) return null;

		return (
			<div className="mb-4">
				<div className="bg-gray-50 px-4 py-2 font-semibold text-gray-500 text-xs uppercase tracking-wide">
					{title} ({contacts.length})
				</div>
				{contacts.map((contact) => {
					const displayName =
						contact.nickname ||
						contact.user.name ||
						contact.user.email ||
						"Anonymous User";

					return (
						<div
							key={contact._id}
							className={`group relative flex items-center space-x-3 px-4 py-3 transition-colors hover:bg-blue-50 ${
								activeChatUserId === contact.user._id
									? "border-blue-500 border-r-2 bg-blue-100"
									: ""
							}`}
						>
							<button
								type="button"
								onClick={() => onSelectContact(contact.user._id)}
								className="flex min-w-0 flex-1 items-center space-x-3"
							>
								<div className="relative">
									<div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-blue-600 font-semibold text-sm text-white">
										{displayName[0]?.toUpperCase() || "U"}
									</div>
									<div className="-bottom-1 -right-1 absolute text-xs">
										{statusEmojis[contact.status as keyof typeof statusEmojis]}
									</div>
								</div>

								<div className="min-w-0 flex-1 text-left">
									<div className="truncate font-medium text-gray-900">
										{displayName}
									</div>
									{contact.statusMessage && (
										<div className="truncate text-gray-500 text-xs">
											{contact.statusMessage}
										</div>
									)}
								</div>

								{contact.unreadCount > 0 && (
									<div className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500 font-bold text-white text-xs">
										{contact.unreadCount > 9 ? "9+" : contact.unreadCount}
									</div>
								)}
							</button>

							{/* Delete button - only visible on hover */}
							<button
								type="button"
								onClick={() => setShowDeleteConfirm(contact._id)}
								className="rounded p-1 text-red-500 opacity-0 transition-all duration-200 hover:text-red-700 group-hover:opacity-100"
								title="Remove contact"
							>
								<svg
									className="h-4 w-4"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
									aria-hidden="true"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
									/>
								</svg>
							</button>
						</div>
					);
				})}
			</div>
		);
	};

	const GroupSection = () => {
		if (groups.length === 0) return null;

		return (
			<div className="mb-4">
				<div className="bg-gray-50 px-4 py-2 font-semibold text-gray-500 text-xs uppercase tracking-wide">
					Groups ({groups.length})
				</div>
				{groups.map((group) => (
					<button
						key={group._id}
						type="button"
						className={`group relative flex w-full items-center space-x-3 px-4 py-3 text-left transition-colors hover:bg-green-50 ${
							activeGroupId === group._id
								? "border-green-500 border-r-2 bg-green-100"
								: ""
						}`}
						onClick={() => onSelectGroup(group._id)}
					>
						<div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-green-400 to-green-600 font-semibold text-sm text-white">
							👥
						</div>

						<div className="min-w-0 flex-1 text-left">
							<div className="truncate font-medium text-gray-900">
								{group.name}
								{group.userRole === "admin" && (
									<span className="ml-1 rounded bg-green-100 px-1 text-green-800 text-xs">
										Admin
									</span>
								)}
							</div>
							<div className="truncate text-gray-500 text-xs">
								{group.memberCount} member{group.memberCount !== 1 ? "s" : ""}
								{group.description && ` • ${group.description}`}
							</div>
						</div>

						{group.unreadCount > 0 && (
							<div className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500 font-bold text-white text-xs">
								{group.unreadCount > 9 ? "9+" : group.unreadCount}
							</div>
						)}
					</button>
				))}
			</div>
		);
	};

	return (
		<>
			<div className="flex-1 overflow-y-auto">
				<GroupSection />
				<ContactGroup title="Online" contacts={onlineContacts} />
				<ContactGroup title="Away" contacts={awayContacts} />
				<ContactGroup title="Busy" contacts={busyContacts} />
				<ContactGroup title="Offline" contacts={offlineContacts} />

				{contacts.length === 0 && groups.length === 0 && (
					<div className="p-8 text-center text-gray-500">
						<div className="mb-4 text-4xl">👥</div>
						<p>No contacts or groups yet</p>
						<p className="text-sm">
							Add some friends or create a group to start chatting!
						</p>
					</div>
				)}
			</div>

			{/* Delete Confirmation Modal */}
			{showDeleteConfirm && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
					<div className="mx-4 w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
						<div className="mb-4 flex items-center justify-between">
							<h2 className="font-semibold text-gray-900 text-xl">
								Remove Contact
							</h2>
							<button
								type="button"
								onClick={() => setShowDeleteConfirm(null)}
								className="font-bold text-gray-400 text-xl hover:text-gray-600"
							>
								×
							</button>
						</div>

						<p className="mb-6 text-gray-600">
							Are you sure you want to remove this contact? This action cannot
							be undone.
						</p>

						<div className="flex space-x-3">
							<button
								type="button"
								onClick={() => setShowDeleteConfirm(null)}
								className="flex-1 rounded-md bg-gray-200 px-4 py-2 font-medium text-gray-800 transition-colors hover:bg-gray-300"
							>
								Cancel
							</button>
							<button
								type="button"
								onClick={() => handleDeleteContact(showDeleteConfirm)}
								className="flex-1 rounded-md bg-red-500 px-4 py-2 font-medium text-white transition-colors hover:bg-red-600"
							>
								Remove Contact
							</button>
						</div>
					</div>
				</div>
			)}
		</>
	);
}
