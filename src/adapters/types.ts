/**
 * Platform-Specific Host Adapter Types
 *
 * This file defines the interfaces and types for platform-specific
 * overlay behavior across Web, Capacitor, and Tauri environments.
 */

/**
 * Supported platforms for overlay system
 */
export type Platform = "web" | "capacitor" | "tauri";

/**
 * Platform capabilities and features
 */
export interface PlatformCapabilities {
	/** Whether the platform supports hardware back button */
	hasHardwareBackButton: boolean;
	/** Whether the platform supports system-level overlays */
	hasSystemOverlays: boolean;
	/** Whether the platform supports deep linking */
	hasDeepLinking: boolean;
	/** Whether the platform supports native sharing */
	hasNativeSharing: boolean;
	/** Whether the platform supports keyboard shortcuts */
	hasKeyboardShortcuts: boolean;
	/** Whether the platform supports window management */
	hasWindowManagement: boolean;
}

/**
 * Platform-specific event handlers
 */
export interface PlatformEventHandlers {
	/** Handle hardware back button press */
	onBackButton?: () => boolean | Promise<boolean>;
	/** Handle escape key press */
	onEscapeKey?: () => boolean | Promise<boolean>;
	/** Handle deep link activation */
	onDeepLink?: (url: string) => void | Promise<void>;
	/** Handle app pause/resume */
	onAppStateChange?: (state: "active" | "background" | "inactive") => void;
	/** Handle window focus/blur */
	onWindowFocus?: (focused: boolean) => void;
}

/**
 * Platform adapter configuration
 */
export interface PlatformAdapterConfig {
	/** Platform type */
	platform: Platform;
	/** Platform capabilities */
	capabilities: PlatformCapabilities;
	/** Event handlers */
	handlers: PlatformEventHandlers;
	/** Whether to prevent default platform behavior */
	preventDefaults?: boolean;
	/** Debug logging enabled */
	debug?: boolean;
}

/**
 * Platform adapter interface
 */
export interface PlatformAdapter {
	/** Platform type */
	readonly platform: Platform;
	/** Platform capabilities */
	readonly capabilities: PlatformCapabilities;
	/** Whether the adapter is initialized */
	readonly isInitialized: boolean;

	/** Initialize the platform adapter */
	initialize(): Promise<void>;
	/** Cleanup the platform adapter */
	cleanup(): void;
	/** Register event handlers */
	registerHandlers(handlers: PlatformEventHandlers): void;
	/** Unregister event handlers */
	unregisterHandlers(): void;
	/** Handle back navigation */
	handleBack(): boolean | Promise<boolean>;
	/** Handle escape key */
	handleEscape(): boolean | Promise<boolean>;
	/** Share content natively */
	share?(content: {
		title?: string;
		text?: string;
		url?: string;
	}): Promise<boolean>;
	/** Open deep link */
	openDeepLink?(url: string): Promise<boolean>;
}

/**
 * Back button handling result
 */
export type BackButtonResult =
	| "handled" // Back button was handled by overlay system
	| "ignored" // Back button was ignored, let platform handle it
	| "prevented"; // Back button was prevented from default behavior

/**
 * Platform detection result
 */
export interface PlatformDetection {
	/** Detected platform */
	platform: Platform;
	/** Platform version/info */
	version?: string;
	/** User agent string */
	userAgent?: string;
	/** Whether running in development mode */
	isDevelopment: boolean;
	/** Additional platform-specific data */
	metadata?: Record<string, unknown>;
}

/**
 * Overlay platform behavior configuration
 */
export interface OverlayPlatformBehavior {
	/** Whether overlays should close on back button */
	closeOnBack: boolean;
	/** Whether overlays should close on escape key */
	closeOnEscape: boolean;
	/** Whether to prevent default back button behavior */
	preventDefaultBack: boolean;
	/** Whether to prevent default escape key behavior */
	preventDefaultEscape: boolean;
	/** Animation preferences for the platform */
	preferredAnimation?: "scale" | "slideDown" | "fade" | "slide";
	/** Whether to use native transitions */
	useNativeTransitions?: boolean;
}

/**
 * Platform-specific overlay configuration
 */
export interface PlatformOverlayConfig {
	/** Web-specific configuration */
	web: OverlayPlatformBehavior;
	/** Capacitor-specific configuration */
	capacitor: OverlayPlatformBehavior;
	/** Tauri-specific configuration */
	tauri: OverlayPlatformBehavior;
}

/**
 * Default platform behaviors
 */
export const DEFAULT_PLATFORM_BEHAVIORS: PlatformOverlayConfig = {
	web: {
		closeOnBack: true,
		closeOnEscape: true,
		preventDefaultBack: false,
		preventDefaultEscape: true,
		preferredAnimation: "scale",
		useNativeTransitions: false,
	},
	capacitor: {
		closeOnBack: true,
		closeOnEscape: false,
		preventDefaultBack: true,
		preventDefaultEscape: false,
		preferredAnimation: "slideDown",
		useNativeTransitions: true,
	},
	tauri: {
		closeOnBack: true,
		closeOnEscape: true,
		preventDefaultBack: false,
		preventDefaultEscape: true,
		preferredAnimation: "scale",
		useNativeTransitions: false,
	},
};

/**
 * Platform adapter factory function type
 */
export type PlatformAdapterFactory = (
	config: Partial<PlatformAdapterConfig>,
) => PlatformAdapter;
