import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { Send, Smile } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { convertTextToEmoji, isOnlyEmoji } from "../utils/emojiUtils";
import { AddMembersModal } from "./AddMembersModal";
import { DragDropZone } from "./DragDropZone";
import { EmojiPicker } from "./EmojiPicker";
import { FileMessage } from "./FileMessage";
import { FileUpload } from "./FileUpload";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

interface GroupChatWindowProps {
	groupId: Id<"groups">;
	onClose: () => void;
}

const statusEmojis = {
	online: "🟢",
	away: "🟡",
	busy: "🔴",
	invisible: "⚫",
	offline: "⚪",
};

export function GroupChatWindow({ groupId, onClose }: GroupChatWindowProps) {
	const [message, setMessage] = useState("");
	const [showMembers, setShowMembers] = useState(false);
	const [showAddMembers, setShowAddMembers] = useState(false);
	const [openMenuId, setOpenMenuId] = useState<Id<"groupMessages"> | null>(
		null,
	);
	const [editingMessageId, setEditingMessageId] =
		useState<Id<"groupMessages"> | null>(null);
	const [editingContent, setEditingContent] = useState("");
	const messagesEndRef = useRef<HTMLDivElement>(null);
	const inputRef = useRef<HTMLInputElement>(null);
	const editTextareaRef = useRef<HTMLTextAreaElement>(null);

	const messages = useQuery(api.groups.getGroupMessages, { groupId });
	const groups = useQuery(api.groups.getUserGroups);
	const members = useQuery(api.groups.getGroupMembers, { groupId });
	const currentUser = useQuery(api.auth.loggedInUser);

	const sendGroupMessage = useMutation(api.groups.sendGroupMessage);
	const markGroupMessagesAsRead = useMutation(
		api.groups.markGroupMessagesAsRead,
	);
	const leaveGroup = useMutation(api.groups.leaveGroup);
	const removeGroupMember = useMutation(api.groups.removeGroupMember);
	const editGroupMessage = useMutation(api.groups.editGroupMessage);
	const deleteGroupMessage = useMutation(api.groups.deleteGroupMessage);

	const group = groups?.find((g) => g?._id === groupId);
	const currentUserMembership = members?.find(
		(m) => m.userId === currentUser?._id,
	);
	const isAdmin = currentUserMembership?.role === "admin";

	// Mark messages as read when opening chat
	useEffect(() => {
		markGroupMessagesAsRead({ groupId });
	}, [groupId, markGroupMessagesAsRead]);

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

			await sendGroupMessage({
				groupId,
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

	const handleLeaveGroup = async () => {
		if (confirm("Are you sure you want to leave this group?")) {
			try {
				await leaveGroup({ groupId });
				toast.success("Left group successfully");
				onClose();
			} catch (error) {
				toast.error(
					error instanceof Error ? error.message : "Failed to leave group",
				);
			}
		}
	};

	const handleRemoveMember = async (memberId: Id<"users">) => {
		const member = members?.find((m) => m.userId === memberId);
		const memberName =
			member?.user?.name || member?.user?.email || "this member";

		if (
			confirm(`Are you sure you want to remove ${memberName} from the group?`)
		) {
			try {
				await removeGroupMember({ groupId, memberId });
				toast.success("Member removed successfully");
			} catch (error) {
				toast.error(
					error instanceof Error ? error.message : "Failed to remove member",
				);
			}
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

	const toggleMenu = (messageId: Id<"groupMessages">) => {
		setOpenMenuId(openMenuId === messageId ? null : messageId);
	};

	const handleEditMessage = async (
		messageId: Id<"groupMessages">,
		newContent: string,
	) => {
		if (!newContent.trim()) return;

		try {
			await editGroupMessage({
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

	const startEditing = (messageId: Id<"groupMessages">, content: string) => {
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

	const handleDeleteMessage = async (messageId: Id<"groupMessages">) => {
		try {
			await deleteGroupMessage({ messageId });
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

	if (!group) {
		return (
			<div className="flex flex-1 items-center justify-center">
				<div className="text-center text-gray-500">
					<div className="mb-4 text-4xl">❌</div>
					<p>Group not found</p>
				</div>
			</div>
		);
	}

	return (
		<DragDropZone groupId={groupId}>
			<div className="flex h-full flex-col bg-white">
				{/* Chat Header */}
				<div className="flex items-center justify-between bg-gradient-to-r from-green-500 to-green-600 p-4 text-white">
					<div className="flex items-center space-x-3">
						<div className="flex h-8 w-8 items-center justify-center rounded-full bg-white font-semibold text-green-600">
							👥
						</div>
						<div>
							<div className="font-semibold">{group.name}</div>
							<div className="text-green-100 text-sm">
								{group.memberCount} member{group.memberCount !== 1 ? "s" : ""}
								{group.description && ` • ${group.description}`}
							</div>
						</div>
					</div>
					<div className="flex items-center space-x-2">
						{isAdmin && (
							<button
								type="button"
								onClick={() => setShowAddMembers(true)}
								className="rounded p-1 text-white hover:text-green-200"
								title="Add members"
							>
								➕
							</button>
						)}
						<button
							type="button"
							onClick={() => setShowMembers(!showMembers)}
							className="rounded p-1 text-white hover:text-green-200"
							title="View members"
						>
							👥
						</button>
						<button
							type="button"
							onClick={handleLeaveGroup}
							className="rounded p-1 text-white hover:text-green-200"
							title="Leave group"
						>
							🚪
						</button>
						<button
							type="button"
							onClick={onClose}
							className="font-bold text-white text-xl hover:text-green-200"
						>
							×
						</button>
					</div>
				</div>

				<div className="flex flex-1 overflow-hidden">
					{/* Messages Area */}
					<div className="flex flex-1 flex-col">
						<div className="flex-1 space-y-4 overflow-y-auto bg-gradient-to-b from-green-50 to-white p-4">
							{Object.entries(groupedMessages).map(([date, dateMessages]) => (
								<div key={date}>
									{/* Date separator */}
									<div className="my-4 flex items-center justify-center">
										<div className="rounded-full bg-gray-200 px-3 py-1 font-medium text-gray-600 text-xs">
											{date}
										</div>
									</div>

									{/* Messages for this date */}
									{(dateMessages as typeof messages)?.map((msg) => {
										const isFromMe = msg.senderId === currentUser?._id;
										const canEdit =
											isFromMe &&
											!msg.isDeleted &&
											msg.messageType !== "file" &&
											msg.messageType !== "system";
										const canDelete = isFromMe && !msg.isDeleted;

										return (
											<div key={msg._id} className="space-y-1">
												{msg.messageType === "system" ? (
													<div className="text-center">
														<div className="inline-block rounded-full bg-gray-200 px-3 py-1 text-gray-600 text-sm">
															{msg.content}
														</div>
													</div>
												) : (
													<div className="flex items-start space-x-3">
														<div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-blue-600 font-semibold text-sm text-white">
															{(msg.sender?.name ||
																msg.sender?.email ||
																"U")[0]?.toUpperCase()}
														</div>
														<div className="min-w-0 flex-1">
															<div className="mb-1 flex items-baseline space-x-2">
																<span className="font-medium text-gray-900 text-sm">
																	{msg.sender?.name ||
																		msg.sender?.email ||
																		"Anonymous User"}
																</span>
																<span className="text-gray-500 text-xs">
																	{formatTime(msg._creationTime)}
																</span>
															</div>
															<div
																className={cn("group relative break-words", {
																	"text-3xl": msg.messageType === "emoji",
																	"rounded-lg bg-gray-100 px-3 py-2 text-gray-500 italic":
																		msg.isDeleted &&
																		msg.messageType !== "emoji",
																	"rounded-lg border border-gray-200 bg-white px-3 py-2 text-gray-800":
																		!msg.isDeleted &&
																		msg.messageType !== "emoji",
																})}
															>
																{/* Three-dot menu button */}
																{(canEdit || canDelete) &&
																	msg.messageType !== "emoji" && (
																		<button
																			type="button"
																			onClick={() => toggleMenu(msg._id)}
																			className="absolute top-2 right-2 rounded-full p-1 opacity-0 transition-opacity hover:bg-black hover:bg-opacity-10 group-hover:opacity-100"
																			aria-label="Message options"
																		>
																			<svg
																				className="h-3 w-3 text-gray-500"
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
																			className="w-full rounded-md border border-gray-300 p-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
																			rows={2}
																			placeholder="Edit your message..."
																			aria-label="Edit message"
																			onKeyDown={(e) => {
																				if (e.key === "Enter" && !e.shiftKey) {
																					e.preventDefault();
																					handleEditMessage(
																						msg._id,
																						editingContent,
																					);
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
																					handleEditMessage(
																						msg._id,
																						editingContent,
																					)
																				}
																				disabled={
																					!editingContent.trim() ||
																					editingContent.trim() === msg.content
																				}
																				className="rounded bg-green-500 px-2 py-1 text-white text-xs hover:bg-green-600 disabled:bg-gray-300"
																			>
																				Save
																			</button>
																		</div>
																	</div>
																) : (
																	<>
																		{msg.content}
																		{msg.isEdited && !msg.isDeleted && (
																			<span className="ml-2 text-gray-400 text-xs">
																				(edited)
																			</span>
																		)}
																	</>
																)}

																{/* Dropdown menu */}
																{openMenuId === msg._id && (
																	<div
																		data-dropdown-menu
																		className="absolute top-8 right-2 z-50 min-w-32 rounded-md border border-gray-200 bg-white py-1 shadow-lg"
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
												)}
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
								<FileUpload groupId={groupId} />
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
									placeholder="Type a message or drag files here..."
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

					{/* Members Sidebar */}
					{showMembers && (
						<div className="w-64 border-gray-200 border-l bg-gray-50">
							<div className="border-gray-200 border-b p-4">
								<h3 className="font-semibold text-gray-900">
									Members ({members?.length || 0})
								</h3>
							</div>
							<div className="overflow-y-auto">
								{members?.map((member) => {
									const displayName =
										member.user?.name || member.user?.email || "Anonymous User";
									const canRemove =
										isAdmin && member.userId !== currentUser?._id;

									return (
										<div
											key={member._id}
											className="group flex items-center space-x-3 p-3 hover:bg-gray-100"
										>
											<div className="relative">
												<div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-blue-600 font-semibold text-sm text-white">
													{displayName[0]?.toUpperCase() || "U"}
												</div>
												<div className="-bottom-1 -right-1 absolute text-xs">
													{
														statusEmojis[
															member.status as keyof typeof statusEmojis
														]
													}
												</div>
											</div>
											<div className="min-w-0 flex-1">
												<div className="truncate font-medium text-gray-900 text-sm">
													{displayName}
													{member.role === "admin" && (
														<span className="ml-1 rounded bg-blue-100 px-1 text-blue-800 text-xs">
															Admin
														</span>
													)}
												</div>
												<div className="text-gray-500 text-xs capitalize">
													{member.status}
													{member.statusMessage && ` - ${member.statusMessage}`}
												</div>
											</div>
											{canRemove && (
												<button
													type="button"
													onClick={() => handleRemoveMember(member.userId)}
													className="rounded p-1 text-red-500 opacity-0 transition-opacity hover:text-red-700 group-hover:opacity-100"
													title="Remove member"
												>
													<svg
														className="h-4 w-4"
														fill="none"
														stroke="currentColor"
														viewBox="0 0 24 24"
														aria-hidden="true"
													>
														<path
															strokeLinecap="round"
															strokeLinejoin="round"
															strokeWidth={2}
															d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
														/>
													</svg>
												</button>
											)}
										</div>
									);
								})}
							</div>
						</div>
					)}
				</div>

				{/* Add Members Modal */}
				{showAddMembers && (
					<AddMembersModal
						groupId={groupId}
						onClose={() => setShowAddMembers(false)}
					/>
				)}
			</div>
		</DragDropZone>
	);
}
