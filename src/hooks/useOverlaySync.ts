/**
 * Advanced URL-Overlay Synchronization Hooks
 *
 * This module provides specialized hooks for advanced synchronization patterns
 * between overlay state and URL parameters, including bidirectional sync,
 * batch operations, and conflict resolution.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import type { OverlayEntry, OverlayType } from "@/types/overlay";
import {
	decodeOverlayFromUrl,
	hasOverlayInUrl,
	type UrlConfig,
} from "@/utils/overlayUrl";
import { useOverlays } from "./useOverlays";
import { useOverlayUrl } from "./useOverlayUrl";

/**
 * Configuration for bidirectional overlay synchronization
 */
export type UseBidirectionalSyncConfig = UrlConfig & {
	/** Whether to sync URL changes to overlay state (default: true) */
	urlToOverlay?: boolean;
	/** Whether to sync overlay changes to URL (default: true) */
	overlayToUrl?: boolean;
	/** Debounce delay for synchronization in milliseconds (default: 150) */
	debounceMs?: number;
	/** Whether to prevent infinite sync loops (default: true) */
	preventLoops?: boolean;
	/** Custom conflict resolution strategy */
	conflictResolution?: "url-wins" | "overlay-wins" | "merge" | "ignore";
};

/**
 * Hook for bidirectional synchronization between overlay state and URL
 *
 * This hook provides more granular control over synchronization direction
 * and conflict resolution compared to the basic useOverlayUrl hook.
 *
 * @example
 * ```tsx
 * function App() {
 *   const { syncState, conflicts, resolvePending } = useBidirectionalSync({
 *     conflictResolution: "url-wins",
 *     debounceMs: 200
 *   });
 *
 *   return (
 *     <div>
 *       {conflicts.length > 0 && (
 *         <button onClick={resolvePending}>
 *           Resolve {conflicts.length} conflicts
 *         </button>
 *       )}
 *     </div>
 *   );
 * }
 * ```
 */
