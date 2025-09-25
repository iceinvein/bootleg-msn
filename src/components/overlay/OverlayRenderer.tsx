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
import { useOverlayUrl } from "@/hooks/useOverlayUrl";
import { cn } from "@/lib/utils";
import type { OverlayEntry, OverlayType } from "@/types/overlay";

// Import overlay components
import { AddContactOverlay } from "./overlays/AddContactOverlay";
import { AddMembersOverlay } from "./overlays/AddMembersOverlay";
import { AvatarEditorOverlay } from "./overlays/AvatarEditorOverlay";
import { ConfirmOverlay } from "./overlays/ConfirmOverlay";
import { ContactRequestsOverlay } from "./overlays/ContactRequestsOverlay";
import { CreateGroupOverlay } from "./overlays/CreateGroupOverlay";
import { EditUserOverlay } from "./overlays/EditUserOverlay";
import { EmojiPickerOverlay } from "./overlays/EmojiPickerOverlay";
import { FilePreviewOverlay } from "./overlays/FilePreviewOverlay";
import { GroupInfoOverlay } from "./overlays/GroupInfoOverlay";
import { InfoOverlay } from "./overlays/InfoOverlay";
import { InviteUsersOverlay } from "./overlays/InviteUsersOverlay";
import { ScreenCrackOverlay } from "./overlays/ScreenCrackOverlay";
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
	ADD_CONTACT: AddContactOverlay as OverlayComponent,
	EDIT_USER: EditUserOverlay as OverlayComponent,
	SHEET: SheetOverlay as OverlayComponent,
	INVITE_USERS: InviteUsersOverlay as OverlayComponent,
	FILE_PREVIEW: FilePreviewOverlay as OverlayComponent,
	EMOJI_PICKER: EmojiPickerOverlay as OverlayComponent,
	THEME_SELECTOR: ThemeSelectorOverlay as OverlayComponent,
	GROUP_INFO: GroupInfoOverlay as OverlayComponent,
	ADD_MEMBERS: AddMembersOverlay as OverlayComponent,
	CONTACT_REQUESTS: ContactRequestsOverlay as OverlayComponent,
	AVATAR_EDITOR: AvatarEditorOverlay as OverlayComponent,
	SCREEN_CRACK: ScreenCrackOverlay as OverlayComponent,
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
	 * Note: URL clearing is handled automatically by the bidirectional sync system
	 */
	// Use URL helpers without enabling auto-sync here to avoid competing effects
	const { clearUrl, hasUrlOverlay } = useOverlayUrl({
		autoSync: false,
		replaceHistory: true,
	});

	const handleClose = useCallback(() => {
		// First remove from overlay stack synchronously
		close(entry.id);
		// Then clear URL if this overlay persisted in URL and URL currently has overlay params
		if (entry.persistInUrl && hasUrlOverlay()) {
			clearUrl({ replace: true });
		}
	}, [close, entry.id, entry.persistInUrl, clearUrl, hasUrlOverlay]);

	/**
	 * Handle backdrop click (close if closable)
	 */
	// Backdrop click handled by individual overlay components (e.g., Dialog/Drawer)

	/**
	 * Handle escape key press
	 */
	// Escape key handling is provided by overlay components; avoid double-handling here

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
				// Do not intercept clicks; overlay components handle interactions
				"pointer-events-none",
			)}
			style={{ zIndex }}
			variants={overlayVariants}
			initial="initial"
			animate="animate"
			exit="exit"
			transition={{ duration: 0.2 }}
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
