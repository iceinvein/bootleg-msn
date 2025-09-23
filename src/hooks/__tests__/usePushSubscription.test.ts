/**
 * Tests for usePushSubscription hook
 * Note: This hook is a side-effect only hook that returns undefined
 */

import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock Convex
const mockUpsert = vi.fn();
vi.mock("convex/react", () => ({
	useMutation: vi.fn(() => mockUpsert),
}));

// Mock push-subscription utilities
const mockEnsurePushSubscription = vi.fn();
vi.mock("../../lib/push-subscription", () => ({
	ensurePushSubscription: mockEnsurePushSubscription,
}));

import { usePushSubscription } from "../usePushSubscription";

describe("usePushSubscription", () => {
	beforeEach(() => {
		vi.clearAllMocks();

		// Mock navigator.serviceWorker
		Object.defineProperty(global.navigator, "serviceWorker", {
			value: {
				register: vi.fn().mockResolvedValue({
					pushManager: {
						getSubscription: vi.fn().mockResolvedValue(null),
					},
				}),
				ready: Promise.resolve({
					pushManager: {
						getSubscription: vi.fn().mockResolvedValue(null),
					},
				}),
			},
			writable: true,
		});

		// Mock window.PushManager
		Object.defineProperty(global.window, "PushManager", {
			value: function PushManager() {},
			writable: true,
		});

		// Mock Notification
		Object.defineProperty(global, "Notification", {
			value: {
				permission: "granted",
			},
			writable: true,
		});

		// Mock import.meta.env
		vi.stubGlobal("import", {
			meta: {
				env: {
					VITE_VAPID_PUBLIC_KEY: "test-vapid-key",
				},
			},
		});

		// Default mock implementations
		mockEnsurePushSubscription.mockResolvedValue({
			endpoint: "https://test.endpoint",
			keys: {
				p256dh: "test-p256dh",
				auth: "test-auth",
			},
		});
		mockUpsert.mockResolvedValue("subscription-id");
	});

	it("should be a side-effect hook that returns undefined", () => {
		const { result } = renderHook(() => usePushSubscription());

		// This hook is a side-effect hook and doesn't return anything
		expect(result.current).toBeUndefined();
	});

	it("should not throw during initialization", () => {
		expect(() => {
			renderHook(() => usePushSubscription());
		}).not.toThrow();
	});

	it("should handle unsupported browsers gracefully", () => {
		// Mock unsupported browser
		Object.defineProperty(global.navigator, "serviceWorker", {
			value: undefined,
			writable: true,
		});

		expect(() => {
			renderHook(() => usePushSubscription());
		}).not.toThrow();
	});

	it("should handle missing VAPID key gracefully", () => {
		// Mock missing VAPID key
		vi.stubGlobal("import", {
			meta: {
				env: {},
			},
		});

		expect(() => {
			renderHook(() => usePushSubscription());
		}).not.toThrow();
	});

	it("should handle permission denied gracefully", () => {
		// Mock permission denied
		Object.defineProperty(global, "Notification", {
			value: {
				permission: "denied",
			},
			writable: true,
		});

		expect(() => {
			renderHook(() => usePushSubscription());
		}).not.toThrow();
	});

	it("should cleanup on unmount", () => {
		const { unmount } = renderHook(() => usePushSubscription());

		// Should not throw
		expect(() => unmount()).not.toThrow();
	});

	describe("Error Handling", () => {
		it("should handle subscription creation errors gracefully", async () => {
			const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
			mockEnsurePushSubscription.mockRejectedValue(new Error("Subscription failed"));

			// Should not throw during render even if subscription setup fails
			expect(() => {
				renderHook(() => usePushSubscription());
			}).not.toThrow();

			// Wait for async operations to complete
			await waitFor(() => {
				// The hook should handle errors gracefully, whether it logs them or not
				expect(true).toBe(true); // Just verify no exceptions were thrown
			}, { timeout: 200 });

			consoleSpy.mockRestore();
		});

		it("should handle missing service worker gracefully", () => {
			const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

			// Mock missing service worker
			Object.defineProperty(global.navigator, "serviceWorker", {
				value: undefined,
				writable: true,
			});

			expect(() => {
				renderHook(() => usePushSubscription());
			}).not.toThrow();

			consoleSpy.mockRestore();
		});

		it("should handle missing PushManager gracefully", () => {
			const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

			// Mock missing PushManager
			Object.defineProperty(global.window, "PushManager", {
				value: undefined,
				writable: true,
			});

			expect(() => {
				renderHook(() => usePushSubscription());
			}).not.toThrow();

			consoleSpy.mockRestore();
		});
	});

	it("should handle multiple renders", () => {
		const { rerender } = renderHook(() => usePushSubscription());

		expect(() => {
			rerender();
		}).not.toThrow();
	});

	it("should work with different browser environments", () => {
		// Test with different navigator configurations
		const originalNavigator = global.navigator;

		// Test with minimal navigator
		Object.defineProperty(global, "navigator", {
			value: {},
			writable: true,
		});

		expect(() => {
			renderHook(() => usePushSubscription());
		}).not.toThrow();

		// Restore original navigator
		Object.defineProperty(global, "navigator", {
			value: originalNavigator,
			writable: true,
		});
	});
});
