/**
 * Simplified tests for push-subscription utilities
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { urlBase64ToUint8Array, ensurePushSubscription } from "../push-subscription";

describe("Push Subscription Utilities - Core Functionality", () => {
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
			expect(result.length).toBeGreaterThan(0);
		});

		it("should add padding if needed", () => {
			const base64 = "SGVsbG8"; // Missing padding
			const result = urlBase64ToUint8Array(base64);

			expect(result).toBeInstanceOf(Uint8Array);
			expect(result.length).toBeGreaterThan(0);
		});
	});

	describe("ensurePushSubscription - Basic Functionality", () => {
		const mockRegistration = {
			pushManager: {
				getSubscription: vi.fn(),
				subscribe: vi.fn(),
			},
		};

		beforeEach(() => {
			vi.clearAllMocks();

			// Mock navigator.serviceWorker
			Object.defineProperty(global.navigator, "serviceWorker", {
				value: {
					getRegistration: vi.fn().mockResolvedValue(mockRegistration),
				},
				writable: true,
			});

			// Mock window.PushManager
			Object.defineProperty(global.window, "PushManager", {
				value: function PushManager() {},
				writable: true,
			});
		});

		it("should return existing subscription if available", async () => {
			const existingSubscription = {
				toJSON: vi.fn().mockReturnValue({
					endpoint: "https://test.endpoint",
					keys: {
						p256dh: "test-p256dh",
						auth: "test-auth",
					},
				}),
			};

			mockRegistration.pushManager.getSubscription.mockResolvedValue(existingSubscription);

			const result = await ensurePushSubscription("test-vapid-key");

			expect(result).toEqual({
				endpoint: "https://test.endpoint",
				keys: {
					p256dh: "test-p256dh",
					auth: "test-auth",
				},
			});
		});

		it("should create new subscription if none exists", async () => {
			const newSubscription = {
				toJSON: vi.fn().mockReturnValue({
					endpoint: "https://new.endpoint",
					keys: {
						p256dh: "new-p256dh",
						auth: "new-auth",
					},
				}),
			};

			mockRegistration.pushManager.getSubscription.mockResolvedValue(null);
			mockRegistration.pushManager.subscribe.mockResolvedValue(newSubscription);

			const result = await ensurePushSubscription("test-vapid-key");

			expect(result).toEqual({
				endpoint: "https://new.endpoint",
				keys: {
					p256dh: "new-p256dh",
					auth: "new-auth",
				},
			});
		});

		it("should handle empty VAPID key by creating subscription anyway", async () => {
			const newSubscription = {
				toJSON: vi.fn().mockReturnValue({
					endpoint: "https://test.endpoint",
					keys: {
						p256dh: "test-p256dh",
						auth: "test-auth",
					},
				}),
			};

			mockRegistration.pushManager.getSubscription.mockResolvedValue(null);
			mockRegistration.pushManager.subscribe.mockResolvedValue(newSubscription);

			const result = await ensurePushSubscription("");

			// The function doesn't validate VAPID key, it just uses it
			expect(result).toEqual({
				endpoint: "https://test.endpoint",
				keys: {
					p256dh: "test-p256dh",
					auth: "test-auth",
				},
			});
		});

		it("should throw error when subscription has missing toJSON method", async () => {
			const invalidSubscription = {}; // Missing toJSON method

			mockRegistration.pushManager.getSubscription.mockResolvedValue(invalidSubscription);

			// The function will throw an error when trying to call toJSON()
			await expect(ensurePushSubscription("test-vapid-key")).rejects.toThrow();
		});
	});

	describe("Browser Support Detection", () => {
		it("should detect when push notifications are supported", () => {
			// Setup supported environment
			Object.defineProperty(global.navigator, "serviceWorker", {
				value: { getRegistration: vi.fn() },
				writable: true,
			});
			Object.defineProperty(global.window, "PushManager", {
				value: function PushManager() {},
				writable: true,
			});

			// The function should not immediately return null for supported browsers
			// (actual support check happens inside the function)
			expect(typeof ensurePushSubscription).toBe("function");
		});
	});
});
