/**
 * Overlay system types and interfaces
 *
 * This file defines the core types used throughout the overlay system,
 * including overlay types, entries, and configuration options.
 */

/**
 * Available overlay types that can be rendered by the system
 */
export type OverlayType =
	| "CONFIRM" // Confirmation dialog
	| "EDIT_USER" // User edit form
	| "SHEET" // Info sheet/drawer
	| "SETTINGS" // Settings dialog
	| "INFO" // Information dialog
	| "CREATE_GROUP" // Group creation form
	| "INVITE_USERS" // User invitation dialog
	| "FILE_PREVIEW" // File preview modal
	| "EMOJI_PICKER" // Emoji picker overlay
	| "THEME_SELECTOR"; // Theme selection dialog

/**
 * Unique identifier for overlay instances
 */
export type OverlayId = string;

/**
 * Base properties that can be passed to any overlay
 */
export interface BaseOverlayProps {
	/** Optional title for the overlay */
	title?: string;
	/** Optional description or subtitle */
	description?: string;
	/** Whether the overlay can be closed by clicking outside or pressing escape */
	closable?: boolean;
	/** Custom CSS classes to apply */
	className?: string;
	/** Whether to use glass/blur effect */
	glass?: boolean;
	/** Animation type for the overlay */
	animationType?: "scale" | "slideDown" | "fade";
}

/**
 * Props specific to confirmation dialogs
 */
export interface ConfirmOverlayProps extends BaseOverlayProps {
	/** Confirmation message */
	message: string;
	/** Text for the confirm button */
	confirmText?: string;
	/** Text for the cancel button */
	cancelText?: string;
	/** Variant of the confirm button */
	confirmVariant?: "default" | "destructive" | "outline" | "secondary";
	/** Callback when user confirms */
	onConfirm?: () => void | Promise<void>;
	/** Callback when user cancels */
	onCancel?: () => void;
}

/**
 * User data structure for editing
 */
export interface UserData {
	name?: string;
	email?: string;
	avatar?: string;
}

/**
 * Props specific to user edit forms
 */
export interface EditUserOverlayProps extends BaseOverlayProps {
	/** ID of the user to edit */
	userId: string;
	/** Initial user data */
	initialData?: UserData;
	/** Callback when user data is saved */
	onSave?: (userData: UserData) => void | Promise<void>;
}

/**
 * Props specific to info sheets
 */
export interface SheetOverlayProps extends BaseOverlayProps {
	/** Content to display in the sheet */
	content: React.ReactNode;
	/** Side to show the sheet from */
	side?: "top" | "right" | "bottom" | "left";
}

/**
 * Union type of all possible overlay props
 */
export type OverlayProps =
	| ConfirmOverlayProps
	| EditUserOverlayProps
	| SheetOverlayProps
	| BaseOverlayProps;

/**
 * Complete overlay entry that gets stored in the overlay stack
 */
export interface OverlayEntry {
	/** Unique identifier for this overlay instance */
	id: OverlayId;
	/** Type of overlay to render */
	type: OverlayType;
	/** Props to pass to the overlay component */
	props?: OverlayProps;
	/** Timestamp when the overlay was created */
	createdAt: number;
	/** Whether this overlay should be persisted in URL */
	persistInUrl?: boolean;
}

/**
 * Configuration options for the overlay system
 */
export interface OverlayConfig {
	/** Maximum number of overlays that can be open simultaneously */
	maxStack?: number;
	/** Default animation type for overlays */
	defaultAnimation?: "scale" | "slideDown" | "fade";
	/** Whether to use glass effect by default */
	defaultGlass?: boolean;
	/** Whether overlays are closable by default */
	defaultClosable?: boolean;
}

/**
 * State of the overlay system
 */
export interface OverlayState {
	/** Stack of currently open overlays */
	stack: OverlayEntry[];
	/** Configuration options */
	config: OverlayConfig;
}

/**
 * Actions that can be performed on the overlay system
 */
export interface OverlayActions {
	/** Open a new overlay */
	open: (entry: Omit<OverlayEntry, "id" | "createdAt">) => OverlayId;
	/** Close an overlay by ID */
	close: (id: OverlayId) => void;
	/** Close the topmost overlay */
	closeTop: () => void;
	/** Close all overlays */
	closeAll: () => void;
	/** Replace the topmost overlay with a new one */
	replaceTop: (entry: Omit<OverlayEntry, "id" | "createdAt">) => OverlayId;
	/** Update the props of an existing overlay */
	updateProps: (id: OverlayId, props: Partial<OverlayProps>) => void;
	/** Check if an overlay with the given ID exists */
	exists: (id: OverlayId) => boolean;
	/** Get an overlay by ID */
	getById: (id: OverlayId) => OverlayEntry | undefined;
}

/**
 * Hook return type for useOverlays
 */
export interface UseOverlaysReturn extends OverlayActions {
	/** Current overlay state */
	state: OverlayState;
	/** Whether any overlays are currently open */
	hasOpen: boolean;
	/** The topmost overlay, if any */
	topOverlay: OverlayEntry | null;
	/** Number of currently open overlays */
	count: number;
}