export function useBidirectionalSync(config: UseBidirectionalSyncConfig = {}) {
	const {
		urlToOverlay = true,
		overlayToUrl = true,
		debounceMs = 150,
		preventLoops = true,
		conflictResolution = "url-wins",
	} = config;

	// Memoize urlConfig to prevent unnecessary re-renders
	const urlConfig = useMemo(
		() => ({
			includeProps: config.includeProps,
			includeId: config.includeId,
			maxPropsLength: config.maxPropsLength,
			compressProps: config.compressProps,
		}),
		[
			config.includeProps,
			config.includeId,
			config.maxPropsLength,
			config.compressProps,
		],
	);

	const [searchParams] = useSearchParams();
	const { topOverlay, open, closeAll } = useOverlays();
	const { updateUrl, openFromUrl } = useOverlayUrl(urlConfig);

	// Track synchronization state
	const [conflicts, setConflicts] = useState<
		Array<{
			id: string;
			urlOverlay: Partial<OverlayEntry> | null;
			stateOverlay: OverlayEntry | null;
			timestamp: number;
		}>
	>([]);

	// Prevent infinite loops
	const syncInProgress = useRef(false);
	const lastSyncTimestamp = useRef(0);

	/**
	 * Detect synchronization conflicts
	 */
	const detectConflicts = useCallback(() => {
		if (!preventLoops || syncInProgress.current) return [];

		const urlOverlay = hasOverlayInUrl(searchParams)
			? decodeOverlayFromUrl(searchParams, urlConfig)
			: null;
		const stateOverlay = topOverlay;

		// Check for conflicts
		const hasUrlOverlay = urlOverlay?.type;
		const hasStateOverlay = stateOverlay?.type;

		if (
			hasUrlOverlay &&
			hasStateOverlay &&
			urlOverlay.type !== stateOverlay.type
		) {
			return [
				{
					id: `conflict-${Date.now()}`,
					urlOverlay,
					stateOverlay,
					timestamp: Date.now(),
				},
			];
		}

		return [];
	}, [searchParams, topOverlay, urlConfig, preventLoops]);

	/**
	 * Resolve pending conflicts based on strategy
	 */
	const resolvePending = useCallback(() => {
		const currentConflicts = detectConflicts();

		if (currentConflicts.length === 0) {
			setConflicts([]);
			return;
		}

		syncInProgress.current = true;

		try {
			for (const conflict of currentConflicts) {
				switch (conflictResolution) {
					case "url-wins":
						if (conflict.urlOverlay?.type) {
							openFromUrl();
						} else {
							closeAll();
						}
						break;
					case "overlay-wins":
						updateUrl(conflict.stateOverlay);
						break;
					case "merge":
						// For merge strategy, prefer URL overlay but keep state overlay props
						if (conflict.urlOverlay?.type && conflict.stateOverlay) {
							const mergedOverlay: Omit<OverlayEntry, "id" | "createdAt"> = {
								type: conflict.urlOverlay.type,
								props: {
									...conflict.stateOverlay.props,
									...conflict.urlOverlay.props,
								},
								persistInUrl: true,
							};
							open(mergedOverlay);
						}
						break;
					case "ignore":
						// Do nothing, keep current state
						break;
				}
			}

			setConflicts([]);
		} finally {
			syncInProgress.current = false;
			lastSyncTimestamp.current = Date.now();
		}
	}, [
		conflictResolution,
		openFromUrl,
		closeAll,
		updateUrl,
		open,
		detectConflicts,
	]);

	/**
	 * Sync URL changes to overlay state
	 */
	useEffect(() => {
		if (!urlToOverlay || syncInProgress.current) return;

		const timeoutId = setTimeout(() => {
			const newConflicts = detectConflicts();
			setConflicts(newConflicts);

			if (newConflicts.length === 0) {
				// No conflicts, safe to sync
				if (hasOverlayInUrl(searchParams) && !topOverlay) {
					openFromUrl();
				} else if (!hasOverlayInUrl(searchParams) && topOverlay) {
					closeAll();
				}
			}
		}, debounceMs);

		return () => clearTimeout(timeoutId);
	}, [
		searchParams,
		urlToOverlay,
		debounceMs,
		detectConflicts,
		openFromUrl,
		closeAll,
		topOverlay,
	]);

	/**
	 * Sync overlay changes to URL
	 */
	useEffect(() => {
		if (!overlayToUrl || syncInProgress.current) return;

		const timeoutId = setTimeout(() => {
			const newConflicts = detectConflicts();
			setConflicts(newConflicts);

			if (newConflicts.length === 0) {
				// No conflicts, safe to sync
				updateUrl(topOverlay, { replace: true });
			}
		}, debounceMs);

		return () => clearTimeout(timeoutId);
	}, [topOverlay, overlayToUrl, debounceMs, detectConflicts, updateUrl]);

	/**
	 * Auto-resolve conflicts if strategy is not "ignore"
	 */
	useEffect(() => {
		if (conflicts.length > 0 && conflictResolution !== "ignore") {
			const timeoutId = setTimeout(resolvePending, 50);
			return () => clearTimeout(timeoutId);
		}
	}, [conflicts, conflictResolution, resolvePending]);

	return {
		/** Current synchronization conflicts */
		conflicts,
		/** Resolve all pending conflicts */
		resolvePending,
		/** Whether synchronization is currently in progress */
		isSyncing: syncInProgress.current,
		/** Manually trigger conflict detection */
		detectConflicts,
		/** Current sync state */
		syncState: {
			hasUrlOverlay: hasOverlayInUrl(searchParams),
			hasStateOverlay: !!topOverlay,
			inSync: conflicts.length === 0,
		},
	};
}

/**
 * Hook for batch overlay operations with URL synchronization
 *
 * This hook provides utilities for performing multiple overlay operations
 * while maintaining proper URL synchronization.
 *
 * @example
 * ```tsx
 * function BatchOperations() {
 *   const { batchOpen, batchClose, batchReplace } = useOverlayBatch();
 *
 *   const handleOpenMultiple = () => {
 *     batchOpen([
 *       { type: "INFO", props: { title: "First" } },
 *       { type: "CONFIRM", props: { message: "Second" } }
 *     ]);
 *   };
 *
 *   return <button onClick={handleOpenMultiple}>Open Multiple</button>;
 * }
 * ```
 */
