/**
 * EmojiPickerOverlay Component
 *
 * An emoji picker overlay that allows users to select emojis.
 * This component renders as a popover or modal with emoji selection.
 */

import { Smile } from "lucide-react";
import { EmojiPicker } from "@/components/EmojiPicker";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import type { EmojiPickerOverlayProps } from "@/types/overlay";

/**
 * EmojiPickerOverlay component that renders the emoji picker
 *
 * @example
 * ```tsx
 * // Usage through overlay system
 * const { open } = useOverlays();
 *
 * const openEmojiPicker = () => {
 *   open({
 *     type: "EMOJI_PICKER",
 *     props: {
 *       onEmojiSelect: (emoji) => console.log("Selected emoji:", emoji),
 *     },
 *   });
 * };
 * ```
 */
export function EmojiPickerOverlay({
	onEmojiSelect,
	onClose,
	glass = false,
	animationType = "scale",
}: EmojiPickerOverlayProps) {
	/**
	 * Handle emoji selection
	 */
	const handleEmojiSelect = (emoji: string) => {
		onEmojiSelect?.(emoji);
		onClose?.();
	};

	return (
		<Dialog open={true} onOpenChange={(open) => !open && onClose?.()}>
			<DialogContent
				glass={glass}
				animationType={animationType}
				className="p-0 sm:max-w-md"
				onClick={(e) => e.stopPropagation()}
				showCloseButton={false}
			>
				<DialogHeader className="px-4 pt-4 pb-2">
					<DialogTitle className="flex items-center gap-3">
						<Smile className="h-5 w-5 text-yellow-500" />
						Choose an Emoji
					</DialogTitle>
				</DialogHeader>

				<div className="px-4 pb-4">
					<EmojiPicker onEmojiSelect={handleEmojiSelect}>
						<div /> {/* Trigger element - not used in overlay mode */}
					</EmojiPicker>
				</div>
			</DialogContent>
		</Dialog>
	);
}
