import { api } from "@convex/_generated/api";
import { useStore } from "@nanostores/react";
import { useMutation, useQuery } from "convex/react";
import { useEffect } from "react";
import { useMessageNotifications } from "@/hooks/useMessageNotifications";
import { cn } from "@/lib/utils";
import { $activeChatWindows } from "@/stores/chatWindows";
import { AccountLinkingNotification } from "./AccountLinkingNotification";
import { Chat } from "./Chat";
import { ContactList } from "./ContactList";
import { StatusBar } from "./StatusBar";
import { VersionBadge } from "./VersionInfo";

export function MessengerApp() {
	const activeWindows = useStore($activeChatWindows);
	console.log("🚀 ~ MessengerApp ~ activeWindows:", activeWindows);
	const hasActiveWindows = activeWindows.size > 0;
	console.log("🚀 ~ MessengerApp ~ hasActiveWindows:", hasActiveWindows);

	const user = useQuery(api.auth.loggedInUser);
	const initializeUserStatus = useMutation(api.userStatus.initializeUserStatus);
	const updateLastSeen = useMutation(api.userStatus.updateLastSeen);

	// Initialize message notifications for toast alerts
	useMessageNotifications();

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
				<div className="h-8 w-8 animate-spin rounded-full border-white border-b-2"></div>
			</div>
		);
	}

	return (
		<div className="flex min-h-screen flex-col">
			{/* Account linking notification */}
			<AccountLinkingNotification />

			<div className={cn("flex flex-1")}>
				{/* Sidebar */}
				<div className={cn("flex flex-col", hasActiveWindows && "hidden")}>
					<StatusBar user={user} />
					<ContactList />
					{/* Version info at bottom of status bar */}
					<div className="mt-2 flex justify-center">
						<VersionBadge />
					</div>
				</div>

				{/* Main Chat Area */}
				<Chat />
			</div>
		</div>
	);
}
