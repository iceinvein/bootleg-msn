/**
 * Tests for Mobile Notifications system
 */

import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock Capacitor APIs
vi.mock("@capacitor/core", () => ({
	Capacitor: {
		isNativePlatform: vi.fn(),
	},
}));

vi.mock("@capacitor/local-notifications", () => ({
	LocalNotifications: {
		schedule: vi.fn(),
		removeAllDeliveredNotifications: vi.fn(),
		addListener: vi.fn(),
		requestPermissions: vi.fn(),
		checkPermissions: vi.fn(),
	},
}));

vi.mock("@capacitor/push-notifications", () => ({
	PushNotifications: {
		requestPermissions: vi.fn(),
		register: vi.fn(),
		addListener: vi.fn(),
		removeAllDeliveredNotifications: vi.fn(),
	},
}));

vi.mock("../browser-notifications", () => ({
	browserNotifications: {
		showNotification: vi.fn(),
	},
}));

// Mock global Notification API
const mockNotification = vi.fn();
Object.defineProperty(global, "Notification", {
	value: mockNotification,
	writable: true,
});

// Import after mocks are set up
import { mobileNotifications } from "../mobile-notifications";

describe("MobileNotificationManager", () => {
	let mockCapacitor: any;
	let mockLocalNotifications: any;
	let mockPushNotifications: any;
	let mockBrowserNotifications: any;

	beforeEach(async () => {
		vi.clearAllMocks();

		// Get mocked modules
		mockCapacitor = vi.mocked(await import("@capacitor/core")).Capacitor;
		mockLocalNotifications = vi.mocked(await import("@capacitor/local-notifications")).LocalNotifications;
		mockPushNotifications = vi.mocked(await import("@capacitor/push-notifications")).PushNotifications;
		mockBrowserNotifications = vi.mocked(await import("../browser-notifications")).browserNotifications;

		// Default mock implementations
		mockCapacitor.isNativePlatform.mockReturnValue(false);
		mockLocalNotifications.schedule.mockResolvedValue(undefined);
		mockLocalNotifications.removeAllDeliveredNotifications.mockResolvedValue(undefined);
		mockLocalNotifications.addListener.mockReturnValue({ remove: vi.fn() });
		mockLocalNotifications.requestPermissions.mockResolvedValue({ display: "granted" });
		mockLocalNotifications.checkPermissions.mockResolvedValue({ display: "granted" });

		mockPushNotifications.requestPermissions.mockResolvedValue({ receive: "granted" });
		mockPushNotifications.register.mockResolvedValue(undefined);
		mockPushNotifications.addListener.mockReturnValue({ remove: vi.fn() });
		mockPushNotifications.removeAllDeliveredNotifications.mockResolvedValue(undefined);

		mockBrowserNotifications.showNotification.mockResolvedValue(undefined);

		// Mock global Notification API
		global.Notification = {
			permission: "granted",
			requestPermission: vi.fn().mockResolvedValue("granted"),
		} as any;

		// Mock window.Notification constructor
		global.window = {
			...global.window,
			Notification: vi.fn().mockImplementation((title, options) => ({
				title,
				...options,
				close: vi.fn(),
			})),
		} as any;
	});

	describe("Web Platform Behavior", () => {
		it("should use browser notifications on web platform", async () => {
			mockCapacitor.isNativePlatform.mockReturnValue(false);

			await mobileNotifications.showLocalNotification({
				title: "Test Title",
				body: "Test Body",
				data: { chatId: "chat123" },
			});

			expect(mockBrowserNotifications.showNotification).toHaveBeenCalledWith({
				title: "Test Title",
				body: "Test Body",
				icon: "/icon-192.png",
				data: { chatId: "chat123" },
				tag: undefined,
			});
		});

		it("should not clear notifications on web platform", async () => {
			mockCapacitor.isNativePlatform.mockReturnValue(false);

			await mobileNotifications.clearAllNotifications();

			expect(mockLocalNotifications.removeAllDeliveredNotifications).not.toHaveBeenCalled();
		});
	});

	describe("Native Platform Behavior", () => {
		beforeEach(() => {
			// Reset the singleton's internal state by creating a fresh import
			vi.resetModules();
		});

		it("should attempt to use native notifications when available", async () => {
			mockCapacitor.isNativePlatform.mockReturnValue(true);

			// Re-import to get fresh instance with native platform
			const { mobileNotifications: nativeMobileNotifications } = await import("../mobile-notifications");

			await nativeMobileNotifications.showLocalNotification({
				title: "Test Title",
				body: "Test Body",
				id: 123,
				data: { chatId: "chat123" },
			});

			expect(mockLocalNotifications.schedule).toHaveBeenCalledWith({
				notifications: [
					{
						id: 123,
						title: "Test Title",
						body: "Test Body",
						sound: "beep.wav",
						extra: { chatId: "chat123" },
						iconColor: "#0078d4",
						smallIcon: "ic_stat_icon_config_sample",
					},
				],
			});
		});

		it("should clear native notifications when available", async () => {
			mockCapacitor.isNativePlatform.mockReturnValue(true);

			// Re-import to get fresh instance with native platform
			const { mobileNotifications: nativeMobileNotifications } = await import("../mobile-notifications");

			await nativeMobileNotifications.clearAllNotifications();

			expect(mockLocalNotifications.removeAllDeliveredNotifications).toHaveBeenCalledTimes(1);
		});
	});

	describe("Error Handling", () => {
		it("should handle errors gracefully", async () => {
			const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

			// Test that errors don't crash the application
			mockBrowserNotifications.showNotification.mockRejectedValue(new Error("Notification failed"));

			await mobileNotifications.showLocalNotification({
				title: "Test Title",
				body: "Test Body",
			});

			// Should not throw
			expect(true).toBe(true);

			consoleSpy.mockRestore();
		});
	});
});
