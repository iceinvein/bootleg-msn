/**
 * ThemeSelectorOverlay Component
 *
 * A theme selection dialog overlay that allows users to choose themes.
 * This component renders as a modal dialog with theme options.
 */

import { Palette } from "lucide-react";
import { ThemeCustomizer } from "@/components/ThemeCustomizer";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import type { ThemeSelectorOverlayProps } from "@/types/overlay";

/**
 * ThemeSelectorOverlay component that renders the theme selector
 *
 * @example
 * ```tsx
 * // Usage through overlay system
 * const { open } = useOverlays();
 *
 * const openThemeSelector = () => {
 *   open({
 *     type: "THEME_SELECTOR",
 *     props: {
 *       onThemeSelect: (theme) => console.log("Selected theme:", theme),
 *     },
 *   });
 * };
 * ```
 */
export function ThemeSelectorOverlay({
	onThemeSelect: _onThemeSelect,
	onClose,
	glass = false,
	animationType = "scale",
}: ThemeSelectorOverlayProps) {
	return (
		<Dialog open={true} onOpenChange={(open) => !open && onClose?.()}>
			<DialogContent
				glass={glass}
				animationType={animationType}
				className="max-h-[90vh] sm:max-w-2xl"
				onClick={(e) => e.stopPropagation()}
			>
				<DialogHeader>
					<DialogTitle className="flex items-center gap-3">
						<Palette className="h-5 w-5 text-purple-500" />
						Choose Theme
					</DialogTitle>
					<DialogDescription>
						Select and customize your preferred theme.
					</DialogDescription>
				</DialogHeader>

				<div className="py-4">
					<ThemeCustomizer />
				</div>
			</DialogContent>
		</Dialog>
	);
}
