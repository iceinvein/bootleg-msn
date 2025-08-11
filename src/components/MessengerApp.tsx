import { api } from "@convex/_generated/api";
import { useStore } from "@nanostores/react";
import { useMutation, useQuery } from "convex/react";
import { useEffect } from "react";
import { useMessageNotifications } from "@/hooks/useMessageNotifications";
import { cn } from "@/lib/utils";
import { $selectedChat } from "@/stores/contact";
import { AccountLinkingNotification } from "./AccountLinkingNotification";
import { Chat } from "./Chat";
import { ContactList } from "./ContactList";
import { StatusBar } from "./StatusBar";
import { VersionBadge } from "./VersionInfo";

export function MessengerApp() {
	const user = useQuery(api.auth.loggedInUser);
	const selectedChat = useStore($selectedChat);
	const initializeUserStatus = useMutation(api.userStatus.initializeUserStatus);
	const updateLastSeen = useMutation(api.userStatus.updateLastSeen);

	// Initialize message notifications for toast alerts
	useMessageNotifications();

	// Check if a chat is currently selected (for mobile layout)
	const isChatOpen = !!(selectedChat?.contact || selectedChat?.group);

	// Initialize user status when app loads (with error handling)
	useEffect(() => {
		if (user) {
			initializeUserStatus().catch((error) => {
				console.error("Failed to initialize user status:", error);
			});
		}
	}, [user, initializeUserStatus]);

	// Update last seen periodically (with error handling and longer interval)
	useEffect(() => {
		if (!user) return;

		const interval = setInterval(() => {
			updateLastSeen().catch((error) => {
				console.error("Failed to update last seen:", error);
			});
		}, 60000); // Update every 60 seconds (reduced frequency)

		return () => clearInterval(interval);
	}, [user, updateLastSeen]);

	// Update last seen on user activity (with throttling and error handling)
	useEffect(() => {
		if (!user) return;

		let lastActivityUpdate = 0;
		const THROTTLE_DELAY = 30000; // Only update once every 30 seconds

		const handleActivity = () => {
			const now = Date.now();
			if (now - lastActivityUpdate > THROTTLE_DELAY) {
				lastActivityUpdate = now;
				updateLastSeen().catch((error) => {
					console.error("Failed to update last seen on activity:", error);
				});
			}
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
				<output
					className="h-8 w-8 animate-spin rounded-full border-white border-b-2"
					aria-label="Loading messenger application"
				/>
			</div>
		);
	}

	return (
		<div className="flex min-h-screen flex-col">
			{/* Account linking notification */}
			<AccountLinkingNotification />

			<div className={cn("flex flex-1")}>
				{/* Sidebar - Full width on mobile when no chat is open */}
				<div
					className={cn(
						"flex flex-col",
						// On mobile: full width when no chat, hidden when chat is open
						// On desktop: always show with normal width
						"md:flex md:w-auto", // Always show on desktop with auto width
						isChatOpen ? "hidden md:flex" : "flex w-full md:w-auto", // Full width on mobile when no chat
					)}
				>
					<StatusBar user={user} />
					<ContactList />
					{/* Version info at bottom of status bar */}
					<div className="mt-2 flex justify-center">
						<VersionBadge />
					</div>
				</div>

				{/* Main Chat Area - Hidden on mobile when no chat is selected */}
				<div
					className={cn(
						"flex-1",
						// On mobile: hidden when no chat, shown when chat is open
						// On desktop: always shown
						"md:flex", // Always show on desktop
						isChatOpen ? "flex" : "hidden md:flex", // Hide on mobile when no chat
					)}
				>
					<Chat />
				</div>
			</div>
		</div>
	);
}