export function useOverlayBatch(config: UrlConfig = {}) {
	const { open, close, closeAll, state } = useOverlays();
	const { updateUrl } = useOverlayUrl(config);

	/**
	 * Open multiple overlays in sequence
	 */
	const batchOpen = useCallback(
		async (overlays: Array<Omit<OverlayEntry, "id" | "createdAt">>) => {
			const openedIds: string[] = [];

			for (const overlay of overlays) {
				const overlayId = open(overlay);
				if (overlayId) {
					openedIds.push(overlayId);
				}
			}

			// Update URL with the current state after opening
			if (openedIds.length > 0) {
				// The URL will be updated automatically by the useOverlayUrl hook
				// when the overlay state changes, so we don't need to manually update it here
			}

			return openedIds;
		},
		[open],
	);

	/**
	 * Close multiple overlays by ID
	 */
	const batchClose = useCallback(
		(ids: string[]) => {
			const closedIds: string[] = [];

			for (const id of ids) {
				try {
					close(id);
					closedIds.push(id);
				} catch (error) {
					// Overlay might not exist, continue with others
					console.warn(`Failed to close overlay ${id}:`, error);
				}
			}

			// Update URL after closing
			updateUrl(null, { replace: true });

			return closedIds;
		},
		[close, updateUrl],
	);

	/**
	 * Close multiple overlays by type
	 */
	const batchCloseByType = useCallback(
		(types: OverlayType[]) => {
			const closedIds: string[] = [];
			const currentStack = state.stack;

			for (const type of types) {
				const overlaysToClose = currentStack.filter(
					(overlay) => overlay.type === type,
				);
				for (const overlay of overlaysToClose) {
					try {
						close(overlay.id);
						closedIds.push(overlay.id);
					} catch (error) {
						console.warn(`Failed to close overlay ${overlay.id}:`, error);
					}
				}
			}

			// Update URL after closing
			updateUrl(null, { replace: true });

			return closedIds;
		},
		[close, updateUrl, state.stack],
	);

	/**
	 * Replace all current overlays with new ones
	 */
	const batchReplace = useCallback(
		async (overlays: Array<Omit<OverlayEntry, "id" | "createdAt">>) => {
			// Close all existing overlays
			closeAll();

			// Open new overlays
			return batchOpen(overlays);
		},
		[closeAll, batchOpen],
	);

	return {
		/** Open multiple overlays in sequence */
		batchOpen,
		/** Close multiple overlays by ID */
		batchClose,
		/** Close multiple overlays by type */
		batchCloseByType,
		/** Replace all overlays with new ones */
		batchReplace,
	};
}

/**
 * Hook for persistent overlay state across page reloads
 *
 * This hook ensures overlay state is preserved and restored
 * when the user navigates or refreshes the page.
 *
 * @example
 * ```tsx
 * function App() {
 *   const { isRestoring, restoreFromUrl } = useOverlayPersistence({
 *     autoRestore: true,
 *     storageKey: "app-overlay-state"
 *   });
 *
 *   if (isRestoring) {
 *     return <div>Restoring overlay state...</div>;
 *   }
 *
 *   return <div>App content</div>;
 * }
 * ```
 */
export function useOverlayPersistence(
	config: {
		/** Whether to automatically restore overlay state on mount (default: true) */
		autoRestore?: boolean;
		/** Local storage key for persistence (default: "overlay-state") */
		storageKey?: string;
		/** URL config for synchronization */
		urlConfig?: UrlConfig;
	} = {},
) {
	const {
		autoRestore = true,
		storageKey = "overlay-state",
		urlConfig = {},
	} = config;

	const [isRestoring, setIsRestoring] = useState(false);
	const [searchParams] = useSearchParams();
	const { openFromUrl } = useOverlayUrl(urlConfig);
	const { topOverlay } = useOverlays();

	/**
	 * Save current overlay state to localStorage
	 */
	const saveState = useCallback(() => {
		if (topOverlay) {
			try {
				const stateToSave = {
					overlay: topOverlay,
					timestamp: Date.now(),
					url: window.location.href,
				};
				localStorage.setItem(storageKey, JSON.stringify(stateToSave));
			} catch (error) {
				console.warn("Failed to save overlay state:", error);
			}
		} else {
			localStorage.removeItem(storageKey);
		}
	}, [topOverlay, storageKey]);

	/**
	 * Restore overlay state from URL or localStorage
	 */
	const restoreFromUrl = useCallback(async () => {
		setIsRestoring(true);

		try {
			// First try to restore from URL
			if (hasOverlayInUrl(searchParams)) {
				const restored = openFromUrl();
				if (restored) {
					return restored;
				}
			}

			// Fallback to localStorage
			const saved = localStorage.getItem(storageKey);
			if (saved) {
				const { timestamp } = JSON.parse(saved);

				// Only restore if saved recently (within 1 hour)
				if (Date.now() - timestamp < 60 * 60 * 1000) {
					return openFromUrl();
				}
			}
		} catch (error) {
			console.warn("Failed to restore overlay state:", error);
		} finally {
			setIsRestoring(false);
		}

		return null;
	}, [searchParams, openFromUrl, storageKey]);

	/**
	 * Clear persisted state
	 */
	const clearPersistedState = useCallback(() => {
		localStorage.removeItem(storageKey);
	}, [storageKey]);

	// Auto-save state changes
	useEffect(() => {
		saveState();
	}, [saveState]);

	// Auto-restore on mount
	useEffect(() => {
		if (autoRestore) {
			restoreFromUrl();
		}
	}, [autoRestore, restoreFromUrl]);

	// Cleanup on unmount
	useEffect(() => {
		return () => {
			if (!topOverlay) {
				clearPersistedState();
			}
		};
	}, [topOverlay, clearPersistedState]);

	return {
		/** Whether overlay state is currently being restored */
		isRestoring,
		/** Manually restore overlay state from URL or storage */
		restoreFromUrl,
		/** Save current overlay state to storage */
		saveState,
		/** Clear persisted overlay state */
		clearPersistedState,
	};
}

