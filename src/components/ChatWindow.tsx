import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { Send, Smile } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { convertTextToEmoji, isOnlyEmoji } from "../utils/emojiUtils";
import { DragDropZone } from "./DragDropZone";
import { EmojiPicker } from "./EmojiPicker";
import { FileMessage } from "./FileMessage";
import { FileUpload } from "./FileUpload";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

interface ChatWindowProps {
	otherUserId: Id<"users">;
	onClose: () => void;
}

const statusEmojis = {
	online: "🟢",
	away: "🟡",
	busy: "🔴",
	invisible: "⚫",
	offline: "⚪",
};

export function ChatWindow({ otherUserId, onClose }: ChatWindowProps) {
	const [message, setMessage] = useState("");
	const [openMenuId, setOpenMenuId] = useState<Id<"messages"> | null>(null);
	const [editingMessageId, setEditingMessageId] =
		useState<Id<"messages"> | null>(null);
	const [editingContent, setEditingContent] = useState("");
	const messagesEndRef = useRef<HTMLDivElement>(null);
	const inputRef = useRef<HTMLInputElement>(null);
	const editTextareaRef = useRef<HTMLTextAreaElement>(null);

	const messages = useQuery(api.messages.getConversation, { otherUserId });
	const contacts = useQuery(api.contacts.getContacts);
	const sendMessage = useMutation(api.messages.sendMessage);
	const markMessagesAsRead = useMutation(api.messages.markMessagesAsRead);
	const editMessage = useMutation(api.messages.editMessage);
	const deleteMessage = useMutation(api.messages.deleteMessage);

	const contact = contacts?.find((c) => c.contactUserId === otherUserId);
	const displayName =
		contact?.nickname ||
		contact?.user?.name ||
		contact?.user?.email ||
		"Unknown User";

	// Mark messages as read when opening chat
	useEffect(() => {
		markMessagesAsRead({ senderId: otherUserId });
	}, [otherUserId, markMessagesAsRead]);

	// biome-ignore lint/correctness/useExhaustiveDependencies: we need to react to changes in the messages query
	useEffect(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
	}, [messages?.length]);

	const handleSendMessage = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!message.trim()) return;

		try {
			const convertedMessage = convertTextToEmoji(message.trim());
			const messageType = isOnlyEmoji(convertedMessage) ? "emoji" : "text";

			await sendMessage({
				receiverId: otherUserId,
				content: convertedMessage,
				messageType,
			});

			setMessage("");
		} catch (error) {
			toast.error(
				error instanceof Error ? error.message : "Failed to send message",
			);
		}
	};

	const handleEmojiSelect = (emoji: string) => {
		const input = inputRef.current;
		if (input) {
			const start = input.selectionStart || 0;
			const end = input.selectionEnd || 0;
			const newMessage = message.slice(0, start) + emoji + message.slice(end);
			setMessage(newMessage);

			// Set cursor position after the emoji
			setTimeout(() => {
				input.focus();
				input.setSelectionRange(start + emoji.length, start + emoji.length);
			}, 0);
		} else {
			setMessage((prev) => prev + emoji);
		}
	};

	const formatTime = (timestamp: number) => {
		return new Date(timestamp).toLocaleTimeString([], {
			hour: "2-digit",
			minute: "2-digit",
		});
	};

	const formatDate = (timestamp: number) => {
		const date = new Date(timestamp);
		const today = new Date();
		const yesterday = new Date(today);
		yesterday.setDate(yesterday.getDate() - 1);

		if (date.toDateString() === today.toDateString()) {
			return "Today";
		} else if (date.toDateString() === yesterday.toDateString()) {
			return "Yesterday";
		} else {
			return date.toLocaleDateString([], {
				month: "short",
				day: "numeric",
				year:
					date.getFullYear() !== today.getFullYear() ? "numeric" : undefined,
			});
		}
	};

	const toggleMenu = (messageId: Id<"messages">) => {
		setOpenMenuId(openMenuId === messageId ? null : messageId);
	};

	const handleEditMessage = async (
		messageId: Id<"messages">,
		newContent: string,
	) => {
		if (!newContent.trim()) return;

		try {
			await editMessage({
				messageId,
				newContent: newContent.trim(),
			});
			setEditingMessageId(null);
			setEditingContent("");
			toast.success("Message edited successfully");
		} catch (error) {
			toast.error(
				error instanceof Error ? error.message : "Failed to edit message",
			);
		}
	};

	const startEditing = (messageId: Id<"messages">, content: string) => {
		setEditingMessageId(messageId);
		setEditingContent(content);
	};

	// Focus the textarea when editing starts
	useEffect(() => {
		if (editingMessageId && editTextareaRef.current) {
			editTextareaRef.current.focus();
			// Position cursor at the end of the text
			const length = editingContent.length;
			editTextareaRef.current.setSelectionRange(length, length);
		}
	}, [editingMessageId, editingContent]);

	// Close menu when clicking outside
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (openMenuId) {
				// Check if the click is inside a dropdown menu
				const target = event.target as Element;
				if (!target.closest("[data-dropdown-menu]")) {
					setOpenMenuId(null);
				}
			}
		};

		document.addEventListener("mousedown", handleClickOutside);
		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
		};
	}, [openMenuId]);

	const cancelEditing = () => {
		setEditingMessageId(null);
		setEditingContent("");
	};

	const handleDeleteMessage = async (messageId: Id<"messages">) => {
		try {
			await deleteMessage({ messageId });
			toast.success("Message deleted successfully");
		} catch (error) {
			toast.error(
				error instanceof Error ? error.message : "Failed to delete message",
			);
		}
	};

	// Group messages by date
	const groupedMessages =
		messages?.reduce(
			(groups: Record<string, typeof messages>, message) => {
				const date = formatDate(message._creationTime);
				if (!groups[date]) {
					groups[date] = [];
				}
				groups[date].push(message);
				return groups;
			},
			{} as Record<string, typeof messages>,
		) || {};

	if (!contact) {
		return (
			<div className="flex flex-1 items-center justify-center">
				<div className="text-center text-gray-500">
					<div className="mb-4 text-4xl">❌</div>
					<p>Contact not found</p>
				</div>
			</div>
		);
	}

	return (
		<DragDropZone receiverId={otherUserId}>
			<div className="flex h-full flex-col bg-white">
				{/* Chat Header */}
				<div className="flex items-center justify-between bg-gradient-to-r from-blue-500 to-blue-600 p-4 text-white">
					<div className="flex items-center space-x-3">
						<div className="relative">
							<div className="flex h-8 w-8 items-center justify-center rounded-full bg-white font-semibold text-blue-600">
								{displayName[0]?.toUpperCase() || "U"}
							</div>
							<div className="-bottom-1 -right-1 absolute text-xs">
								{statusEmojis[contact.status as keyof typeof statusEmojis]}
							</div>
						</div>
						<div>
							<div className="font-semibold">{displayName}</div>
							<div className="text-blue-100 text-sm capitalize">
								{contact.status}
								{contact.statusMessage && ` - ${contact.statusMessage}`}
							</div>
						</div>
					</div>
					<button
						type="button"
						onClick={onClose}
						className="font-bold text-white text-xl hover:text-blue-200"
					>
						×
					</button>
				</div>

				{/* Messages Area */}
				<div className="flex-1 space-y-4 overflow-y-auto bg-gradient-to-b from-blue-50 to-white p-4">
					{Object.entries(groupedMessages).map(([date, dateMessages]) => (
						<div key={date}>
							{/* Date separator */}
							<div className="my-4 flex items-center justify-center">
								<div className="rounded-full bg-gray-200 px-3 py-1 font-medium text-gray-600 text-xs">
									{date}
								</div>
							</div>

							{/* Messages for this date */}
							{(dateMessages as typeof messages)?.map((msg, index) => {
								const isFromMe = msg.senderId !== otherUserId;
								const showAvatar =
									index === 0 ||
									(dateMessages as typeof messages)?.[index - 1]?.senderId !==
										msg.senderId;
								const isEmojiOnly = msg.messageType === "emoji";
								const canEdit =
									isFromMe &&
									!msg.isDeleted &&
									msg.messageType !== "file" &&
									msg.messageType !== "system";
								const canDelete = isFromMe && !msg.isDeleted;

								return (
									<div
										key={msg._id}
										className={cn(
											"mb-2 flex",
											isFromMe ? "justify-end" : "justify-start",
										)}
									>
										<div
											className={cn(
												"flex max-w-xs items-end space-x-2 lg:max-w-md",
												isFromMe && "flex-row-reverse space-x-reverse",
											)}
										>
											{!isFromMe && (
												<div
													className={cn(
														"flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full font-semibold text-xs",
														showAvatar
															? "bg-gradient-to-br from-gray-400 to-gray-600 text-white"
															: "invisible",
													)}
												>
													{showAvatar
														? displayName[0]?.toUpperCase() || "U"
														: ""}
												</div>
											)}
											<div
												className={cn("group relative rounded-lg px-3 py-2", {
													"bg-transparent p-0": isEmojiOnly,
													"bg-gray-100 text-gray-500 italic":
														msg.isDeleted && !isEmojiOnly,
													"bg-blue-500 text-white":
														isFromMe && !msg.isDeleted && !isEmojiOnly,
													"border border-gray-200 bg-white text-gray-800":
														!isFromMe && !msg.isDeleted && !isEmojiOnly,
												})}
											>
												{/* Three-dot menu button */}
												{(canEdit || canDelete) && !isEmojiOnly && (
													<button
														type="button"
														onClick={() => toggleMenu(msg._id)}
														className={cn(
															"absolute top-2 rounded-full p-1 opacity-0 transition-opacity hover:bg-black hover:bg-opacity-10 group-hover:opacity-100",
															isFromMe ? "left-2" : "right-2",
														)}
														aria-label="Message options"
													>
														<svg
															className={cn(
																"h-3 w-3",
																isFromMe ? "text-blue-200" : "text-gray-500",
															)}
															fill="currentColor"
															viewBox="0 0 20 20"
														>
															<title>Message options</title>
															<path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
														</svg>
													</button>
												)}

												{msg.messageType === "file" && msg.fileId ? (
													<FileMessage
														fileId={msg.fileId}
														fileName={msg.fileName || msg.content}
														fileType={
															msg.fileType || "application/octet-stream"
														}
														fileSize={msg.fileSize || 0}
													/>
												) : editingMessageId === msg._id ? (
													<div className="space-y-2">
														<textarea
															ref={editTextareaRef}
															value={editingContent}
															onChange={(e) =>
																setEditingContent(e.target.value)
															}
															className="w-full rounded-md border border-gray-300 p-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
															rows={2}
															placeholder="Edit your message..."
															aria-label="Edit message"
															onKeyDown={(e) => {
																if (e.key === "Enter" && !e.shiftKey) {
																	e.preventDefault();
																	handleEditMessage(msg._id, editingContent);
																} else if (e.key === "Escape") {
																	cancelEditing();
																}
															}}
														/>
														<div className="flex justify-end space-x-2">
															<button
																type="button"
																onClick={cancelEditing}
																className="rounded px-2 py-1 text-gray-600 text-xs hover:bg-gray-100"
															>
																Cancel
															</button>
															<button
																type="button"
																onClick={() =>
																	handleEditMessage(msg._id, editingContent)
																}
																disabled={
																	!editingContent.trim() ||
																	editingContent.trim() === msg.content
																}
																className="rounded bg-blue-500 px-2 py-1 text-white text-xs hover:bg-blue-600 disabled:bg-gray-300"
															>
																Save
															</button>
														</div>
													</div>
												) : (
													<div
														className={cn(
															"break-words",
															isEmojiOnly && "text-3xl",
														)}
													>
														{msg.content}
														{msg.isEdited && !msg.isDeleted && (
															<span
																className={cn(
																	"ml-2 text-xs",
																	isFromMe ? "text-blue-200" : "text-gray-400",
																)}
															>
																(edited)
															</span>
														)}
													</div>
												)}
												{!isEmojiOnly && (
													<div
														className={cn("mt-1 text-xs", {
															"text-gray-400": msg.isDeleted,
															"text-blue-100": !msg.isDeleted && isFromMe,
															"text-gray-500": !msg.isDeleted && !isFromMe,
														})}
													>
														{formatTime(msg._creationTime)}
													</div>
												)}

												{/* Dropdown menu */}
												{openMenuId === msg._id && (
													<div
														data-dropdown-menu
														className={cn(
															"absolute top-8 z-50 min-w-32 rounded-md border border-gray-200 bg-white py-1 shadow-lg",
															isFromMe ? "left-2" : "right-2",
														)}
													>
														{canEdit && (
															<button
																type="button"
																onClick={() => {
																	startEditing(msg._id, msg.content);
																	setOpenMenuId(null);
																}}
																className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100"
															>
																✏️ Edit
															</button>
														)}
														{canDelete && (
															<button
																type="button"
																onClick={() => {
																	handleDeleteMessage(msg._id);
																	setOpenMenuId(null);
																}}
																className="w-full px-3 py-2 text-left text-red-600 text-sm hover:bg-red-50"
															>
																🗑️ Delete
															</button>
														)}
													</div>
												)}
											</div>
										</div>
									</div>
								);
							})}
						</div>
					))}
					<div ref={messagesEndRef} />
				</div>

				{/* Message Input */}
				<div className="border-gray-200 border-t bg-white p-3 md:p-4">
					<form
						onSubmit={handleSendMessage}
						className="flex items-center space-x-2"
					>
						<FileUpload receiverId={otherUserId} />
						<EmojiPicker onEmojiSelect={handleEmojiSelect}>
							<Button
								type="button"
								variant="ghost"
								size="sm"
								className="h-8 w-8 flex-shrink-0 cursor-pointer md:h-10 md:w-10"
							>
								<Smile className="h-3 w-3 md:h-4 md:w-4" />
							</Button>
						</EmojiPicker>
						<Input
							type="text"
							ref={inputRef}
							value={message}
							onChange={(e) => setMessage(e.target.value)}
							placeholder={`Message ${displayName}...`}
							className="h-9 flex-1 rounded-full border-gray-300 text-sm focus:border-blue-500 md:h-10 md:text-base"
						/>
						<Button
							type="submit"
							size="sm"
							className="h-8 w-8 flex-shrink-0 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 md:h-10 md:w-10"
							disabled={!message.trim()}
						>
							<Send className="h-3 w-3 md:h-4 md:w-4" />
						</Button>
					</form>
				</div>
			</div>
		</DragDropZone>
	);
}
