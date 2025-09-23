import { useStore } from "@nanostores/react";
import { useMemo } from "react";
import {
	$hasOpenOverlays,
	$overlayConfig,
	$overlayCount,
	$overlayStack,
	$overlayState,
	$topOverlay,
	overlayActions,
} from "@/stores/overlays";
import type { UseOverlaysReturn } from "@/types/overlay";

/**
 * React hook for interacting with the overlay system
 *
 * This hook provides a convenient interface to the overlay state and actions,
 * automatically subscribing to state changes and providing memoized actions.
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { open, close, hasOpen, topOverlay } = useOverlays();
 *
 *   const handleOpenConfirm = () => {
 *     open({
 *       type: "CONFIRM",
 *       props: {
 *         message: "Are you sure?",
 *         onConfirm: () => console.log("Confirmed!"),
 *       },
 *     });
 *   };
 *
 *   return (
 *     <div>
 *       <button onClick={handleOpenConfirm}>Open Confirm</button>
 *       {hasOpen && <p>Overlay is open: {topOverlay?.type}</p>}
 *     </div>
 *   );
 * }
 * ```
 */
export function useOverlays(): UseOverlaysReturn {
	// Subscribe to overlay state changes
	const state = useStore($overlayState);
	const _stack = useStore($overlayStack);
	const _config = useStore($overlayConfig);
	const hasOpen = useStore($hasOpenOverlays);
	const topOverlay = useStore($topOverlay);
	const count = useStore($overlayCount);

	// Memoize actions to prevent unnecessary re-renders
	const actions = useMemo(() => overlayActions, []);

	return {
		// State
		state,
		hasOpen,
		topOverlay,
		count,

		// Actions
		...actions,
	};
}

/**
 * Hook for accessing only the overlay state (read-only)
 *
 * Use this when you only need to read overlay state without performing actions.
 * This can help prevent unnecessary re-renders in components that don't need actions.
 *
 * @example
 * ```tsx
 * function OverlayIndicator() {
 *   const { hasOpen, count } = useOverlayState();
 *
 *   if (!hasOpen) return null;
 *
 *   return <div>Open overlays: {count}</div>;
 * }
 * ```
 */
export function useOverlayState() {
	const state = useStore($overlayState);
	const hasOpen = useStore($hasOpenOverlays);
	const topOverlay = useStore($topOverlay);
	const count = useStore($overlayCount);

	return {
		state,
		hasOpen,
		topOverlay,
		count,
	};
}

/**
 * Hook for accessing only overlay actions (write-only)
 *
 * Use this when you only need to perform overlay actions without reading state.
 * This can help prevent unnecessary re-renders in components that don't need state.
 *
 * @example
 * ```tsx
 * function ActionButton() {
 *   const { open, close } = useOverlayActions();
 *
 *   return (
 *     <button onClick={() => open({ type: "INFO", props: { title: "Hello" } })}>
 *       Open Info
 *     </button>
 *   );
 * }
 * ```
 */
export function useOverlayActions() {
	return useMemo(() => overlayActions, []);
}
