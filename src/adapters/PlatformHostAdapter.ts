/**
 * Platform Host Adapter
 *
 * This is the main adapter that integrates platform-specific behavior
 * with the overlay system, providing a unified interface for handling
 * back buttons, escape keys, and other platform events.
 */

import { createPlatformAdapter } from "./PlatformAdapterFactory";
import { getPlatformConfig } from "./platformDetection";
import type {
	BackButtonResult,
	OverlayPlatformBehavior,
	Platform,
	PlatformAdapter,
	PlatformAdapterConfig,
	PlatformEventHandlers,
} from "./types";
import { DEFAULT_PLATFORM_BEHAVIORS } from "./types";

/**
 * Configuration for the platform host adapter
 */
export interface PlatformHostAdapterConfig {
	/** Platform adapter configuration */
	adapterConfig?: Partial<PlatformAdapterConfig>;
	/** Platform-specific overlay behaviors */
	overlayBehaviors?: Partial<
		Record<Platform, Partial<OverlayPlatformBehavior>>
	>;
	/** Whether to auto-initialize on creation */
	autoInitialize?: boolean;
	/** Debug logging */
	debug?: boolean;
}

/**
 * Overlay system integration callbacks
 */
export interface OverlaySystemCallbacks {
	/** Check if any overlays are open */
	hasOpenOverlays: () => boolean;
	/** Get the number of open overlays */
	getOverlayCount: () => number;
	/** Close the top overlay */
	closeTopOverlay: () => boolean;
	/** Close all overlays */
	closeAllOverlays: () => void;
	/** Handle URL-based overlay opening */
	handleUrlOverlay?: (url: string) => void;
}

/**
 * Platform host adapter that bridges platform events with overlay system
 */
export class PlatformHostAdapter {
	private adapter: PlatformAdapter;
	private overlayCallbacks?: OverlaySystemCallbacks;
	private config: PlatformHostAdapterConfig;
	private overlayBehavior: OverlayPlatformBehavior;
	private isInitialized = false;

	constructor(config: PlatformHostAdapterConfig = {}) {
		this.config = {
			autoInitialize: true,
			debug: false,
			...config,
		};

		// Create the platform adapter
		this.adapter = createPlatformAdapter(this.config.adapterConfig);

		// Get platform-specific overlay behavior
		this.overlayBehavior = this.getOverlayBehavior();

		// Auto-initialize if requested
		if (this.config.autoInitialize) {
			this.initialize().catch((error) => {
				this.log("Auto-initialization failed:", error);
			});
		}
	}

	/**
	 * Get the current platform
	 */
	public get platform(): Platform {
		return this.adapter.platform;
	}

	/**
	 * Get platform capabilities
	 */
	public get capabilities() {
		return this.adapter.capabilities;
	}

	/**
	 * Check if the adapter is initialized
	 */
	public get initialized(): boolean {
		return this.isInitialized && this.adapter.isInitialized;
	}

	/**
	 * Initialize the platform host adapter
	 */
	public async initialize(): Promise<void> {
		if (this.isInitialized) {
			return;
		}

		try {
			// Initialize the platform adapter
			await this.adapter.initialize();

			// Register event handlers
			this.registerEventHandlers();

			this.isInitialized = true;
			this.log("Platform host adapter initialized for", this.platform);
		} catch (error) {
			this.log("Failed to initialize platform host adapter:", error);
			throw error;
		}
	}

	/**
	 * Cleanup the platform host adapter
	 */
	public cleanup(): void {
		if (!this.isInitialized) {
			return;
		}

		try {
			this.adapter.cleanup();
			this.overlayCallbacks = undefined;
			this.isInitialized = false;
			this.log("Platform host adapter cleaned up");
		} catch (error) {
			this.log("Error during cleanup:", error);
		}
	}

	/**
	 * Connect to the overlay system
	 */
	public connectOverlaySystem(callbacks: OverlaySystemCallbacks): void {
		this.overlayCallbacks = callbacks;
		this.log("Connected to overlay system");
	}

	/**
	 * Disconnect from the overlay system
	 */
	public disconnectOverlaySystem(): void {
		this.overlayCallbacks = undefined;
		this.log("Disconnected from overlay system");
	}

