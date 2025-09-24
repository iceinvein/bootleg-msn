/**
 * React Hook for Platform Host Adapter
 *
 * This hook provides React integration for the platform host adapter,
 * automatically connecting it to the overlay system and managing lifecycle.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import type {
	OverlaySystemCallbacks,
	PlatformHostAdapterConfig,
} from "@/adapters/PlatformHostAdapter";
import {
	createPlatformHostAdapter,
	type PlatformHostAdapter,
} from "@/adapters/PlatformHostAdapter";
import { getPlatformCapabilities } from "@/adapters/platformDetection";
import type {
	BackButtonResult,
	Platform,
	PlatformCapabilities,
} from "@/adapters/types";

import { useOverlays } from "./useOverlays";
import { useOverlayUrl } from "./useOverlayUrl";

/**
 * Configuration for the platform host adapter hook
 */
export type UsePlatformHostAdapterConfig = PlatformHostAdapterConfig & {
	/** Whether to automatically connect to overlay system */
	autoConnect?: boolean;
	/** Whether to handle URL-based overlays */
	handleUrlOverlays?: boolean;
};

/**
 * Return type for the platform host adapter hook
 */
export type UsePlatformHostAdapterReturn = {
	/** The platform host adapter instance */
	adapter: PlatformHostAdapter | null;
	/** Current platform */
	platform: Platform | null;
	/** Whether the adapter is initialized */
	isInitialized: boolean;
	/** Whether the adapter is connected to overlay system */
	isConnected: boolean;
	/** Platform capabilities */
	capabilities: PlatformCapabilities;
	/** Manually handle back button */
	handleBack: () => Promise<BackButtonResult>;
	/** Manually handle escape key */
	handleEscape: () => Promise<BackButtonResult>;
	/** Share content using platform sharing */
	share: (content: {
		title?: string;
		text?: string;
		url?: string;
	}) => Promise<boolean>;
	/** Open deep link */
	openDeepLink: (url: string) => Promise<boolean>;
	/** Connect to overlay system */
	connect: () => void;
	/** Disconnect from overlay system */
	disconnect: () => void;
};

/**
 * Hook for using the platform host adapter with React
 */
