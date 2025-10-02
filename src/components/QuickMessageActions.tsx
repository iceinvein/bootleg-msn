import { CornerUpLeft, Edit3, Trash2 } from "lucide-react";
import type React from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
	ResponsivePopover,
	ResponsivePopoverContent,
	ResponsivePopoverTrigger,
} from "@/components/ui/responsive-popover";
import type { ReactionType } from "./ReactionPicker";

type QuickMessageActionsProps = {
	children?: React.ReactNode;
	ownsMessage: boolean;
	canEdit?: boolean; // Optional prop to control edit button visibility separately
	isReactionLoading: boolean;
	onQuickReaction: (reactionType: ReactionType) => void;
	onEdit: () => void;
	onDelete: () => void;
	onReply?: () => void;
	className?: string;
	// Controlled state props for long press
	open?: boolean;
	onOpenChange?: (open: boolean) => void;
};

export function QuickMessageActions({
	children,
	ownsMessage,
	canEdit,
	isReactionLoading,
	onQuickReaction,
	onEdit,
	onDelete,
	onReply,
	className,
	open,
	onOpenChange,
}: QuickMessageActionsProps) {
	const [internalOpen, setInternalOpen] = useState(false);

	// Use controlled state if provided, otherwise use internal state
	const isOpen = open !== undefined ? open : internalOpen;
	const setIsOpen = onOpenChange || setInternalOpen;

	return (
		<ResponsivePopover open={isOpen} onOpenChange={setIsOpen}>
			{children && (
				<ResponsivePopoverTrigger asChild className={className}>
					{children}
				</ResponsivePopoverTrigger>
			)}
			<ResponsivePopoverContent
				className="w-auto rounded-full border border-border bg-background/90 p-1 shadow-lg backdrop-blur-md"
				align={ownsMessage ? "end" : "start"}
				sideOffset={8}
				title="Message actions"
			>
				<div className="flex items-center space-x-1">
					{/* Quick reaction buttons */}
					<Button
						size="sm"
						variant="ghost"
						onClick={() => {
							onQuickReaction("thumbs_up");
							setIsOpen(false);
						}}
						disabled={isReactionLoading}
						className="h-8 w-8 rounded-full p-0 text-lg hover:bg-muted md:h-8 md:w-8"
					>
						👍
					</Button>
					<Button
						size="sm"
						variant="ghost"
						onClick={() => {
							onQuickReaction("heart");
							setIsOpen(false);
						}}
						disabled={isReactionLoading}
						className="h-8 w-8 rounded-full p-0 text-lg hover:bg-muted md:h-8 md:w-8"
					>
						❤️
					</Button>
					<Button
						size="sm"
						variant="ghost"
						onClick={() => {
							onQuickReaction("laugh");
							setIsOpen(false);
						}}
						disabled={isReactionLoading}
						className="h-8 w-8 rounded-full p-0 text-lg hover:bg-muted md:h-8 md:w-8"
					>
						😂
					</Button>
					<Button
						size="sm"
						variant="ghost"
						onClick={() => {
							onQuickReaction("wow");
							setIsOpen(false);
						}}
						disabled={isReactionLoading}
						className="h-8 w-8 rounded-full p-0 text-lg hover:bg-muted md:h-8 md:w-8"
					>
						😮
					</Button>

					{/* Sad reaction button (using 😢 emoji) */}
					<Button
						size="sm"
						variant="ghost"
						onClick={() => {
							onQuickReaction("sad");
							setIsOpen(false);
						}}
						disabled={isReactionLoading}
						className="h-8 w-8 rounded-full p-0 text-lg hover:bg-muted md:h-8 md:w-8"
					>
						😢
					</Button>

					<div className="mx-1 h-6 w-px bg-border" />

					{/* Reply button */}
					{onReply && (
						<Button
							size="sm"
							variant="ghost"
							onClick={() => {
								onReply();
								setIsOpen(false);
							}}
							className="h-8 w-8 rounded-full p-0 text-muted-foreground hover:bg-muted md:h-8 md:w-8"
						>
							<CornerUpLeft className="h-4 w-4" />
						</Button>
					)}

					{/* Edit Button (only for editable user messages) */}
					{(canEdit !== undefined ? canEdit : ownsMessage) && (
						<Button
							size="sm"
							variant="ghost"
							onClick={() => {
								onEdit();
								setIsOpen(false);
							}}
							className="h-8 w-8 rounded-full p-0 text-muted-foreground hover:bg-muted md:h-8 md:w-8"
						>
							<Edit3 className="h-4 w-4" />
						</Button>
					)}

					{/* More Options (Dropdown for Delete - only for user messages) */}
					{ownsMessage && (
						<Button
							size="sm"
							variant="ghost"
							onClick={() => {
								onDelete();
								setIsOpen(false);
							}}
							className="h-8 w-8 rounded-full p-0 text-destructive hover:bg-destructive/10 md:h-8 md:w-8"
						>
							<Trash2 className="h-4 w-4" />
						</Button>
					)}
				</div>
			</ResponsivePopoverContent>
		</ResponsivePopover>
	);
}
