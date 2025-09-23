/**
 * Simplified tests for usePushSubscription hook
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";

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

// Import after mocking
import { usePushSubscription } from "../usePushSubscription";

describe("usePushSubscription Hook - Side Effect Hook", () => {
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

	it("should cleanup properly on unmount", () => {
		const { unmount } = renderHook(() => usePushSubscription());

		// Should not throw during unmount
		expect(() => unmount()).not.toThrow();
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
});
