/**
 * ConfirmOverlay Component
 *
 * A confirmation dialog overlay that prompts the user to confirm or cancel an action.
 * This component renders as a modal dialog with customizable title, message, and buttons.
 */

import { AlertTriangle, CheckCircle, Info, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import type { ConfirmOverlayProps } from "@/types/overlay";

/**
 * Icon mapping for different confirmation types
 */
const CONFIRM_ICONS = {
	info: Info,
	warning: AlertTriangle,
	error: XCircle,
	success: CheckCircle,
} as const;

/**
 * Color mapping for different confirmation types
 */
const CONFIRM_COLORS = {
	info: "text-blue-500",
	warning: "text-yellow-500",
	error: "text-red-500",
	success: "text-green-500",
} as const;

/**
 * ConfirmOverlay component that renders a confirmation dialog
 *
 * @example
 * ```tsx
 * // Usage through overlay system
 * const { open } = useOverlays();
 *
 * const handleDelete = () => {
 *   open({
 *     type: "CONFIRM",
 *     props: {
 *       title: "Delete Item",
 *       message: "Are you sure you want to delete this item?",
 *       variant: "warning",
 *       confirmText: "Delete",
 *       cancelText: "Cancel",
 *       onConfirm: () => console.log("Confirmed!"),
 *       onCancel: () => console.log("Cancelled!"),
 *     },
 *   });
 * };
 * ```
 */
export function ConfirmOverlay({
	title = "Confirm Action",
	message,
	variant = "info",
	confirmText = "Confirm",
	cancelText = "Cancel",
	onConfirm,
	onCancel,
	onClose,
	glass = false,
	animationType = "scale",
}: ConfirmOverlayProps) {
	const IconComponent = CONFIRM_ICONS[variant];
	const iconColor = CONFIRM_COLORS[variant];

	/**
	 * Handle confirm button click
	 */
	const handleConfirm = () => {
		onConfirm?.();
		onClose?.();
	};

	/**
	 * Handle cancel button click
	 */
	const handleCancel = () => {
		onCancel?.();
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
						<IconComponent className={`h-5 w-5 ${iconColor}`} />
						{title}
					</DialogTitle>
					{message && (
						<DialogDescription className="text-left">
							{message}
						</DialogDescription>
					)}
				</DialogHeader>

				<DialogFooter className="flex-col-reverse gap-2 sm:flex-row sm:gap-2">
					<Button
						variant="outline"
						onClick={handleCancel}
						className="w-full sm:w-auto"
					>
						{cancelText}
					</Button>
					<Button
						variant={variant === "error" ? "destructive" : "default"}
						onClick={handleConfirm}
						className="w-full sm:w-auto"
					>
						{confirmText}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
