/**
 * Overlay Back Button Bridge Hook
 *
 * This hook provides a focused interface for bridging back button events
 * with overlay management and URL synchronization. It offers a simpler
 * alternative to the comprehensive usePlatformHostAdapter for components
 * that primarily need back button integration with overlays.
 */

import { useCallback, useRef, useState } from "react";
import type { BackButtonResult } from "@/adapters/types";
import { useOverlays } from "./useOverlays";
import { useOverlayUrl } from "./useOverlayUrl";
import { usePlatformHostAdapter } from "./usePlatformHostAdapter";

/**
 * Back button handler function
 */
export type BackButtonHandler = () => boolean | Promise<boolean>;

/**
 * Configuration options for useOverlayBackBridge
 */
export type UseOverlayBackBridgeConfig = {
	/** Whether to automatically handle overlay closing (default: true) */
	autoHandleOverlays?: boolean;
	/** Whether to integrate with URL synchronization (default: true) */
	integrateWithUrl?: boolean;
	/** Component name for debugging (default: auto-generated) */
	componentName?: string;
	/** Enable debug logging (default: false) */
	debug?: boolean;
};

/**
 * Return type for useOverlayBackBridge hook
 */
export type UseOverlayBackBridgeReturn = {
	/** Register a custom back button handler */
	registerBackHandler: (handler: BackButtonHandler) => string;
	/** Unregister a back button handler by ID */
	unregisterBackHandler: (id: string) => boolean;
	/** Manually trigger back button handling */
	handleBack: () => Promise<BackButtonResult>;
	/** Check if back navigation is possible */
	canGoBack: () => boolean;
	/** Whether the last back button event was handled by this hook */
	isBackHandled: boolean;
	/** List of currently registered handlers (for debugging) */
	backHandlers: Array<{ id: string; handler: BackButtonHandler }>;
	/** Platform capabilities */
	capabilities: {
		hasHardwareBackButton: boolean;
		hasKeyboardShortcuts: boolean;
	};
};

/**
 * Overlay back button bridge hook
 */
export function useOverlayBackBridge(
	config: UseOverlayBackBridgeConfig = {},
): UseOverlayBackBridgeReturn {
	const {
		autoHandleOverlays = true,
		integrateWithUrl = true,
		debug = false,
	} = config;

	// Generate stable component name using useRef to avoid re-generation on re-renders
	const componentNameRef = useRef(
		config.componentName ||
			`Component-${Math.random().toString(36).substr(2, 9)}`,
	);
	const componentName = componentNameRef.current;

	// Local state for this hook instance
	const [isBackHandled, setIsBackHandled] = useState(false);
	const [backHandlers, setBackHandlers] = useState<
		Array<{ id: string; handler: BackButtonHandler }>
	>([]);
	const backHandlersRef = useRef<
		Array<{ id: string; handler: BackButtonHandler }>
	>([]);
	const handlerIdCounter = useRef(0);

	// Hook dependencies
	const overlays = useOverlays();
	const overlayUrl = useOverlayUrl();
	const platformAdapter = usePlatformHostAdapter();

	const log = useCallback(
		(...args: unknown[]) => {
			if (debug) {
				console.log(`[useOverlayBackBridge:${componentName}]`, ...args);
			}
		},
		[debug, componentName],
	);

	/**
	 * Register a custom back button handler
	 */
	const registerBackHandler = useCallback(
		(handler: BackButtonHandler): string => {
			const handlerId = `back-handler-${++handlerIdCounter.current}-${Date.now()}`;
			const newHandler = { id: handlerId, handler };

			// Update both ref and state
			backHandlersRef.current = [...backHandlersRef.current, newHandler];
			setBackHandlers(backHandlersRef.current);
			log("Registered back handler:", handlerId);

			return handlerId;
		},
		[log],
	);

	/**
	 * Unregister a back button handler by ID
	 */
	const unregisterBackHandler = useCallback(
		(id: string): boolean => {
			const currentHandlers = backHandlersRef.current;
			const index = currentHandlers.findIndex((h) => h.id === id);
			const found = index >= 0;

			if (found) {
				// Update both ref and state
				backHandlersRef.current = currentHandlers.filter((_, i) => i !== index);
				setBackHandlers(backHandlersRef.current);
			}

			log(
				"Unregistering handler:",
				id,
				"from handlers:",
				currentHandlers.map((h) => h.id),
			);
			log("Unregistered back handler:", id, "existed:", found);
			return found;
		},
		[log],
	);

	/**
	 * Handle overlay closing
	 */
	const handleOverlayBack = useCallback(async (): Promise<boolean> => {
		if (!autoHandleOverlays) {
			return false;
		}

		// Check if there are overlays to close
		if (overlays.hasOpen) {
			log("Closing overlay via back button");
			overlays.closeTop();

			// Update URL if integration is enabled
			if (integrateWithUrl && overlayUrl.hasUrlOverlay()) {
				overlayUrl.clearUrl();
			}

			return true;
		}

		return false;
	}, [autoHandleOverlays, overlays, integrateWithUrl, overlayUrl, log]);

	/**
	 * Execute custom back handlers
	 */
	const executeBackHandlers = useCallback(async (): Promise<boolean> => {
		for (const { handler } of backHandlersRef.current) {
			try {
				const result = await handler();
				if (result) {
					log("Back handler returned true, stopping execution");
					return true;
				}
			} catch (error) {
				log("Back handler error:", error);
			}
		}
		return false;
	}, [log]);

	/**
	 * Main back button handler
	 */
	const handleBack = useCallback(async (): Promise<BackButtonResult> => {
		setIsBackHandled(true);
		log("Handling back button event");

		try {
			// 1. Execute custom handlers first
			const customHandled = await executeBackHandlers();
			if (customHandled) {
				log("Custom handler handled the back event");
				return "handled";
			}

			// 2. Handle overlay closing
			const overlayHandled = await handleOverlayBack();
			if (overlayHandled) {
				log("Overlay handler handled the back event");
				return "handled";
			}

			// 3. Delegate to platform adapter
			log("Delegating to platform adapter");
			return await platformAdapter.handleBack();
		} catch (error) {
			log("Error handling back button:", error);
			return "ignored";
		} finally {
			setIsBackHandled(false);
		}
	}, [executeBackHandlers, handleOverlayBack, platformAdapter, log]);

	/**
	 * Check if back navigation is possible
	 */
	const canGoBack = useCallback((): boolean => {
		// Can go back if there are overlays, custom handlers, or platform supports it
		return (
			overlays.hasOpen ||
			backHandlersRef.current.length > 0 ||
			(platformAdapter.capabilities?.hasHardwareBackButton ?? false)
		);
	}, [overlays.hasOpen, platformAdapter.capabilities]);

	return {
		registerBackHandler,
		unregisterBackHandler,
		handleBack,
		canGoBack,
		isBackHandled,
		backHandlers,
		capabilities: {
			hasHardwareBackButton:
				platformAdapter.capabilities?.hasHardwareBackButton ?? false,
			hasKeyboardShortcuts:
				platformAdapter.capabilities?.hasKeyboardShortcuts ?? false,
		},
	};
}
