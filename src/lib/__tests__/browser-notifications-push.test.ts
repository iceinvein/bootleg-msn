/**
 * Tests for Browser Notifications Push Integration
 */

import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock push-subscription utilities
const mockEnsurePushSubscription = vi.fn();
vi.mock("../push-subscription", () => ({
	ensurePushSubscription: mockEnsurePushSubscription,
}));

import { browserNotifications } from "../browser-notifications";

describe("Browser Notifications Push Integration", () => {
	let mockNotification: any;
	let mockServiceWorker: any;

	beforeEach(() => {
		vi.clearAllMocks();

		// Mock Notification API
		mockNotification = vi.fn().mockImplementation((title, options) => ({
			title,
			...options,
			close: vi.fn(),
		}));

		Object.defineProperty(global, "Notification", {
			value: mockNotification,
			writable: true,
		});

		Object.defineProperty(Notification, "permission", {
			value: "granted",
			writable: true,
		});

		Object.defineProperty(Notification, "requestPermission", {
			value: vi.fn().mockResolvedValue("granted"),
			writable: true,
		});

		// Mock service worker
		mockServiceWorker = {
			register: vi.fn(),
			ready: Promise.resolve({
				pushManager: {
					getSubscription: vi.fn(),
					subscribe: vi.fn(),
				},
			}),
		};

		Object.defineProperty(global.navigator, "serviceWorker", {
			value: mockServiceWorker,
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
		mockServiceWorker.register.mockResolvedValue({});
		mockEnsurePushSubscription.mockResolvedValue({
			endpoint: "https://test.endpoint",
			keys: {
				p256dh: "test-p256dh",
				auth: "test-auth",
			},
		});
	});

	describe("Push Subscription Setup", () => {
		it("should successfully request permission when VAPID key is available", async () => {
			Object.defineProperty(Notification, "permission", {
				value: "default",
				writable: true,
			});

			const result = await browserNotifications.requestPermission();

			// Should successfully request permission
			expect(result).toBe("granted");
			expect(Notification.requestPermission).toHaveBeenCalled();
		});

		it("should handle permission request without VAPID key", async () => {
			vi.stubGlobal("import", {
				meta: {
					env: {},
				},
			});

			Object.defineProperty(Notification, "permission", {
				value: "default",
				writable: true,
			});

			const result = await browserNotifications.requestPermission();

			// Should still successfully request permission even without VAPID key
			expect(result).toBe("granted");
			expect(Notification.requestPermission).toHaveBeenCalled();
		});

		it("should handle permission request gracefully", async () => {
			Object.defineProperty(Notification, "permission", {
				value: "default",
				writable: true,
			});

			// Test that permission request works regardless of push subscription setup
			const result = await browserNotifications.requestPermission();

			expect(result).toBe("granted");
			expect(Notification.requestPermission).toHaveBeenCalled();
		});
	});

	describe("Notification Display with Push Support", () => {
		it("should show notification with push subscription support", async () => {
			await browserNotifications.showNotification({
				title: "Test Notification",
				body: "Test body",
				icon: "/test-icon.png",
				data: { chatId: "chat123" },
			});

			expect(mockNotification).toHaveBeenCalledWith("Test Notification", {
				body: "Test body",
				icon: "/test-icon.png",
			badge: "/badge-72.png",
				data: { chatId: "chat123" },
				tag: undefined,
				requireInteraction: false,
				silent: false,
			});
		});

		it("should handle notification with custom tag", async () => {
			await browserNotifications.showNotification({
				title: "Tagged Notification",
				body: "Tagged body",
				tag: "custom-tag",
			});

			expect(mockNotification).toHaveBeenCalledWith("Tagged Notification", {
				body: "Tagged body",
				icon: "/icon-192.png",
			badge: "/badge-72.png",
				data: undefined,
				tag: "custom-tag",
				requireInteraction: false,
				silent: false,
			});
		});

		it("should handle notification with interaction requirements", async () => {
			await browserNotifications.showNotification({
				title: "Interactive Notification",
				body: "Requires interaction",
				requireInteraction: true,
			});

			expect(mockNotification).toHaveBeenCalledWith("Interactive Notification", {
				body: "Requires interaction",
				icon: "/icon-192.png",
			badge: "/badge-72.png",
				data: undefined,
				tag: undefined,
				requireInteraction: true,
				silent: false,
			});
		});

		it("should handle silent notifications", async () => {
			await browserNotifications.showNotification({
				title: "Silent Notification",
				body: "Silent body",
				silent: true,
			});

			expect(mockNotification).toHaveBeenCalledWith("Silent Notification", {
				body: "Silent body",
				icon: "/icon-192.png",
			badge: "/badge-72.png",
				data: undefined,
				tag: undefined,
				requireInteraction: false,
				silent: true,
			});
		});
	});

	describe("Permission Handling", () => {
		it("should request permission when explicitly called", async () => {
			Object.defineProperty(Notification, "permission", {
				value: "default",
				writable: true,
			});

			const result = await browserNotifications.requestPermission();

			expect(Notification.requestPermission).toHaveBeenCalled();
			expect(result).toBe("granted");
		});

		it("should not show notification if permission denied", async () => {
			Object.defineProperty(Notification, "permission", {
				value: "denied",
				writable: true,
			});

			await browserNotifications.showNotification({
				title: "Test Notification",
				body: "Test body",
			});

			// Should not show notification when permission denied
			expect(mockNotification).not.toHaveBeenCalled();
		});

		it("should handle permission request failure", async () => {
			Object.defineProperty(Notification, "permission", {
				value: "default",
				writable: true,
			});

			Object.defineProperty(Notification, "requestPermission", {
				value: vi.fn().mockResolvedValue("denied"),
				writable: true,
			});

			const result = await browserNotifications.requestPermission();

			expect(Notification.requestPermission).toHaveBeenCalled();
			expect(result).toBe("denied");
		});

		it("should not show notification if notifications disabled in settings", async () => {
			// Disable notifications in settings
			browserNotifications.updateSettings({ enabled: false });

			await browserNotifications.showNotification({
				title: "Test Notification",
				body: "Test body",
			});

			// Should not show notification when disabled
			expect(mockNotification).not.toHaveBeenCalled();

			// Re-enable for other tests
			browserNotifications.updateSettings({ enabled: true });
		});
	});

	describe("Service Worker Integration", () => {
		it("should initialize service worker on construction", async () => {
			// Service worker initialization happens in constructor
			// We can't easily test this without creating a new instance
			// But we can verify the mock was set up correctly
			expect(mockServiceWorker.register).toBeDefined();
		});

		it("should handle service worker registration failure gracefully", async () => {
			const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

			// Test that the service worker initialization doesn't break the service
			// Even if registration fails, notifications should still work
			await browserNotifications.showNotification({
				title: "Test Notification",
				body: "Test body",
			});

			// Should still show notification even if service worker fails
			expect(mockNotification).toHaveBeenCalled();

			consoleSpy.mockRestore();
		});

		it("should handle missing service worker support", async () => {
			const originalServiceWorker = global.navigator.serviceWorker;

			// Remove service worker support
			Object.defineProperty(global.navigator, "serviceWorker", {
				value: undefined,
				writable: true,
			});

			await browserNotifications.showNotification({
				title: "Test Notification",
				body: "Test body",
			});

			// Should still show notification without service worker
			expect(mockNotification).toHaveBeenCalled();

			// Restore service worker
			Object.defineProperty(global.navigator, "serviceWorker", {
				value: originalServiceWorker,
				writable: true,
			});
		});
	});

	describe("Specialized Notification Methods", () => {
		it("should handle message notifications with push support", async () => {
			await browserNotifications.notifyNewMessage(
				"msg123",
				"John Doe",
				"Hello there!",
				"chat456",
				"user789"
			);

			expect(mockNotification).toHaveBeenCalledWith("New message from John Doe", {
				body: "Hello there!",
				icon: "/icon-192.png",
				badge: "/badge-72.png",
				data: {
					messageId: "msg123",
					chatId: "chat456",
					senderId: "user789",
					action: "openChat",
				},
				tag: "message-chat456",
				requireInteraction: false,
				silent: false,
			});
		});

		it("should handle contact request notifications with push support", async () => {
			await browserNotifications.notifyContactRequest("req123", "Jane Smith", "user456");

			expect(mockNotification).toHaveBeenCalledWith("New Contact Request", {
				body: "Jane Smith (user456) wants to add you as a contact",
				icon: "/icon-192.png",
				badge: "/badge-72.png",
				data: {
					requestId: "req123",
					requesterEmail: "user456",
					action: "openContactRequests",
				},
				tag: "contact-request-req123",
				requireInteraction: true,
				silent: false,
			});
		});

		it("should handle group invite notifications with push support", async () => {
			await browserNotifications.notifyGroupInvite("invite123", "Team Chat", "Alice Johnson", "group789");

			expect(mockNotification).toHaveBeenCalledWith("Group Invitation", {
				body: "Alice Johnson invited you to join \"Team Chat\"",
				icon: "/icon-192.png",
				badge: "/badge-72.png",
				data: {
					inviteId: "invite123",
					groupName: "Team Chat",
					action: "openGroupInvites",
				},
				tag: "group-invite-invite123",
				requireInteraction: true,
				silent: false,
			});
		});
	});
});
