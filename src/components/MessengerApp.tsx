import { useMutation, useQuery } from "convex/react";
import { useEffect, useState } from "react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { ChatWindow } from "./ChatWindow";
import { ContactList } from "./ContactList";
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

	const user = useQuery(api.auth.loggedInUser);
	const contacts = useQuery(api.contacts.getContacts);
	const groups = useQuery(api.groups.getUserGroups);
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

	return (
		<div className="flex min-h-screen">
			{/* Sidebar */}
			<div className="flex w-80 flex-col border-gray-200 border-r bg-white">
				<StatusBar user={user} />
				<div className="flex flex-1 flex-col">
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
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
