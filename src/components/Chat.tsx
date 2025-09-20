import { api } from "@convex/_generated/api";
import { useStore } from "@nanostores/react";
import { useMutation, useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { motion } from "framer-motion";
import {
	ArrowLeft,
	Info,
	MessageCircle,
	Paperclip,
	Send,
	Smile,
	User,
	Users,
	X,
	Zap,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useGroupAvatarUrls, useUserAvatarUrls } from "@/hooks/useAvatarUrls";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { useNudge } from "@/hooks/useNudge";
import { useOptimisticMessages } from "@/hooks/useOptimisticMessages";
import { cn } from "@/lib/utils";
import { $selectedChat } from "@/stores/contact";
import { EmojiPicker } from "./EmojiPicker";
import { GroupInfoDialog } from "./GroupInfoDialog";
import { InlineStatusEditor } from "./InlineStatusEditor";
import { Message } from "./Message";
import { NudgeMessage } from "./NudgeMessage";
import { TypingIndicator } from "./TypingIndicator";
import {
	fadeInUp,
	hoverScale,
	nudgeShake,
	nudgeShakeMobile,
	tapScale,
} from "./ui/animated";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { ScrollArea } from "./ui/scroll-area";

export function Chat() {
	const selectedChat = useStore($selectedChat);

	const [showChat, setShowChat] = useState(false);
	const [messageInput, setMessageInput] = useState("");

	// Resolve avatar URLs for selected chat
	const selectedUserId = selectedChat?.contact?.contactUserId;
	const selectedGroupId = selectedChat?.group?._id;
	const userAvatarMap = useUserAvatarUrls(
		selectedUserId ? [selectedUserId] : undefined,
	);
	const groupAvatarMap = useGroupAvatarUrls(
		selectedGroupId ? [selectedGroupId] : undefined,
	);

	const messagesEndRef = useRef<HTMLDivElement>(null);
	const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

	// Nudge functionality
	const {
		sendNudge,
		isSending: isNudgeSending,
		cooldownRemaining,
		isShaking,
	} = useNudge();
	const isMobile = useMediaQuery("(max-width: 768px)");

	const contactIsTyping = useQuery(
		api.userStatus.getTypingIndicator,
		selectedChat?.contact
			? {
					otherUserId: selectedChat?.contact?.contactUserId,
				}
			: "skip",
	);
	const groupIsTyping = useQuery(
		api.userStatus.getGroupTypingIndicators,
		selectedChat?.group?._id ? { groupId: selectedChat?.group?._id } : "skip",
	);

	// Get current user for optimistic messages
	const currentUser = useQuery(api.auth.loggedInUser);

	// Use optimistic messages hook
	const { messages, addOptimisticMessage, markOptimisticMessageFailed } =
		useOptimisticMessages({
			otherUserId: selectedChat?.contact?.contactUserId,
			groupId: selectedChat?.group?._id,
			currentUserId: currentUser?._id,
		});

	// Get nudges for the current conversation with stable 'since' to avoid re-fetch loops
	const [nudgesSince] = useState(() => Date.now() - 12 * 60 * 60 * 1000); // last 12 hours

	// Types for combining messages and nudges without using 'any'
	type ChatMessage = Parameters<typeof Message>[0]["message"];
	type ConversationNudge = FunctionReturnType<
		typeof api.nudges.getConversationNudges
	>[number];

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
	) as ConversationNudge[] | undefined;

	const sendMessage = useMutation(api.unifiedMessages.sendMessage);
	const markMessagesAsRead = useMutation(
		api.unifiedMessages.markMessagesAsRead,
	);
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

	// biome-ignore lint/correctness/useExhaustiveDependencies: we want to go to the bottom when a new message arrives
	useEffect(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
	}, [messages]);

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
					<div className="chat-header mx-4 mt-4 rounded-2xl border border-border bg-background/80 p-3 shadow-lg backdrop-blur-md md:p-4">
						<div className="flex items-center justify-between">
							<div className="flex items-center space-x-3">
								{/* Back button for mobile */}
								<Button
									variant="ghost"
									size="sm"
									className="h-8 w-8 md:hidden"
									onClick={handleCloseChat}
								>
									<ArrowLeft className="h-4 w-4" />
								</Button>
								<div className="relative">
									<Avatar className="h-8 w-8 md:h-10 md:w-10">
										{selectedChat.contact ? (
											selectedUserId && userAvatarMap.get(selectedUserId) ? (
												<AvatarImage src={userAvatarMap.get(selectedUserId)} />
											) : (
												<AvatarFallback delayMs={0}>
													<User className="h-8 w-8 md:h-10 md:w-10" />
												</AvatarFallback>
											)
										) : selectedGroupId &&
											groupAvatarMap.get(selectedGroupId) ? (
											<AvatarImage src={groupAvatarMap.get(selectedGroupId)} />
										) : (
											<Users className="h-8 w-8 md:h-10 md:w-10" />
										)}
									</Avatar>
								</div>
								<div className="min-w-0 flex-1">
									{selectedChat.group ? (
										<InlineStatusEditor
											initialStatus={selectedChat.group.name}
											onSave={() => {
												// TODO: Implement group name update
											}}
											placeholder="Group name"
											className="truncate rounded px-1 font-semibold text-gray-900 text-sm hover:bg-gray-100 md:text-base dark:text-gray-100 dark:hover:bg-gray-700"
											textColor="text-gray-900 dark:text-gray-100"
											maxLength={50}
										/>
									) : (
										<h3 className="truncate font-semibold text-gray-900 text-sm md:text-base dark:text-gray-100">
											{selectedChat.contact?.nickname ??
												selectedChat.contact?.user?.name ??
												selectedChat.contact?.user?.email ??
												"Unknown User"}
										</h3>
									)}
									<p className="truncate px-1 text-gray-500 text-xs md:text-sm dark:text-gray-400">
										{selectedChat.contact
											? selectedChat.contact.statusMessage
											: `${selectedChat.group?.memberCount} members`}
									</p>
								</div>
							</div>
							<div className="flex items-center space-x-1 md:space-x-2">
								{selectedChat.group && (
									<GroupInfoDialog group={selectedChat.group}>
										<Button
											variant="ghost"
											size="sm"
											className="h-8 w-8 md:h-10 md:w-10"
										>
											<Info className="h-3 w-3 md:h-4 md:w-4" />
										</Button>
									</GroupInfoDialog>
								)}
								<Button
									variant="ghost"
									size="sm"
									className="h-8 w-8 md:h-10 md:w-10 [&>svg]:h-4! [&>svg]:w-4! md:[&>svg]:h-6! md:[&>svg]:w-6!"
									title="Close chat"
									onClick={handleCloseChat}
								>
									<X className="h-4 w-4 md:h-6 md:w-6" />
								</Button>
							</div>
						</div>
					</div>

					{/* Messages - Scrollable middle section */}
					<div className="chat-messages-container">
						<ScrollArea className="h-full p-3 md:p-4">
							<div className="space-y-1">
								{(!messages || messages.length === 0) && (
									<div className="py-8 text-center text-gray-500">
										<MessageCircle className="mx-auto mb-2 h-8 w-8 text-gray-400 opacity-50 md:h-12 md:w-12 dark:text-gray-500" />
										<p className="text-sm md:text-base">
											Start a conversation with{" "}
											{selectedChat.contact?.nickname ??
												selectedChat.contact?.user?.name ??
												selectedChat.contact?.user?.email ??
												selectedChat.group?.name}
										</p>
									</div>
								)}

								{(() => {
									// Build a combined, chronologically sorted list of messages and nudges
									type CombinedItem =
										| { type: "nudge"; time: number; data: ConversationNudge }
										| { type: "message"; time: number; data: ChatMessage };

									const nudgeItems: CombinedItem[] = (
										conversationNudges ?? []
									).map((n) => ({ type: "nudge", time: n.createdAt, data: n }));
									const messageItems: CombinedItem[] = (messages ?? []).map(
										(m) => ({
											type: "message",
											time: m._creationTime,
											data: m as ChatMessage,
										}),
									);

									const combined: CombinedItem[] = [
										...messageItems,
										...nudgeItems,
									].sort((a, b) => a.time - b.time);

									return combined.map((item, idx) => {
										if (item.type === "nudge") {
											const n = item.data;
											return (
												<div key={`nudge-${n._id}`} className="mt-6 md:mt-8">
													<NudgeMessage
														senderName={n.fromUser?.name ?? "Unknown User"}
														nudgeType={n.nudgeType}
														timestamp={n.createdAt}
														isOwn={Boolean(n.isFromMe)}
													/>
												</div>
											);
										}

										// Compute consecutive only against previous message in the combined list
										let prevMsg: ChatMessage | null = null;
										for (let j = idx - 1; j >= 0; j--) {
											if (combined[j].type === "message") {
												prevMsg = combined[j].data as ChatMessage;
												break;
											}
										}
										const m = item.data as ChatMessage;
										const isConsecutive = Boolean(
											prevMsg &&
												prevMsg.senderId === m.senderId &&
												m._creationTime - prevMsg._creationTime < 5 * 60 * 1000,
										);

										return (
											<div
												key={
													"clientKey" in m &&
													typeof (m as Record<string, unknown>).clientKey ===
														"string"
														? ((m as Record<string, unknown>)
																.clientKey as string)
														: (m._id as string)
												}
												className={cn(isConsecutive ? "mt-1" : "mt-6 md:mt-8")}
											>
												<Message message={m} isConsecutive={isConsecutive} />
											</div>
										);
									});
								})()}

								{contactIsTyping && (
									<div className="flex justify-start">
										<TypingIndicator
											className="ml-2 max-w-[85%] md:max-w-xs lg:max-w-md"
											userName={
												selectedChat.contact?.nickname ??
												selectedChat.contact?.user?.name ??
												selectedChat.contact?.user?.email ??
												"Unknown User"
											}
										/>
									</div>
								)}
								{!!groupIsTyping?.length && (
									<div className="flex justify-start">
										<div className="flex flex-col space-y-2">
											{groupIsTyping.map((indicator) => (
												<TypingIndicator
													key={indicator._id}
													className="ml-8 max-w-[85%] md:ml-10 md:max-w-xs lg:max-w-md"
													userName={
														indicator.user?.name ??
														indicator.user?.email ??
														"Unknown User"
													}
												/>
											))}
										</div>
									</div>
								)}
								<div ref={messagesEndRef} />
							</div>
						</ScrollArea>
					</div>

					{/* Message Input - Fixed at bottom */}
					<div className="chat-input">
						<motion.div
							className="glass mx-4 mb-4 rounded-2xl p-3 md:p-4"
							variants={fadeInUp}
							initial="initial"
							animate="animate"
						>
							<form
								onSubmit={handleSendMessage}
								className="flex items-center space-x-2"
							>
								<motion.div whileHover={hoverScale} whileTap={tapScale}>
									<Button
										type="button"
										variant="ghost"
										size="sm"
										className="h-8 w-8 flex-shrink-0 md:h-10 md:w-10"
									>
										<Paperclip className="h-3 w-3 md:h-4 md:w-4" />
									</Button>
								</motion.div>
								<EmojiPicker onEmojiSelect={handleEmojiSelect}>
									<motion.div whileHover={hoverScale} whileTap={tapScale}>
										<Button
											type="button"
											variant="ghost"
											size="sm"
											className="h-8 w-8 flex-shrink-0 md:h-10 md:w-10"
										>
											<Smile className="h-3 w-3 md:h-4 md:w-4" />
										</Button>
									</motion.div>
								</EmojiPicker>
								{/* Nudge Button - Only show for direct chats */}
								{selectedChat?.contact && (
									<motion.div whileHover={hoverScale} whileTap={tapScale}>
										<Button
											type="button"
											variant="ghost"
											size="sm"
											className="h-8 w-8 flex-shrink-0 md:h-10 md:w-10"
											onClick={handleSendNudge}
											disabled={isNudgeSending || cooldownRemaining > 0}
											title={
												cooldownRemaining > 0
													? `Wait ${cooldownRemaining}s before sending another nudge`
													: "Send a nudge"
											}
										>
											<Zap
												className={`h-3 w-3 md:h-4 md:w-4 ${
													cooldownRemaining > 0 ? "opacity-50" : ""
												}`}
											/>
										</Button>
									</motion.div>
								)}
								<Input
									value={messageInput}
									onChange={handleInputChange}
									placeholder={`Message ${
										selectedChat.contact?.nickname ??
										selectedChat.contact?.user?.name ??
										selectedChat.contact?.user?.email ??
										selectedChat.group?.name ??
										"Unknown User"
									}...`}
									className="h-9 flex-1 rounded-full border-input bg-background text-foreground text-sm focus:border-ring md:h-10 md:text-base"
								/>
								<motion.div whileHover={hoverScale} whileTap={tapScale}>
									<Button
										type="submit"
										size="sm"
										className="msn-gradient h-8 w-8 flex-shrink-0 rounded-full text-white hover:opacity-90 md:h-10 md:w-10"
									>
										<Send className="h-3 w-3 md:h-4 md:w-4" />
									</Button>
								</motion.div>
							</form>
						</motion.div>
					</div>
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
