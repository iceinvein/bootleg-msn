/**
 * URL Parameter Utilities for Overlay System
 *
 * This module provides utilities for encoding and decoding overlay state
 * to/from URL search parameters, enabling deep linking and shareability.
 */

import type { OverlayEntry, OverlayProps, OverlayType } from "@/types/overlay";

/**
 * Type for values that can be safely serialized to JSON and stored in URLs
 */
type SerializableValue =
	| string
	| number
	| boolean
	| null
	| SerializableValue[]
	| { [key: string]: SerializableValue };

/**
 * URL parameter names used for overlay state
 */
export const OVERLAY_URL_PARAMS = {
	/** Main overlay type parameter */
	MODAL: "modal",
	/** Overlay props parameter (JSON encoded) */
	PROPS: "modalProps",
	/** Overlay ID parameter */
	ID: "modalId",
} as const;

/**
 * Configuration for URL encoding/decoding
 */
export type UrlConfig = {
	/** Whether to include overlay props in URL (default: true) */
	includeProps?: boolean;
	/** Whether to include overlay ID in URL (default: false) */
	includeId?: boolean;
	/** Maximum length for encoded props (default: 2000) */
	maxPropsLength?: number;
	/** Whether to compress props JSON (default: true) */
	compressProps?: boolean;
};

/**
 * Default URL configuration
 */
const DEFAULT_URL_CONFIG: Required<UrlConfig> = {
	includeProps: true,
	includeId: false,
	maxPropsLength: 2000,
	compressProps: true,
};

/**
 * Safely encode overlay props to URL-safe string
 */
function encodeOverlayProps(
	props: OverlayProps | undefined,
	config: Required<UrlConfig>,
): string | null {
	if (!props || !config.includeProps) {
		return null;
	}

	try {
		// Remove functions and non-serializable values
		const serializableProps = sanitizePropsForUrl(props);
		let encoded = JSON.stringify(serializableProps);

		// Apply compression if enabled (simple minification)
		if (config.compressProps) {
			encoded = encoded.replace(/\s+/g, "");
		}

		// Check length limit
		if (encoded.length > config.maxPropsLength) {
			console.warn(
				`Overlay props too long for URL (${encoded.length} > ${config.maxPropsLength}), skipping props`,
			);
			return null;
		}

		// Base64 encode for URL safety
		return btoa(encoded);
	} catch (error) {
		console.warn("Failed to encode overlay props for URL:", error);
		return null;
	}
}

/**
 * Safely decode overlay props from URL string
 */
function decodeOverlayProps(encoded: string | null): OverlayProps | undefined {
	if (!encoded) {
		return undefined;
	}

	try {
		// Base64 decode
		const decoded = atob(encoded);
		return JSON.parse(decoded) as OverlayProps;
	} catch (error) {
		console.warn("Failed to decode overlay props from URL:", error);
		return undefined;
	}
}

/**
 * Remove non-serializable values from props for URL encoding
 */
function sanitizePropsForUrl(
	props: OverlayProps,
): Record<string, SerializableValue> {
	const sanitized: Record<string, SerializableValue> = {};

	for (const [key, value] of Object.entries(props)) {
		// Skip functions
		if (typeof value === "function") {
			continue;
		}

		// Skip undefined values
		if (value === undefined) {
			continue;
		}

		// Include serializable values
		if (
			value === null ||
			typeof value === "string" ||
			typeof value === "number" ||
			typeof value === "boolean" ||
			Array.isArray(value) ||
			(typeof value === "object" && value.constructor === Object)
		) {
			sanitized[key] = value;
		}
	}

	return sanitized;
}

/**
 * Encode overlay entry to URL search parameters
 */
