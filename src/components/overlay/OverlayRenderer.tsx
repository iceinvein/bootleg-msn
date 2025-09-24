/**
 * OverlayRenderer Component
 *
 * This component handles rendering individual overlay entries based on their type.
 * It maps overlay types to their corresponding React components and handles
 * the rendering logic, animations, and event handling.
 */

import { motion } from "framer-motion";
import { useCallback } from "react";
import { useOverlays } from "@/hooks/useOverlays";
import { cn } from "@/lib/utils";
import type { OverlayEntry, OverlayType } from "@/types/overlay";

// Import overlay components
import { ConfirmOverlay } from "./overlays/ConfirmOverlay";
import { CreateGroupOverlay } from "./overlays/CreateGroupOverlay";
import { EditUserOverlay } from "./overlays/EditUserOverlay";
import { EmojiPickerOverlay } from "./overlays/EmojiPickerOverlay";
import { FilePreviewOverlay } from "./overlays/FilePreviewOverlay";
import { InfoOverlay } from "./overlays/InfoOverlay";
import { InviteUsersOverlay } from "./overlays/InviteUsersOverlay";
import { SettingsOverlay } from "./overlays/SettingsOverlay";
import { SheetOverlay } from "./overlays/SheetOverlay";
import { ThemeSelectorOverlay } from "./overlays/ThemeSelectorOverlay";

/**
 * Props for the OverlayRenderer component
 */
export type OverlayRendererProps = {
	/** The overlay entry to render */
	entry: OverlayEntry;
	/** Z-index for this overlay */
	zIndex: number;
	/** Whether this is the topmost overlay */
	isTopmost: boolean;
};

/**
 * Type for overlay component that accepts any props (we'll type-cast when using)
 * Each overlay component has different prop requirements, but they all accept
 * the common injected props (id, type, onClose, isTopmost, createdAt)
 */
type OverlayComponent = React.ComponentType<Record<string, unknown>>;

/**
 * Mapping of overlay types to their corresponding React components
 * Note: We use type assertion here because each component has different prop requirements
 * but they all accept the common injected props from OverlayComponentInjectedProps
 */
const OVERLAY_COMPONENTS: Record<OverlayType, OverlayComponent> = {
	CONFIRM: ConfirmOverlay as OverlayComponent,
	INFO: InfoOverlay as OverlayComponent,
	SETTINGS: SettingsOverlay as OverlayComponent,
	CREATE_GROUP: CreateGroupOverlay as OverlayComponent,
	EDIT_USER: EditUserOverlay as OverlayComponent,
	SHEET: SheetOverlay as OverlayComponent,
	INVITE_USERS: InviteUsersOverlay as OverlayComponent,
	FILE_PREVIEW: FilePreviewOverlay as OverlayComponent,
	EMOJI_PICKER: EmojiPickerOverlay as OverlayComponent,
	THEME_SELECTOR: ThemeSelectorOverlay as OverlayComponent,
};

/**
 * Animation variants for overlay container
 */
const overlayVariants = {
	initial: { opacity: 0 },
	animate: { opacity: 1 },
	exit: { opacity: 0 },
};

/**
 * OverlayRenderer component that renders a single overlay
 *
 * This component:
 * - Maps overlay types to their corresponding components
 * - Handles overlay-specific props and configuration
 * - Manages animations and z-index stacking
 * - Provides common overlay functionality (close, backdrop, etc.)
 *
 * @example
 * ```tsx
 * <OverlayRenderer
 *   entry={overlayEntry}
 *   zIndex={1000}
 *   isTopmost={true}
 * />
 * ```
 */
export function OverlayRenderer({
	entry,
	zIndex,
	isTopmost,
}: OverlayRendererProps) {
	const { close } = useOverlays();

	/**
	 * Handle overlay close
	 */
	const handleClose = useCallback(() => {
		close(entry.id);
	}, [close, entry.id]);

	/**
	 * Handle backdrop click (close if closable)
	 */
	const handleBackdropClick = useCallback(
		(event: React.MouseEvent) => {
			// Only close if clicking the backdrop itself, not child elements
			// Default to closable=true if not specified
			const isClosable = entry.props?.closable !== false;
			if (event.target === event.currentTarget && isClosable) {
				handleClose();
			}
		},
		[handleClose, entry.props?.closable],
	);

	/**
	 * Handle escape key press
	 */
	const handleKeyDown = useCallback(
		(event: React.KeyboardEvent) => {
			// Default to closable=true if not specified
			const isClosable = entry.props?.closable !== false;
			if (event.key === "Escape" && isClosable && isTopmost) {
				handleClose();
			}
		},
		[handleClose, entry.props?.closable, isTopmost],
	);

	// Get the component for this overlay type
	const OverlayComponent = OVERLAY_COMPONENTS[entry.type];

	if (!OverlayComponent) {
		console.error(`[OverlayRenderer] Unknown overlay type: ${entry.type}`);
		return null;
	}

	// Prepare props for the overlay component
	const overlayProps = {
		...entry.props,
		id: entry.id,
		type: entry.type,
		onClose: handleClose,
		isTopmost,
		createdAt: entry.createdAt,
	};

	return (
		<motion.div
			className={cn(
				"fixed inset-0 flex items-center justify-center",
				// Ensure proper stacking
				"pointer-events-auto",
			)}
			style={{ zIndex }}
			variants={overlayVariants}
			initial="initial"
			animate="animate"
			exit="exit"
			transition={{ duration: 0.2 }}
			onClick={handleBackdropClick}
			onKeyDown={handleKeyDown}
			tabIndex={-1}
			data-overlay-id={entry.id}
			data-overlay-type={entry.type}
			data-overlay-topmost={isTopmost}
		>
			<OverlayComponent {...overlayProps} />
		</motion.div>
	);
}

/**
 * Utility function to check if an overlay type is supported
 */
export function isOverlayTypeSupported(type: string): type is OverlayType {
	return type in OVERLAY_COMPONENTS;
}

/**
 * Utility function to get all supported overlay types
 */
export function getSupportedOverlayTypes(): OverlayType[] {
	return Object.keys(OVERLAY_COMPONENTS) as OverlayType[];
}
