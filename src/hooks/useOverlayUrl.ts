/**
 * React Hook for Overlay URL Synchronization
 *
 * This hook provides seamless integration between the overlay system
 * and React Router URL parameters for deep linking and shareability.
 */

import { useCallback, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import type { OverlayEntry } from "@/types/overlay";
import { overlayDebugLog } from "@/utils/overlayDebug";
import {
	clearOverlayFromUrl,
	decodeOverlayFromUrl,
	encodeOverlayToUrl,
	generateShareableUrl,
	hasOverlayInUrl,
	type UrlConfig,
	updateUrlWithOverlay,
} from "@/utils/overlayUrl";
import { useOverlays } from "./useOverlays";

/**
 * Configuration options for overlay URL synchronization
 */
export type UseOverlayUrlConfig = UrlConfig & {
	/** Whether to automatically sync overlay state with URL (default: true) */
	autoSync?: boolean;
	/** Whether to replace history instead of pushing new entries (default: false) */
	replaceHistory?: boolean;
	/** Debounce delay for URL updates in milliseconds (default: 100) */
	debounceMs?: number;
};

/**
 * Default configuration for overlay URL synchronization
 */
const DEFAULT_CONFIG: Required<UseOverlayUrlConfig> = {
	autoSync: true,
	replaceHistory: false,
	debounceMs: 100,
	includeProps: true,
	includeId: false,
	maxPropsLength: 2000,
	compressProps: true,
};

/**
 * Hook for synchronizing overlay state with URL parameters
 *
 * @example
 * ```tsx
 * function App() {
 *   const { openFromUrl, updateUrl, generateShareUrl } = useOverlayUrl();
 *
 *   // URL will automatically sync with overlay state
 *   const { open } = useOverlays();
 *
 *   const handleShare = () => {
 *     const shareUrl = generateShareUrl();
 *     navigator.clipboard.writeText(shareUrl);
 *   };
 *
 *   return <div>...</div>;
 * }
 * ```
 */
export function useOverlayUrl(config: UseOverlayUrlConfig = {}) {
	const finalConfig = useMemo(
		() => ({ ...DEFAULT_CONFIG, ...config }),
		[config],
	);
	const [searchParams, setSearchParams] = useSearchParams();
	const navigate = useNavigate();
	const { open, closeAll, topOverlay } = useOverlays();

	/**
	 * Update URL with current overlay state
	 */
	const updateUrl = useCallback(
		(overlay: OverlayEntry | null, options: { replace?: boolean } = {}) => {
			const prev = searchParams.toString();
			const newParams = updateUrlWithOverlay(
				searchParams,
				overlay,
				finalConfig,
			);
			const replace = options.replace ?? finalConfig.replaceHistory;

			overlayDebugLog("url.update", {
				source: "useOverlayUrl.updateUrl",
				overlayType: overlay?.type ?? null,
				prev,
				next: newParams.toString(),
				replace,
			});
			setSearchParams(newParams, { replace });
		},
		[searchParams, setSearchParams, finalConfig],
	);

	/**
	 * Open overlay from URL parameters
	 */
	const openFromUrl = useCallback(() => {
		const overlayData = decodeOverlayFromUrl(searchParams, finalConfig);
		if (overlayData?.type) {
			overlayDebugLog("sync.urlToOverlay.openFromUrl", {
				decodedType: overlayData.type,
				decodedProps: overlayData.props ? Object.keys(overlayData.props) : null,
				search: searchParams.toString(),
			});
			// Create a complete overlay entry
			const overlayEntry: Omit<OverlayEntry, "id" | "createdAt"> = {
				type: overlayData.type,
				props: overlayData.props,
				persistInUrl: true,
			};

			return open(overlayEntry);
		}
		return null;
	}, [searchParams, finalConfig, open]);

	/**
	 * Clear overlay from URL
	 */
	const clearUrl = useCallback(
		(options: { replace?: boolean } = {}) => {
			const prev = searchParams.toString();
			const newParams = clearOverlayFromUrl(searchParams);
			const replace = options.replace ?? finalConfig.replaceHistory;

			overlayDebugLog("url.clear", {
				source: "useOverlayUrl.clearUrl",
				prev,
				next: newParams.toString(),
				replace,
			});
			setSearchParams(newParams, { replace });
		},
		[searchParams, setSearchParams, finalConfig],
	);

	/**
	 * Generate shareable URL for current overlay
	 */
	const generateShareUrl = useCallback(
		(overlay?: OverlayEntry) => {
			const targetOverlay = overlay ?? topOverlay;
			if (!targetOverlay) {
				return window.location.href;
			}

			return generateShareableUrl(
				window.location.origin + window.location.pathname,
				targetOverlay,
				finalConfig,
			);
		},
		[topOverlay, finalConfig],
	);

	/**
	 * Check if URL contains overlay parameters
	 */
	const hasUrlOverlay = useCallback(() => {
		return hasOverlayInUrl(searchParams);
	}, [searchParams]);

	/**
	 * Navigate to a URL with overlay parameters
	 */
	const navigateWithOverlay = useCallback(
		(
			path: string,
			overlay: OverlayEntry,
			options: { replace?: boolean } = {},
		) => {
			const overlayParams = encodeOverlayToUrl(overlay, finalConfig);
			const url = new URL(path, window.location.origin);

			// Add overlay parameters to the URL
			for (const [key, value] of overlayParams) {
				url.searchParams.set(key, value);
			}

			const replace = options.replace ?? finalConfig.replaceHistory;
			navigate(url.pathname + url.search, { replace });
		},
		[navigate, finalConfig],
	);

	/**
	 * Auto-sync overlay state with URL when enabled
	 */
	useEffect(() => {
		if (!finalConfig.autoSync) {
			return;
		}

		let timeoutId: NodeJS.Timeout;

		const syncUrl = () => {
			// Clear any existing timeout
			if (timeoutId) {
				clearTimeout(timeoutId);
			}

			// Debounce URL updates
			timeoutId = setTimeout(() => {
				const currentOverlay = topOverlay;

				// Only update URL if overlay should persist
				if (currentOverlay?.persistInUrl !== false) {
					overlayDebugLog("sync.overlayToUrl.updateUrl", {
						source: "useOverlayUrl.autoSync",
						type: currentOverlay?.type ?? null,
					});
					updateUrl(currentOverlay, { replace: true });
				}
			}, finalConfig.debounceMs);
		};

		// Sync when overlay state changes
		syncUrl();

		return () => {
			if (timeoutId) {
				clearTimeout(timeoutId);
			}
		};
	}, [topOverlay, updateUrl, finalConfig.autoSync, finalConfig.debounceMs]);

	/**
	 * Handle browser back/forward navigation
	 */
	useEffect(() => {
		if (!finalConfig.autoSync) {
			return;
		}

		const handlePopState = () => {
			// Check if URL has overlay parameters
			if (hasOverlayInUrl(searchParams)) {
				// Open overlay from URL if not already open
				const urlOverlay = decodeOverlayFromUrl(searchParams, finalConfig);
				const currentOverlay = topOverlay;

				overlayDebugLog("router.popstate", {
					urlOverlayType: urlOverlay?.type ?? null,
					currentOverlayType: currentOverlay?.type ?? null,
					search: searchParams.toString(),
				});

				// Only open if different from current overlay
				if (!currentOverlay || currentOverlay.type !== urlOverlay?.type) {
					openFromUrl();
				}
			} else if (topOverlay) {
				overlayDebugLog("router.popstate", {
					urlOverlayType: null,
					currentOverlayType: topOverlay?.type ?? null,
					search: searchParams.toString(),
				});
				closeAll();
			}
		};

		// Listen for popstate events (back/forward navigation)
		window.addEventListener("popstate", handlePopState);

		return () => {
			window.removeEventListener("popstate", handlePopState);
		};
	}, [searchParams, finalConfig, openFromUrl, closeAll, topOverlay]);

	/**
	 * Initialize overlay from URL on mount
	 */
	useEffect(() => {
		if (finalConfig.autoSync && hasOverlayInUrl(searchParams) && !topOverlay) {
			overlayDebugLog("init.fromUrl", { search: searchParams.toString() });
			openFromUrl();
		}
	}, [finalConfig.autoSync, openFromUrl, searchParams, topOverlay]); // Only run on mount

	return {
		/** Update URL with overlay state */
		updateUrl,
		/** Open overlay from current URL parameters */
		openFromUrl,
		/** Clear overlay parameters from URL */
		clearUrl,
		/** Generate shareable URL for overlay */
		generateShareUrl,
		/** Check if URL contains overlay parameters */
		hasUrlOverlay,
		/** Navigate to path with overlay parameters */
		navigateWithOverlay,
		/** Current search parameters */
		searchParams,
	};
}

/**
 * Hook for generating shareable URLs (lightweight version)
 *
 * Use this when you only need URL generation without full synchronization.
 */
export function useOverlayShare(config: UrlConfig = {}) {
	const { topOverlay } = useOverlays();

	const generateShareUrl = useCallback(
		(overlay?: OverlayEntry) => {
			const targetOverlay = overlay ?? topOverlay;
			if (!targetOverlay) {
				return window.location.href;
			}

			return generateShareableUrl(
				window.location.origin + window.location.pathname,
				targetOverlay,
				config,
			);
		},
		[topOverlay, config],
	);

	const copyShareUrl = useCallback(
		async (overlay?: OverlayEntry) => {
			const url = generateShareUrl(overlay);
			try {
				await navigator.clipboard.writeText(url);
				return true;
			} catch (error) {
				console.warn("Failed to copy URL to clipboard:", error);
				return false;
			}
		},
		[generateShareUrl],
	);

	return {
		/** Generate shareable URL for overlay */
		generateShareUrl,
		/** Copy shareable URL to clipboard */
		copyShareUrl,
	};
}
