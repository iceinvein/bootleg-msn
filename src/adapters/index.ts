/**
 * Platform Adapters - Main Export
 *
 * This file exports all platform adapter functionality for easy importing
 * throughout the application.
 */

import { createPlatformHostAdapter } from "./PlatformHostAdapter";
import {
	detectPlatform,
	getPlatformClasses,
	getPlatformConfig,
	platformSupports,
	platformSwitch,
} from "./platformDetection";
import type { Platform } from "./types";

export type {
	UsePlatformHostAdapterConfig,
	UsePlatformHostAdapterReturn,
} from "../hooks/usePlatformHostAdapter";
// React Hooks
export {
	usePlatformDetection,
	usePlatformHostAdapter,
	usePlatformShare,
} from "../hooks/usePlatformHostAdapter";
// Base Adapter
export { BasePlatformAdapter } from "./BasePlatformAdapter";
export { CapacitorPlatformAdapter } from "./CapacitorPlatformAdapter";
// Platform Adapter Factory
export {
	createAllPlatformAdapters,
	createBestAvailablePlatformAdapter,
	createMockPlatformAdapter,
	createPlatformAdapter,
	createPlatformAdapterFactory,
	getAvailablePlatformAdapters,
	getPlatformAdapterClass,
	isPlatformAdapterAvailable,
	validatePlatformAdapterConfig,
} from "./PlatformAdapterFactory";
export type {
	OverlaySystemCallbacks,
	PlatformHostAdapterConfig,
} from "./PlatformHostAdapter";
// Platform Host Adapter
export {
	createPlatformHostAdapter,
	createPlatformHostAdapterForPlatform,
	PlatformHostAdapter,
} from "./PlatformHostAdapter";
// Platform Detection
export {
	createPlatformEventListener,
	detectPlatform,
	getPlatformCapabilities,
	getPlatformClasses,
	getPlatformConfig,
	isAndroidCapacitor,
	isDesktop,
	isIOSCapacitor,
	isMobile,
	platformSupports,
	platformSwitch,
} from "./platformDetection";
export { TauriPlatformAdapter } from "./TauriPlatformAdapter";
// Types
export type {
	BackButtonResult,
	OverlayPlatformBehavior,
	Platform,
	PlatformAdapter,
	PlatformAdapterConfig,
	PlatformAdapterFactory,
	PlatformCapabilities,
	PlatformDetection,
	PlatformEventHandlers,
	PlatformOverlayConfig,
} from "./types";
export { DEFAULT_PLATFORM_BEHAVIORS } from "./types";
// Platform-Specific Adapters
export { WebPlatformAdapter } from "./WebPlatformAdapter";

/**
 * Convenience function to create and initialize a platform host adapter
 */
export async function createAndInitializePlatformHostAdapter(
	config: import("./PlatformHostAdapter").PlatformHostAdapterConfig = {},
): Promise<import("./PlatformHostAdapter").PlatformHostAdapter> {
	const adapter = createPlatformHostAdapter({
		autoInitialize: false,
		...config,
	});

	await adapter.initialize();
	return adapter;
}

/**
 * Get platform-specific CSS classes for the current environment
 */
export function getCurrentPlatformClasses(): string[] {
	const platform = detectPlatform().platform;
	return getPlatformClasses(platform);
}

/**
 * Check if the current platform supports a specific feature
 */
export function currentPlatformSupports(
	feature: keyof import("./types").PlatformCapabilities,
): boolean {
	const platform = detectPlatform().platform;
	return platformSupports(feature, platform);
}

/**
 * Get configuration for the current platform
 */
export function getCurrentPlatformConfig<T>(configs: Record<Platform, T>): T {
	const platform = detectPlatform().platform;
	return getPlatformConfig(configs, platform);
}

/**
 * Execute platform-specific code for the current platform
 */
export function executeForCurrentPlatform<T>(
	handlers: Partial<Record<Platform, () => T>>,
	defaultHandler?: () => T,
): T | undefined {
	return platformSwitch(handlers, defaultHandler);
}
