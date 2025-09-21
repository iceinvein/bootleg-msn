import { api } from "@convex/_generated/api";
import { useStore } from "@nanostores/react";
import { useMutation, useQuery } from "convex/react";
import { motion } from "framer-motion";
import { MessageCircle } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useGroupAvatarUrls, useUserAvatarUrls } from "@/hooks/useAvatarUrls";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { useNudge } from "@/hooks/useNudge";
import { useOptimisticMessages } from "@/hooks/useOptimisticMessages";
import { setGroupAvatars, setUserAvatars } from "@/stores/avatars";
import {
	$contactIsTyping,
	$groupIsTyping,
	$isMessagesLoading,
	$selectedChat,
} from "@/stores/contact";
import { ChatComposer } from "./chat/ChatComposer";
import { ChatHeader } from "./chat/ChatHeader";
import { ChatMessages } from "./chat/ChatMessages";
import { nudgeShake, nudgeShakeMobile } from "./ui/animated";

export function Chat() {
	const selectedChat = useStore($selectedChat);

	const [showChat, setShowChat] = useState(false);
	const [messageInput, setMessageInput] = useState("");

	// Resolve avatar URLs for selected chat and update stores
	const selectedUserId = selectedChat?.contact?.contactUserId;
	const selectedGroupId = selectedChat?.group?._id;
	const userAvatarMap = useUserAvatarUrls(
		selectedUserId ? [selectedUserId] : undefined,
	);
	const groupAvatarMap = useGroupAvatarUrls(
		selectedGroupId ? [selectedGroupId] : undefined,
	);

	// Update avatar stores when data changes
	useEffect(() => {
		setUserAvatars(userAvatarMap);
	}, [userAvatarMap]);

	useEffect(() => {
		setGroupAvatars(groupAvatarMap);
	}, [groupAvatarMap]);

	const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

	// Nudge functionality
	const {
		sendNudge,
		isSending: isNudgeSending,
		cooldownRemaining,
		isShaking,
	} = useNudge();
	const isMobile = useMediaQuery("(max-width: 768px)");

	// Update typing indicator stores
	const contactIsTypingData = useQuery(
		api.userStatus.getTypingIndicator,
		selectedChat?.contact
			? {
					otherUserId: selectedChat?.contact?.contactUserId,
				}
			: "skip",
	);
	const groupIsTypingData = useQuery(
		api.userStatus.getGroupTypingIndicators,
		selectedChat?.group?._id ? { groupId: selectedChat?.group?._id } : "skip",
	);

	// Update stores when data changes
	useEffect(() => {
		$contactIsTyping.set(contactIsTypingData || null);
	}, [contactIsTypingData]);

	useEffect(() => {
		$groupIsTyping.set(groupIsTypingData || null);
	}, [groupIsTypingData]);

	// Get current user for optimistic messages
	const currentUser = useQuery(api.auth.loggedInUser);

	// Use optimistic messages hook
	const {
		messages,
		isLoading: isMessagesLoading,
		addOptimisticMessage,
		markOptimisticMessageFailed,
	} = useOptimisticMessages({
		otherUserId: selectedChat?.contact?.contactUserId,
		groupId: selectedChat?.group?._id,
		currentUserId: currentUser?._id,
	});

	// Update loading state store
	useEffect(() => {
		$isMessagesLoading.set(isMessagesLoading);
	}, [isMessagesLoading]);

	// Get nudges for the current conversation with stable 'since' to avoid re-fetch loops
	const [nudgesSince] = useState(() => Date.now() - 12 * 60 * 60 * 1000); // last 12 hours

	const conversationNudges = useQuery(
		api.nudges.getConversationNudges,
		selectedChat?.contact?.contactUserId
			? {
					otherUserId: selectedChat.contact.contactUserId,
					limit: 50,
					since: nudgesSince,
				}
			: selectedChat?.group?._id
				? {
						groupId: selectedChat.group._id,
						limit: 50,
						since: nudgesSince,
					}
				: "skip",
	);

	const sendMessage = useMutation(api.messages.sendMessage);
	const markMessagesAsRead = useMutation(api.messages.markMessagesAsRead);
	const setTyping = useMutation(api.userStatus.setTyping);

	const handleTyping = useCallback(
		async (isTyping: boolean) => {
			// Only send typing indicator if we have a valid chat
			if (!selectedChat?.contact?.contactUserId && !selectedChat?.group?._id) {
				return;
			}

			try {
				await setTyping({
					chatWithUserId: selectedChat?.contact?.contactUserId,
					groupId: selectedChat?.group?._id,
					isTyping,
				});
			} catch (error) {
				console.error("Failed to set typing status:", error);
			}
		},
		[selectedChat, setTyping],
	);

	const handleCloseChat = () => {
		$selectedChat.set({ contact: null, group: null });
		setShowChat(false);
	};

	useEffect(() => {
		setShowChat(!!selectedChat?.contact || !!selectedChat?.group);
	}, [selectedChat]);

	// Mark messages as read when opening chat
	useEffect(() => {
		markMessagesAsRead({
			groupId: selectedChat?.group?._id,
			otherUserId: selectedChat?.contact?.contactUserId,
		});
	}, [
		selectedChat?.group?._id,
		selectedChat?.contact?.contactUserId,
		markMessagesAsRead,
	]);

	// Cleanup typing timeout on unmount or chat change
	useEffect(() => {
		return () => {
			if (typingTimeoutRef.current) {
				clearTimeout(typingTimeoutRef.current);
				handleTyping(false);
			}
		};
	}, [handleTyping]);

	const handleSendMessage = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!messageInput.trim()) return;

		const messageContent = messageInput.trim();

		// Clear input immediately for better UX
		setMessageInput("");

		// Add optimistic message immediately
		const optimisticId = addOptimisticMessage(messageContent, "text");
		if (!optimisticId) {
			console.error("Failed to create optimistic message");
			setMessageInput(messageContent); // Restore input on error
			return;
		}

		try {
			// Stop typing indicator before sending
			await handleTyping(false);
			if (typingTimeoutRef.current) {
				clearTimeout(typingTimeoutRef.current);
				typingTimeoutRef.current = null;
			}

			// Send message to server
			await sendMessage({
				content: messageContent,
				messageType: "text",
				receiverId: selectedChat?.contact?.contactUserId,
				groupId: selectedChat?.group?._id,
			});

			// No need to mark as sent - optimistic message already looks final
			// It will be automatically replaced when server confirms
		} catch (error) {
			console.error("Failed to send message:", error);

			// Mark optimistic message as failed
			const errorMessage =
				error instanceof Error ? error.message : "Failed to send message";
			markOptimisticMessageFailed(optimisticId, errorMessage);
		}
	};

	const handleEmojiSelect = (emoji: string) => {
		setMessageInput((prev) => prev + emoji);
	};

	const handleSendNudge = async () => {
		if (
			!selectedChat?.contact?.contactUserId ||
			isNudgeSending ||
			cooldownRemaining > 0
		) {
			return;
		}

		try {
			await sendNudge(selectedChat.contact.contactUserId, "nudge");
		} catch (error) {
			console.error("Failed to send nudge:", error);
		}
	};

	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const value = e.target.value;
		setMessageInput(value);

		// Handle typing indicators
		if (value.trim() && !typingTimeoutRef.current) {
			// Start typing
			handleTyping(true);
		}

		// Clear existing timeout
		if (typingTimeoutRef.current) {
			clearTimeout(typingTimeoutRef.current);
		}

		// Set timeout to stop typing after 3 seconds of inactivity
		typingTimeoutRef.current = setTimeout(() => {
			handleTyping(false);
			typingTimeoutRef.current = null;
		}, 3000);

		// If input is empty, immediately stop typing
		if (!value.trim()) {
			handleTyping(false);
			if (typingTimeoutRef.current) {
				clearTimeout(typingTimeoutRef.current);
				typingTimeoutRef.current = null;
			}
		}
	};

	return (
		<motion.div
			className={`chat-container ${showChat ? "flex" : "hidden md:flex"}`}
			variants={
				isShaking ? (isMobile ? nudgeShakeMobile : nudgeShake) : undefined
			}
			animate={isShaking ? "animate" : "initial"}
		>
			{selectedChat?.contact || selectedChat?.group ? (
				<>
					{/* Chat Header - Fixed at top */}
					<ChatHeader onClose={handleCloseChat} />

					{/* Messages - Scrollable middle section */}
					<ChatMessages
						messages={messages}
						conversationNudges={conversationNudges}
					/>

					{/* Message Input - Fixed at bottom */}
					<ChatComposer
						value={messageInput}
						onChange={handleInputChange}
						onSubmit={handleSendMessage}
						onEmojiSelect={handleEmojiSelect}
						onSendNudge={handleSendNudge}
						isNudgeSending={isNudgeSending}
						cooldownRemaining={cooldownRemaining}
					/>
				</>
			) : (
				<div className="flex flex-1 items-center justify-center bg-muted/30 p-4">
					<div className="text-center">
						<MessageCircle className="mx-auto mb-4 h-12 w-12 text-muted-foreground md:h-16 md:w-16" />
						<h3 className="mb-2 font-semibold text-base text-muted-foreground md:text-lg">
							Select a contact or group to start chatting
						</h3>
						<p className="text-gray-500 text-sm md:text-base dark:text-gray-400">
							Choose someone from your list to begin a conversation
						</p>
					</div>
				</div>
			)}
		</motion.div>
	);
}
