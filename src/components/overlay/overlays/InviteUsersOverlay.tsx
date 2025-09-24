/**
 * InviteUsersOverlay Component
 *
 * A user invitation dialog overlay that allows users to invite others.
 * This component renders as a modal dialog with invitation form.
 */

import { UserPlus } from "lucide-react";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import type { InviteUsersOverlayProps } from "@/types/overlay";

/**
 * InviteUsersOverlay component that renders the user invitation dialog
 *
 * @example
 * ```tsx
 * // Usage through overlay system
 * const { open } = useOverlays();
 *
 * const inviteUsers = () => {
 *   open({
 *     type: "INVITE_USERS",
 *     props: {
 *       groupId: "group-123",
 *       onUsersInvited: (users) => console.log("Users invited:", users),
 *     },
 *   });
 * };
 * ```
 */
export function InviteUsersOverlay({
	groupId,
	onUsersInvited: _onUsersInvited,
	onClose,
	glass = false,
	animationType = "scale",
}: InviteUsersOverlayProps) {
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
						<UserPlus className="h-5 w-5 text-blue-500" />
						Invite Users
					</DialogTitle>
					<DialogDescription>Invite users to join the group.</DialogDescription>
				</DialogHeader>

				<div className="py-4">
					<p className="text-muted-foreground text-sm">
						User invitation functionality will be implemented here. Group ID:{" "}
						{groupId}
					</p>
				</div>
			</DialogContent>
		</Dialog>
	);
}
