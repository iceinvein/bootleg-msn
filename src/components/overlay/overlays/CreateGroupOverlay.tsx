/**
 * CreateGroupOverlay Component
 *
 * A group creation dialog overlay that allows users to create new groups.
 * This component renders as a modal dialog with group creation form.
 */

import { CreateGroupDialog } from "@/components/CreateGroupDialog";
import type { CreateGroupOverlayProps } from "@/types/overlay";

/**
 * CreateGroupOverlay component that renders the group creation dialog
 *
 * @example
 * ```tsx
 * // Usage through overlay system
 * const { open } = useOverlays();
 *
 * const createGroup = () => {
 *   open({
 *     type: "CREATE_GROUP",
 *     props: {
 *       onGroupCreated: (group) => console.log("Group created:", group),
 *     },
 *   });
 * };
 * ```
 */
export function CreateGroupOverlay({
	onGroupCreated: _onGroupCreated,
	onClose,
}: CreateGroupOverlayProps) {
	// Note: CreateGroupDialog handles group creation internally
	// The onGroupCreated callback is not currently supported by the dialog
	// TODO: Enhance CreateGroupDialog to support external callbacks
	return (
		<CreateGroupDialog
			open={true}
			onOpenChange={(o) => {
				if (!o) onClose?.();
			}}
		/>
	);
}
