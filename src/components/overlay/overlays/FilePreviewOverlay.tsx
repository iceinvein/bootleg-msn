/**
 * FilePreviewOverlay Component
 *
 * A file preview dialog overlay that displays file content.
 * This component renders as a modal dialog with file preview.
 */

import { File } from "lucide-react";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import type { FilePreviewOverlayProps } from "@/types/overlay";

/**
 * FilePreviewOverlay component that renders the file preview dialog
 *
 * @example
 * ```tsx
 * // Usage through overlay system
 * const { open } = useOverlays();
 *
 * const previewFile = () => {
 *   open({
 *     type: "FILE_PREVIEW",
 *     props: {
 *       fileId: "file-123",
 *       fileName: "document.pdf",
 *       fileUrl: "https://example.com/file.pdf",
 *     },
 *   });
 * };
 * ```
 */
export function FilePreviewOverlay({
	fileId,
	fileName,
	fileUrl,
	onClose,
	glass = false,
	animationType = "scale",
}: FilePreviewOverlayProps) {
	return (
		<Dialog open={true} onOpenChange={(open) => !open && onClose?.()}>
			<DialogContent
				glass={glass}
				animationType={animationType}
				className="max-h-[90vh] sm:max-w-4xl"
				onClick={(e) => e.stopPropagation()}
			>
				<DialogHeader>
					<DialogTitle className="flex items-center gap-3">
						<File className="h-5 w-5 text-blue-500" />
						{fileName || "File Preview"}
					</DialogTitle>
					<DialogDescription>Preview file content.</DialogDescription>
				</DialogHeader>

				<div className="flex min-h-[400px] items-center justify-center py-4">
					<p className="text-muted-foreground text-sm">
						File preview functionality will be implemented here.
						<br />
						File ID: {fileId}
						<br />
						File URL: {fileUrl}
					</p>
				</div>
			</DialogContent>
		</Dialog>
	);
}
