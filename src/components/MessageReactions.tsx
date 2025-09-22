"use client";

import { User } from "lucide-react";
import type React from "react";
import { useCallback, useEffect, useState } from "react";
import type { ReactionType } from "@/components/ReactionPicker";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";

type ReactionSummary = {
	reactionType: ReactionType;
	customEmoji?: string;
	count: number;
	users: Array<{
		_id: string;
		name?: string;
		image?: string;
	}>;
	hasCurrentUserReacted: boolean;
};

type MessageReactionsProps = {
	reactions: ReactionSummary[];
	onReactionClick?: (
		reactionType: ReactionType,
		customEmoji?: string,
	) => Promise<void> | void;
	isLoading?: boolean;
	disabled?: boolean;
	className?: string;
};

// Map reaction types to their emoji representations
const reactionEmojis: Record<ReactionType, string> = {
	thumbs_up: "👍",
	heart: "❤️",
	laugh: "😂",
	wow: "😮",
	sad: "😢",
	angry: "😡",
	custom: "", // Will use customEmoji instead
};

// Map reaction types to their labels
const reactionLabels: Record<ReactionType, string> = {
	thumbs_up: "Thumbs up",
	heart: "Love",
	laugh: "Laugh",
	wow: "Wow",
	sad: "Sad",
	angry: "Angry",
	custom: "Custom",
};

function ReactionTooltip({
	reaction,
	children,
}: {
	reaction: ReactionSummary;
	children: React.ReactNode;
}) {
	const getReactionLabel = () => {
		if (reaction.reactionType === "custom" && reaction.customEmoji) {
			return `${reaction.customEmoji} reaction`;
		}
		return reactionLabels[reaction.reactionType];
	};

	return (
		<Tooltip>
			<TooltipTrigger asChild>{children}</TooltipTrigger>
			<TooltipContent
				className="w-fit rounded-lg shadow-lg"
				align="center"
				sideOffset={8}
				side="bottom"
			>
				<div className="space-y-3">
					<div className="flex items-center gap-2">
						<span className="text-lg">
							{reaction.reactionType === "custom"
								? reaction.customEmoji
								: reactionEmojis[reaction.reactionType]}
						</span>
						<span className="font-medium text-primary-foreground/70 text-sm">
							{getReactionLabel()}
						</span>
					</div>

					<div className="max-h-48 overflow-y-auto">
						<div className="space-y-2">
							{reaction.users.slice(0, 20).map((user) => (
								<div key={user._id} className="flex items-center gap-2">
									<Avatar className="h-6 w-6 border-2 border-gray-300 bg-white text-white dark:border-gray-700 dark:bg-gray-800">
										<User className="h-6 w-6" />
									</Avatar>
									<span className="text-primary-foreground/70 text-sm">
										{user.name ?? "Unknown User"}
									</span>
								</div>
							))}

							{reaction.users.length > 5 && (
								<div className="text-center text-gray-500 text-sm">
									and {reaction.users.length - 20} more...
								</div>
							)}
						</div>
					</div>
				</div>
			</TooltipContent>
		</Tooltip>
	);
}

function ReactionBadge({
	reaction,
	onReactionClick,
	isLoading,
	disabled,
}: {
	reaction: ReactionSummary;
	onReactionClick?: (
		reactionType: ReactionType,
		customEmoji?: string,
	) => Promise<void> | void;
	isLoading?: boolean;
	disabled?: boolean;
}) {
	const [isPending, setIsPending] = useState(false);
	const [isNewReaction, setIsNewReaction] = useState(false);

	const handleClick = useCallback(async () => {
		if (!onReactionClick || disabled || isLoading || isPending) return;

		try {
			setIsPending(true);
			await onReactionClick(reaction.reactionType, reaction.customEmoji);
		} catch (error) {
			console.error("Failed to toggle reaction:", error);
		} finally {
			setIsPending(false);
		}
	}, [
		onReactionClick,
		reaction.reactionType,
		reaction.customEmoji,
		disabled,
		isLoading,
		isPending,
	]);

	// Trigger animation for new reactions
	useEffect(() => {
		if (reaction.count > 0) {
			setIsNewReaction(true);
			const timer = setTimeout(() => setIsNewReaction(false), 600);
			return () => clearTimeout(timer);
		}
	}, [reaction.count]);

	const reactionEmoji =
		reaction.reactionType === "custom"
			? reaction.customEmoji
			: reactionEmojis[reaction.reactionType];

	return (
		<ReactionTooltip reaction={reaction}>
			<Button
				variant="ghost"
				size="sm"
				className={cn(
					"h-7 gap-1 rounded-full px-2 py-3 text-xs",
					"transition-all duration-200",
					"focus:ring-2 focus:ring-blue-500 focus:ring-offset-1",
					"border bg-white dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-800",
					(isLoading || isPending || disabled) &&
						"cursor-not-allowed opacity-50",
					isPending && "animate-pulse",
					isNewReaction && "animate-bounce",
				)}
				onClick={onReactionClick ? handleClick : undefined}
				disabled={disabled || isLoading || isPending}
			>
				<span
					className={cn(
						"text-sm transition-transform duration-200",
						isNewReaction && "animate-pulse",
					)}
				>
					{reactionEmoji}
				</span>
				{reaction.count > 1 && (
					<span
						className={cn(
							"font-medium transition-all duration-200",
							isNewReaction && "scale-110",
						)}
					>
						{reaction.count}
					</span>
				)}
			</Button>
		</ReactionTooltip>
	);
}

export function MessageReactions({
	reactions,
	onReactionClick,
	isLoading = false,
	disabled = false,
	className,
}: MessageReactionsProps) {
	// Don't render if no reactions
	if (!reactions || reactions.length === 0) {
		return null;
	}

	// Sort reactions by count (descending) and then by whether current user reacted
	const sortedReactions = [...reactions].sort((a, b) => {
		if (a.hasCurrentUserReacted && !b.hasCurrentUserReacted) return -1;
		if (!a.hasCurrentUserReacted && b.hasCurrentUserReacted) return 1;
		return b.count - a.count;
	});

	return (
		<div className={cn("flex flex-wrap gap-1", className)}>
			{sortedReactions.map((reaction, index) => (
				<ReactionBadge
					key={`${reaction.reactionType}-${reaction.customEmoji || ""}-${index}`}
					reaction={reaction}
					onReactionClick={onReactionClick}
					isLoading={isLoading}
					disabled={disabled}
				/>
			))}
		</div>
	);
}
