import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mock Tauri APIs
vi.mock("@tauri-apps/api/core", () => ({
	invoke: vi.fn(),
}));

vi.mock("@tauri-apps/api/event", () => ({
	listen: vi.fn(),
}));

import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { TauriNotificationService } from "./tauri-notifications";

const mockInvoke = vi.mocked(invoke);
const mockListen = vi.mocked(listen);

// Mock window.__TAURI__ for environment detection
Object.defineProperty(window, "__TAURI__", {
	value: {},
	writable: true,
});

describe("TauriNotificationService", () => {
	let service: TauriNotificationService;

	beforeEach(() => {
		vi.clearAllMocks();
		mockListen.mockResolvedValue(() => {});
		service = TauriNotificationService.getInstance();
	});

	afterEach(() => {
		vi.resetAllMocks();
	});

	describe("Environment Detection", () => {
		it("should detect Tauri environment correctly", () => {
			expect(TauriNotificationService.isTauriEnvironment()).toBe(true);
		});

		it("should detect non-Tauri environment correctly", () => {
			// Temporarily remove __TAURI__ property
			const originalTauri = window.__TAURI__;
			// @ts-ignore
			window.__TAURI__ = undefined;

			expect(TauriNotificationService.isTauriEnvironment()).toBe(false);

			// Restore for other tests
			// @ts-ignore
			window.__TAURI__ = originalTauri;
		});
	});

	describe("Permission Management", () => {
		it("should request notification permission", async () => {
			mockInvoke.mockResolvedValue("granted");

			const permission = await service.requestPermission();

			expect(mockInvoke).toHaveBeenCalledWith(
				"request_notification_permission",
			);
			expect(permission).toBe("granted");
		});

		it("should check notification permission", async () => {
			mockInvoke.mockResolvedValue("denied");

			const permission = await service.checkPermission();

			expect(mockInvoke).toHaveBeenCalledWith("check_notification_permission");
			expect(permission).toBe("denied");
		});

		it("should handle permission request errors", async () => {
			mockInvoke.mockRejectedValue(new Error("Permission request failed"));

			const permission = await service.requestPermission();

			expect(permission).toBe("denied");
		});
	});

	describe("Notification Display", () => {
		it("should show a basic notification", async () => {
			mockInvoke.mockResolvedValue(undefined);

			const notificationData = {
				id: "test-notification",
				title: "Test Title",
				body: "Test Body",
				notificationType: "message" as const,
				timestamp: Date.now(),
			};

			await service.showNotification(notificationData);

			expect(mockInvoke).toHaveBeenCalledWith("show_notification", {
				notificationData: {
					id: "test-notification",
					title: "Test Title",
					body: "Test Body",
					chat_id: undefined,
					sender_id: undefined,
					notification_type: "message",
					timestamp: notificationData.timestamp,
				},
			});
		});

		it("should show notification with chat and sender data", async () => {
			mockInvoke.mockResolvedValue(undefined);

			const notificationData = {
				id: "test-notification",
				title: "Test Title",
				body: "Test Body",
				chatId: "chat-123",
				senderId: "user-456",
				notificationType: "message" as const,
				timestamp: Date.now(),
			};

			await service.showNotification(notificationData);

			expect(mockInvoke).toHaveBeenCalledWith("show_notification", {
				notificationData: {
					id: "test-notification",
					title: "Test Title",
					body: "Test Body",
					chat_id: "chat-123",
					sender_id: "user-456",
					notification_type: "message",
					timestamp: notificationData.timestamp,
				},
			});
		});

		it("should handle notification display errors", async () => {
			mockInvoke.mockRejectedValue(new Error("Failed to show notification"));

			const notificationData = {
				id: "test-notification",
				title: "Test Title",
				body: "Test Body",
				notificationType: "message" as const,
				timestamp: Date.now(),
			};

			await expect(service.showNotification(notificationData)).rejects.toThrow(
				"Failed to show notification",
			);
		});
	});

	describe("Convenience Methods", () => {
		beforeEach(() => {
			mockInvoke.mockResolvedValue(undefined);
		});

		it("should create message notification", async () => {
			await service.notifyNewMessage(
				"msg-123",
				"Alice",
				"Hello!",
				"chat-456",
				"user-789",
			);

			expect(mockInvoke).toHaveBeenCalledWith("show_notification", {
				notificationData: {
					id: "message-msg-123",
					title: "New message from Alice",
					body: "Hello!",
					chat_id: "chat-456",
					sender_id: "user-789",
					notification_type: "message",
					timestamp: expect.any(Number),
				},
			});
		});

		it("should create contact request notification", async () => {
			await service.notifyContactRequest(
				"req-123",
				"Bob Smith",
				"bob@example.com",
			);

			expect(mockInvoke).toHaveBeenCalledWith("show_notification", {
				notificationData: {
					id: "contact-request-req-123",
					title: "New Contact Request",
					body: "Bob Smith (bob@example.com) wants to add you as a contact",
					chat_id: undefined,
					sender_id: "req-123",
					notification_type: "contact_request",
					timestamp: expect.any(Number),
				},
			});
		});

		it("should create group invite notification", async () => {
			await service.notifyGroupInvite("invite-123", "Team Chat", "Charlie");

			expect(mockInvoke).toHaveBeenCalledWith("show_notification", {
				notificationData: {
					id: "group-invite-invite-123",
					title: "Group Invitation",
					body: 'Charlie invited you to join "Team Chat"',
					chat_id: undefined,
					sender_id: "invite-123",
					notification_type: "group_invite",
					timestamp: expect.any(Number),
				},
			});
		});
	});

	describe("Settings Management", () => {
		it("should save notification settings", async () => {
			mockInvoke.mockResolvedValue(undefined);

			const settings = {
				enabled: true,
				soundEnabled: false,
				showPreview: true,
				suppressWhenFocused: true,
				quietHoursEnabled: false,
			};

			await service.saveSettings(settings);

			expect(mockInvoke).toHaveBeenCalledWith("save_notification_settings", {
				settings,
			});
		});

		it("should load notification settings", async () => {
			const mockSettings = {
				enabled: true,
				soundEnabled: true,
				showPreview: false,
				suppressWhenFocused: true,
				quietHoursEnabled: true,
				quietHoursStart: "22:00",
				quietHoursEnd: "08:00",
			};

			mockInvoke.mockResolvedValue(mockSettings);

			const settings = await service.loadSettings();

			expect(mockInvoke).toHaveBeenCalledWith("load_notification_settings");
			expect(settings).toEqual(mockSettings);
		});

		it("should return default settings on load error", async () => {
			mockInvoke.mockRejectedValue(new Error("Failed to load settings"));

			const settings = await service.loadSettings();

			expect(settings).toEqual({
				enabled: true,
				soundEnabled: true,
				showPreview: true,
				suppressWhenFocused: true,
				quietHoursEnabled: false,
			});
		});
	});

	describe("Utility Methods", () => {
		it("should clear all notifications", async () => {
			mockInvoke.mockResolvedValue(undefined);

			await service.clearAllNotifications();

			expect(mockInvoke).toHaveBeenCalledWith("clear_all_notifications");
		});

		it("should handle clear notifications error", async () => {
			mockInvoke.mockRejectedValue(new Error("Failed to clear"));

			await expect(service.clearAllNotifications()).rejects.toThrow(
				"Failed to clear",
			);
		});
	});

	describe("Event System", () => {
		it("should register and trigger event listeners", () => {
			const callback = vi.fn();

			service.on("test-event", callback);
			// @ts-ignore - accessing private method for testing
			service.emit("test-event", { data: "test" });

			expect(callback).toHaveBeenCalledWith({ data: "test" });
		});

		it("should remove event listeners", () => {
			const callback = vi.fn();

			service.on("test-event", callback);
			service.off("test-event", callback);
			// @ts-ignore - accessing private method for testing
			service.emit("test-event", { data: "test" });

			expect(callback).not.toHaveBeenCalled();
		});
	});

	describe("Singleton Pattern", () => {
		it("should return the same instance", () => {
			const instance1 = TauriNotificationService.getInstance();
			const instance2 = TauriNotificationService.getInstance();

			expect(instance1).toBe(instance2);
		});
	});
});
