import { api } from "@convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { Check, Edit3, Trash2, User, X } from "lucide-react";
import type React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { cn } from "@/lib/utils";
import { MessageReactions } from "./MessageReactions";
import { QuickMessageActions } from "./QuickMessageActions";
import type { ReactionType } from "./ReactionPicker";

interface MessageProps {
	message: FunctionReturnType<typeof api.unifiedMessages.getMessages>[number];
}

export function Message({ message }: MessageProps) {
	const loggedInUser = useQuery(api.auth.loggedInUser);
	const isMobile = useMediaQuery("(max-width: 768px)");

	// For now, use direct message reactions for all messages since unified messages uses single table
	// TODO: Refactor to handle group messages properly when system is made consistent
	const reactionSummary = useQuery(api.reactions.getMessageReactionSummary, {
		messageId: message._id,
	});

	const addReaction = useMutation(api.reactions.addMessageReaction);
	const removeReaction = useMutation(api.reactions.removeMessageReaction);

	const [isEditing, setIsEditing] = useState(false);
	const [editContent, setEditContent] = useState(message.content);
	const [isReactionLoading, setIsReactionLoading] = useState(false);
	const [isLongPressOpen, setIsLongPressOpen] = useState(false);
	const inputRef = useRef<HTMLInputElement>(null);
	const ownsMessage = message.senderId === loggedInUser?._id;

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
		setEditContent(message.content);
		setIsEditing(true);
	};

	const handleSave = () => {
		const trimmedContent = editContent.trim();
		if (trimmedContent && trimmedContent !== message.content) {
			// TODO: update message
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

	const handleDelete = () => {
		// TODO: delete message
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

				if (existingReaction) {
					// Remove existing reaction
					await removeReaction({ messageId: message._id });
				} else {
					// Add new reaction
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
		[loggedInUser, reactionSummary, addReaction, removeReaction, message._id],
	);

	const handleQuickReaction = useCallback(
		async (reactionType: ReactionType) => {
			await handleReactionSelect(reactionType);
		},
		[handleReactionSelect],
	);

	return (
		<div
			className={cn(
				`flex w-full overflow-visible`,
				ownsMessage ? "justify-end" : "justify-start",
			)}
		>
			<div className="flex flex-col gap-1">
				<span className="text-muted-foreground text-xs">
					{message.sender?.name ?? message.sender?.email}
				</span>
				<div
					className={cn(
						"relative flex max-w-[85%] items-center gap-2 space-x-2 overflow-visible md:max-w-xs lg:max-w-md",
						ownsMessage && "flex-row-reverse",
					)}
				>
					<Avatar className="h-6 w-6 border-2 border-border md:h-8 md:w-8">
						<User className="h-6 w-6 md:h-8 md:w-8" />
					</Avatar>

					<div className="group relative overflow-visible">
						{isEditing ? (
							<div className="flex items-center space-x-2 rounded-2xl border-2 border-primary bg-background p-2">
								<Input
									ref={inputRef}
									value={editContent}
									onChange={(e) => setEditContent(e.target.value)}
									onKeyDown={handleKeyDown}
									className="h-auto border-none bg-transparent p-0 text-foreground text-sm focus:ring-0 md:text-base"
								/>
								<Button
									size="sm"
									variant="ghost"
									onClick={handleSave}
									className="h-6 w-6 p-0"
								>
									<Check className="h-3 w-3" />
								</Button>
								<Button
									size="sm"
									variant="ghost"
									onClick={handleCancel}
									className="h-6 w-6 p-0"
								>
									<X className="h-3 w-3" />
								</Button>
							</div>
						) : (
							<div
								className={cn(
									`rounded-2xl px-3 py-2 transition-all duration-200 hover:scale-[1.02] hover:shadow-lg md:px-4 md:py-2`,
									ownsMessage
										? "msn-gradient text-white shadow-lg hover:shadow-xl"
										: "border border-border bg-muted/80 text-foreground hover:bg-muted",
								)}
								// Long press handlers for mobile
								onTouchStart={handleLongPressStart}
								onTouchEnd={handleLongPressEnd}
								onTouchCancel={handleLongPressCancel}
								onMouseDown={handleLongPressStart}
								onMouseUp={handleLongPressEnd}
								onMouseLeave={handleLongPressCancel}
							>
								<p className="break-words text-sm md:text-base">
									{message.content}
									{message.isEdited && (
										<span className="ml-2 text-xs opacity-70">(edited)</span>
									)}
								</p>
							</div>
						)}

						{/* Message actions - responsive: hover on desktop, tap on mobile */}
						{!isEditing && (
							<>
								{/* Desktop: Hover actions */}
								{!isMobile && (
									<div
										className={cn(
											"absolute bottom-[calc(100%)] z-[9999] flex items-center space-x-1 rounded-full border border-border bg-background/90 p-1 shadow-lg backdrop-blur-md transition-all duration-200",
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
										{ownsMessage && <div className="mx-1 h-6 w-px bg-border" />}

										{/* Edit Button (only for user messages) */}
										{ownsMessage && (
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
										{ownsMessage && (
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
								)}

								{/* Mobile: Long press triggered drawer */}
								{isMobile && (
									<QuickMessageActions
										ownsMessage={ownsMessage}
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
					{reactionSummary && reactionSummary.length > 0 && (
						<div
							className={cn(
								"-bottom-5 absolute left-[calc(25%)]",
								ownsMessage ? "flex justify-end" : "flex justify-start",
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
		</div>
	);
}
