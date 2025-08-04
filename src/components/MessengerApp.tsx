import { useStore } from "@nanostores/react";
import { useMutation, useQuery } from "convex/react";
import { MessageCircle } from "lucide-react";
import { useEffect } from "react";
import { $selectedChat } from "@/stores/contact";
import { api } from "../../convex/_generated/api";
import { ChatWindow } from "./ChatWindow";
import { ContactList } from "./ContactList";
import { GroupChatWindow } from "./GroupChatWindow";
import { StatusBar } from "./StatusBar";

export function MessengerApp() {
	const selectedChat = useStore($selectedChat);

	const user = useQuery(api.auth.loggedInUser);
	const initializeUserStatus = useMutation(api.userStatus.initializeUserStatus);
	const updateLastSeen = useMutation(api.userStatus.updateLastSeen);

	const handleCloseChat = () => {
		$selectedChat.set({ contact: null, group: null });
	};

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
			<div className="flex w-full flex-col md:w-90">
				<StatusBar user={user} />
				<ContactList />
			</div>

			{/* Main Chat Area */}
			<div className="flex flex-1 flex-col">
				{selectedChat?.contact ? (
					<ChatWindow
						otherUserId={selectedChat.contact.userId}
						onClose={handleCloseChat}
					/>
				) : selectedChat?.group ? (
					<GroupChatWindow
						groupId={selectedChat.group._id}
						onClose={handleCloseChat}
					/>
				) : (
					<div className="flex flex-1 items-center justify-center bg-gray-50 p-4 dark:bg-gray-900">
						<div className="text-center">
							<MessageCircle className="mx-auto mb-4 h-12 w-12 text-gray-400 md:h-16 md:w-16 dark:text-gray-500" />
							<h3 className="mb-2 font-semibold text-base text-gray-600 md:text-lg dark:text-gray-300">
								Select a contact or group to start chatting
							</h3>
							<p className="text-gray-500 text-sm md:text-base dark:text-gray-400">
								Choose someone from your list to begin a conversation
							</p>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
