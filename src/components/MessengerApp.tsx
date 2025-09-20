import { api } from "@convex/_generated/api";
import { useStore } from "@nanostores/react";
import { useMutation, useQuery } from "convex/react";
import { useEffect } from "react";
import { useMessageNotifications } from "@/hooks/useMessageNotifications";
import { useOnlineNotifications } from "@/hooks/useOnlineNotifications";
import { cn } from "@/lib/utils";
import { $selectedChat } from "@/stores/contact";
import { AccountLinkingNotification } from "./AccountLinkingNotification";
import { Chat } from "./Chat";
import { ContactList } from "./ContactList";
import { StatusBar } from "./StatusBar";
import {
	ResizableHandle,
	ResizablePanel,
	ResizablePanelGroup,
} from "./ui/resizable";
import { VersionBadge } from "./VersionInfo";

export function MessengerApp() {
	const user = useQuery(api.auth.loggedInUser);
	const selectedChat = useStore($selectedChat);
	const initializeUserStatus = useMutation(api.userStatus.initializeUserStatus);
	const updateLastSeen = useMutation(api.userStatus.updateLastSeen);

	// Initialize message notifications for toast alerts
	useMessageNotifications();

	// Initialize online status notifications for sign-in alerts
	useOnlineNotifications();

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
		<div className="flex h-screen flex-col">
			{/* Account linking notification */}
			<AccountLinkingNotification />

			{/* Desktop: resizable panels */}
			<div className="hidden flex-1 overflow-hidden md:flex">
				<ResizablePanelGroup
					direction="horizontal"
					className="flex-1"
					autoSaveId="msn_panel_layout_v1"
				>
					{/* Left panel: status + contacts */}
					<ResizablePanel
						defaultSize={28}
						minSize={15}
						maxSize={60}
						className="min-w-[400px] max-w-[840px]"
					>
						<div className="flex h-full flex-col">
							<StatusBar user={user} />
							<ContactList />
							<div className="mt-2 flex justify-center">
								<VersionBadge />
							</div>
						</div>
					</ResizablePanel>
					<ResizableHandle withHandle className="mx-1" />
					{/* Right panel: chat */}
					{/* @ts-ignore */}
					<ResizablePanel minSize={15} className="min-w-[400px]">
						<Chat />
					</ResizablePanel>
				</ResizablePanelGroup>
			</div>

			{/* Mobile: original stacked layout */}
			<div className={cn("flex flex-1 overflow-hidden md:hidden")}>
				{/* Sidebar - full width when no chat is open */}
				<div
					className={cn("flex w-full flex-col", isChatOpen ? "hidden" : "flex")}
				>
					<StatusBar user={user} />
					<ContactList />
					<div className="mt-2 flex justify-center">
						<VersionBadge />
					</div>
				</div>

				{/* Main Chat Area - shown when a chat is selected */}
				<div className={cn("h-full flex-1", isChatOpen ? "flex" : "hidden")}>
					<Chat />
				</div>
			</div>
		</div>
	);
}
