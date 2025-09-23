/**
 * Base Platform Adapter
 *
 * This abstract class provides the foundation for platform-specific
 * overlay behavior implementations.
 */

import type {
	Platform,
	PlatformAdapter,
	PlatformAdapterConfig,
	PlatformCapabilities,
	PlatformEventHandlers,
} from "./types";

/**
 * Abstract base class for platform adapters
 */
export abstract class BasePlatformAdapter implements PlatformAdapter {
	public readonly platform: Platform;
	public readonly capabilities: PlatformCapabilities;
	protected config: PlatformAdapterConfig;
	protected handlers: PlatformEventHandlers = {};
	protected _isInitialized = false;
	protected cleanupFunctions: Array<() => void> = [];

	constructor(config: PlatformAdapterConfig) {
		this.platform = config.platform;
		this.capabilities = config.capabilities;
		this.config = config;
		this.handlers = { ...config.handlers };
	}

	public get isInitialized(): boolean {
		return this._isInitialized;
	}

	/**
	 * Initialize the platform adapter
	 */
	public async initialize(): Promise<void> {
		if (this._isInitialized) {
			return;
		}

		try {
			await this.doInitialize();
			this._isInitialized = true;
			this.log("Platform adapter initialized");
		} catch (error) {
			this.log("Failed to initialize platform adapter:", error);
			throw error;
		}
	}

	/**
	 * Cleanup the platform adapter
	 */
	public cleanup(): void {
		if (!this._isInitialized) {
			return;
		}

		try {
			// Run all cleanup functions
			this.cleanupFunctions.forEach((cleanup) => {
				try {
					cleanup();
				} catch (error) {
					this.log("Error during cleanup:", error);
				}
			});

			this.cleanupFunctions = [];
			this.doCleanup();
			this._isInitialized = false;
			this.log("Platform adapter cleaned up");
		} catch (error) {
			this.log("Error during cleanup:", error);
		}
	}

	/**
	 * Register event handlers
	 */
	public registerHandlers(handlers: PlatformEventHandlers): void {
		this.handlers = { ...this.handlers, ...handlers };
		this.updateEventListeners();
	}

	/**
	 * Unregister event handlers
	 */
	public unregisterHandlers(): void {
		this.handlers = {};
		this.updateEventListeners();
	}

	/**
	 * Handle back navigation
	 */
	public async handleBack(): Promise<boolean> {
		try {
			if (this.handlers.onBackButton) {
				const result = await this.handlers.onBackButton();
				this.log("Back button handled:", result);
				return result;
			}
			return false;
		} catch (error) {
			this.log("Error handling back button:", error);
			return false;
		}
	}

	/**
	 * Handle escape key
	 */
	public async handleEscape(): Promise<boolean> {
		try {
			if (this.handlers.onEscapeKey) {
				const result = await this.handlers.onEscapeKey();
				this.log("Escape key handled:", result);
				return result;
			}
			return false;
		} catch (error) {
			this.log("Error handling escape key:", error);
			return false;
		}
	}

	/**
	 * Share content natively (optional)
	 */
	public async share?(_content: {
		title?: string;
		text?: string;
		url?: string;
	}): Promise<boolean> {
		this.log("Native sharing not implemented for", this.platform);
		return false;
	}

	/**
	 * Open deep link (optional)
	 */
	public async openDeepLink?(_url: string): Promise<boolean> {
		this.log("Deep link opening not implemented for", this.platform);
		return false;
	}

	/**
	 * Platform-specific initialization
	 */
	protected abstract doInitialize(): Promise<void>;

	/**
	 * Platform-specific cleanup
	 */
	protected abstract doCleanup(): void;

	/**
	 * Update event listeners based on current handlers
	 */
	protected abstract updateEventListeners(): void;

	/**
	 * Add a cleanup function
	 */
	protected addCleanup(cleanup: () => void): void {
		this.cleanupFunctions.push(cleanup);
	}

	/**
	 * Log debug messages if debug is enabled
	 */
	protected log(...args: unknown[]): void {
		if (this.config.debug) {
			console.log(`[${this.platform.toUpperCase()} Adapter]`, ...args);
		}
	}

	/**
	 * Handle app state changes
	 */
	protected handleAppStateChange(
		state: "active" | "background" | "inactive",
	): void {
		if (this.handlers.onAppStateChange) {
			try {
				this.handlers.onAppStateChange(state);
				this.log("App state changed:", state);
			} catch (error) {
				this.log("Error handling app state change:", error);
			}
		}
	}

	/**
	 * Handle window focus changes
	 */
	protected handleWindowFocus(focused: boolean): void {
		if (this.handlers.onWindowFocus) {
			try {
				this.handlers.onWindowFocus(focused);
				this.log("Window focus changed:", focused);
			} catch (error) {
				this.log("Error handling window focus change:", error);
			}
		}
	}

	/**
	 * Handle deep link activation
	 */
	protected handleDeepLink(url: string): void {
		if (this.handlers.onDeepLink) {
			try {
				this.handlers.onDeepLink(url);
				this.log("Deep link activated:", url);
			} catch (error) {
				this.log("Error handling deep link:", error);
			}
		}
	}

	/**
	 * Create a safe event listener that handles errors
	 */
	protected createSafeEventListener<T extends Event>(
		handler: (event: T) => void | Promise<void>,
	): (event: T) => void {
		return async (event: T) => {
			try {
				await handler(event);
			} catch (error) {
				this.log("Error in event handler:", error);
			}
		};
	}

	/**
	 * Prevent default behavior if configured
	 */
	protected maybePreventDefault(event: Event): void {
		if (this.config.preventDefaults) {
			event.preventDefault();
		}
	}

	/**
	 * Check if a specific capability is supported
	 */
	protected hasCapability(capability: keyof PlatformCapabilities): boolean {
		return this.capabilities[capability];
	}
}
