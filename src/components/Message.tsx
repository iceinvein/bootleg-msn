import { api } from "@convex/_generated/api";
import { useStore } from "@nanostores/react";
import { useMutation, useQuery } from "convex/react";
import { motion } from "framer-motion";
import { AlertCircle, Check, Edit3, Trash2, User, X } from "lucide-react";
import type React from "react";
import { memo, useCallback, useEffect, useRef, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import type { CombinedMessage } from "@/hooks/useOptimisticMessages";
import { cn } from "@/lib/utils";
import { $userAvatarMap } from "@/stores/avatars";
import { MessageReactions } from "./MessageReactions";
import { QuickMessageActions } from "./QuickMessageActions";
import type { ReactionType } from "./ReactionPicker";
import { hoverScale, messageBubble, tapScale } from "./ui/animated";

// Use the CombinedMessage type from useOptimisticMessages for consistency
type MessageProps = {
	message: CombinedMessage;
	isConsecutive?: boolean;
};

// Helper function to check if a message is a server message (not optimistic)
const isServerMessage = (
	m: CombinedMessage,
): m is Exclude<CombinedMessage, { isOptimistic: true }> =>
	!("isOptimistic" in m);

const MessageComponent = function Message({
	message,
	isConsecutive = false,
}: MessageProps) {
	const loggedInUser = useQuery(api.auth.loggedInUser);
	const isMobile = useMediaQuery("(max-width: 768px)");
	const userAvatarMap = useStore($userAvatarMap);

	// Check if this is an optimistic message
	const isOptimistic = "isOptimistic" in message && message.isOptimistic;
	// Suppress entrance/layout animation when a server message is reusing an optimistic key
	const isReconciledServer = !isOptimistic && "clientKey" in message;

	const reactionSummary = useQuery(
		api.reactions.getMessageReactionSummary,
		isServerMessage(message) ? { messageId: message._id } : "skip",
	);

	const addReaction = useMutation(api.reactions.addMessageReaction);
	const removeReaction = useMutation(api.reactions.removeMessageReaction);

	const deleteMessageMutation = useMutation(api.messages.deleteMessage);
	const editMessageMutation = useMutation(api.messages.editMessage);

	const [isEditing, setIsEditing] = useState(false);
	const [editContent, setEditContent] = useState(message.content);
	const [isEditLoading, setIsEditLoading] = useState(false);
	const [isReactionLoading, setIsReactionLoading] = useState(false);
	const [isLongPressOpen, setIsLongPressOpen] = useState(false);
	const inputRef = useRef<HTMLInputElement>(null);
	const ownsMessage = message.senderId === loggedInUser?._id;
	const hasReactions = reactionSummary && reactionSummary.length > 0;

	// Helper function to determine if a message can be edited
	const canEditMessage =
		ownsMessage &&
		!message.isDeleted &&
		isServerMessage(message) &&
		message.messageType !== "file" &&
		message.messageType !== "system";

	// Format timestamp
	const formatTimestamp = (timestamp: number) => {
		const date = new Date(timestamp);
		const now = new Date();
		const isToday = date.toDateString() === now.toDateString();

		if (isToday) {
			return date.toLocaleTimeString([], {
				hour: "2-digit",
				minute: "2-digit",
			});
		} else {
			return (
				date.toLocaleDateString([], { month: "short", day: "numeric" }) +
				" " +
				date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
			);
		}
	};

	// Long press handling for mobile
	const longPressTimer = useRef<NodeJS.Timeout | null>(null);
	const isLongPressing = useRef(false);

	useEffect(() => {
		if (isEditing && inputRef.current) {
			inputRef.current.focus();
			inputRef.current.select();
		}
	}, [isEditing]);

	// Long press handlers for mobile
	const handleLongPressStart = () => {
		if (!isMobile) return;

		isLongPressing.current = false;
		longPressTimer.current = setTimeout(() => {
			isLongPressing.current = true;
			setIsLongPressOpen(true);
		}, 500); // 500ms long press threshold
	};

	const handleLongPressEnd = () => {
		if (longPressTimer.current) {
			clearTimeout(longPressTimer.current);
			longPressTimer.current = null;
		}
	};

	const handleLongPressCancel = () => {
		handleLongPressEnd();
		isLongPressing.current = false;
	};

	// Cleanup timer on unmount
	useEffect(() => {
		return () => {
			if (longPressTimer.current) {
				clearTimeout(longPressTimer.current);
			}
		};
	}, []);

	const handleEdit = () => {
		// Only allow editing server messages (not optimistic)
		if (!isServerMessage(message)) return;

		// Don't allow editing deleted messages
		if (message.isDeleted) return;

		// Don't allow editing file messages
		if (message.messageType === "file") return;

		// Don't allow editing system messages
		if (message.messageType === "system") return;

		setEditContent(message.content);
		setIsEditing(true);
	};

	const handleSave = async () => {
		const trimmedContent = editContent.trim();

		// Don't save if content is empty
		if (!trimmedContent) {
			setEditContent(message.content);
			setIsEditing(false);
			return;
		}

		// Don't save if content hasn't changed
		if (trimmedContent === message.content) {
			setIsEditing(false);
			return;
		}

		try {
			setIsEditLoading(true);
			// Only allow editing confirmed (non-optimistic) messages
			if (!isServerMessage(message)) return;
			await editMessageMutation({
				messageId: message._id,
				newContent: trimmedContent,
			});
		} catch (error) {
			console.error("Failed to edit message:", error);
			// Reset content on error
			setEditContent(message.content);
		} finally {
			setIsEditLoading(false);
		}

		setIsEditing(false);
	};

	const handleCancel = () => {
		setEditContent(message.content);
		setIsEditing(false);
	};

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === "Enter") {
			e.preventDefault();
			handleSave();
		} else if (e.key === "Escape") {
			e.preventDefault();
			handleCancel();
		}
	};

	const handleDelete = async () => {
		try {
			// Only allow deleting confirmed (non-optimistic) messages
			const isServerMessage = (
				m: CombinedMessage,
			): m is Exclude<CombinedMessage, { isOptimistic: true }> =>
				!("isOptimistic" in m);
			if (!isServerMessage(message)) return;
			await deleteMessageMutation({ messageId: message._id });
		} catch (error) {
			console.error("Failed to delete message:", error);
		}
	};

	// Reaction handling
	const handleReactionSelect = useCallback(
		async (reactionType: ReactionType, customEmoji?: string) => {
			if (!loggedInUser) return;

			try {
				setIsReactionLoading(true);

				// Check if user already has this reaction
				const existingReaction = reactionSummary?.find(
					(r) =>
						r.reactionType === reactionType &&
						r.customEmoji === customEmoji &&
						r.hasCurrentUserReacted,
				);

				if (isOptimistic) return;

				if (existingReaction && isServerMessage(message)) {
					// Remove existing reaction - only for server messages
					await removeReaction({ messageId: message._id });
				} else if (!existingReaction && isServerMessage(message)) {
					// Add new reaction - only for server messages
					await addReaction({
						messageId: message._id,
						reactionType,
						customEmoji,
					});
				}
			} catch (error) {
				console.error("Failed to handle reaction:", error);
			} finally {
				setIsReactionLoading(false);
			}
		},
		[
			loggedInUser,
			reactionSummary,
			addReaction,
			removeReaction,
			isOptimistic,
			message,
		],
	);

	const handleQuickReaction = useCallback(
		async (reactionType: ReactionType) => {
			await handleReactionSelect(reactionType);
		},
		[handleReactionSelect],
	);

	return (
		<motion.div
			className={cn(
				`flex w-full overflow-visible`,
				ownsMessage ? "justify-end" : "justify-start",
				hasReactions && "mb-7", // Add 28px margin bottom when reactions are present
			)}
			variants={messageBubble}
			initial={isReconciledServer ? false : "initial"}
			animate="animate"
			exit="exit"
			layout={!isReconciledServer}
		>
			<div className="flex flex-col gap-1">
				{/* Name and Timestamp - only show on first message in group */}
				{!isConsecutive && (
					<motion.div
						className={cn(
							"mb-1 flex items-center gap-2 text-muted-foreground text-xs",
							ownsMessage ? "flex-row-reverse text-right" : "text-left",
						)}
						initial={isReconciledServer ? false : { opacity: 0 }}
						animate={isReconciledServer ? undefined : { opacity: 1 }}
						transition={isReconciledServer ? undefined : { delay: 0.2 }}
					>
						{/* Sender name - only for group chats */}
						{message.groupId && (
							<span className="truncate font-medium">
								{message.sender?.name ?? message.sender?.email}
							</span>
						)}
						{/* Timestamp */}
						<span className="shrink-0">
							{formatTimestamp(message._creationTime)}
						</span>
					</motion.div>
				)}

				{/* Message and Avatar row */}
				<div
					className={cn(
						"relative flex max-w-full items-center overflow-visible",
						message.groupId && "gap-2", // Only add gap for group chats with avatars
						ownsMessage && "flex-row-reverse",
					)}
				>
					{/* Avatar - only show for group chats and first message in group */}
					{message.groupId && !isConsecutive ? (
						<Avatar className="h-6 w-6 border-2 border-border md:h-8 md:w-8">
							{userAvatarMap.get(message.senderId) ? (
								<AvatarImage src={userAvatarMap.get(message.senderId)} />
							) : (
								<AvatarFallback delayMs={0}>
									<User className="h-6 w-6 md:h-8 md:w-8" />
								</AvatarFallback>
							)}
						</Avatar>
					) : message.groupId && isConsecutive ? (
						<div className="h-6 w-6 md:h-8 md:w-8" /> // Spacer to maintain alignment in group chats
					) : null}

					<div className="group relative overflow-visible">
						{isEditing ? (
							<div className="flex items-center space-x-2 rounded-2xl border-2 border-primary bg-background p-2">
								<Input
									ref={inputRef}
									value={editContent}
									onChange={(e) => setEditContent(e.target.value)}
									onKeyDown={handleKeyDown}
									disabled={isEditLoading}
									className="h-auto border-none bg-transparent p-0 text-foreground text-sm focus:ring-0 md:text-base"
								/>
								<Button
									size="sm"
									variant="ghost"
									onClick={handleSave}
									disabled={isEditLoading}
									className="h-6 w-6 p-0"
								>
									<Check className="h-3 w-3" />
								</Button>
								<Button
									size="sm"
									variant="ghost"
									onClick={handleCancel}
									disabled={isEditLoading}
									className="h-6 w-6 p-0"
								>
									<X className="h-3 w-3" />
								</Button>
							</div>
						) : (
							<motion.div
								className={cn(
									`rounded-2xl px-3 py-2 transition-all duration-200 md:px-4 md:py-2`,
									ownsMessage
										? "message-bubble-sent hover-lift"
										: "message-bubble-received hover-lift",
									// Only show visual indicators for failed messages
									isOptimistic &&
										"sendError" in message &&
										message.sendError &&
										"border-2 border-red-500/50",
								)}
								// Long press handlers for mobile
								onTouchStart={handleLongPressStart}
								onTouchEnd={handleLongPressEnd}
								onTouchCancel={handleLongPressCancel}
								onMouseDown={handleLongPressStart}
								onMouseUp={handleLongPressEnd}
								onMouseLeave={handleLongPressCancel}
								whileHover={hoverScale}
								whileTap={tapScale}
							>
								<div className="flex items-center gap-2">
									<p className="flex-1 break-words text-sm md:text-base">
										{message.isDeleted ? (
											<span className="text-muted-foreground italic">
												This message was deleted
											</span>
										) : (
											<>
												{message.content}
												{message.isEdited && (
													<motion.span
														className="ml-2 text-xs opacity-70"
														initial={
															isReconciledServer
																? false
																: { opacity: 0, scale: 0.8 }
														}
														animate={
															isReconciledServer
																? undefined
																: { opacity: 0.7, scale: 1 }
														}
														transition={
															isReconciledServer ? undefined : { delay: 0.2 }
														}
													>
														(edited)
													</motion.span>
												)}
											</>
										)}
									</p>

									{/* Only show error indicator for failed messages */}
									{isOptimistic &&
										"sendError" in message &&
										message.sendError && (
											<div title={message.sendError}>
												<AlertCircle className="h-3 w-3 text-red-500" />
											</div>
										)}
								</div>
							</motion.div>
						)}

						{/* Message actions - responsive: hover on desktop, tap on mobile */}
						{!isEditing && !message.isDeleted && (
							<>
								{/* Desktop: Hover actions */}
								{!isMobile && (
									<>
										{/* Invisible bridge to maintain hover state */}
										<div
											className={cn(
												"absolute bottom-[calc(100%)] h-2 w-full",
												"pointer-events-none group-hover:pointer-events-auto",
											)}
										/>
										<div
											className={cn(
												"absolute bottom-[calc(100%+8px)] z-[9999] flex items-center space-x-1 rounded-full border border-border bg-background/90 p-1 shadow-lg backdrop-blur-md transition-all duration-200",
												ownsMessage ? "right-0" : "left-0",
												"pointer-events-none scale-90 opacity-0 group-hover:pointer-events-auto group-hover:scale-100 group-hover:opacity-100",
											)}
										>
											{/* Quick reaction buttons */}
											<Button
												size="sm"
												variant="ghost"
												onClick={() => handleQuickReaction("thumbs_up")}
												disabled={isReactionLoading}
												className="h-8 w-8 rounded-full p-0 text-lg hover:bg-muted"
											>
												👍
											</Button>
											<Button
												size="sm"
												variant="ghost"
												onClick={() => handleQuickReaction("heart")}
												disabled={isReactionLoading}
												className="h-8 w-8 rounded-full p-0 text-lg hover:bg-muted"
											>
												❤️
											</Button>
											<Button
												size="sm"
												variant="ghost"
												onClick={() => handleQuickReaction("laugh")}
												disabled={isReactionLoading}
												className="h-8 w-8 rounded-full p-0 text-lg hover:bg-muted"
											>
												😂
											</Button>
											<Button
												size="sm"
												variant="ghost"
												onClick={() => handleQuickReaction("wow")}
												disabled={isReactionLoading}
												className="h-8 w-8 rounded-full p-0 text-lg hover:bg-muted"
											>
												😮
											</Button>

											{/* Sad reaction button */}
											<Button
												size="sm"
												variant="ghost"
												onClick={() => handleQuickReaction("sad")}
												disabled={isReactionLoading}
												className="h-8 w-8 rounded-full p-0 text-lg hover:bg-muted"
											>
												😢
											</Button>

											{/* Separator only if there are edit/delete actions for user messages */}
											{(canEditMessage ||
												(ownsMessage && !message.isDeleted)) && (
												<div className="mx-1 h-6 w-px bg-border" />
											)}

											{/* Edit Button (only for editable user messages) */}
											{canEditMessage && (
												<Button
													size="sm"
													variant="ghost"
													onClick={handleEdit}
													className="h-8 w-8 rounded-full p-0 text-muted-foreground hover:bg-muted"
												>
													<Edit3 className="h-4 w-4" />
												</Button>
											)}

											{/* Delete Button (only for user messages) */}
											{ownsMessage && !message.isDeleted && (
												<Button
													size="sm"
													variant="ghost"
													onClick={handleDelete}
													className="h-8 w-8 rounded-full p-0 text-destructive hover:bg-destructive/10"
												>
													<Trash2 className="h-4 w-4" />
												</Button>
											)}
										</div>
									</>
								)}

								{/* Mobile: Long press triggered drawer */}
								{isMobile && (
									<QuickMessageActions
										ownsMessage={ownsMessage && !message.isDeleted}
										canEdit={canEditMessage}
										isReactionLoading={isReactionLoading}
										onQuickReaction={handleQuickReaction}
										onEdit={handleEdit}
										onDelete={handleDelete}
										open={isLongPressOpen}
										onOpenChange={setIsLongPressOpen}
									/>
								)}
							</>
						)}
					</div>
					{/* Message reactions */}
					{!message.isDeleted &&
						reactionSummary &&
						reactionSummary.length > 0 && (
							<div
								className={cn(
									"-bottom-5 absolute",
									ownsMessage
										? "left-2 flex justify-end"
										: "right-2 flex justify-start",
								)}
							>
								<MessageReactions
									reactions={reactionSummary}
									onReactionClick={handleReactionSelect}
									isLoading={isReactionLoading}
									className={cn(ownsMessage ? "mr-8" : "ml-8")}
								/>
							</div>
						)}
				</div>
			</div>
		</motion.div>
	);
};

// Memoize the component to prevent unnecessary re-renders
export const Message = memo(MessageComponent, (prevProps, nextProps) => {
	// Custom comparison to prevent re-renders when message object reference is the same
	return (
		prevProps.message === nextProps.message &&
		prevProps.isConsecutive === nextProps.isConsecutive
	);
});
