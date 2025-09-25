/**
 * Tests for push-subscription utilities
 */

import { beforeEach, describe, expect, it, vi } from "vitest";

import {
	ensurePushSubscription,
	urlBase64ToUint8Array,
} from "../push-subscription";

// Mock global APIs
const mockSubscribe = vi.fn();
const mockGetSubscription = vi.fn();
const mockPushManager = {
	subscribe: mockSubscribe,
	getSubscription: mockGetSubscription,
};
const mockRegistration = {
	pushManager: mockPushManager,
};

// Mock navigator.serviceWorker
const mockServiceWorker = {
	getRegistration: vi.fn(),
};

Object.defineProperty(global.navigator, "serviceWorker", {
	value: mockServiceWorker,
	writable: true,
});

// Mock window.PushManager
Object.defineProperty(global.window, "PushManager", {
	value: function PushManager() {},
	writable: true,
});

describe("push-subscription utilities", () => {
	beforeEach(() => {
		vi.clearAllMocks();

		// Restore default mocks
		Object.defineProperty(global.navigator, "serviceWorker", {
			value: mockServiceWorker,
			writable: true,
		});

		Object.defineProperty(global.window, "PushManager", {
			value: function PushManager() {},
			writable: true,
		});

		// Default mock implementations
		mockServiceWorker.getRegistration.mockResolvedValue(
			mockRegistration as any,
		);
		mockGetSubscription.mockResolvedValue(null);
		mockSubscribe.mockResolvedValue({
			toJSON: vi.fn().mockReturnValue({
				endpoint: "https://test.endpoint",
				keys: {
					p256dh: "test-p256dh",
					auth: "test-auth",
				},
			}),
		});
	});

	describe("urlBase64ToUint8Array", () => {
		it("should convert base64 string to Uint8Array", () => {
			const base64 = "SGVsbG8gV29ybGQ"; // "Hello World" in base64
			const result = urlBase64ToUint8Array(base64);

			expect(result).toBeInstanceOf(Uint8Array);
			expect(result.length).toBeGreaterThan(0);
		});

		it("should handle URL-safe base64 characters", () => {
			const base64 = "SGVsbG8tV29ybGRf"; // Contains - and _
			const result = urlBase64ToUint8Array(base64);

			expect(result).toBeInstanceOf(Uint8Array);
		});

		it("should add padding if needed", () => {
			const base64 = "SGVsbG8"; // Missing padding
			const result = urlBase64ToUint8Array(base64);

			expect(result).toBeInstanceOf(Uint8Array);
		});
	});

	describe("ensurePushSubscription", () => {
		const testVapidKey =
			"BEl62iUYgUivxIkv69yViEuiBIa40HI80xeSNdnzPUoYmDzspHSdkJiHQOdHpzBjsrfhY6-e0NkZPw";

		it("should return existing subscription if available", async () => {
			const existingSubscription = {
				toJSON: vi.fn().mockReturnValue({
					endpoint: "https://existing.endpoint",
					keys: {
						p256dh: "existing-p256dh",
						auth: "existing-auth",
					},
				}),
			};
			mockGetSubscription.mockResolvedValue(existingSubscription);

			const result = await ensurePushSubscription(testVapidKey);

			expect(result).toEqual({
				endpoint: "https://existing.endpoint",
				keys: {
					p256dh: "existing-p256dh",
					auth: "existing-auth",
				},
			});
			expect(mockSubscribe).not.toHaveBeenCalled();
		});

		it("should create new subscription if none exists", async () => {
			mockGetSubscription.mockResolvedValue(null);

			const result = await ensurePushSubscription(testVapidKey);

			expect(mockSubscribe).toHaveBeenCalledWith({
				userVisibleOnly: true,
				applicationServerKey: expect.any(ArrayBuffer),
			});
			expect(result).toEqual({
				endpoint: "https://test.endpoint",
				keys: {
					p256dh: "test-p256dh",
					auth: "test-auth",
				},
			});
		});

		it("should return null if service worker not supported", async () => {
			// Create a navigator without serviceWorker
			const originalNavigator = global.navigator;
			Object.defineProperty(global, "navigator", {
				value: {},
				writable: true,
				configurable: true,
			});

			const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
			const result = await ensurePushSubscription(testVapidKey);

			expect(result).toBeNull();
			expect(consoleSpy).toHaveBeenCalledWith(
				"Push not supported in this browser",
			);

			consoleSpy.mockRestore();

			// Restore original navigator
			Object.defineProperty(global, "navigator", {
				value: originalNavigator,
				writable: true,
				configurable: true,
			});
		});

		it("should return null if PushManager not supported", async () => {
			// Create a window without PushManager
			const originalWindow = global.window;
			Object.defineProperty(global, "window", {
				value: {},
				writable: true,
				configurable: true,
			});

			const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
			const result = await ensurePushSubscription(testVapidKey);

			expect(result).toBeNull();
			expect(consoleSpy).toHaveBeenCalledWith(
				"Push not supported in this browser",
			);

			consoleSpy.mockRestore();

			// Restore original window
			Object.defineProperty(global, "window", {
				value: originalWindow,
				writable: true,
				configurable: true,
			});
		});

		it("should return null if service worker not registered", async () => {
			mockServiceWorker.getRegistration.mockResolvedValue(null);

			const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
			const result = await ensurePushSubscription(testVapidKey);

			expect(result).toBeNull();
			expect(consoleSpy).toHaveBeenCalledWith(
				"Service worker not registered; cannot subscribe to push",
			);

			consoleSpy.mockRestore();
		});

		it("should handle subscription errors gracefully", async () => {
			mockGetSubscription.mockResolvedValue(null);
			mockSubscribe.mockRejectedValue(new Error("Subscription failed"));

			await expect(ensurePushSubscription(testVapidKey)).rejects.toThrow(
				"Subscription failed",
			);
		});

		it("should handle invalid VAPID key", async () => {
			mockGetSubscription.mockResolvedValue(null);

			// Test with invalid base64 - this should throw when urlBase64ToUint8Array is called
			await expect(ensurePushSubscription("invalid!!!key")).rejects.toThrow();
		});

		it("should convert VAPID key to proper format", async () => {
			mockGetSubscription.mockResolvedValue(null);

			await ensurePushSubscription(testVapidKey);

			expect(mockSubscribe).toHaveBeenCalledWith({
				userVisibleOnly: true,
				applicationServerKey: expect.any(ArrayBuffer),
			});

			// Verify the applicationServerKey is an ArrayBuffer
			const call = mockSubscribe.mock.calls[0][0];
			expect(call.applicationServerKey).toBeInstanceOf(ArrayBuffer);
		});

		it("should handle subscription with missing toJSON method", async () => {
			mockGetSubscription.mockResolvedValue(null);
			mockSubscribe.mockResolvedValue({
				// Missing toJSON method
			});

			await expect(ensurePushSubscription(testVapidKey)).rejects.toThrow();
		});

		it("should handle subscription with invalid JSON format", async () => {
			mockGetSubscription.mockResolvedValue(null);
			mockSubscribe.mockResolvedValue({
				toJSON: vi.fn().mockReturnValue({
					// Missing required fields
					endpoint: "https://test.endpoint",
				}),
			});

			const result = await ensurePushSubscription(testVapidKey);

			// Should still return the JSON even if it's invalid (validation happens elsewhere)
			expect(result).toEqual({
				endpoint: "https://test.endpoint",
			});
		});
	});

	describe("Browser Compatibility", () => {
		it("should work with different browser implementations", async () => {
			// Test with different subscription formats
			const subscriptionFormats = [
				{
					endpoint: "https://fcm.googleapis.com/fcm/send/test",
					keys: { p256dh: "test-p256dh", auth: "test-auth" },
				},
				{
					endpoint: "https://updates.push.services.mozilla.com/test",
					keys: { p256dh: "test-p256dh", auth: "test-auth" },
				},
			];

			for (const format of subscriptionFormats) {
				mockGetSubscription.mockResolvedValue({
					toJSON: vi.fn().mockReturnValue(format),
				});

				const result = await ensurePushSubscription("test-vapid-key");
				expect(result).toEqual(format);
			}
		});
	});
});
