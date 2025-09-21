import { api } from "@convex/_generated/api";
import { useStore } from "@nanostores/react";
import { useQuery } from "convex/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { chatWindowHelpers } from "@/stores/chatWindows";
import { $selectedChat } from "@/stores/contact";
import { useBrowserNotifications } from "./useBrowserNotifications";
import { useNotifications } from "./useNotifications";

// Type-safe Web Audio access without using `any`
type WebAudioWindow = Window & {
	webkitAudioContext?: {
		new (): AudioContext;
	};
};

const createAudioContext = (): AudioContext | null => {
	const w = window as WebAudioWindow;
	const Ctor = (window.AudioContext || w.webkitAudioContext) as
		| (new () => AudioContext)
		| undefined;
	return Ctor ? new Ctor() : null;
};

// Type for messages returned from getAllUserMessages query - end-to-end type safe
type AllUserMessagesReturn = ReturnType<
	typeof useQuery<typeof api.messages.getAllUserMessages>
>;
type MessageFromQuery = NonNullable<AllUserMessagesReturn>[number];

export function useMessageNotifications() {
	const selectedChat = useStore($selectedChat);
	const user = useQuery(api.auth.loggedInUser);

	// Initialize desktop notifications for Tauri
	const {
		notifyNewMessage,
		isSupported: isDesktopNotificationSupported,
		settings: tauriSettings,
	} = useNotifications();

	// Initialize browser notifications for web
	const {
		notifyNewMessage: notifyBrowserMessage,
		isBrowserEnvironment,
		canNotify: canNotifyBrowser,
		settings: browserSettings,
	} = useBrowserNotifications();

	// Track the last seen message IDs to detect new messages
	const lastSeenMessageIds = useRef<Set<string>>(new Set());
	const isInitialized = useRef(false);

	// Get all messages for the current user (both direct and group messages)
	const allMessages = useQuery(api.messages.getAllUserMessages);

	// Track window focus/visibility to decide when to notify even if chat is open
	const [isWindowFocused, setIsWindowFocused] = useState<boolean>(
		typeof document !== "undefined" ? document.hasFocus() : true,
	);
	useEffect(() => {
		const handleFocus = () => setIsWindowFocused(true);
		const handleBlur = () => setIsWindowFocused(false);
		const handleVisibility = () =>
			setIsWindowFocused(
				typeof document !== "undefined"
					? document.visibilityState === "visible" && document.hasFocus()
					: true,
			);

		window.addEventListener("focus", handleFocus);
		window.addEventListener("blur", handleBlur);
		document.addEventListener("visibilitychange", handleVisibility);
		return () => {
			window.removeEventListener("focus", handleFocus);
			window.removeEventListener("blur", handleBlur);
			document.removeEventListener("visibilitychange", handleVisibility);
		};
	}, []);

	// New message sound using public/sounds/message.mp3 with a WebAudio fallback
	const lastSoundAtRef = useRef<number>(0);
	const audioRef = useRef<HTMLAudioElement | null>(null);
	const audioUnlockedRef = useRef<boolean>(false);
	useEffect(() => {
		try {
			audioRef.current = new Audio("/sounds/message.mp3");
			audioRef.current.preload = "auto";
			audioRef.current.volume = 0.6;
			const unlock = async () => {
				if (!audioRef.current) return;
				try {
					const a = audioRef.current;
					const prevVol = a.volume;
					a.volume = 0.001;
					a.currentTime = 0;
					await a.play();
					a.pause();
					a.currentTime = 0;
					a.volume = prevVol;
					audioUnlockedRef.current = true;
					removeListeners();
				} catch {
					// If this fails, we'll fallback later
				}
			};
			const onDown = () => void unlock();
			const onKey = () => void unlock();
			const removeListeners = () => {
				window.removeEventListener("mousedown", onDown);
				window.removeEventListener("touchstart", onDown);
				window.removeEventListener("keydown", onKey);
			};
			window.addEventListener("mousedown", onDown, { once: true });
			window.addEventListener("touchstart", onDown, { once: true });
			window.addEventListener("keydown", onKey, { once: true });
			return removeListeners;
		} catch {}
	}, []);

	const playNewMessageSound = useCallback(() => {
		const now = Date.now();
		if (now - lastSoundAtRef.current < 750) return; // throttle
		lastSoundAtRef.current = now;

		const playBeepFallback = () => {
			try {
				const ctx = createAudioContext();
				if (!ctx) return;
				const osc = ctx.createOscillator();
				const gain = ctx.createGain();
				osc.type = "sine";
				osc.frequency.value = 880;
				gain.gain.setValueAtTime(0.0001, ctx.currentTime);
				gain.gain.exponentialRampToValueAtTime(0.05, ctx.currentTime + 0.005);
				gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.2);
				osc.connect(gain);
				gain.connect(ctx.destination);
				osc.start();
				osc.stop(ctx.currentTime + 0.22);
				setTimeout(() => ctx.close().catch(() => {}), 400);
			} catch {}
		};

		try {
			if (audioRef.current) {
				// Restart from start for crisp ding when multiple messages arrive
				audioRef.current.currentTime = 0;
				const p = audioRef.current.play();
				if (p && typeof p.then === "function") {
					p.catch(() => {
						// Autoplay restrictions or other error — try unlock quickly then retry once
						if (audioUnlockedRef.current) {
							playBeepFallback();
						} else {
							// force a silent prime attempt
							const a = audioRef.current;

							if (!a) return;

							const prevVol = a.volume;
							a.volume = 0.001;
							a.play()
								.then(() => {
									a.pause();
									a.currentTime = 0;
									a.volume = prevVol;
									audioUnlockedRef.current = true;
									// retry real play
									a.currentTime = 0;
									a.play().catch(() => playBeepFallback());
								})
								.catch(() => playBeepFallback());
						}
					});
				}
			} else {
				playBeepFallback();
			}
		} catch {
			playBeepFallback();
		}
	}, []);

	// Get contacts and groups for name resolution
	const contacts = useQuery(api.contacts.getContacts);
	const groups = useQuery(api.groups.getUserGroups);

	// Helper function to get sender display name
	const getSenderDisplayName = useCallback(
		(message: MessageFromQuery) => {
			if (message.isFromMe) return "You";

			if (message.groupId) {
				// For group messages, use sender name
				return message.sender?.name || message.sender?.email || "Unknown User";
			} else {
				// For direct messages, find the contact
				const contact = contacts?.find(
					(c) => c.contactUserId === message.senderId,
				);
				return (
					contact?.nickname ||
					contact?.user?.name ||
					contact?.user?.email ||
					"Unknown User"
				);
			}
		},
		[contacts],
	);

	// Helper function to get chat display name
	const getChatDisplayName = useCallback(
		(message: MessageFromQuery) => {
			if (message.groupId) {
				const group = groups?.find((g) => g?._id === message.groupId);
				return group?.name || "Unknown Group";
			} else {
				const contact = contacts?.find(
					(c) => c.contactUserId === message.senderId,
				);
				return (
					contact?.nickname ||
					contact?.user?.name ||
					contact?.user?.email ||
					"Unknown User"
				);
			}
		},
		[contacts, groups],
	);

	// Helper function to check if a chat is currently active
	const isChatActive = useCallback((message: MessageFromQuery) => {
		if (message.groupId) {
			return chatWindowHelpers.isChatActiveAnywhere("group", message.groupId);
		} else {
			return chatWindowHelpers.isChatActiveAnywhere(
				"contact",
				message.senderId,
			);
		}
	}, []);

	// Helper function to open a chat when notification is clicked
	const openChat = useCallback(
		(message: MessageFromQuery) => {
			if (message.groupId) {
				const group = groups?.find((g) => g?._id === message.groupId);
				if (group) {
					$selectedChat.set({ contact: null, group });
				}
			} else {
				const contact = contacts?.find(
					(c) => c.contactUserId === message.senderId,
				);
				if (contact) {
					$selectedChat.set({ contact, group: null });
				}
			}
		},
		[contacts, groups],
	);

	// Helper function to show toast notification
	const showToastNotification = useCallback(
		async (message: MessageFromQuery) => {
			const senderName = getSenderDisplayName(message);
			const chatName = getChatDisplayName(message);

			// Truncate long messages for the toast
			const truncatedContent =
				message.content.length > 50
					? `${message.content.substring(0, 50)}...`
					: message.content;

			// Different toast content for group vs direct messages
			const toastTitle = message.groupId
				? `${senderName} in ${chatName}`
				: `${senderName}`;

			const toastContent =
				message.messageType === "file" ? "📎 Sent a file" : truncatedContent;

			// Show toast notification (always shown for web compatibility)
			toast(toastTitle, {
				description: toastContent,
				action: {
					label: "Open",
					onClick: () => openChat(message),
				},
				duration: 5000,
			});

			// Also show desktop notification when running in Tauri
			if (isDesktopNotificationSupported) {
				try {
					// Generate a unique chat ID for the notification
					const chatId = message.groupId
						? `group:${message.groupId}`
						: `contact:${message.senderId}`;

					await notifyNewMessage(
						message._id,
						senderName,
						toastContent,
						chatId,
						message.senderId,
					);
				} catch (error) {
					console.error("Failed to show desktop notification:", error);
					// Don't throw here to avoid disrupting the toast notification
				}
			}

			// Also show browser notification when running in web browser
			if (isBrowserEnvironment && canNotifyBrowser) {
				try {
					// Generate a unique chat ID for the notification
					const chatId = message.groupId
						? `group:${message.groupId}`
						: `contact:${message.senderId}`;

					await notifyBrowserMessage(
						message._id,
						senderName,
						toastContent,
						chatId,
						message.senderId,
					);
				} catch (error) {
					console.error("Failed to show browser notification:", error);
					// Don't throw here to avoid disrupting the toast notification
				}
			}
		},
		[
			getSenderDisplayName,
			getChatDisplayName,
			openChat,
			isDesktopNotificationSupported,
			notifyNewMessage,
			isBrowserEnvironment,
			canNotifyBrowser,
			notifyBrowserMessage,
		],
	);

	// Process messages and show notifications for new ones
	useEffect(() => {
		if (!allMessages || !user || !contacts || !groups) return;

		// Filter out messages from the current user and system messages
		const relevantMessages = allMessages.filter(
			(msg) => !msg.isFromMe && msg.messageType !== "system",
		);

		// On first load, just record existing message IDs without showing notifications
		if (!isInitialized.current) {
			const messageIds = new Set(relevantMessages.map((msg) => msg._id));
			lastSeenMessageIds.current = messageIds;
			isInitialized.current = true;
			return;
		}

		// Find new messages that we haven't seen before
		const newMessages = relevantMessages.filter(
			(msg) => !lastSeenMessageIds.current.has(msg._id),
		);

		// Show notifications for new messages when window not focused OR chat is inactive
		for (const message of newMessages) {
			const windowNotFocused = !isWindowFocused;
			const chatInactive = !isChatActive(message);
			if (windowNotFocused || chatInactive) {
				showToastNotification(message).catch((error) => {
					console.error("Failed to show notification:", error);
				});
				// Play sound hint when user likely won't see the message immediately, respecting settings
				const allowSound = isBrowserEnvironment
					? !!browserSettings?.sound
					: (tauriSettings?.soundEnabled ?? true);
				if (allowSound) {
					playNewMessageSound();
				}
			}
		}

		// Update the set of seen message IDs
		const currentMessageIds = new Set(relevantMessages.map((msg) => msg._id));
		lastSeenMessageIds.current = currentMessageIds;
	}, [
		allMessages,
		user,
		contacts,
		groups,
		isChatActive,
		showToastNotification,
		browserSettings?.sound,
		tauriSettings?.soundEnabled,
		playNewMessageSound,
		isWindowFocused,
		isBrowserEnvironment,
	]);

	// Update main window active chat when selectedChat changes
	useEffect(() => {
		if (selectedChat?.contact) {
			chatWindowHelpers.setMainWindowActiveChat({
				type: "contact",
				id: selectedChat.contact.contactUserId,
				name:
					selectedChat.contact.nickname ||
					selectedChat.contact.user?.name ||
					"Unknown",
			});
		} else if (selectedChat?.group) {
			chatWindowHelpers.setMainWindowActiveChat({
				type: "group",
				id: selectedChat.group._id,
				name: selectedChat.group.name,
			});
		} else {
			chatWindowHelpers.setMainWindowActiveChat(null);
		}
	}, [selectedChat]);

	return {
		// Expose helper functions for manual chat window management
		addChatWindow: chatWindowHelpers.addChatWindow,
		removeChatWindow: chatWindowHelpers.removeChatWindow,
		isChatActive,
	};
}
