/**
 * Platform detection utilities for cross-platform OAuth and feature detection
 */

// Cache for async Tauri detection
let tauriDetectionCache: boolean | null = null;

// Type for Capacitor module structure
type CapacitorModule = {
	Capacitor: {
		isNativePlatform: () => boolean;
		getPlatform: () => string;
	};
} | null;

// Capacitor module loader (can be mocked in tests)
let capacitorLoader = (): CapacitorModule => {
	try {
		return require("@capacitor/core");
	} catch {
		return null;
	}
};

// Test helper to reset cache (only available in test environment)
export const __resetPlatformCache = () => {
	if (process.env.NODE_ENV === "test" || process.env.VITEST) {
		tauriDetectionCache = null;
	}
};

// Test helper to mock Capacitor (only available in test environment)
export const __mockCapacitor = (mockModule: CapacitorModule) => {
	if (process.env.NODE_ENV === "test" || process.env.VITEST) {
		capacitorLoader = () => mockModule;
	}
};

export const Platform = {
	// Tauri desktop detection (synchronous fallback)
	isDesktop: () => {
		if (typeof window === "undefined") return false;

		// Use cached result if available
		if (tauriDetectionCache !== null) {
			return tauriDetectionCache;
		}

		// Check for Tauri v2 globals first
		if ("__TAURI__" in window || "__TAURI_INTERNALS__" in window) {
			tauriDetectionCache = true;
			return true;
		}

		// Check for Tauri invoke function
		const windowObj = window as unknown as Record<string, unknown>;
		if (typeof windowObj.__TAURI_INVOKE__ === "function") {
			tauriDetectionCache = true;
			return true;
		}

		// Check user agent for Tauri
		if (navigator?.userAgent.includes("Tauri")) {
			tauriDetectionCache = true;
			return true;
		}

		// Check if we have any Tauri-related keys in window
		const tauriKeys = Object.keys(window).filter((k) => k.includes("TAURI"));
		if (tauriKeys.length > 0) {
			tauriDetectionCache = true;
			return true;
		}

		// Default to false for synchronous detection
		return false;
	},

	// Async Tauri detection using dynamic import
	isDesktopAsync: async (): Promise<boolean> => {
		if (typeof window === "undefined") return false;

		// Use cached result if available
		if (tauriDetectionCache !== null) {
			return tauriDetectionCache;
		}

		// Try synchronous detection first
		if (Platform.isDesktop()) {
			return true;
		}

		// Try dynamic import detection
		try {
			const { invoke } = await import("@tauri-apps/api/core");
			if (typeof invoke === "function") {
				tauriDetectionCache = true;
				return true;
			}
		} catch {
			// Tauri API not available
		}

		tauriDetectionCache = false;
		return false;
	},

	// Capacitor mobile detection
	isMobile: () => {
		try {
			const capacitorModule = capacitorLoader();
			if (!capacitorModule) return false;
			return capacitorModule.Capacitor.isNativePlatform();
		} catch {
			return false;
		}
	},

	// Web browser detection
	isWeb: () => !Platform.isDesktop() && !Platform.isMobile(),

	// Specific platform detection
	getPlatform: () => {
		if (Platform.isDesktop()) return "desktop";
		if (Platform.isMobile()) {
			try {
				const capacitorModule = capacitorLoader();
				if (!capacitorModule) return "mobile";
				return capacitorModule.Capacitor.getPlatform(); // 'ios' or 'android'
			} catch {
				return "mobile";
			}
		}
		return "web";
	},

	// Check if system browser OAuth is supported
	supportsSystemBrowser: () => {
		return Platform.isDesktop() || Platform.isMobile();
	},

	// Check if in-app OAuth should be used (fallback)
	shouldUseInAppOAuth: () => {
		return Platform.isWeb() || !Platform.supportsSystemBrowser();
	},

	// Async version that uses dynamic import detection
	shouldUseInAppOAuthAsync: async (): Promise<boolean> => {
		const isDesktop = await Platform.isDesktopAsync();
		const isMobile = Platform.isMobile();
		return !isDesktop && !isMobile;
	},
};
