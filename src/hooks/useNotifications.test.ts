import { renderHook, waitFor, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useNotifications } from "./useNotifications";
import type { NotificationPermission } from "@/lib/tauri-notifications";

// Mock the tauri-notifications module
const mockTauriNotifications = {
	checkPermission: vi.fn(),
	requestPermission: vi.fn(),
	loadSettings: vi.fn(),
	updateSettings: vi.fn(),
	notifyNewMessage: vi.fn(),
	notifyContactRequest: vi.fn(),
	notifyGroupInvite: vi.fn(),
	clearAllNotifications: vi.fn(),
};

const mockIsTauriEnvironment = vi.fn();

vi.mock("@/lib/tauri-notifications", () => ({
	TauriNotificationService: {
		getInstance: () => mockTauriNotifications,
		isTauriEnvironment: mockIsTauriEnvironment,
	},
}));

describe("useNotifications", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockIsTauriEnvironment.mockReturnValue(true);
		mockTauriNotifications.checkPermission.mockResolvedValue("granted");
		mockTauriNotifications.loadSettings.mockResolvedValue({
			enabled: true,
			soundEnabled: true,
			showPreview: true,
			suppressWhenFocused: true,
			quietHoursEnabled: false,
			quietHoursStart: undefined,
			quietHoursEnd: undefined,
		});
	});

	describe("Initialization", () => {
		it("should initialize with correct default values", () => {
			const { result } = renderHook(() => useNotifications());

			expect(result.current.permission).toBe("denied");
			expect(result.current.settings).toBe(null);
			expect(result.current.isSupported).toBe(true);
			expect(result.current.isLoading).toBe(true);
			expect(result.current.error).toBe(null);
		});

		it("should initialize permission and settings when supported", async () => {
			const { result } = renderHook(() => useNotifications());

			await waitFor(() => {
				expect(result.current.isLoading).toBe(false);
			});

			expect(mockTauriNotifications.checkPermission).toHaveBeenCalled();
			expect(mockTauriNotifications.loadSettings).toHaveBeenCalled();
			expect(result.current.permission).toBe("granted");
			expect(result.current.settings).toEqual({
				enabled: true,
				soundEnabled: true,
				showPreview: true,
				suppressWhenFocused: true,
				quietHoursEnabled: false,
				quietHoursStart: undefined,
				quietHoursEnd: undefined,
			});
		});

		it("should not initialize when not supported", () => {
			mockIsTauriEnvironment.mockReturnValue(false);

			const { result } = renderHook(() => useNotifications());

			expect(result.current.isSupported).toBe(false);
			expect(result.current.isLoading).toBe(false);
			expect(mockTauriNotifications.checkPermission).not.toHaveBeenCalled();
			expect(mockTauriNotifications.loadSettings).not.toHaveBeenCalled();
		});
	});

	describe("Permission Management", () => {
		it("should request permission successfully", async () => {
			mockTauriNotifications.requestPermission.mockResolvedValue("granted");

			const { result } = renderHook(() => useNotifications());

			await waitFor(() => {
				expect(result.current.isLoading).toBe(false);
			});

			let newPermission: NotificationPermission;
			await act(async () => {
				newPermission = await result.current.requestPermission();
			});

			expect(mockTauriNotifications.requestPermission).toHaveBeenCalled();
			expect(newPermission!).toBe("granted");
			expect(result.current.permission).toBe("granted");
		});

		it("should handle permission request errors", async () => {
			mockTauriNotifications.requestPermission.mockRejectedValue(
				new Error("Permission denied"),
			);

			const { result } = renderHook(() => useNotifications());

			await waitFor(() => {
				expect(result.current.isLoading).toBe(false);
			});

			let newPermission: NotificationPermission;
			await act(async () => {
				newPermission = await result.current.requestPermission();
			});

			expect(newPermission!).toBe("denied");
			expect(result.current.error).toBe("Permission denied");
		});

		it("should return denied for non-supported environment", async () => {
			mockIsTauriEnvironment.mockReturnValue(false);

			const { result } = renderHook(() => useNotifications());

			let permission: NotificationPermission;
			await act(async () => {
				permission = await result.current.requestPermission();
			});

			expect(permission!).toBe("denied");
			expect(mockTauriNotifications.requestPermission).not.toHaveBeenCalled();
		});
	});

	describe("Settings Management", () => {
		it("should update settings successfully", async () => {
			const newSettings = {
				enabled: false,
				soundEnabled: false,
				showPreview: false,
				suppressWhenFocused: false,
				quietHoursEnabled: true,
				quietHoursStart: "22:00",
				quietHoursEnd: "08:00",
			};

			mockTauriNotifications.updateSettings.mockResolvedValue(undefined);

			const { result } = renderHook(() => useNotifications());

			await waitFor(() => {
				expect(result.current.isLoading).toBe(false);
			});

			await act(async () => {
				await result.current.updateSettings(newSettings);
			});

			expect(mockTauriNotifications.updateSettings).toHaveBeenCalledWith(
				newSettings,
			);
			expect(result.current.settings).toEqual(newSettings);
		});

		it("should handle settings update errors", async () => {
			const newSettings = {
				enabled: false,
				soundEnabled: false,
				showPreview: false,
				suppressWhenFocused: false,
				quietHoursEnabled: false,
			};

			mockTauriNotifications.updateSettings.mockRejectedValue(
				new Error("Settings update failed"),
			);

			const { result } = renderHook(() => useNotifications());

			await waitFor(() => {
				expect(result.current.isLoading).toBe(false);
			});

			await act(async () => {
				try {
					await result.current.updateSettings(newSettings);
				} catch (error) {
					// Expected to throw
				}
			});

			expect(result.current.error).toBe("Settings update failed");
		});
	});

	describe("Notification Methods", () => {
		it("should send message notification when permitted and enabled", async () => {
			const { result } = renderHook(() => useNotifications());

			await waitFor(() => {
				expect(result.current.isLoading).toBe(false);
			});

			await act(async () => {
				await result.current.notifyNewMessage(
					"msg1",
					"John Doe",
					"Hello!",
					"chat1",
					"user1",
				);
			});

			expect(mockTauriNotifications.notifyNewMessage).toHaveBeenCalledWith(
				"msg1",
				"John Doe",
				"Hello!",
				"chat1",
				"user1",
			);
		});

		it("should not send notification when permission denied", async () => {
			mockTauriNotifications.checkPermission.mockResolvedValue("denied");

			const { result } = renderHook(() => useNotifications());

			await waitFor(() => {
				expect(result.current.isLoading).toBe(false);
			});

			await act(async () => {
				await result.current.notifyNewMessage(
					"msg1",
					"John Doe",
					"Hello!",
					"chat1",
					"user1",
				);
			});

			expect(mockTauriNotifications.notifyNewMessage).not.toHaveBeenCalled();
		});

		it("should not send notification when disabled in settings", async () => {
			mockTauriNotifications.loadSettings.mockResolvedValue({
				enabled: false,
				soundEnabled: true,
				showPreview: true,
				suppressWhenFocused: true,
				quietHoursEnabled: false,
			});

			const { result } = renderHook(() => useNotifications());

			await waitFor(() => {
				expect(result.current.isLoading).toBe(false);
			});

			await act(async () => {
				await result.current.notifyNewMessage(
					"msg1",
					"John Doe",
					"Hello!",
					"chat1",
					"user1",
				);
			});

			expect(mockTauriNotifications.notifyNewMessage).not.toHaveBeenCalled();
		});

		it("should clear all notifications", async () => {
			const { result } = renderHook(() => useNotifications());

			await waitFor(() => {
				expect(result.current.isLoading).toBe(false);
			});

			await act(async () => {
				await result.current.clearAllNotifications();
			});

			expect(mockTauriNotifications.clearAllNotifications).toHaveBeenCalled();
		});
	});
});
