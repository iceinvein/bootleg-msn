import { api } from "@convex/_generated/api";
import { useStore } from "@nanostores/react";
import { useQuery } from "convex/react";
import { useCallback, useEffect, useRef } from "react";
import { toast } from "sonner";
import { chatWindowHelpers } from "@/stores/chatWindows";
import { $selectedChat } from "@/stores/contact";
import { useNotifications } from "./useNotifications";

// Type for messages returned from getAllUserMessages query - end-to-end type safe
type AllUserMessagesReturn = ReturnType<
	typeof useQuery<typeof api.unifiedMessages.getAllUserMessages>
>;
type MessageFromQuery = NonNullable<AllUserMessagesReturn>[number];

export function useMessageNotifications() {
	const selectedChat = useStore($selectedChat);
	const user = useQuery(api.auth.loggedInUser);

	// Initialize desktop notifications for Tauri
	const { notifyNewMessage, isSupported: isDesktopNotificationSupported } =
		useNotifications();

	// Track the last seen message IDs to detect new messages
	const lastSeenMessageIds = useRef<Set<string>>(new Set());
	const isInitialized = useRef(false);

	// Get all messages for the current user (both direct and group messages)
	const allMessages = useQuery(api.unifiedMessages.getAllUserMessages);

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
		},
		[
			getSenderDisplayName,
			getChatDisplayName,
			openChat,
			isDesktopNotificationSupported,
			notifyNewMessage,
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

		// Show notifications for new messages from inactive chats
		for (const message of newMessages) {
			if (!isChatActive(message)) {
				showToastNotification(message).catch((error) => {
					console.error("Failed to show notification:", error);
				});
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
