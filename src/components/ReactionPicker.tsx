"use client";

import type { reactionTypeValidator } from "@convex/validators";
import type { Infer } from "convex/values";
import { Plus } from "lucide-react";
import type React from "react";
import { useCallback, useState } from "react";
import { EmojiPicker } from "@/components/EmojiPicker";
import { Button } from "@/components/ui/button";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

// End-to-end type safe reaction type
export type ReactionType = Infer<typeof reactionTypeValidator>;

interface ReactionPickerProps {
	onReactionSelect: (
		reactionType: ReactionType,
		customEmoji?: string,
	) => Promise<void> | void;
	children: React.ReactNode;
	isLoading?: boolean;
	disabled?: boolean;
	currentUserReaction?: ReactionType | null;
	className?: string;
}

// Common reaction emojis with their types
const commonReactions = [
	{ type: "thumbs_up" as const, emoji: "👍", label: "Thumbs up" },
	{ type: "heart" as const, emoji: "❤️", label: "Love" },
	{ type: "laugh" as const, emoji: "😂", label: "Laugh" },
	{ type: "wow" as const, emoji: "😮", label: "Wow" },
	{ type: "sad" as const, emoji: "😢", label: "Sad" },
	{ type: "angry" as const, emoji: "😡", label: "Angry" },
];

export function ReactionPicker({
	onReactionSelect,
	children,
	isLoading = false,
	disabled = false,
	currentUserReaction = null,
	className,
}: ReactionPickerProps) {
	const [isOpen, setIsOpen] = useState(false);
	const [showEmojiPicker, setShowEmojiPicker] = useState(false);
	const [pendingReaction, setPendingReaction] = useState<ReactionType | null>(
		null,
	);

	const handleReactionClick = useCallback(
		async (reactionType: ReactionType, customEmoji?: string) => {
			if (disabled || isLoading) return;

			try {
				setPendingReaction(reactionType);
				await onReactionSelect(reactionType, customEmoji);
				setIsOpen(false);
				setShowEmojiPicker(false);
			} catch (error) {
				console.error("Failed to add reaction:", error);
			} finally {
				setPendingReaction(null);
			}
		},
		[onReactionSelect, disabled, isLoading],
	);

	const handleCustomEmojiSelect = useCallback(
		(emoji: string) => {
			handleReactionClick("custom", emoji);
		},
		[handleReactionClick],
	);

	const handleMoreReactionsClick = useCallback(() => {
		setShowEmojiPicker(true);
	}, []);

	const handleOpenChange = useCallback((open: boolean) => {
		setIsOpen(open);
		if (!open) {
			setShowEmojiPicker(false);
		}
	}, []);

	if (showEmojiPicker) {
		return (
			<EmojiPicker onEmojiSelect={handleCustomEmojiSelect}>
				{children}
			</EmojiPicker>
		);
	}

	return (
		<Popover open={isOpen} onOpenChange={handleOpenChange}>
			<PopoverTrigger asChild disabled={disabled} className={className}>
				{children}
			</PopoverTrigger>
			<PopoverContent
				className="w-auto rounded-2xl border-2 border-border p-2 shadow-xl"
				align="center"
				sideOffset={8}
			>
				<div className="flex items-center gap-1">
					{/* Common reactions */}
					{commonReactions.map((reaction) => {
						const isCurrentReaction = currentUserReaction === reaction.type;
						const isPending = pendingReaction === reaction.type;

						return (
							<Button
								key={reaction.type}
								variant="ghost"
								size="sm"
								className={cn(
									"h-10 w-10 cursor-pointer rounded-full p-0 text-lg",
									"transition-all duration-150 hover:scale-110",
									"focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
									isCurrentReaction
										? "bg-blue-100 ring-2 ring-blue-300 hover:bg-blue-200"
										: "hover:bg-blue-50",
									(isLoading || isPending) && "cursor-not-allowed opacity-50",
									isPending && "animate-pulse",
								)}
								onClick={() => handleReactionClick(reaction.type)}
								disabled={disabled || isLoading || isPending}
								title={
									isCurrentReaction
										? `Remove ${reaction.label}`
										: reaction.label
								}
							>
								{reaction.emoji}
							</Button>
						);
					})}

					{/* More reactions button */}
					<Button
						variant="ghost"
						size="sm"
						className={cn(
							"h-10 w-10 cursor-pointer rounded-full p-0",
							"transition-all duration-150 hover:scale-110 hover:bg-gray-50",
							"focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
							isLoading && "cursor-not-allowed opacity-50",
						)}
						onClick={handleMoreReactionsClick}
						disabled={disabled || isLoading}
						title="More reactions"
					>
						<Plus className="h-4 w-4 text-gray-500" />
					</Button>
				</div>

				{/* Loading indicator */}
				{(isLoading || pendingReaction) && (
					<div className="mt-2 text-center">
						<p className="text-gray-500 text-xs">
							{pendingReaction ? "Adding reaction..." : "Loading..."}
						</p>
					</div>
				)}
			</PopoverContent>
		</Popover>
	);
}
