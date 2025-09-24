/**
 * OverlayHost Component
 *
 * This component serves as the central host for rendering all overlays in the application.
 * It subscribes to the overlay state and renders the appropriate overlay components
 * based on the overlay type and configuration.
 */

import { useStore } from "@nanostores/react";
import { AnimatePresence } from "framer-motion";
import { $overlayStack } from "@/stores/overlays";
import type { OverlayEntry } from "@/types/overlay";
import { OverlayRenderer } from "./OverlayRenderer";

/**
 * Configuration options for the OverlayHost
 */
export type OverlayHostConfig = {
	/** Whether to enable debug logging */
	debug?: boolean;
	/** Custom z-index base for overlays */
	zIndexBase?: number;
	/** Whether to render overlays in a portal */
	usePortal?: boolean;
	/** Portal container selector */
	portalContainer?: string;
};

/**
 * Props for the OverlayHost component
 */
export type OverlayHostProps = {
	/** Configuration options */
	config?: OverlayHostConfig;
	/** Custom class name */
	className?: string;
};

/**
 * Default configuration for the OverlayHost
 */
const DEFAULT_CONFIG: Required<OverlayHostConfig> = {
	debug: false,
	zIndexBase: 1000,
	usePortal: true,
	portalContainer: "body",
};

/**
 * OverlayHost component that renders all active overlays
 *
 * This component:
 * - Subscribes to the overlay state
 * - Renders overlays in the correct order (stack)
 * - Handles animations between overlay changes
 * - Provides proper z-index stacking
 * - Supports portal rendering for proper DOM placement
 *
 * @example
 * ```tsx
 * function App() {
 *   return (
 *     <div>
 *       <main>Your app content</main>
 *       <OverlayHost />
 *     </div>
 *   );
 * }
 * ```
 */
export function OverlayHost({ config, className }: OverlayHostProps) {
	const overlayStack = useStore($overlayStack);
	const finalConfig = { ...DEFAULT_CONFIG, ...config };

	// Debug logging
	if (finalConfig.debug) {
		console.log("[OverlayHost] Rendering overlays:", overlayStack.length);
	}

	/**
	 * Calculate z-index for an overlay based on its position in the stack
	 */
	const getZIndex = (index: number): number => {
		return finalConfig.zIndexBase + index;
	};

	/**
	 * Render a single overlay entry
	 */
	const renderOverlay = (entry: OverlayEntry, index: number) => {
		const zIndex = getZIndex(index);

		if (finalConfig.debug) {
			console.log(
				`[OverlayHost] Rendering overlay ${entry.id} (${entry.type}) at z-index ${zIndex}`,
			);
		}

		return (
			<OverlayRenderer
				key={entry.id}
				entry={entry}
				zIndex={zIndex}
				isTopmost={index === overlayStack.length - 1}
			/>
		);
	};

	/**
	 * Render the overlay stack with animations
	 */
	const renderOverlayStack = () => (
		<AnimatePresence mode="sync">
			{overlayStack.map((entry, index) => renderOverlay(entry, index))}
		</AnimatePresence>
	);

	// If using portal, render in a portal container
	if (finalConfig.usePortal) {
		return (
			<div
				className={className}
				data-overlay-host="true"
				data-overlay-count={overlayStack.length}
			>
				{renderOverlayStack()}
			</div>
		);
	}

	// Render directly in the component tree
	return (
		<div
			className={className}
			data-overlay-host="true"
			data-overlay-count={overlayStack.length}
		>
			{renderOverlayStack()}
		</div>
	);
}

/**
 * Hook to get overlay host information
 *
 * Useful for debugging or conditional rendering based on overlay state.
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { overlayCount, hasOverlays } = useOverlayHost();
 *
 *   return (
 *     <div>
 *       {hasOverlays && <div>Overlays are open: {overlayCount}</div>}
 *     </div>
 *   );
 * }
 * ```
 */
export function useOverlayHost() {
	const overlayStack = useStore($overlayStack);

	return {
		overlayCount: overlayStack.length,
		hasOverlays: overlayStack.length > 0,
		topOverlay: overlayStack[overlayStack.length - 1] || null,
		overlayStack,
	};
}
