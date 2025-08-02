import { useMutation, useQuery } from "convex/react";
import { useEffect, useState } from "react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { AddContactModal } from "./AddContactModal";
import { ChatWindow } from "./ChatWindow";
import { ContactList } from "./ContactList";
import { ContactRequestsModal } from "./ContactRequestsModal";
import { CreateGroupModal } from "./CreateGroupModal";
import { GroupChatWindow } from "./GroupChatWindow";
import { StatusBar } from "./StatusBar";

interface Group {
	_id: Id<"groups">;
	_creationTime: number;
	name: string;
	description?: string;
	createdBy: Id<"users">;
	isPrivate: boolean;
	memberCount: number;
	unreadCount: number;
	userRole: "admin" | "member";
}

export function MessengerApp() {
	const [activeChatUserId, setActiveChatUserId] = useState<Id<"users"> | null>(
		null,
	);
	const [activeGroupId, setActiveGroupId] = useState<Id<"groups"> | null>(null);
	const [showAddContact, setShowAddContact] = useState(false);
	const [showContactRequests, setShowContactRequests] = useState(false);
	const [showCreateGroup, setShowCreateGroup] = useState(false);

	const user = useQuery(api.auth.loggedInUser);
	const contacts = useQuery(api.contacts.getContacts);
	const groups = useQuery(api.groups.getUserGroups);
	const pendingRequests = useQuery(api.contacts.getPendingRequests);
	const sentRequests = useQuery(api.contacts.getSentRequests);
	const initializeUserStatus = useMutation(api.userStatus.initializeUserStatus);
	const updateLastSeen = useMutation(api.userStatus.updateLastSeen);

	// Initialize user status when app loads
	useEffect(() => {
		if (user) {
			initializeUserStatus();
		}
	}, [user, initializeUserStatus]);

	// Update last seen periodically
	useEffect(() => {
		if (!user) return;

		const interval = setInterval(() => {
			updateLastSeen();
		}, 30000); // Update every 30 seconds

		return () => clearInterval(interval);
	}, [user, updateLastSeen]);

	// Update last seen on user activity
	useEffect(() => {
		if (!user) return;

		const handleActivity = () => {
			updateLastSeen();
		};

		window.addEventListener("click", handleActivity);
		window.addEventListener("keypress", handleActivity);
		window.addEventListener("mousemove", handleActivity);

		return () => {
			window.removeEventListener("click", handleActivity);
			window.removeEventListener("keypress", handleActivity);
			window.removeEventListener("mousemove", handleActivity);
		};
	}, [user, updateLastSeen]);

	const handleSelectContact = (userId: Id<"users">) => {
		setActiveChatUserId(userId);
		setActiveGroupId(null);
	};

	const handleSelectGroup = (groupId: Id<"groups">) => {
		setActiveGroupId(groupId);
		setActiveChatUserId(null);
	};

	const handleCloseChat = () => {
		setActiveChatUserId(null);
		setActiveGroupId(null);
	};

	if (!user) {
		return (
			<div className="flex min-h-screen items-center justify-center">
				<div className="h-8 w-8 animate-spin rounded-full border-white border-b-2"></div>
			</div>
		);
	}

	const totalRequestCount =
		(pendingRequests?.length || 0) + (sentRequests?.length || 0);

	return (
		<div className="flex min-h-screen">
			{/* Sidebar */}
			<div className="flex w-80 flex-col border-gray-200 border-r bg-white">
				<StatusBar user={user} />

				<div className="flex flex-1 flex-col">
					<div className="space-y-2 border-gray-200 border-b p-4">
						<button
							type="button"
							onClick={() => setShowAddContact(true)}
							className="w-full rounded-md bg-blue-500 px-4 py-2 font-medium text-sm text-white transition-colors hover:bg-blue-600"
						>
							Add Contact
						</button>
						<button
							type="button"
							onClick={() => setShowCreateGroup(true)}
							className="w-full rounded-md bg-purple-500 px-4 py-2 font-medium text-sm text-white transition-colors hover:bg-purple-600"
						>
							Create Group
						</button>
						<button
							type="button"
							onClick={() => setShowContactRequests(true)}
							className="relative w-full rounded-md bg-green-500 px-4 py-2 font-medium text-sm text-white transition-colors hover:bg-green-600"
						>
							Contact Requests
							{totalRequestCount > 0 && (
								<span className="-top-1 -right-1 absolute flex h-5 w-5 items-center justify-center rounded-full bg-red-500 font-bold text-white text-xs">
									{totalRequestCount > 9 ? "9+" : totalRequestCount}
								</span>
							)}
						</button>
					</div>

					<ContactList
						contacts={(contacts || []).filter(
							(
								contact,
							): contact is typeof contact & {
								user: NonNullable<typeof contact.user>;
							} => contact.user !== null,
						)}
						groups={
							groups?.filter(
								(group): group is Group =>
									group !== null && group !== undefined,
							) || []
						}
						activeChatUserId={activeChatUserId}
						activeGroupId={activeGroupId}
						onSelectContact={handleSelectContact}
						onSelectGroup={handleSelectGroup}
					/>
				</div>
			</div>

			{/* Main Chat Area */}
			<div className="flex flex-1 flex-col">
				{activeChatUserId ? (
					<ChatWindow
						otherUserId={activeChatUserId}
						onClose={handleCloseChat}
					/>
				) : activeGroupId ? (
					<GroupChatWindow groupId={activeGroupId} onClose={handleCloseChat} />
				) : (
					<div className="flex flex-1 items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100">
						<div className="text-center">
							<div className="mb-4 text-6xl">💬</div>
							<h2 className="mb-2 font-semibold text-2xl text-gray-700">
								Welcome to MSN Messenger
							</h2>
							<p className="text-gray-500">
								Select a contact or group to start chatting
							</p>
							{totalRequestCount > 0 && (
								<div className="mt-4">
									<button
										type="button"
										onClick={() => setShowContactRequests(true)}
										className="rounded-md bg-green-500 px-4 py-2 font-medium text-sm text-white transition-colors hover:bg-green-600"
									>
										You have {totalRequestCount} pending request
										{totalRequestCount !== 1 ? "s" : ""}
									</button>
								</div>
							)}
						</div>
					</div>
				)}
			</div>

			{showAddContact && (
				<AddContactModal onClose={() => setShowAddContact(false)} />
			)}

			{showCreateGroup && (
				<CreateGroupModal onClose={() => setShowCreateGroup(false)} />
			)}

			{showContactRequests && (
				<ContactRequestsModal onClose={() => setShowContactRequests(false)} />
			)}
		</div>
	);
}
