/**
 * Tauri Platform Adapter
 *
 * This adapter handles overlay behavior for Tauri desktop apps,
 * including window management and system integration.
 */

import { BasePlatformAdapter } from "./BasePlatformAdapter";
import type { PlatformAdapterConfig } from "./types";

/**
 * Tauri event listener unsubscribe function
 */
type TauriUnsubscribeFn = () => void;

/**
 * Window information from Tauri
 */
interface WindowInfo {
	scaleFactor: number;
	size: {
		width: number;
		height: number;
	};
	position: {
		x: number;
		y: number;
	};
	isFullscreen: boolean;
	isMaximized: boolean;
	isMinimized: boolean;
	isVisible: boolean;
	isFocused: boolean;
	isDecorated: boolean;
	isResizable: boolean;
}

/**
 * Tauri platform adapter implementation
 */
export class TauriPlatformAdapter extends BasePlatformAdapter {
	private keydownListener?: (event: KeyboardEvent) => void;
	private windowFocusListener?: TauriUnsubscribeFn;
	private windowBlurListener?: TauriUnsubscribeFn;
	private deepLinkListener?: TauriUnsubscribeFn;

	constructor(config: Partial<PlatformAdapterConfig> = {}) {
		super({
			platform: "tauri",
			capabilities: {
				hasHardwareBackButton: false,
				hasSystemOverlays: true,
				hasDeepLinking: true,
				hasNativeSharing: false,
				hasKeyboardShortcuts: true,
				hasWindowManagement: true,
			},
			handlers: {},
			preventDefaults: false,
			debug: false,
			...config,
		});
	}

	/**
	 * Initialize Tauri-specific event listeners
	 */
	protected async doInitialize(): Promise<void> {
		if (typeof window === "undefined" || !("__TAURI__" in window)) {
			throw new Error("TauriPlatformAdapter requires Tauri environment");
		}

		this.updateEventListeners();
	}

	/**
	 * Cleanup Tauri-specific event listeners
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

		if (this.handlers.onWindowFocus) {
			this.addWindowFocusListeners();
		}

		if (this.handlers.onDeepLink) {
			this.addDeepLinkListener();
		}
	}

	/**
	 * Open deep link using Tauri shell
	 */
	public async openDeepLink(url: string): Promise<boolean> {
		try {
			const { open } = await import("@tauri-apps/plugin-shell");
			await open(url);
			this.log("Deep link opened:", url);
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
	 * Add window focus/blur listeners using Tauri events
	 */
	private async addWindowFocusListeners(): Promise<void> {
		try {
			const { appWindow } = await import("@tauri-apps/api/window");

			this.windowFocusListener = await appWindow.onFocusChanged(
				({ payload: focused }) => {
					this.handleWindowFocus(focused);
				},
			);

			this.log("Window focus listeners added");
		} catch (error) {
			this.log("Error adding window focus listeners:", error);
		}
	}

	/**
	 * Add deep link listener using Tauri events
	 */
	private async addDeepLinkListener(): Promise<void> {
		try {
			const { listen } = await import("@tauri-apps/api/event");

			this.deepLinkListener = await listen("deep-link", (event) => {
				if (typeof event.payload === "string") {
					this.handleDeepLink(event.payload);
				}
			});

			this.log("Deep link listener added");
		} catch (error) {
			this.log("Error adding deep link listener:", error);
		}
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

		if (this.windowFocusListener) {
			this.windowFocusListener();
			this.windowFocusListener = undefined;
		}

		if (this.windowBlurListener) {
			this.windowBlurListener();
			this.windowBlurListener = undefined;
		}

		if (this.deepLinkListener) {
			this.deepLinkListener();
			this.deepLinkListener = undefined;
		}

		this.log("All event listeners removed");
	}

	/**
	 * Get window information
	 */
	public async getWindowInfo(): Promise<Partial<WindowInfo> | null> {
		try {
			const { appWindow } = await import("@tauri-apps/api/window");
			const [
				position,
				size,
				isMaximized,
				isMinimized,
				isFullscreen,
				isFocused,
			] = await Promise.all([
				appWindow.outerPosition(),
				appWindow.outerSize(),
				appWindow.isMaximized(),
				appWindow.isMinimized(),
				appWindow.isFullscreen(),
				appWindow.isFocused(),
			]);

			return {
				position,
				size,
				isMaximized,
				isMinimized,
				isFullscreen,
				isFocused,
			};
		} catch (error) {
			this.log("Error getting window info:", error);
			return null;
		}
	}

	/**
	 * Set window title
	 */
	public async setWindowTitle(title: string): Promise<void> {
		try {
			const { appWindow } = await import("@tauri-apps/api/window");
			await appWindow.setTitle(title);
		} catch (error) {
			this.log("Error setting window title:", error);
		}
	}

	/**
	 * Minimize window
	 */
	public async minimizeWindow(): Promise<void> {
		try {
			const { appWindow } = await import("@tauri-apps/api/window");
			await appWindow.minimize();
		} catch (error) {
			this.log("Error minimizing window:", error);
		}
	}

	/**
	 * Maximize window
	 */
	public async maximizeWindow(): Promise<void> {
		try {
			const { appWindow } = await import("@tauri-apps/api/window");
			await appWindow.maximize();
		} catch (error) {
			this.log("Error maximizing window:", error);
		}
	}

	/**
	 * Close window
	 */
	public async closeWindow(): Promise<void> {
		try {
			const { appWindow } = await import("@tauri-apps/api/window");
			await appWindow.close();
		} catch (error) {
			this.log("Error closing window:", error);
		}
	}

	/**
	 * Set window always on top
	 */
	public async setAlwaysOnTop(alwaysOnTop: boolean): Promise<void> {
		try {
			const { appWindow } = await import("@tauri-apps/api/window");
			await appWindow.setAlwaysOnTop(alwaysOnTop);
		} catch (error) {
			this.log("Error setting always on top:", error);
		}
	}

	/**
	 * Show system notification
	 */
	public async showNotification(title: string, body?: string): Promise<void> {
		try {
			const { sendNotification } = await import(
				"@tauri-apps/plugin-notification"
			);
			await sendNotification({
				title,
				body,
			});
		} catch (error) {
			this.log("Error showing notification:", error);
		}
	}

	/**
	 * Get app version
	 */
	public async getAppVersion(): Promise<string | null> {
		try {
			const { getVersion } = await import("@tauri-apps/api/app");
			return await getVersion();
		} catch (error) {
			this.log("Error getting app version:", error);
			return null;
		}
	}

	/**
	 * Get app name
	 */
	public async getAppName(): Promise<string | null> {
		try {
			const { getName } = await import("@tauri-apps/api/app");
			return await getName();
		} catch (error) {
			this.log("Error getting app name:", error);
			return null;
		}
	}

	/**
	 * Write to clipboard
	 */
	public async writeToClipboard(text: string): Promise<boolean> {
		try {
			const { writeText } = await import(
				"@tauri-apps/plugin-clipboard-manager"
			);
			await writeText(text);
			return true;
		} catch (error) {
			this.log("Error writing to clipboard:", error);
			return false;
		}
	}

	/**
	 * Read from clipboard
	 */
	public async readFromClipboard(): Promise<string | null> {
		try {
			const { readText } = await import("@tauri-apps/plugin-clipboard-manager");
			return await readText();
		} catch (error) {
			this.log("Error reading from clipboard:", error);
			return null;
		}
	}
}
