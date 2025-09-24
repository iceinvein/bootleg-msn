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
export type BaseOverlayProps = {
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
};

/**
 * Props specific to confirmation dialogs
 */
export type ConfirmOverlayProps = BaseOverlayProps & {
	/** Confirmation message */
	message: string;
	/** Variant of the confirmation dialog */
	variant?: "info" | "warning" | "error" | "success";
	/** Text for the confirm button */
	confirmText?: string;
	/** Text for the cancel button */
	cancelText?: string;
	/** Callback when user confirms */
	onConfirm?: () => void | Promise<void>;
	/** Callback when user cancels */
	onCancel?: () => void;
	/** Callback when overlay closes */
	onClose?: () => void;
};

/**
 * Props specific to information dialogs
 */
export type InfoOverlayProps = BaseOverlayProps & {
	/** Information content */
	content?: string;
	/** Custom content as React node */
	children?: React.ReactNode;
	/** Text for the action button */
	buttonText?: string;
	/** Callback when user clicks action button */
	onAction?: () => void | Promise<void>;
	/** Callback when overlay closes */
	onClose?: () => void;
};

/**
 * Props specific to settings dialogs
 */
export type SettingsOverlayProps = BaseOverlayProps & {
	/** Initial tab to show */
	initialTab?: string;
	/** Callback when overlay closes */
	onClose?: () => void;
};

/**
 * User data structure for editing
 */
export type UserData = {
	name?: string;
	email?: string;
	avatar?: string;
};

/**
 * Props specific to user edit forms
 */
export type EditUserOverlayProps = BaseOverlayProps & {
	/** ID of the user to edit */
	userId: string;
	/** Initial user data */
	initialData?: UserData;
	/** Callback when user data is updated */
	onUserUpdated?: (userData: UserData) => void | Promise<void>;
	/** Callback when overlay closes */
	onClose?: () => void;
};

/**
 * Props specific to info sheets
 */
export type SheetOverlayProps = BaseOverlayProps & {
	/** Content to display in the sheet */
	content?: string;
	/** Custom content as React node */
	children?: React.ReactNode;
	/** Side to show the sheet from */
	side?: "top" | "right" | "bottom" | "left";
	/** Callback when overlay closes */
	onClose?: () => void;
};

/**
 * Props specific to group creation dialogs
 */
export type CreateGroupOverlayProps = BaseOverlayProps & {
	/** Callback when group is created */
	onGroupCreated?: (group: unknown) => void | Promise<void>;
	/** Callback when overlay closes */
	onClose?: () => void;
};

/**
 * Props specific to user invitation dialogs
 */
export type InviteUsersOverlayProps = BaseOverlayProps & {
	/** ID of the group to invite users to */
	groupId?: string;
	/** Callback when users are invited */
	onUsersInvited?: (users: unknown[]) => void | Promise<void>;
	/** Callback when overlay closes */
	onClose?: () => void;
};

/**
 * Props specific to file preview dialogs
 */
export type FilePreviewOverlayProps = BaseOverlayProps & {
	/** ID of the file to preview */
	fileId: string;
	/** Name of the file */
	fileName?: string;
	/** URL of the file */
	fileUrl?: string;
	/** Callback when overlay closes */
	onClose?: () => void;
};

/**
 * Props specific to emoji picker overlays
 */
export type EmojiPickerOverlayProps = BaseOverlayProps & {
	/** Callback when emoji is selected */
	onEmojiSelect?: (emoji: string) => void;
	/** Callback when overlay closes */
	onClose?: () => void;
};

/**
 * Props specific to theme selector overlays
 */
export type ThemeSelectorOverlayProps = BaseOverlayProps & {
	/** Callback when theme is selected */
	onThemeSelect?: (theme: unknown) => void;
	/** Callback when overlay closes */
	onClose?: () => void;
};

/**
 * Union type of all possible overlay props
 */
export type OverlayProps =
	| ConfirmOverlayProps
	| InfoOverlayProps
	| SettingsOverlayProps
	| EditUserOverlayProps
	| SheetOverlayProps
	| CreateGroupOverlayProps
	| InviteUsersOverlayProps
	| FilePreviewOverlayProps
	| EmojiPickerOverlayProps
	| ThemeSelectorOverlayProps
	| BaseOverlayProps;

/**
 * Complete overlay entry that gets stored in the overlay stack
 */
export type OverlayEntry = {
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
};

/**
 * Configuration options for the overlay system
 */
export type OverlayConfig = {
	/** Maximum number of overlays that can be open simultaneously */
	maxStack?: number;
	/** Default animation type for overlays */
	defaultAnimation?: "scale" | "slideDown" | "fade";
	/** Whether to use glass effect by default */
	defaultGlass?: boolean;
	/** Whether overlays are closable by default */
	defaultClosable?: boolean;
};

/**
 * State of the overlay system
 */
export type OverlayState = {
	/** Stack of currently open overlays */
	stack: OverlayEntry[];
	/** Configuration options */
	config: OverlayConfig;
};

/**
 * Actions that can be performed on the overlay system
 */
export type OverlayActions = {
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
};

/**
 * Hook return type for useOverlays
 */
export type UseOverlaysReturn = OverlayActions & {
	/** Current overlay state */
	state: OverlayState;
	/** Whether any overlays are currently open */
	hasOpen: boolean;
	/** The topmost overlay, if any */
	topOverlay: OverlayEntry | null;
	/** Number of currently open overlays */
	count: number;
};
