/**
 * Web Platform Adapter
 *
 * This adapter handles overlay behavior for web browsers,
 * including keyboard shortcuts and browser navigation.
 */

import { BasePlatformAdapter } from "./BasePlatformAdapter";
import type { PlatformAdapterConfig } from "./types";

/**
 * Web platform adapter implementation
 */
export class WebPlatformAdapter extends BasePlatformAdapter {
	private keydownListener?: (event: KeyboardEvent) => void;
	private popstateListener?: (event: PopStateEvent) => void;
	private focusListener?: (event: FocusEvent) => void;
	private blurListener?: (event: FocusEvent) => void;
	private visibilityChangeListener?: (event: Event) => void;

	constructor(config: Partial<PlatformAdapterConfig> = {}) {
		super({
			platform: "web",
			capabilities: {
				hasHardwareBackButton: false,
				hasSystemOverlays: false,
				hasDeepLinking: true,
				hasNativeSharing:
					typeof navigator !== "undefined" && "share" in navigator,
				hasKeyboardShortcuts: true,
				hasWindowManagement: false,
			},
			handlers: {},
			preventDefaults: false,
			debug: false,
			...config,
		});
	}

	/**
	 * Initialize web-specific event listeners
	 */
	protected async doInitialize(): Promise<void> {
		if (typeof window === "undefined") {
			throw new Error("WebPlatformAdapter requires a browser environment");
		}

		this.updateEventListeners();
	}

	/**
	 * Cleanup web-specific event listeners
	 */
	protected doCleanup(): void {
		this.removeAllEventListeners();
	}

	/**
	 * Update event listeners based on current handlers
	 */
	protected updateEventListeners(): void {
		// Remove existing listeners
		this.removeAllEventListeners();

		// Add new listeners based on handlers
		if (this.handlers.onEscapeKey) {
			this.addKeydownListener();
		}

		if (this.handlers.onBackButton) {
			this.addPopstateListener();
		}

		if (this.handlers.onWindowFocus) {
			this.addFocusListeners();
		}

		if (this.handlers.onAppStateChange) {
			this.addVisibilityChangeListener();
		}
	}

	/**
	 * Share content using Web Share API
	 */
	public async share(content: {
		title?: string;
		text?: string;
		url?: string;
	}): Promise<boolean> {
		if (!this.capabilities.hasNativeSharing || !navigator.share) {
			this.log("Web Share API not available");
			return false;
		}

		try {
			await navigator.share(content);
			this.log("Content shared successfully");
			return true;
		} catch (error) {
			if ((error as Error).name === "AbortError") {
				this.log("Share was cancelled by user");
			} else {
				this.log("Error sharing content:", error);
			}
			return false;
		}
	}

	/**
	 * Open deep link by navigating to URL
	 */
	public async openDeepLink(url: string): Promise<boolean> {
		try {
			window.location.href = url;
			this.log("Navigated to deep link:", url);
			return true;
		} catch (error) {
			this.log("Error opening deep link:", error);
			return false;
		}
	}

	/**
	 * Add keyboard event listener for escape key
	 */
	private addKeydownListener(): void {
		this.keydownListener = this.createSafeEventListener(
			async (event: KeyboardEvent) => {
				if (event.key === "Escape") {
					const handled = await this.handleEscape();
					if (handled && this.config.preventDefaults) {
						event.preventDefault();
						event.stopPropagation();
					}
				}
			},
		);

		window.addEventListener("keydown", this.keydownListener, { capture: true });
		this.log("Keydown listener added");
	}

	/**
	 * Add popstate listener for browser back button
	 */
	private addPopstateListener(): void {
		this.popstateListener = this.createSafeEventListener(
			async (_event: PopStateEvent) => {
				// Note: popstate fires after the navigation has already occurred
				// We can't prevent it, but we can handle the state change
				const handled = await this.handleBack();
				this.log("Popstate event handled:", handled);
			},
		);

		window.addEventListener("popstate", this.popstateListener);
		this.log("Popstate listener added");
	}

	/**
	 * Add focus/blur listeners for window focus tracking
	 */
	private addFocusListeners(): void {
		this.focusListener = this.createSafeEventListener(() => {
			this.handleWindowFocus(true);
		});

		this.blurListener = this.createSafeEventListener(() => {
			this.handleWindowFocus(false);
		});

		window.addEventListener("focus", this.focusListener);
		window.addEventListener("blur", this.blurListener);
		this.log("Focus/blur listeners added");
	}

	/**
	 * Add visibility change listener for app state tracking
	 */
	private addVisibilityChangeListener(): void {
		this.visibilityChangeListener = this.createSafeEventListener(() => {
			const state =
				document.visibilityState === "visible" ? "active" : "background";
			this.handleAppStateChange(state);
		});

		document.addEventListener(
			"visibilitychange",
			this.visibilityChangeListener,
		);
		this.log("Visibility change listener added");
	}

	/**
	 * Remove all event listeners
	 */
	private removeAllEventListeners(): void {
		if (this.keydownListener) {
			window.removeEventListener("keydown", this.keydownListener, {
				capture: true,
			});
			this.keydownListener = undefined;
		}

		if (this.popstateListener) {
			window.removeEventListener("popstate", this.popstateListener);
			this.popstateListener = undefined;
		}

		if (this.focusListener) {
			window.removeEventListener("focus", this.focusListener);
			this.focusListener = undefined;
		}

		if (this.blurListener) {
			window.removeEventListener("blur", this.blurListener);
			this.blurListener = undefined;
		}

		if (this.visibilityChangeListener) {
			document.removeEventListener(
				"visibilitychange",
				this.visibilityChangeListener,
			);
			this.visibilityChangeListener = undefined;
		}

		this.log("All event listeners removed");
	}

	/**
	 * Handle browser back button (via popstate)
	 * Note: This fires after navigation has occurred
	 */
	public async handleBack(): Promise<boolean> {
		// For web, we can't prevent the back navigation since popstate
		// fires after it's already happened. We can only react to it.
		return super.handleBack();
	}

	/**
	 * Check if the current page can go back
	 */
	public canGoBack(): boolean {
		return window.history.length > 1;
	}

	/**
	 * Programmatically trigger back navigation
	 */
	public goBack(): void {
		if (this.canGoBack()) {
			window.history.back();
		}
	}

	/**
	 * Push a new history state
	 */
	public pushState(state: unknown, title: string, url?: string): void {
		window.history.pushState(state, title, url);
	}

	/**
	 * Replace the current history state
	 */
	public replaceState(state: unknown, title: string, url?: string): void {
		window.history.replaceState(state, title, url);
	}
}
