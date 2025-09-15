import { api } from "@convex/_generated/api";
import { useStore } from "@nanostores/react";
import { useMutation, useQuery } from "convex/react";
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
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { $selectedChat } from "@/stores/contact";
import { EmojiPicker } from "./EmojiPicker";
import { GroupInfoDialog } from "./GroupInfoDialog";
import { InlineStatusEditor } from "./InlineStatusEditor";
import { Message } from "./Message";
import { fadeInUp, hoverScale, tapScale } from "./ui/animated";
import { Avatar } from "./ui/avatar";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { ScrollArea } from "./ui/scroll-area";

export function Chat() {
	const selectedChat = useStore($selectedChat);

	const [showChat, setShowChat] = useState(false);
	const [messageInput, setMessageInput] = useState("");

	const messagesEndRef = useRef<HTMLDivElement>(null);
	const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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

	const messages = useQuery(
		api.unifiedMessages.getMessages,
		selectedChat?.contact?.contactUserId
			? { otherUserId: selectedChat.contact.contactUserId }
			: selectedChat?.group?._id
				? { groupId: selectedChat.group._id }
				: "skip",
	);

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

		try {
			// Stop typing indicator before sending
			await handleTyping(false);
			if (typingTimeoutRef.current) {
				clearTimeout(typingTimeoutRef.current);
				typingTimeoutRef.current = null;
			}

			await sendMessage({
				content: messageInput.trim(),
				messageType: "text",
				receiverId: selectedChat?.contact?.contactUserId,
				groupId: selectedChat?.group?._id,
			});
			setMessageInput("");
		} catch (error) {
			console.error("Failed to send message:", error);
		}
	};

	const handleEmojiSelect = (emoji: string) => {
		setMessageInput((prev) => prev + emoji);
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
		<div className={`chat-container ${showChat ? "flex" : "hidden md:flex"}`}>
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
											<User className="h-8 w-8 md:h-10 md:w-10" />
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

								{messages?.map((message, index) => {
									const prevMessage = index > 0 ? messages[index - 1] : null;
									const nextMessage =
										index < messages.length - 1 ? messages[index + 1] : null;

									// Check if this message is consecutive with the previous one
									const isConsecutive = Boolean(
										prevMessage &&
											prevMessage.senderId === message.senderId &&
											message._creationTime - prevMessage._creationTime <
												5 * 60 * 1000, // 5 minutes
									);

									// Check if this is the last message in a group
									const isLastInGroup = Boolean(
										!nextMessage ||
											nextMessage.senderId !== message.senderId ||
											nextMessage._creationTime - message._creationTime >=
												5 * 60 * 1000, // 5 minutes
									);

									return (
										<div
											key={message._id}
											className={cn(
												// Tight spacing for consecutive messages, normal spacing for new groups
												isConsecutive ? "mt-1" : "mt-6 md:mt-8",
											)}
										>
											<Message
												message={message}
												isConsecutive={isConsecutive}
												isLastInGroup={isLastInGroup}
											/>
										</div>
									);
								})}

								{contactIsTyping && (
									<div className="flex justify-start">
										<div className="flex max-w-[85%] items-end space-x-2 md:max-w-xs lg:max-w-md">
											<Avatar className="h-6 w-6 md:h-8 md:w-8">
												<User className="h-6 w-6 md:h-8 md:w-8" />
											</Avatar>
											<div>
												<div className="rounded-2xl bg-gray-100 px-3 py-2 md:px-4 md:py-2 dark:bg-gray-700">
													<div className="flex space-x-1">
														<div className="h-2 w-2 animate-bounce rounded-full bg-gray-400 dark:bg-gray-500" />
														<div
															className="h-2 w-2 animate-bounce rounded-full bg-gray-400 dark:bg-gray-500"
															style={{ animationDelay: "0.1s" }}
														/>
														<div
															className="h-2 w-2 animate-bounce rounded-full bg-gray-400 dark:bg-gray-500"
															style={{ animationDelay: "0.2s" }}
														/>
													</div>
												</div>
												<span className="text-gray-500 text-xs md:text-sm">
													{selectedChat.contact?.nickname ??
														selectedChat.contact?.user?.name ??
														selectedChat.contact?.user?.email ??
														"Unknown User"}{" "}
													is typing...
												</span>
											</div>
										</div>
									</div>
								)}
								{!!groupIsTyping?.length && (
									<div className="flex justify-start">
										<div className="flex max-w-[85%] items-end space-x-2 md:max-w-xs lg:max-w-md">
											<Avatar className="h-6 w-6 md:h-8 md:w-8">
												<User className="h-6 w-6 md:h-8 md:w-8" />
											</Avatar>
											<div>
												<div className="rounded-2xl bg-gray-100 px-3 py-2 md:px-4 md:py-2 dark:bg-gray-700">
													<div className="flex space-x-1">
														<div className="h-2 w-2 animate-bounce rounded-full bg-gray-400 dark:bg-gray-500" />
														<div
															className="h-2 w-2 animate-bounce rounded-full bg-gray-400 dark:bg-gray-500"
															style={{ animationDelay: "0.1s" }}
														/>
														<div
															className="h-2 w-2 animate-bounce rounded-full bg-gray-400 dark:bg-gray-500"
															style={{ animationDelay: "0.2s" }}
														/>
													</div>
													<span className="text-gray-500 text-xs md:text-sm">
														{groupIsTyping.map((indicator) => (
															<span key={indicator._id}>
																{indicator.user?.name ?? indicator.user?.email}{" "}
																is typing...
															</span>
														))}
													</span>
												</div>
											</div>
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
		</div>
	);
}
