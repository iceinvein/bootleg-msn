/**
 * EditUserOverlay Component
 *
 * A user editing dialog overlay that allows users to edit their profile.
 * This component renders as a modal dialog with user editing form.
 */

import { User } from "lucide-react";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import type { EditUserOverlayProps } from "@/types/overlay";

/**
 * EditUserOverlay component that renders the user editing dialog
 *
 * @example
 * ```tsx
 * // Usage through overlay system
 * const { open } = useOverlays();
 *
 * const editUser = () => {
 *   open({
 *     type: "EDIT_USER",
 *     props: {
 *       userId: "user-123",
 *       onUserUpdated: (user) => console.log("User updated:", user),
 *     },
 *   });
 * };
 * ```
 */
export function EditUserOverlay({
	userId,
	onUserUpdated: _onUserUpdated,
	onClose,
	glass = false,
	animationType = "scale",
}: EditUserOverlayProps) {
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
						<User className="h-5 w-5 text-blue-500" />
						Edit User Profile
					</DialogTitle>
					<DialogDescription>
						Update user information and settings.
					</DialogDescription>
				</DialogHeader>

				<div className="py-4">
					<p className="text-muted-foreground text-sm">
						User editing functionality will be implemented here. User ID:{" "}
						{userId}
					</p>
				</div>
			</DialogContent>
		</Dialog>
	);
}
