/**
 * Capacitor Platform Adapter
 *
 * This adapter handles overlay behavior for Capacitor mobile apps,
 * including hardware back button and native sharing.
 */

import { BasePlatformAdapter } from "./BasePlatformAdapter";
import type { PlatformAdapterConfig } from "./types";

/**
 * Capacitor listener handle type (matches PluginListenerHandle from Capacitor)
 */
type CapacitorListenerHandle = {
	remove(): Promise<void>;
};

/**
 * Device information from Capacitor
 */
type DeviceInfo = {
	model: string;
	platform: string;
	operatingSystem: string;
	osVersion: string;
	manufacturer: string;
	isVirtual: boolean;
	webViewVersion: string;
};

/**
 * Capacitor platform adapter implementation
 */
export class CapacitorPlatformAdapter extends BasePlatformAdapter {
	private backButtonListener?: CapacitorListenerHandle;
	private appStateListener?: CapacitorListenerHandle;
	private deepLinkListener?: CapacitorListenerHandle;

	constructor(config: Partial<PlatformAdapterConfig> = {}) {
		super({
			platform: "capacitor",
			capabilities: {
				hasHardwareBackButton: true,
				hasSystemOverlays: true,
				hasDeepLinking: true,
				hasNativeSharing: true,
				hasKeyboardShortcuts: false,
				hasWindowManagement: false,
			},
			handlers: {},
			preventDefaults: true, // Usually want to prevent default on mobile
			debug: false,
			...config,
		});
	}

	/**
	 * Initialize Capacitor-specific event listeners
	 */
	protected async doInitialize(): Promise<void> {
		if (typeof window === "undefined" || !("Capacitor" in window)) {
			throw new Error(
				"CapacitorPlatformAdapter requires Capacitor environment",
			);
		}

		// Import Capacitor plugins dynamically
		await this.loadCapacitorPlugins();
		this.updateEventListeners();
	}

	/**
	 * Cleanup Capacitor-specific event listeners
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
		if (this.handlers.onBackButton && this.capabilities.hasHardwareBackButton) {
			this.addBackButtonListener();
		}

		if (this.handlers.onAppStateChange) {
			this.addAppStateListener();
		}

		if (this.handlers.onDeepLink) {
			this.addDeepLinkListener();
		}
	}

	/**
	 * Share content using Capacitor Share plugin
	 */
	public async share(content: {
		title?: string;
		text?: string;
		url?: string;
	}): Promise<boolean> {
		try {
			const { Share } = await import("@capacitor/share");
			await Share.share(content);
			this.log("Content shared successfully");
			return true;
		} catch (error) {
			this.log("Error sharing content:", error);
			return false;
		}
	}

	/**
	 * Open deep link using Capacitor Browser plugin
	 */
	public async openDeepLink(url: string): Promise<boolean> {
		try {
			const { Browser } = await import("@capacitor/browser");
			await Browser.open({ url });
			this.log("Deep link opened:", url);
			return true;
		} catch (error) {
			this.log("Error opening deep link:", error);
			return false;
		}
	}

	/**
	 * Load Capacitor plugins
	 */
	private async loadCapacitorPlugins(): Promise<void> {
		try {
			// Pre-load commonly used plugins
			await Promise.all([
				import("@capacitor/app").catch(() => null),
				import("@capacitor/share").catch(() => null),
				import("@capacitor/browser").catch(() => null),
			]);
			this.log("Capacitor plugins loaded");
		} catch (error) {
			this.log("Error loading Capacitor plugins:", error);
		}
	}

	/**
	 * Add hardware back button listener
	 */
	private async addBackButtonListener(): Promise<void> {
		try {
			const { App } = await import("@capacitor/app");

			this.backButtonListener = await App.addListener(
				"backButton",
				async (_event) => {
					this.log("Hardware back button pressed");

					const handled = await this.handleBack();

					if (!handled) {
						// If not handled by overlay system, let the app handle it
						// This might exit the app or navigate back
						this.log("Back button not handled, using default behavior");

						// On Android, we might want to minimize the app or exit
						if (this.isAndroid()) {
							try {
								const { App: AppPlugin } = await import("@capacitor/app");
								await AppPlugin.minimizeApp();
							} catch (error) {
								this.log("Error minimizing app:", error);
							}
						}
					}
				},
			);

			this.log("Back button listener added");
		} catch (error) {
			this.log("Error adding back button listener:", error);
		}
	}

	/**
	 * Add app state change listener
	 */
	private async addAppStateListener(): Promise<void> {
		try {
			const { App } = await import("@capacitor/app");

			this.appStateListener = await App.addListener(
				"appStateChange",
				(state) => {
					const appState = state.isActive ? "active" : "background";
					this.handleAppStateChange(appState);
				},
			);

			this.log("App state listener added");
		} catch (error) {
			this.log("Error adding app state listener:", error);
		}
	}

	/**
	 * Add deep link listener
	 */
	private async addDeepLinkListener(): Promise<void> {
		try {
			const { App } = await import("@capacitor/app");

			this.deepLinkListener = await App.addListener("appUrlOpen", (event) => {
				this.handleDeepLink(event.url);
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
		if (this.backButtonListener) {
			this.backButtonListener.remove();
			this.backButtonListener = undefined;
		}

		if (this.appStateListener) {
			this.appStateListener.remove();
			this.appStateListener = undefined;
		}

		if (this.deepLinkListener) {
			this.deepLinkListener.remove();
			this.deepLinkListener = undefined;
		}

		this.log("All event listeners removed");
	}

	/**
	 * Check if running on Android
	 */
	private isAndroid(): boolean {
		try {
			const capacitor = (
				window as Window & { Capacitor?: { getPlatform?(): string } }
			).Capacitor;
			return capacitor?.getPlatform?.() === "android";
		} catch (_error) {
			return false;
		}
	}

	/**
	 * Get device info
	 */
	public async getDeviceInfo(): Promise<DeviceInfo | null> {
		try {
			const { Device } = await import("@capacitor/device");
			return await Device.getInfo();
		} catch (error) {
			this.log("Error getting device info:", error);
			return null;
		}
	}

	/**
	 * Show native toast message
	 * Note: @capacitor/toast is not installed, using console.log as fallback
	 */
	public async showToast(
		message: string,
		duration: "short" | "long" = "short",
	): Promise<void> {
		try {
			// Try to import toast plugin if available
			const { Toast } = await import("@capacitor/toast");
			await Toast.show({
				text: message,
				duration: duration,
			});
		} catch (_error) {
			// Fallback to console log if toast plugin not available
			this.log("Toast plugin not available, using console fallback:", message);
			console.log(`[Toast ${duration}]: ${message}`);
		}
	}

	/**
	 * Haptic feedback
	 */
	public async hapticFeedback(
		type: "light" | "medium" | "heavy" = "light",
	): Promise<void> {
		try {
			const { Haptics, ImpactStyle } = await import("@capacitor/haptics");

			const styleMap = {
				light: ImpactStyle.Light,
				medium: ImpactStyle.Medium,
				heavy: ImpactStyle.Heavy,
			};

			await Haptics.impact({ style: styleMap[type] });
		} catch (error) {
			this.log("Error with haptic feedback:", error);
		}
	}

	/**
	 * Set status bar style
	 */
	public async setStatusBarStyle(style: "light" | "dark"): Promise<void> {
		try {
			const { StatusBar, Style } = await import("@capacitor/status-bar");
			await StatusBar.setStyle({
				style: style === "light" ? Style.Light : Style.Dark,
			});
		} catch (error) {
			this.log("Error setting status bar style:", error);
		}
	}
}
