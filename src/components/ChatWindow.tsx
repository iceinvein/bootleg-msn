import { useMutation, useQuery } from "convex/react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { convertTextToEmoji, isOnlyEmoji } from "../utils/emojiUtils";
import { DragDropZone } from "./DragDropZone";
import { EmojiPicker } from "./EmojiPicker";
import { FileMessage } from "./FileMessage";
import { FileUpload } from "./FileUpload";

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
	const [showEmojiPicker, setShowEmojiPicker] = useState(false);
	const messagesEndRef = useRef<HTMLDivElement>(null);
	const inputRef = useRef<HTMLInputElement>(null);

	const messages = useQuery(api.messages.getConversation, { otherUserId });
	const contacts = useQuery(api.contacts.getContacts);
	const sendMessage = useMutation(api.messages.sendMessage);
	const markMessagesAsRead = useMutation(api.messages.markMessagesAsRead);

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
		setShowEmojiPicker(false);
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

								return (
									<div
										key={msg._id}
										className={`flex ${isFromMe ? "justify-end" : "justify-start"} mb-2`}
									>
										<div
											className={`flex max-w-xs items-end space-x-2 lg:max-w-md ${isFromMe ? "flex-row-reverse space-x-reverse" : ""}`}
										>
											{!isFromMe && (
												<div
													className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full font-semibold text-xs ${
														showAvatar
															? "bg-gradient-to-br from-gray-400 to-gray-600 text-white"
															: "invisible"
													}`}
												>
													{showAvatar
														? displayName[0]?.toUpperCase() || "U"
														: ""}
												</div>
											)}
											<div
												className={`rounded-lg px-3 py-2 ${
													isEmojiOnly
														? "bg-transparent p-0"
														: isFromMe
															? "bg-blue-500 text-white"
															: "border border-gray-200 bg-white text-gray-800"
												}`}
											>
												{msg.messageType === "file" && msg.fileId ? (
													<FileMessage
														fileId={msg.fileId}
														fileName={msg.fileName || msg.content}
														fileType={
															msg.fileType || "application/octet-stream"
														}
														fileSize={msg.fileSize || 0}
													/>
												) : (
													<div
														className={`break-words ${isEmojiOnly ? "text-3xl" : ""}`}
													>
														{msg.content}
													</div>
												)}
												{!isEmojiOnly && (
													<div
														className={`mt-1 text-xs ${
															isFromMe ? "text-blue-100" : "text-gray-500"
														}`}
													>
														{formatTime(msg._creationTime)}
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
				<div className="relative border-gray-200 border-t p-4">
					<form
						onSubmit={handleSendMessage}
						className="flex items-end space-x-2"
					>
						<FileUpload receiverId={otherUserId} />
						<div className="relative flex-1">
							<input
								ref={inputRef}
								type="text"
								value={message}
								onChange={(e) => setMessage(e.target.value)}
								placeholder="Type a message or drag files here..."
								className="w-full rounded-md border border-gray-300 px-3 py-2 pr-10 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
							/>
							<button
								type="button"
								onClick={() => setShowEmojiPicker(!showEmojiPicker)}
								className="-translate-y-1/2 absolute top-1/2 right-2 transform text-gray-400 text-xl hover:text-gray-600"
								title="Add emoji"
							>
								😊
							</button>
						</div>
						<button
							type="submit"
							disabled={!message.trim()}
							className="rounded-md bg-blue-500 px-6 py-2 font-medium text-white transition-colors hover:bg-blue-600 disabled:bg-gray-300"
						>
							Send
						</button>
					</form>

					{showEmojiPicker && (
						<EmojiPicker
							onEmojiSelect={handleEmojiSelect}
							onClose={() => setShowEmojiPicker(false)}
						/>
					)}
				</div>
			</div>
		</DragDropZone>
	);
}
