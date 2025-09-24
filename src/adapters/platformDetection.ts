/**
 * Platform Detection Utilities
 *
 * This module provides utilities for detecting the current platform
 * and determining platform-specific capabilities.
 */

import type {
	Platform,
	PlatformCapabilities,
	PlatformDetection,
} from "./types";

/**
 * Tauri API interface
 */
type TauriAPI = {
	app?: {
		getVersion?(): Promise<string> | string;
	};
	version?: string;
};

/**
 * Extended window interface for platform detection
 */
type ExtendedWindow = Window & {
	__TAURI__?: TauriAPI;
	Capacitor?: {
		getPlatform?(): string;
		isNativePlatform?(): boolean;
	};
};

/**
 * Detect the current platform
 */
export function detectPlatform(): PlatformDetection {
	const userAgent = typeof navigator !== "undefined" ? navigator.userAgent : "";
	const isDevelopment = process.env.NODE_ENV === "development";

	// Check for Tauri
	if (typeof window !== "undefined" && "__TAURI__" in window) {
		return {
			platform: "tauri",
			version: getTauriVersion(),
			userAgent,
			isDevelopment,
			metadata: {
				tauri: (window as ExtendedWindow).__TAURI__,
			},
		};
	}

	// Check for Capacitor
	if (typeof window !== "undefined" && "Capacitor" in window) {
		const capacitor = (window as ExtendedWindow).Capacitor;
		return {
			platform: "capacitor",
			version: capacitor?.getPlatform?.() || "unknown",
			userAgent,
			isDevelopment,
			metadata: {
				capacitor,
				isNative: capacitor?.isNativePlatform?.() || false,
				platform: capacitor?.getPlatform?.(),
			},
		};
	}

	// Default to web
	return {
		platform: "web",
		userAgent,
		isDevelopment,
		metadata: {
			isBrowser: typeof window !== "undefined",
			isSSR: typeof window === "undefined",
		},
	};
}

/**
 * Get Tauri version if available
 */
function getTauriVersion(): string | undefined {
	try {
		if (typeof window !== "undefined" && "__TAURI__" in window) {
			const tauri = (window as ExtendedWindow).__TAURI__;
			// Try to get version from the version property first (synchronous)
			if (tauri?.version) {
				return tauri.version;
			}
			// For async getVersion, we can't await here, so return a fallback
			if (tauri?.app?.getVersion) {
				return "unknown"; // We'll handle async version getting elsewhere if needed
			}
		}
	} catch (error) {
		console.warn("Failed to get Tauri version:", error);
	}
	return undefined;
}

/**
 * Get platform capabilities based on detected platform
 */
export function getPlatformCapabilities(
	platform: Platform,
): PlatformCapabilities {
	switch (platform) {
		case "web":
			return {
				hasHardwareBackButton: false,
				hasSystemOverlays: false,
				hasDeepLinking: true,
				hasNativeSharing:
					typeof navigator !== "undefined" && "share" in navigator,
				hasKeyboardShortcuts: true,
				hasWindowManagement: false,
			};

		case "capacitor":
			return {
				hasHardwareBackButton: isAndroidCapacitor(),
				hasSystemOverlays: true,
				hasDeepLinking: true,
				hasNativeSharing: true,
				hasKeyboardShortcuts: false,
				hasWindowManagement: false,
			};

		case "tauri":
			return {
				hasHardwareBackButton: false,
				hasSystemOverlays: true,
				hasDeepLinking: true,
				hasNativeSharing: false,
				hasKeyboardShortcuts: true,
				hasWindowManagement: true,
			};

		default:
			return {
				hasHardwareBackButton: false,
				hasSystemOverlays: false,
				hasDeepLinking: false,
				hasNativeSharing: false,
				hasKeyboardShortcuts: false,
				hasWindowManagement: false,
			};
	}
}

/**
 * Check if running on Android in Capacitor
 */
function isAndroidCapacitor(): boolean {
	if (typeof window === "undefined" || !("Capacitor" in window)) {
		return false;
	}

	try {
		const capacitor = (window as ExtendedWindow).Capacitor;
		const platform = capacitor?.getPlatform?.();
		return platform === "android";
	} catch (_error) {
		return false;
	}
}

/**
 * Check if running on iOS in Capacitor
 */
export function isIOSCapacitor(): boolean {
	if (typeof window === "undefined" || !("Capacitor" in window)) {
		return false;
	}

	try {
		const capacitor = (window as ExtendedWindow).Capacitor;
		const platform = capacitor?.getPlatform?.();
		return platform === "ios";
	} catch (_error) {
		return false;
	}
}

/**
 * Check if running in a mobile environment
 */
export function isMobile(): boolean {
	const detection = detectPlatform();

	if (detection.platform === "capacitor") {
		return true;
	}

	// Check user agent for mobile indicators
	if (detection.userAgent) {
		const mobileRegex =
			/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
		return mobileRegex.test(detection.userAgent);
	}

	return false;
}

/**
 * Check if running in a desktop environment
 */
export function isDesktop(): boolean {
	const detection = detectPlatform();
	return (
		detection.platform === "tauri" ||
		(!isMobile() && detection.platform === "web")
	);
}

/**
 * Get platform-specific CSS classes
 */
export function getPlatformClasses(platform?: Platform): string[] {
	const detectedPlatform = platform || detectPlatform().platform;
	const classes = [`platform-${detectedPlatform}`];

	// Add additional classes based on platform
	switch (detectedPlatform) {
		case "capacitor":
			classes.push("platform-mobile");
			if (isAndroidCapacitor()) {
				classes.push("platform-android");
			} else if (isIOSCapacitor()) {
				classes.push("platform-ios");
			}
			break;

		case "tauri":
			classes.push("platform-desktop");
			break;

		case "web":
			if (isMobile()) {
				classes.push("platform-mobile");
			} else {
				classes.push("platform-desktop");
			}
			break;
	}

	return classes;
}

/**
 * Check if platform supports a specific feature
 */
export function platformSupports(
	feature: keyof PlatformCapabilities,
	platform?: Platform,
): boolean {
	const detectedPlatform = platform || detectPlatform().platform;
	const capabilities = getPlatformCapabilities(detectedPlatform);
	return capabilities[feature];
}

/**
 * Get platform-specific configuration
 */
export function getPlatformConfig<T>(
	configs: Record<Platform, T>,
	platform?: Platform,
): T {
	const detectedPlatform = platform || detectPlatform().platform;
	return configs[detectedPlatform];
}

/**
 * Execute platform-specific code
 */
export function platformSwitch<T>(
	handlers: Partial<Record<Platform, () => T>>,
	defaultHandler?: () => T,
): T | undefined {
	const platform = detectPlatform().platform;
	const handler = handlers[platform] || defaultHandler;
	return handler?.();
}

/**
 * Create a platform-aware event listener
 */
export function createPlatformEventListener(
	eventType: string,
	handler: (event: Event) => void,
	options?: AddEventListenerOptions,
): () => void {
	if (typeof window === "undefined") {
		return () => {}; // No-op for SSR
	}

	window.addEventListener(eventType, handler, options);

	return () => {
		window.removeEventListener(eventType, handler, options);
	};
}