	/**
	 * Handle back button/navigation
	 */
	public async handleBack(): Promise<BackButtonResult> {
		if (!this.overlayCallbacks || !this.overlayBehavior.closeOnBack) {
			return "ignored";
		}

		// Check if we have overlays to close
		if (this.overlayCallbacks.hasOpenOverlays()) {
			const closed = this.overlayCallbacks.closeTopOverlay();
			this.log("Back button closed overlay:", closed);

			if (closed) {
				return this.overlayBehavior.preventDefaultBack
					? "prevented"
					: "handled";
			}
		}

		return "ignored";
	}

	/**
	 * Handle escape key
	 */
	public async handleEscape(): Promise<BackButtonResult> {
		if (!this.overlayCallbacks || !this.overlayBehavior.closeOnEscape) {
			return "ignored";
		}

		// Check if we have overlays to close
		if (this.overlayCallbacks.hasOpenOverlays()) {
			const closed = this.overlayCallbacks.closeTopOverlay();
			this.log("Escape key closed overlay:", closed);

			if (closed) {
				return this.overlayBehavior.preventDefaultEscape
					? "prevented"
					: "handled";
			}
		}

		return "ignored";
	}

	/**
	 * Handle deep link
	 */
	public handleDeepLink(url: string): void {
		this.log("Deep link received:", url);

		if (this.overlayCallbacks?.handleUrlOverlay) {
			this.overlayCallbacks.handleUrlOverlay(url);
		}
	}

	/**
	 * Handle app state changes
	 */
	public handleAppStateChange(
		state: "active" | "background" | "inactive",
	): void {
		this.log("App state changed:", state);

		// Close overlays when app goes to background (optional behavior)
		if (state === "background" && this.overlayCallbacks) {
			const overlayCount = this.overlayCallbacks.getOverlayCount();
			if (overlayCount > 0) {
				this.log("Closing overlays due to app backgrounding");
				this.overlayCallbacks.closeAllOverlays();
			}
		}
	}

	/**
	 * Handle window focus changes
	 */
	public handleWindowFocus(focused: boolean): void {
		this.log("Window focus changed:", focused);
		// Could implement focus-based overlay behavior here
	}

	/**
	 * Share content using platform-specific sharing
	 */
	public async share(content: {
		title?: string;
		text?: string;
		url?: string;
	}): Promise<boolean> {
		if (this.adapter.share) {
			return await this.adapter.share(content);
		}
		return false;
	}

	/**
	 * Open deep link using platform-specific method
	 */
	public async openDeepLink(url: string): Promise<boolean> {
		if (this.adapter.openDeepLink) {
			return await this.adapter.openDeepLink(url);
		}
		return false;
	}

	/**
	 * Get platform-specific overlay behavior
	 */
	private getOverlayBehavior(): OverlayPlatformBehavior {
		const defaultBehavior = getPlatformConfig(
			DEFAULT_PLATFORM_BEHAVIORS,
			this.platform,
		);
		const customBehavior = this.config.overlayBehaviors?.[this.platform] || {};

		return { ...defaultBehavior, ...customBehavior };
	}

	/**
	 * Register event handlers with the platform adapter
	 */
	private registerEventHandlers(): void {
		const handlers: PlatformEventHandlers = {
			onBackButton: async () => {
				const result = await this.handleBack();
				return result === "handled" || result === "prevented";
			},
			onEscapeKey: async () => {
				const result = await this.handleEscape();
				return result === "handled" || result === "prevented";
			},
			onDeepLink: (url: string) => {
				this.handleDeepLink(url);
			},
			onAppStateChange: (state: "active" | "background" | "inactive") => {
				this.handleAppStateChange(state);
			},
			onWindowFocus: (focused: boolean) => {
				this.handleWindowFocus(focused);
			},
		};

		this.adapter.registerHandlers(handlers);
		this.log("Event handlers registered");
	}

	/**
	 * Log debug messages if debug is enabled
	 */
	private log(...args: unknown[]): void {
		if (this.config.debug) {
			console.log(
				`[PlatformHostAdapter:${this.platform.toUpperCase()}]`,
				...args,
			);
		}
	}
}

/**
 * Create a platform host adapter with default configuration
 */
export function createPlatformHostAdapter(
	config: PlatformHostAdapterConfig = {},
): PlatformHostAdapter {
	return new PlatformHostAdapter(config);
}

/**
 * Create a platform host adapter for a specific platform
 */
export function createPlatformHostAdapterForPlatform(
	platform: Platform,
	config: PlatformHostAdapterConfig = {},
): PlatformHostAdapter {
	return new PlatformHostAdapter({
		...config,
		adapterConfig: {
			...config.adapterConfig,
			platform,
		},
	});
}
