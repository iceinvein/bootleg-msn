/**
 * Overlay System Exports
 *
 * This file provides a centralized export point for all overlay-related components,
 * hooks, and utilities.
 */

// Re-export overlay types from the main types file
export type {
	BaseOverlayProps,
	ConfirmOverlayProps,
	CreateGroupOverlayProps,
	EditUserOverlayProps,
	EmojiPickerOverlayProps,
	FilePreviewOverlayProps,
	InfoOverlayProps,
	InviteUsersOverlayProps,
	OverlayEntry,
	OverlayId,
	OverlayProps,
	OverlayType,
	SettingsOverlayProps,
	SheetOverlayProps,
	ThemeSelectorOverlayProps,
} from "@/types/overlay";
// Re-export types for convenience
export type {
	OverlayHostConfig,
	OverlayHostProps,
} from "./OverlayHost";
// Main overlay components
export { OverlayHost, useOverlayHost } from "./OverlayHost";
export type { OverlayRendererProps } from "./OverlayRenderer";
export {
	getSupportedOverlayTypes,
	isOverlayTypeSupported,
	OverlayRenderer,
} from "./OverlayRenderer";
// Individual overlay components
export { ConfirmOverlay } from "./overlays/ConfirmOverlay";
export { CreateGroupOverlay } from "./overlays/CreateGroupOverlay";
export { EditUserOverlay } from "./overlays/EditUserOverlay";
export { EmojiPickerOverlay } from "./overlays/EmojiPickerOverlay";
export { FilePreviewOverlay } from "./overlays/FilePreviewOverlay";
export { InfoOverlay } from "./overlays/InfoOverlay";
export { InviteUsersOverlay } from "./overlays/InviteUsersOverlay";
export { SettingsOverlay } from "./overlays/SettingsOverlay";
export { SheetOverlay } from "./overlays/SheetOverlay";
export { ThemeSelectorOverlay } from "./overlays/ThemeSelectorOverlay";