/**
 * Hook for overlay state synchronization across multiple tabs/windows
 *
 * This hook uses the Broadcast Channel API to synchronize overlay state
 * across multiple browser tabs or windows of the same application.
 *
 * @example
 * ```tsx
 * function App() {
 *   const { isConnected, connectedTabs } = useOverlayBroadcast({
 *     channelName: "app-overlays"
 *   });
 *
 *   return (
 *     <div>
 *       Connected tabs: {connectedTabs}
 *       {!isConnected && <div>Broadcast not supported</div>}
 *     </div>
 *   );
 * }
 * ```
 */
export function useOverlayBroadcast(
	config: {
		/** Broadcast channel name (default: "overlay-sync") */
		channelName?: string;
		/** Whether to sync overlay changes to other tabs (default: true) */
		broadcastChanges?: boolean;
		/** Whether to receive changes from other tabs (default: true) */
		receiveChanges?: boolean;
	} = {},
) {
	const {
		channelName = "overlay-sync",
		broadcastChanges = true,
		receiveChanges = true,
	} = config;

	const [isConnected, setIsConnected] = useState(false);
	const [connectedTabs, setConnectedTabs] = useState(0);
	const channelRef = useRef<BroadcastChannel | null>(null);

	const { topOverlay, open, closeAll } = useOverlays();

	// Initialize broadcast channel
	useEffect(() => {
		if (typeof BroadcastChannel === "undefined") {
			console.warn("BroadcastChannel not supported");
			return;
		}

		const channel = new BroadcastChannel(channelName);
		channelRef.current = channel;
		setIsConnected(true);

		// Handle incoming messages
		const handleMessage = (event: MessageEvent) => {
			if (!receiveChanges) return;

			const { type, payload } = event.data;

			switch (type) {
				case "overlay-opened":
					if (payload.overlay) {
						open(payload.overlay);
					}
					break;
				case "overlay-closed":
					closeAll();
					break;
				case "tab-connected":
					setConnectedTabs((prev) => prev + 1);
					break;
				case "tab-disconnected":
					setConnectedTabs((prev) => Math.max(0, prev - 1));
					break;
			}
		};

		channel.addEventListener("message", handleMessage);

		// Announce this tab's connection
		channel.postMessage({ type: "tab-connected" });

		return () => {
			channel.postMessage({ type: "tab-disconnected" });
			channel.removeEventListener("message", handleMessage);
			channel.close();
			setIsConnected(false);
		};
	}, [channelName, receiveChanges, open, closeAll]);

	// Broadcast overlay changes
	useEffect(() => {
		if (!broadcastChanges || !channelRef.current) return;

		if (topOverlay) {
			channelRef.current.postMessage({
				type: "overlay-opened",
				payload: { overlay: topOverlay },
			});
		} else {
			channelRef.current.postMessage({
				type: "overlay-closed",
				payload: {},
			});
		}
	}, [topOverlay, broadcastChanges]);

	return {
		/** Whether broadcast channel is connected */
		isConnected,
		/** Number of connected tabs */
		connectedTabs,
		/** Broadcast channel instance */
		channel: channelRef.current,
	};
}
