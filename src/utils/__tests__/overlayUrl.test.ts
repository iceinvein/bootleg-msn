import { describe, it, expect, beforeEach, vi } from "vitest";
import {
	encodeOverlayToUrl,
	decodeOverlayFromUrl,
	updateUrlWithOverlay,
	hasOverlayInUrl,
	clearOverlayFromUrl,
	generateShareableUrl,
	OVERLAY_URL_PARAMS,
} from "../overlayUrl";
import type { OverlayEntry } from "@/types/overlay";

// Mock console.warn to avoid noise in tests
const mockConsoleWarn = vi.spyOn(console, "warn").mockImplementation(() => {});

describe("Overlay URL Utilities", () => {
	beforeEach(() => {
		mockConsoleWarn.mockClear();
	});

	describe("encodeOverlayToUrl", () => {
		it("should encode basic overlay to URL parameters", () => {
			const overlay: OverlayEntry = {
				id: "test-id",
				type: "CONFIRM",
				createdAt: Date.now(),
				props: {
					title: "Test Title",
					message: "Test message",
				},
			};

			const params = encodeOverlayToUrl(overlay);

			expect(params.get(OVERLAY_URL_PARAMS.MODAL)).toBe("CONFIRM");
			expect(params.has(OVERLAY_URL_PARAMS.PROPS)).toBe(true);
			expect(params.has(OVERLAY_URL_PARAMS.ID)).toBe(false); // ID not included by default
		});

		it("should include ID when configured", () => {
			const overlay: OverlayEntry = {
				id: "test-id",
				type: "INFO",
				createdAt: Date.now(),
			};

			const params = encodeOverlayToUrl(overlay, { includeId: true });

			expect(params.get(OVERLAY_URL_PARAMS.ID)).toBe("test-id");
		});

		it("should exclude props when configured", () => {
			const overlay: OverlayEntry = {
				id: "test-id",
				type: "CONFIRM",
				createdAt: Date.now(),
				props: {
					title: "Test Title",
				},
			};

			const params = encodeOverlayToUrl(overlay, { includeProps: false });

			expect(params.get(OVERLAY_URL_PARAMS.MODAL)).toBe("CONFIRM");
			expect(params.has(OVERLAY_URL_PARAMS.PROPS)).toBe(false);
		});

		it("should handle overlay without props", () => {
			const overlay: OverlayEntry = {
				id: "test-id",
				type: "SETTINGS",
				createdAt: Date.now(),
			};

			const params = encodeOverlayToUrl(overlay);

			expect(params.get(OVERLAY_URL_PARAMS.MODAL)).toBe("SETTINGS");
			expect(params.has(OVERLAY_URL_PARAMS.PROPS)).toBe(false);
		});

		it("should sanitize props by removing functions", () => {
			const overlay: OverlayEntry = {
				id: "test-id",
				type: "CONFIRM",
				createdAt: Date.now(),
				props: {
					title: "Test",
					onConfirm: () => console.log("confirmed"), // Function should be removed
					message: "Test message",
				},
			};

			const params = encodeOverlayToUrl(overlay, { compressProps: false });
			const encodedProps = params.get(OVERLAY_URL_PARAMS.PROPS);

			expect(encodedProps).toBeTruthy();

			// Decode and check that function was removed
			const decoded = JSON.parse(atob(encodedProps!));
			expect(decoded.title).toBe("Test");
			expect(decoded.message).toBe("Test message");
			expect(decoded.onConfirm).toBeUndefined();
		});

		it("should handle props that are too long", () => {
			const longString = "a".repeat(3000);
			const overlay: OverlayEntry = {
				id: "test-id",
				type: "INFO",
				createdAt: Date.now(),
				props: {
					longData: longString,
				},
			};

			const params = encodeOverlayToUrl(overlay, { maxPropsLength: 100 });

			expect(params.has(OVERLAY_URL_PARAMS.PROPS)).toBe(false);
			expect(mockConsoleWarn).toHaveBeenCalledWith(
				expect.stringContaining("Overlay props too long for URL")
			);
		});
	});

	describe("decodeOverlayFromUrl", () => {
		it("should decode basic overlay from URL parameters", () => {
			const params = new URLSearchParams();
			params.set(OVERLAY_URL_PARAMS.MODAL, "CONFIRM");
			params.set(OVERLAY_URL_PARAMS.PROPS, btoa(JSON.stringify({ title: "Test" })));

			const overlay = decodeOverlayFromUrl(params);

			expect(overlay).toEqual({
				type: "CONFIRM",
				props: { title: "Test" },
			});
		});

		it("should return null when no modal parameter", () => {
			const params = new URLSearchParams();
			params.set("other", "value");

			const overlay = decodeOverlayFromUrl(params);

			expect(overlay).toBeNull();
		});

		it("should handle invalid overlay type", () => {
			const params = new URLSearchParams();
			params.set(OVERLAY_URL_PARAMS.MODAL, "INVALID_TYPE");

			const overlay = decodeOverlayFromUrl(params);

			expect(overlay).toBeNull();
			expect(mockConsoleWarn).toHaveBeenCalledWith(
				expect.stringContaining("Invalid overlay type in URL")
			);
		});

		it("should decode overlay with ID", () => {
			const params = new URLSearchParams();
			params.set(OVERLAY_URL_PARAMS.MODAL, "INFO");
			params.set(OVERLAY_URL_PARAMS.ID, "test-id");

			const overlay = decodeOverlayFromUrl(params);

			expect(overlay).toEqual({
				type: "INFO",
				id: "test-id",
			});
		});

		it("should handle malformed props gracefully", () => {
			const params = new URLSearchParams();
			params.set(OVERLAY_URL_PARAMS.MODAL, "CONFIRM");
			params.set(OVERLAY_URL_PARAMS.PROPS, "invalid-base64");

			const overlay = decodeOverlayFromUrl(params);

			expect(overlay).toEqual({
				type: "CONFIRM",
				props: undefined,
			});
			expect(mockConsoleWarn).toHaveBeenCalledWith(
				"Failed to decode overlay props from URL:",
				expect.any(Error)
			);
		});
	});

	describe("updateUrlWithOverlay", () => {
		it("should add overlay parameters to existing URL", () => {
			const currentParams = new URLSearchParams("existing=value");
			const overlay: OverlayEntry = {
				id: "test-id",
				type: "CONFIRM",
				createdAt: Date.now(),
				props: { title: "Test" },
			};

			const newParams = updateUrlWithOverlay(currentParams, overlay);

			expect(newParams.get("existing")).toBe("value");
			expect(newParams.get(OVERLAY_URL_PARAMS.MODAL)).toBe("CONFIRM");
			expect(newParams.has(OVERLAY_URL_PARAMS.PROPS)).toBe(true);
		});

		it("should remove overlay parameters when overlay is null", () => {
			const currentParams = new URLSearchParams();
			currentParams.set(OVERLAY_URL_PARAMS.MODAL, "CONFIRM");
			currentParams.set(OVERLAY_URL_PARAMS.PROPS, "test");
			currentParams.set("other", "value");

			const newParams = updateUrlWithOverlay(currentParams, null);

			expect(newParams.has(OVERLAY_URL_PARAMS.MODAL)).toBe(false);
			expect(newParams.has(OVERLAY_URL_PARAMS.PROPS)).toBe(false);
			expect(newParams.get("other")).toBe("value");
		});

		it("should replace existing overlay parameters", () => {
			const currentParams = new URLSearchParams();
			currentParams.set(OVERLAY_URL_PARAMS.MODAL, "OLD_TYPE");
			currentParams.set(OVERLAY_URL_PARAMS.PROPS, "old-props");

			const overlay: OverlayEntry = {
				id: "new-id",
				type: "INFO",
				createdAt: Date.now(),
			};

			const newParams = updateUrlWithOverlay(currentParams, overlay);

			expect(newParams.get(OVERLAY_URL_PARAMS.MODAL)).toBe("INFO");
			expect(newParams.has(OVERLAY_URL_PARAMS.PROPS)).toBe(false);
		});
	});

	describe("hasOverlayInUrl", () => {
		it("should return true when modal parameter exists", () => {
			const params = new URLSearchParams();
			params.set(OVERLAY_URL_PARAMS.MODAL, "CONFIRM");

			expect(hasOverlayInUrl(params)).toBe(true);
		});

		it("should return false when modal parameter does not exist", () => {
			const params = new URLSearchParams("other=value");

			expect(hasOverlayInUrl(params)).toBe(false);
		});
	});

	describe("clearOverlayFromUrl", () => {
		it("should remove all overlay parameters", () => {
			const params = new URLSearchParams();
			params.set(OVERLAY_URL_PARAMS.MODAL, "CONFIRM");
			params.set(OVERLAY_URL_PARAMS.PROPS, "test");
			params.set(OVERLAY_URL_PARAMS.ID, "test-id");
			params.set("other", "value");

			const cleared = clearOverlayFromUrl(params);

			expect(cleared.has(OVERLAY_URL_PARAMS.MODAL)).toBe(false);
			expect(cleared.has(OVERLAY_URL_PARAMS.PROPS)).toBe(false);
			expect(cleared.has(OVERLAY_URL_PARAMS.ID)).toBe(false);
			expect(cleared.get("other")).toBe("value");
		});
	});

	describe("generateShareableUrl", () => {
		it("should generate URL with overlay parameters", () => {
			const baseUrl = "https://example.com/app";
			const overlay: OverlayEntry = {
				id: "test-id",
				type: "CONFIRM",
				createdAt: Date.now(),
				props: { title: "Test" },
			};

			const shareableUrl = generateShareableUrl(baseUrl, overlay);

			const url = new URL(shareableUrl);
			expect(url.origin + url.pathname).toBe(baseUrl);
			expect(url.searchParams.get(OVERLAY_URL_PARAMS.MODAL)).toBe("CONFIRM");
			expect(url.searchParams.has(OVERLAY_URL_PARAMS.PROPS)).toBe(true);
		});

		it("should preserve existing query parameters", () => {
			const baseUrl = "https://example.com/app?existing=value";
			const overlay: OverlayEntry = {
				id: "test-id",
				type: "INFO",
				createdAt: Date.now(),
			};

			const shareableUrl = generateShareableUrl(baseUrl, overlay);

			const url = new URL(shareableUrl);
			expect(url.searchParams.get("existing")).toBe("value");
			expect(url.searchParams.get(OVERLAY_URL_PARAMS.MODAL)).toBe("INFO");
		});
	});

	describe("Round-trip encoding/decoding", () => {
		it("should preserve overlay data through encode/decode cycle", () => {
			const originalOverlay: OverlayEntry = {
				id: "test-id",
				type: "EDIT_USER",
				createdAt: Date.now(),
				props: {
					title: "Edit User",
					userId: "user-123",
					initialData: {
						name: "John Doe",
						email: "john@example.com",
					},
				},
			};

			// Encode to URL without compression to preserve exact values
			const params = encodeOverlayToUrl(originalOverlay, { includeId: true, compressProps: false });

			// Decode from URL
			const decodedOverlay = decodeOverlayFromUrl(params);

			expect(decodedOverlay).toEqual({
				type: originalOverlay.type,
				id: originalOverlay.id,
				props: originalOverlay.props,
			});
		});
	});
});
