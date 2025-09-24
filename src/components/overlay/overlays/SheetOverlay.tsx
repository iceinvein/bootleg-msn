/**
 * SheetOverlay Component
 *
 * A sheet/drawer overlay that slides in from the side or bottom.
 * This component renders as a drawer with customizable content.
 */

import { FileText } from "lucide-react";
import {
	Drawer,
	DrawerContent,
	DrawerDescription,
	DrawerHeader,
	DrawerTitle,
} from "@/components/ui/drawer";
import type { SheetOverlayProps } from "@/types/overlay";

/**
 * SheetOverlay component that renders a sheet/drawer
 *
 * @example
 * ```tsx
 * // Usage through overlay system
 * const { open } = useOverlays();
 *
 * const openSheet = () => {
 *   open({
 *     type: "SHEET",
 *     props: {
 *       title: "Information Sheet",
 *       content: "This is sheet content",
 *       side: "bottom",
 *     },
 *   });
 * };
 * ```
 */
export function SheetOverlay({
	title = "Sheet",
	content,
	children,
	side: _side = "bottom",
	onClose,
}: SheetOverlayProps) {
	return (
		<Drawer open={true} onOpenChange={(open) => !open && onClose?.()}>
			<DrawerContent onClick={(e) => e.stopPropagation()}>
				<DrawerHeader>
					<DrawerTitle className="flex items-center gap-3">
						<FileText className="h-5 w-5 text-blue-500" />
						{title}
					</DrawerTitle>
					{content && <DrawerDescription>{content}</DrawerDescription>}
				</DrawerHeader>

				<div className="px-4 pb-4">
					{children || (
						<p className="text-muted-foreground text-sm">
							Sheet content will be displayed here.
						</p>
					)}
				</div>
			</DrawerContent>
		</Drawer>
	);
}
