import { nanoid } from "nanoid";
import { atom, computed } from "nanostores";
import type {
	OverlayActions,
	OverlayConfig,
	OverlayEntry,
	OverlayId,
	OverlayProps,
	OverlayState,
	OverlayType,
} from "@/types/overlay";
import { overlayDebugLog } from "@/utils/overlayDebug";

/**
 * Default configuration for the overlay system
 */
const DEFAULT_CONFIG: OverlayConfig = {
	maxStack: 5,
	defaultAnimation: "scale",
	defaultGlass: false,
	defaultClosable: true,
};

/**
 * Core overlay state atom
 */
export const $overlayState = atom<OverlayState>({
	stack: [],
	config: DEFAULT_CONFIG,
});

/**
 * Computed values derived from overlay state
 */
export const $overlayStack = computed($overlayState, (state) => state.stack);
export const $overlayConfig = computed($overlayState, (state) => state.config);
export const $hasOpenOverlays = computed(
	$overlayState,
	(state) => state.stack.length > 0,
);
export const $topOverlay = computed($overlayState, (state) =>
	state.stack.length > 0 ? state.stack[state.stack.length - 1] : null,
);
export const $overlayCount = computed(
	$overlayState,
	(state) => state.stack.length,
);

/**
 * Helper function to generate unique overlay IDs
 */
function generateOverlayId(): OverlayId {
	return `overlay_${nanoid(8)}`;
}

/** Default URL persistence per overlay type */
const DEFAULT_PERSIST: Record<OverlayType, boolean> = {
	CONFIRM: false,
	INFO: false,
	SHEET: false,
	SETTINGS: true,
	CREATE_GROUP: true,
	EDIT_USER: true,
	ADD_CONTACT: true,
	INVITE_USERS: true,
	FILE_PREVIEW: true,
	EMOJI_PICKER: false,
	THEME_SELECTOR: false,
	GROUP_INFO: true,
	ADD_MEMBERS: false,
	CONTACT_REQUESTS: true,
	AVATAR_EDITOR: false,
	SCREEN_CRACK: false,
};

/**
 * Helper function to create a complete overlay entry
 */
function createOverlayEntry(
	entry: Omit<OverlayEntry, "id" | "createdAt">,
): OverlayEntry {
	return {
		...entry,
		id: generateOverlayId(),
		createdAt: Date.now(),
		persistInUrl: entry.persistInUrl ?? DEFAULT_PERSIST[entry.type] ?? true,
	};
}

/**
 * Overlay actions - these functions modify the overlay state
 */
export const overlayActions: OverlayActions = {
	/**
	 * Open a new overlay
	 */
	open: (entry: Omit<OverlayEntry, "id" | "createdAt">): OverlayId => {
		const currentState = $overlayState.get();
		const newEntry = createOverlayEntry(entry);

		// Check if we've reached the maximum stack size
		let newStack = [...currentState.stack, newEntry];
		if (
			currentState.config.maxStack &&
			newStack.length > currentState.config.maxStack
		) {
			// Remove the oldest overlay to make room
			newStack = newStack.slice(1);
		}

		$overlayState.set({
			...currentState,
			stack: newStack,
		});

		overlayDebugLog("overlay.open", {
			id: newEntry.id,
			type: newEntry.type,
			stackSize: newStack.length,
		});

		return newEntry.id;
	},

	/**
	 * Close an overlay by ID
	 */
	close: (id: OverlayId): void => {
		const currentState = $overlayState.get();
		const target = currentState.stack.find((o) => o.id === id);
		const newStack = currentState.stack.filter((overlay) => overlay.id !== id);

		$overlayState.set({
			...currentState,
			stack: newStack,
		});

		overlayDebugLog("overlay.close", {
			id,
			type: target?.type ?? null,
			stackSize: newStack.length,
		});
	},

	/**
	 * Close the topmost overlay
	 */
	closeTop: (): void => {
		const currentState = $overlayState.get();
		if (currentState.stack.length > 0) {
			const target = currentState.stack[currentState.stack.length - 1];
			const newStack = currentState.stack.slice(0, -1);
			$overlayState.set({
				...currentState,
				stack: newStack,
			});
			overlayDebugLog("overlay.close", {
				id: target.id,
				type: target.type,
				stackSize: newStack.length,
			});
		}
	},

	/**
	 * Close all overlays
	 */
	closeAll: (): void => {
		const currentState = $overlayState.get();
		$overlayState.set({
			...currentState,
			stack: [],
		});
		overlayDebugLog("overlay.closeAll", {
			prevStackSize: currentState.stack.length,
		});
	},

	/**
	 * Replace the topmost overlay with a new one
	 */
	replaceTop: (entry: Omit<OverlayEntry, "id" | "createdAt">): OverlayId => {
		const currentState = $overlayState.get();
		const newEntry = createOverlayEntry(entry);

		let newStack: OverlayEntry[];
		if (currentState.stack.length > 0) {
			// Replace the top overlay
			newStack = [...currentState.stack.slice(0, -1), newEntry];
		} else {
			// No overlays to replace, just add the new one
			newStack = [newEntry];
		}

		$overlayState.set({
			...currentState,
			stack: newStack,
		});

		overlayDebugLog("overlay.replaceTop", {
			id: newEntry.id,
			type: newEntry.type,
			stackSize: newStack.length,
		});

		return newEntry.id;
	},

	/**
	 * Update the props of an existing overlay
	 */
	updateProps: (id: OverlayId, props: Partial<OverlayProps>): void => {
		const currentState = $overlayState.get();
		const newStack = currentState.stack.map((overlay) => {
			if (overlay.id === id) {
				return {
					...overlay,
					props: { ...overlay.props, ...props },
				};
			}
			return overlay;
		});

		$overlayState.set({
			...currentState,
			stack: newStack,
		});

		overlayDebugLog("overlay.updateProps", { id });
	},

	/**
	 * Check if an overlay with the given ID exists
	 */
	exists: (id: OverlayId): boolean => {
		const currentState = $overlayState.get();
		return currentState.stack.some((overlay) => overlay.id === id);
	},

	/**
	 * Get an overlay by ID
	 */
	getById: (id: OverlayId): OverlayEntry | undefined => {
		const currentState = $overlayState.get();
		return currentState.stack.find((overlay) => overlay.id === id);
	},
};

/**
 * Update overlay configuration
 */
export function updateOverlayConfig(config: Partial<OverlayConfig>): void {
	const currentState = $overlayState.get();
	$overlayState.set({
		...currentState,
		config: { ...currentState.config, ...config },
	});
}

/**
 * Reset overlay system to initial state
 */
export function resetOverlaySystem(): void {
	$overlayState.set({
		stack: [],
		config: DEFAULT_CONFIG,
	});
}