export function usePlatformHostAdapter(
	config: UsePlatformHostAdapterConfig = {},
): UsePlatformHostAdapterReturn {
	const {
		autoConnect = true,
		handleUrlOverlays = true,
		...adapterConfig
	} = config;

	const [adapter, setAdapter] = useState<PlatformHostAdapter | null>(null);
	const [isInitialized, setIsInitialized] = useState(false);
	const [isConnected, setIsConnected] = useState(false);
	const initializationRef = useRef(false);
	const initialConfigRef = useRef(adapterConfig);

	// Get overlay system hooks
	const { hasOpen, count, closeTop, closeAll } = useOverlays();
	const { openFromUrl } = useOverlayUrl();

	/**
	 * Create overlay system callbacks
	 */
	const createOverlayCallbacks = useCallback((): OverlaySystemCallbacks => {
		return {
			hasOpenOverlays: () => hasOpen,
			getOverlayCount: () => count,
			closeTopOverlay: () => {
				closeTop();
				return true; // Assume success for now
			},
			closeAllOverlays: () => {
				closeAll();
			},
			handleUrlOverlay: handleUrlOverlays
				? (url: string) => {
						// Extract overlay parameters from URL and open overlay
						try {
							const urlObj = new URL(url);
							if (urlObj.searchParams.has("modal")) {
								openFromUrl();
							}
						} catch (error) {
							console.warn("Failed to handle URL overlay:", error);
						}
					}
				: undefined,
		};
	}, [hasOpen, count, closeTop, closeAll, handleUrlOverlays, openFromUrl]);

	/**
	 * Initialize the platform adapter
	 */
	useEffect(() => {
		if (initializationRef.current) {
			return;
		}

		initializationRef.current = true;
		let currentAdapter: PlatformHostAdapter | null = null;

		const initializeAdapter = async () => {
			try {
				const config = initialConfigRef.current;
				const newAdapter = createPlatformHostAdapter({
					...config,
					debug: config.debug ?? process.env.NODE_ENV === "development",
				});

				await newAdapter.initialize();
				currentAdapter = newAdapter;
				setAdapter(newAdapter);
				setIsInitialized(true);
			} catch (error) {
				console.error("Failed to initialize platform host adapter:", error);
				setAdapter(null);
				setIsInitialized(false);
			}
		};

		initializeAdapter();

		// Cleanup on unmount
		return () => {
			if (currentAdapter) {
				currentAdapter.cleanup();
			}
		};
	}, []); // Only initialize once

	/**
	 * Connect to overlay system when adapter is ready
	 */
	useEffect(() => {
		if (!adapter || !isInitialized || !autoConnect) {
			return;
		}

		const callbacks = createOverlayCallbacks();
		adapter.connectOverlaySystem(callbacks);
		setIsConnected(true);

		return () => {
			adapter.disconnectOverlaySystem();
			setIsConnected(false);
		};
	}, [adapter, isInitialized, autoConnect, createOverlayCallbacks]);

	/**
	 * Manual back button handler
	 */
	const handleBack = useCallback(async (): Promise<BackButtonResult> => {
		if (!adapter) {
			return "ignored";
		}
		return await adapter.handleBack();
	}, [adapter]);

	/**
	 * Manual escape key handler
	 */
	const handleEscape = useCallback(async (): Promise<BackButtonResult> => {
		if (!adapter) {
			return "ignored";
		}
		return await adapter.handleEscape();
	}, [adapter]);

	/**
	 * Share content
	 */
	const share = useCallback(
		async (content: {
			title?: string;
			text?: string;
			url?: string;
		}): Promise<boolean> => {
			if (!adapter) {
				return false;
			}
			return await adapter.share(content);
		},
		[adapter],
	);

	/**
	 * Open deep link
	 */
	const openDeepLink = useCallback(
		async (url: string): Promise<boolean> => {
			if (!adapter) {
				return false;
			}
			return await adapter.openDeepLink(url);
		},
		[adapter],
	);

	/**
	 * Manually connect to overlay system
	 */
	const connect = useCallback(() => {
		if (!adapter || isConnected) {
			return;
		}

		const callbacks = createOverlayCallbacks();
		adapter.connectOverlaySystem(callbacks);
		setIsConnected(true);
	}, [adapter, isConnected, createOverlayCallbacks]);

	/**
	 * Manually disconnect from overlay system
	 */
	const disconnect = useCallback(() => {
		if (!adapter || !isConnected) {
			return;
		}

		adapter.disconnectOverlaySystem();
		setIsConnected(false);
	}, [adapter, isConnected]);

	return {
		adapter,
		platform: adapter?.platform || null,
		isInitialized,
		isConnected,
		capabilities: adapter?.capabilities || getPlatformCapabilities("web"),
		handleBack,
		handleEscape,
		share,
		openDeepLink,
		connect,
		disconnect,
	};
}

/**
 * Hook for platform-specific sharing
 */
export function usePlatformShare() {
	const { share, capabilities } = usePlatformHostAdapter({
		autoConnect: false, // Don't need overlay integration for sharing
	});

	const canShare = capabilities?.hasNativeSharing || false;

	const shareContent = useCallback(
		async (content: {
			title?: string;
			text?: string;
			url?: string;
		}): Promise<boolean> => {
			if (!canShare) {
				// Fallback to clipboard or other sharing method
				try {
					if (content.url && navigator.clipboard) {
						await navigator.clipboard.writeText(content.url);
						return true;
					}
				} catch (error) {
					console.warn("Fallback sharing failed:", error);
				}
				return false;
			}

			return await share(content);
		},
		[share, canShare],
	);

	return {
		share: shareContent,
		canShare,
	};
}

/**
 * Hook for platform detection
 */
export function usePlatformDetection() {
	const { platform, capabilities, isInitialized } = usePlatformHostAdapter({
		autoConnect: false, // Don't need overlay integration for detection
	});

	return {
		platform,
		capabilities,
		isInitialized,
		isWeb: platform === "web",
		isCapacitor: platform === "capacitor",
		isTauri: platform === "tauri",
		isMobile: platform === "capacitor",
		isDesktop: platform === "tauri" || platform === "web",
	};
}
