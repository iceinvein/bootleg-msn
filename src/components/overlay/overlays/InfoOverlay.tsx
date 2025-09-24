/**
 * InfoOverlay Component
 *
 * An information dialog overlay that displays content to the user.
 * This component renders as a modal dialog with customizable title, content, and actions.
 */

import { Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import type { InfoOverlayProps } from "@/types/overlay";

/**
 * InfoOverlay component that renders an information dialog
 *
 * @example
 * ```tsx
 * // Usage through overlay system
 * const { open } = useOverlays();
 *
 * const showInfo = () => {
 *   open({
 *     type: "INFO",
 *     props: {
 *       title: "Information",
 *       content: "This is some important information.",
 *       buttonText: "Got it",
 *       onAction: () => console.log("Info acknowledged"),
 *     },
 *   });
 * };
 * ```
 */
export function InfoOverlay({
	title = "Information",
	content,
	children,
	buttonText = "OK",
	onAction,
	onClose,
	glass = false,
	animationType = "scale",
}: InfoOverlayProps) {
	/**
	 * Handle action button click
	 */
	const handleAction = () => {
		onAction?.();
		onClose?.();
	};

	return (
		<Dialog open={true} onOpenChange={(open) => !open && onClose?.()}>
			<DialogContent
				glass={glass}
				animationType={animationType}
				className="sm:max-w-md"
				onClick={(e) => e.stopPropagation()}
			>
				<DialogHeader>
					<DialogTitle className="flex items-center gap-3">
						<Info className="h-5 w-5 text-blue-500" />
						{title}
					</DialogTitle>
					{content && (
						<DialogDescription className="text-left">
							{content}
						</DialogDescription>
					)}
				</DialogHeader>

				{children && <div className="py-4">{children}</div>}

				<DialogFooter>
					<Button onClick={handleAction} className="w-full sm:w-auto">
						{buttonText}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
