/**
 * SettingsOverlay Component
 *
 * A settings dialog overlay that allows users to configure application settings.
 * This component renders as a modal dialog with various settings sections.
 */

import { SettingsDialog } from "@/components/SettingsDialog";
import type { SettingsOverlayProps } from "@/types/overlay";

/**
 * SettingsOverlay component that renders the settings dialog
 *
 * @example
 * ```tsx
 * // Usage through overlay system
 * const { open } = useOverlays();
 *
 * const openSettings = () => {
 *   open({
 *     type: "SETTINGS",
 *     props: {
 *       initialTab: "account",
 *     },
 *   });
 * };
 * ```
 */
export function SettingsOverlay({
	initialTab = "account",
	onClose,
}: SettingsOverlayProps) {
	return (
		<SettingsDialog
			initialTab={initialTab}
			open={true}
			onOpenChange={(o) => {
				if (!o) onClose?.();
			}}
		/>
	);
}
