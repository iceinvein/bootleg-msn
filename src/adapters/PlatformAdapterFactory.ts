/**
 * Platform Adapter Factory
 *
 * This factory creates the appropriate platform adapter based on
 * the current environment and configuration.
 */

import { CapacitorPlatformAdapter } from "./CapacitorPlatformAdapter";
import { detectPlatform, getPlatformCapabilities } from "./platformDetection";
import { TauriPlatformAdapter } from "./TauriPlatformAdapter";
import type {
	Platform,
	PlatformAdapter,
	PlatformAdapterConfig,
	PlatformAdapterFactory,
} from "./types";
import { WebPlatformAdapter } from "./WebPlatformAdapter";

/**
 * Create a platform adapter based on the current environment
 */
export function createPlatformAdapter(
	config: Partial<PlatformAdapterConfig> = {},
): PlatformAdapter {
	const detection = detectPlatform();
	const platform = config.platform || detection.platform;
	const capabilities = config.capabilities || getPlatformCapabilities(platform);

	const fullConfig: PlatformAdapterConfig = {
		platform,
		capabilities,
		handlers: {},
		preventDefaults: getDefaultPreventDefaults(platform),
		debug: detection.isDevelopment,
		...config,
	};

	switch (platform) {
		case "web":
			return new WebPlatformAdapter(fullConfig);

		case "capacitor":
			return new CapacitorPlatformAdapter(fullConfig);

		case "tauri":
			return new TauriPlatformAdapter(fullConfig);

		default:
			throw new Error(`Unsupported platform: ${platform}`);
	}
}

/**
 * Get default preventDefaults setting for platform
 */
function getDefaultPreventDefaults(platform: Platform): boolean {
	switch (platform) {
		case "web":
			return false; // Let browser handle most events
		case "capacitor":
			return true; // Prevent default mobile behaviors
		case "tauri":
			return false; // Let desktop handle most events
		default:
			return false;
	}
}

/**
 * Create a platform adapter factory with pre-configured settings
 */
export function createPlatformAdapterFactory(
	defaultConfig: Partial<PlatformAdapterConfig> = {},
): PlatformAdapterFactory {
	return (config: Partial<PlatformAdapterConfig> = {}) => {
		return createPlatformAdapter({ ...defaultConfig, ...config });
	};
}

/**
 * Create platform adapters for all supported platforms
 */
export function createAllPlatformAdapters(
	config: Partial<PlatformAdapterConfig> = {},
): Record<Platform, PlatformAdapter> {
	return {
		web: createPlatformAdapter({ ...config, platform: "web" }),
		capacitor: createPlatformAdapter({ ...config, platform: "capacitor" }),
		tauri: createPlatformAdapter({ ...config, platform: "tauri" }),
	};
}

/**
 * Get the appropriate adapter class for a platform
 */
export function getPlatformAdapterClass(platform: Platform) {
	switch (platform) {
		case "web":
			return WebPlatformAdapter;
		case "capacitor":
			return CapacitorPlatformAdapter;
		case "tauri":
			return TauriPlatformAdapter;
		default:
			throw new Error(`Unsupported platform: ${platform}`);
	}
}

/**
 * Check if a platform adapter is available
 */
export function isPlatformAdapterAvailable(platform: Platform): boolean {
	try {
		switch (platform) {
			case "web":
				return typeof window !== "undefined";
			case "capacitor":
				return typeof window !== "undefined" && "Capacitor" in window;
			case "tauri":
				return typeof window !== "undefined" && "__TAURI__" in window;
			default:
				return false;
		}
	} catch (_error) {
		return false;
	}
}

/**
 * Get available platform adapters
 */
export function getAvailablePlatformAdapters(): Platform[] {
	const platforms: Platform[] = ["web", "capacitor", "tauri"];
	return platforms.filter(isPlatformAdapterAvailable);
}

/**
 * Create the best available platform adapter
 */
export function createBestAvailablePlatformAdapter(
	config: Partial<PlatformAdapterConfig> = {},
): PlatformAdapter {
	const detection = detectPlatform();
	const requestedPlatform = config.platform || detection.platform;

	// If the requested platform is available, use it
	if (isPlatformAdapterAvailable(requestedPlatform)) {
		return createPlatformAdapter({ ...config, platform: requestedPlatform });
	}

	// Otherwise, find the best available platform
	const availablePlatforms = getAvailablePlatformAdapters();

	if (availablePlatforms.length === 0) {
		throw new Error("No platform adapters are available");
	}

	// Prefer the detected platform if available
	const preferredPlatform = availablePlatforms.includes(detection.platform)
		? detection.platform
		: availablePlatforms[0];

	console.warn(
		`Requested platform '${requestedPlatform}' is not available. Using '${preferredPlatform}' instead.`,
	);

	return createPlatformAdapter({ ...config, platform: preferredPlatform });
}

/**
 * Validate platform adapter configuration
 */
export function validatePlatformAdapterConfig(
	config: PlatformAdapterConfig,
): void {
	if (!config.platform) {
		throw new Error("Platform adapter config must specify a platform");
	}

	if (!["web", "capacitor", "tauri"].includes(config.platform)) {
		throw new Error(`Invalid platform: ${config.platform}`);
	}

	if (!config.capabilities) {
		throw new Error("Platform adapter config must specify capabilities");
	}

	// Validate platform-specific requirements
	switch (config.platform) {
		case "web":
			if (typeof window === "undefined") {
				throw new Error("Web platform adapter requires a browser environment");
			}
			break;

		case "capacitor":
			if (typeof window === "undefined" || !("Capacitor" in window)) {
				throw new Error(
					"Capacitor platform adapter requires Capacitor environment",
				);
			}
			break;

		case "tauri":
			if (typeof window === "undefined" || !("__TAURI__" in window)) {
				throw new Error("Tauri platform adapter requires Tauri environment");
			}
			break;
	}
}

/**
 * Create a mock platform adapter for testing
 */
export function createMockPlatformAdapter(
	platform: Platform = "web",
	config: Partial<PlatformAdapterConfig> = {},
): PlatformAdapter {
	const mockConfig: PlatformAdapterConfig = {
		platform,
		capabilities: getPlatformCapabilities(platform),
		handlers: {},
		preventDefaults: false,
		debug: true,
		...config,
	};

	// Return a mock implementation
	return {
		platform: mockConfig.platform,
		capabilities: mockConfig.capabilities,
		isInitialized: true,
		async initialize() {},
		cleanup() {},
		registerHandlers() {},
		unregisterHandlers() {},
		async handleBack() {
			return false;
		},
		async handleEscape() {
			return false;
		},
	};
}