export function encodeOverlayToUrl(
	overlay: OverlayEntry,
	config: UrlConfig = {},
): URLSearchParams {
	const finalConfig = { ...DEFAULT_URL_CONFIG, ...config };
	const params = new URLSearchParams();

	// Add overlay type
	params.set(OVERLAY_URL_PARAMS.MODAL, overlay.type);

	// Add overlay ID if configured
	if (finalConfig.includeId) {
		params.set(OVERLAY_URL_PARAMS.ID, overlay.id);
	}

	// Add overlay props if configured and available
	const encodedProps = encodeOverlayProps(overlay.props, finalConfig);
	if (encodedProps) {
		params.set(OVERLAY_URL_PARAMS.PROPS, encodedProps);
	}

	return params;
}

/**
 * Decode overlay entry from URL search parameters
 */
export function decodeOverlayFromUrl(
	searchParams: URLSearchParams,
	config: UrlConfig = {},
): Partial<OverlayEntry> | null {
	const _finalConfig = { ...DEFAULT_URL_CONFIG, ...config };

	// Check if modal parameter exists
	const modalType = searchParams.get(OVERLAY_URL_PARAMS.MODAL);
	if (!modalType) {
		return null;
	}

	// Validate overlay type
	if (!isValidOverlayType(modalType)) {
		console.warn(`Invalid overlay type in URL: ${modalType}`);
		return null;
	}

	const overlay: Partial<OverlayEntry> = {
		type: modalType as OverlayType,
	};

	// Decode overlay ID if present
	const modalId = searchParams.get(OVERLAY_URL_PARAMS.ID);
	if (modalId) {
		overlay.id = modalId;
	}

	// Decode overlay props if present
	const encodedProps = searchParams.get(OVERLAY_URL_PARAMS.PROPS);
	if (encodedProps) {
		overlay.props = decodeOverlayProps(encodedProps);
	}

	return overlay;
}

/**
 * Check if a string is a valid overlay type
 */
function isValidOverlayType(type: string): boolean {
	const validTypes: OverlayType[] = [
		"CONFIRM",
		"EDIT_USER",
		"SHEET",
		"SETTINGS",
		"INFO",
		"CREATE_GROUP",
		"INVITE_USERS",
		"FILE_PREVIEW",
		"EMOJI_PICKER",
		"THEME_SELECTOR",
	];
	return validTypes.includes(type as OverlayType);
}

/**
 * Update URL search parameters with overlay state
 */
export function updateUrlWithOverlay(
	currentParams: URLSearchParams,
	overlay: OverlayEntry | null,
	config: UrlConfig = {},
): URLSearchParams {
	const newParams = new URLSearchParams(currentParams);

	// Remove existing overlay parameters
	newParams.delete(OVERLAY_URL_PARAMS.MODAL);
	newParams.delete(OVERLAY_URL_PARAMS.PROPS);
	newParams.delete(OVERLAY_URL_PARAMS.ID);

	// Add new overlay parameters if overlay exists
	if (overlay) {
		const overlayParams = encodeOverlayToUrl(overlay, config);
		for (const [key, value] of overlayParams) {
			newParams.set(key, value);
		}
	}

	return newParams;
}

/**
 * Check if URL contains overlay parameters
 */
export function hasOverlayInUrl(searchParams: URLSearchParams): boolean {
	return searchParams.has(OVERLAY_URL_PARAMS.MODAL);
}

/**
 * Clear all overlay parameters from URL
 */
export function clearOverlayFromUrl(
	searchParams: URLSearchParams,
): URLSearchParams {
	const newParams = new URLSearchParams(searchParams);
	newParams.delete(OVERLAY_URL_PARAMS.MODAL);
	newParams.delete(OVERLAY_URL_PARAMS.PROPS);
	newParams.delete(OVERLAY_URL_PARAMS.ID);
	return newParams;
}

/**
 * Generate a shareable URL for an overlay
 */
export function generateShareableUrl(
	baseUrl: string,
	overlay: OverlayEntry,
	config: UrlConfig = {},
): string {
	const url = new URL(baseUrl);
	const overlayParams = encodeOverlayToUrl(overlay, config);

	// Merge with existing search params
	for (const [key, value] of overlayParams) {
		url.searchParams.set(key, value);
	}

	return url.toString();
}
