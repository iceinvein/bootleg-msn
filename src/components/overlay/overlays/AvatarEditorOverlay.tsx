import { AvatarEditor } from "@/components/AvatarEditor";
import type { AvatarEditorOverlayProps } from "@/types/overlay";

export function AvatarEditorOverlay({
	entity,
	currentAvatarUrl,
	previewShape = "circle",
	onClose,
}: AvatarEditorOverlayProps & { onClose?: () => void }) {
	return (
		<AvatarEditor
			open={true}
			onOpenChange={(open) => {
				if (!open) onClose?.();
			}}
			entity={entity}
			currentAvatarUrl={currentAvatarUrl}
			previewShape={previewShape}
		/>
	);
}
