/**
 * Tests for Tauri API integration
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	getPlatform,
	isTauri,
	tauriApi,
	tauriEvents,
	type WindowConfig,
	windowManager,
} from "../tauri";

// Mock Tauri APIs
vi.mock("@tauri-apps/api/core", () => ({
	invoke: vi.fn(),
}));

vi.mock("@tauri-apps/api/event", () => ({
	listen: vi.fn(),
}));

vi.mock("@tauri-apps/api/window", () => ({
	getCurrentWindow: vi.fn(),
}));

vi.mock("@tauri-apps/api/dpi", () => ({
	LogicalSize: vi
		.fn()
		.mockImplementation((width, height) => ({ width, height })),
	LogicalPosition: vi.fn().mockImplementation((x, y) => ({ x, y })),
}));

// Import the mocked functions
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { getCurrentWindow } from "@tauri-apps/api/window";

const mockInvoke = vi.mocked(invoke);
const mockListen = vi.mocked(listen);
const mockGetCurrentWindow = vi.mocked(getCurrentWindow);

describe("tauriApi", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("createChatWindow", () => {
		it("should invoke create_chat_window command with correct parameters", async () => {
			mockInvoke.mockResolvedValue(undefined);

			await tauriApi.createChatWindow("chat-123", "John Doe");

			expect(mockInvoke).toHaveBeenCalledWith("create_chat_window", {
				chatId: "chat-123",
				contactName: "John Doe",
			});
		});

		it("should handle errors from Tauri command", async () => {
			const error = new Error("Failed to create window");
			mockInvoke.mockRejectedValue(error);

			await expect(
				tauriApi.createChatWindow("chat-123", "John Doe"),
			).rejects.toThrow("Failed to create window");
		});
	});

	describe("closeChatWindow", () => {
		it("should invoke close_chat_window command with correct parameters", async () => {
			mockInvoke.mockResolvedValue(undefined);

			await tauriApi.closeChatWindow("chat-123");

			expect(mockInvoke).toHaveBeenCalledWith("close_chat_window", {
				chatId: "chat-123",
			});
		});
	});

	describe("minimizeToTray", () => {
		it("should invoke minimize_to_tray command", async () => {
			mockInvoke.mockResolvedValue(undefined);

			await tauriApi.minimizeToTray();

			expect(mockInvoke).toHaveBeenCalledWith("minimize_to_tray");
		});
	});

	describe("restoreFromTray", () => {
		it("should invoke restore_from_tray command", async () => {
			mockInvoke.mockResolvedValue(undefined);

			await tauriApi.restoreFromTray();

			expect(mockInvoke).toHaveBeenCalledWith("restore_from_tray");
		});
	});

	describe("updateUnreadCount", () => {
		it("should invoke update_unread_count command with correct parameters", async () => {
			mockInvoke.mockResolvedValue(undefined);

			await tauriApi.updateUnreadCount(5);

			expect(mockInvoke).toHaveBeenCalledWith("update_unread_count", {
				count: 5,
			});
		});

		it("should handle zero unread count", async () => {
			mockInvoke.mockResolvedValue(undefined);

			await tauriApi.updateUnreadCount(0);

			expect(mockInvoke).toHaveBeenCalledWith("update_unread_count", {
				count: 0,
			});
		});
	});

	describe("saveWindowState", () => {
		it("should invoke save_window_state command with correct parameters", async () => {
			mockInvoke.mockResolvedValue(undefined);

			const config: WindowConfig = {
				width: 800,
				height: 600,
				x: 100,
				y: 50,
				maximized: false,
				minimized: false,
			};

			await tauriApi.saveWindowState("main-window", config);

			expect(mockInvoke).toHaveBeenCalledWith("save_window_state", {
				windowLabel: "main-window",
				config,
			});
		});
	});

	describe("loadWindowState", () => {
		it("should invoke load_window_state command and return config", async () => {
			const config: WindowConfig = {
				width: 800,
				height: 600,
				x: 100,
				y: 50,
				maximized: false,
				minimized: false,
			};

			mockInvoke.mockResolvedValue(config);

			const result = await tauriApi.loadWindowState("main-window");

			expect(mockInvoke).toHaveBeenCalledWith("load_window_state", {
				windowLabel: "main-window",
			});
			expect(result).toEqual(config);
		});

		it("should return null when no saved state exists", async () => {
			mockInvoke.mockResolvedValue(null);

			const result = await tauriApi.loadWindowState("main-window");

			expect(result).toBeNull();
		});
	});

	describe("handleDeepLinks", () => {
		it("should invoke handle_deep_links command with correct parameters", async () => {
			mockInvoke.mockResolvedValue(undefined);

			await tauriApi.handleDeepLinks("msn://chat/user123");

			expect(mockInvoke).toHaveBeenCalledWith("handle_deep_links", {
				url: "msn://chat/user123",
			});
		});
	});
});

describe("windowManager", () => {
	let mockWindow: any;

	beforeEach(() => {
		vi.clearAllMocks();

		mockWindow = {
			innerSize: vi.fn(),
			innerPosition: vi.fn(),
			isMaximized: vi.fn(),
			isMinimized: vi.fn(),
			maximize: vi.fn(),
			setSize: vi.fn(),
			setPosition: vi.fn(),
		};

		mockGetCurrentWindow.mockReturnValue(mockWindow);
	});

	describe("getCurrentWindowConfig", () => {
		it("should return current window configuration", async () => {
			mockWindow.innerSize.mockResolvedValue({ width: 800, height: 600 });
			mockWindow.innerPosition.mockResolvedValue({ x: 100, y: 50 });
			mockWindow.isMaximized.mockResolvedValue(false);
			mockWindow.isMinimized.mockResolvedValue(false);

			const config = await windowManager.getCurrentWindowConfig();

			expect(config).toEqual({
				width: 800,
				height: 600,
				x: 100,
				y: 50,
				maximized: false,
				minimized: false,
			});
		});

		it("should handle maximized window", async () => {
			mockWindow.innerSize.mockResolvedValue({ width: 1920, height: 1080 });
			mockWindow.innerPosition.mockResolvedValue({ x: 0, y: 0 });
			mockWindow.isMaximized.mockResolvedValue(true);
			mockWindow.isMinimized.mockResolvedValue(false);

			const config = await windowManager.getCurrentWindowConfig();

			expect(config.maximized).toBe(true);
		});
	});

	describe("saveCurrentWindowState", () => {
		it("should get current config and save it", async () => {
			mockWindow.innerSize.mockResolvedValue({ width: 800, height: 600 });
			mockWindow.innerPosition.mockResolvedValue({ x: 100, y: 50 });
			mockWindow.isMaximized.mockResolvedValue(false);
			mockWindow.isMinimized.mockResolvedValue(false);
			mockInvoke.mockResolvedValue(undefined);

			await windowManager.saveCurrentWindowState("test-window");

			expect(mockInvoke).toHaveBeenCalledWith("save_window_state", {
				windowLabel: "test-window",
				config: {
					width: 800,
					height: 600,
					x: 100,
					y: 50,
					maximized: false,
					minimized: false,
				},
			});
		});
	});

	describe("restoreWindowState", () => {
		it("should restore window to saved state", async () => {
			const savedConfig: WindowConfig = {
				width: 800,
				height: 600,
				x: 100,
				y: 50,
				maximized: false,
				minimized: false,
			};

			mockInvoke.mockResolvedValue(savedConfig);

			await windowManager.restoreWindowState("test-window");

			expect(mockWindow.setSize).toHaveBeenCalledWith({
				width: 800,
				height: 600,
			});
			expect(mockWindow.setPosition).toHaveBeenCalledWith({ x: 100, y: 50 });
			expect(mockWindow.maximize).not.toHaveBeenCalled();
		});

		it("should maximize window if saved as maximized", async () => {
			const savedConfig: WindowConfig = {
				width: 800,
				height: 600,
				x: 100,
				y: 50,
				maximized: true,
				minimized: false,
			};

			mockInvoke.mockResolvedValue(savedConfig);

			await windowManager.restoreWindowState("test-window");

			expect(mockWindow.maximize).toHaveBeenCalled();
			expect(mockWindow.setSize).not.toHaveBeenCalled();
			expect(mockWindow.setPosition).not.toHaveBeenCalled();
		});

		it("should handle missing position data", async () => {
			const savedConfig: WindowConfig = {
				width: 800,
				height: 600,
				maximized: false,
				minimized: false,
			};

			mockInvoke.mockResolvedValue(savedConfig);

			await windowManager.restoreWindowState("test-window");

			expect(mockWindow.setSize).toHaveBeenCalledWith({
				width: 800,
				height: 600,
			});
			expect(mockWindow.setPosition).not.toHaveBeenCalled();
		});

		it("should do nothing if no saved config exists", async () => {
			mockInvoke.mockResolvedValue(null);

			await windowManager.restoreWindowState("test-window");

			expect(mockWindow.setSize).not.toHaveBeenCalled();
			expect(mockWindow.setPosition).not.toHaveBeenCalled();
			expect(mockWindow.maximize).not.toHaveBeenCalled();
		});
	});
});

describe("tauriEvents", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("onWindowClose", () => {
		it("should listen for close-requested event", async () => {
			const callback = vi.fn();
			const mockUnlisten = vi.fn();
			mockListen.mockResolvedValue(mockUnlisten);

			const unlisten = await tauriEvents.onWindowClose(callback);

			expect(mockListen).toHaveBeenCalledWith(
				"tauri://close-requested",
				callback,
			);
			expect(unlisten).toBe(mockUnlisten);
		});
	});

	describe("onWindowFocus", () => {
		it("should listen for focus event", async () => {
			const callback = vi.fn();
			const mockUnlisten = vi.fn();
			mockListen.mockResolvedValue(mockUnlisten);

			const unlisten = await tauriEvents.onWindowFocus(callback);

			expect(mockListen).toHaveBeenCalledWith("tauri://focus", callback);
			expect(unlisten).toBe(mockUnlisten);
		});
	});

	describe("onWindowBlur", () => {
		it("should listen for blur event", async () => {
			const callback = vi.fn();
			const mockUnlisten = vi.fn();
			mockListen.mockResolvedValue(mockUnlisten);

			const unlisten = await tauriEvents.onWindowBlur(callback);

			expect(mockListen).toHaveBeenCalledWith("tauri://blur", callback);
			expect(unlisten).toBe(mockUnlisten);
		});
	});

	describe("onDeepLink", () => {
		it("should listen for deep-link event and extract payload", async () => {
			const callback = vi.fn();
			const mockUnlisten = vi.fn();
			mockListen.mockImplementation((_eventName, handler) => {
				// Simulate event with payload
				handler({ payload: "msn://chat/user123" });
				return Promise.resolve(mockUnlisten);
			});

			const unlisten = await tauriEvents.onDeepLink(callback);

			expect(mockListen).toHaveBeenCalledWith(
				"deep-link",
				expect.any(Function),
			);
			expect(callback).toHaveBeenCalledWith("msn://chat/user123");
			expect(unlisten).toBe(mockUnlisten);
		});
	});
});

describe("isTauri", () => {
	it("should return true when __TAURI__ is present in window", () => {
		Object.defineProperty(window, "__TAURI__", {
			value: {},
			writable: true,
		});

		expect(isTauri()).toBe(true);
	});

	it("should return false when __TAURI__ is not present", () => {
		// Mock window without __TAURI__
		const originalWindow = global.window;
		global.window = {} as any;

		expect(isTauri()).toBe(false);

		// Restore original window
		global.window = originalWindow;
	});
});

describe("getPlatform", () => {
	let originalUserAgent: string;

	beforeEach(() => {
		originalUserAgent = navigator.userAgent;
	});

	afterEach(() => {
		Object.defineProperty(navigator, "userAgent", {
			value: originalUserAgent,
			writable: true,
		});
	});

	it("should return 'web' when not in Tauri", () => {
		// Mock window without __TAURI__
		const originalWindow = global.window;
		global.window = {} as any;

		expect(getPlatform()).toBe("web");

		// Restore original window
		global.window = originalWindow;
	});

	it("should detect Windows platform", () => {
		Object.defineProperty(window, "__TAURI__", { value: {}, writable: true });
		Object.defineProperty(navigator, "userAgent", {
			value: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
			writable: true,
		});

		expect(getPlatform()).toBe("windows");
	});

	it("should detect macOS platform", () => {
		Object.defineProperty(window, "__TAURI__", { value: {}, writable: true });
		Object.defineProperty(navigator, "userAgent", {
			value: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
			writable: true,
		});

		expect(getPlatform()).toBe("macos");
	});

	it("should detect Linux platform", () => {
		Object.defineProperty(window, "__TAURI__", { value: {}, writable: true });
		Object.defineProperty(navigator, "userAgent", {
			value: "Mozilla/5.0 (X11; Linux x86_64)",
			writable: true,
		});

		expect(getPlatform()).toBe("linux");
	});

	it("should fallback to 'web' for unknown platforms", () => {
		Object.defineProperty(window, "__TAURI__", { value: {}, writable: true });
		Object.defineProperty(navigator, "userAgent", {
			value: "Mozilla/5.0 (Unknown Platform)",
			writable: true,
		});

		expect(getPlatform()).toBe("web");
	});
});
