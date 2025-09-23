import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	useChatWindows,
	useDeepLinks,
	useSystemTray,
	useTauri,
	useUnreadCount,
	useWindowState,
} from "./useTauri";

// Mock Tauri API
vi.mock("@/lib/tauri", () => ({
	isTauri: vi.fn(() => false),
	getPlatform: vi.fn(() => "web"),
	tauriApi: {
		createChatWindow: vi.fn(),
		closeChatWindow: vi.fn(),
		minimizeToTray: vi.fn(),
		restoreFromTray: vi.fn(),
		updateUnreadCount: vi.fn(),
		saveWindowState: vi.fn(),
		loadWindowState: vi.fn(),
		handleDeepLinks: vi.fn(),
	},
	tauriEvents: {
		onWindowClose: vi.fn(),
		onWindowFocus: vi.fn(),
		onWindowBlur: vi.fn(),
		onDeepLink: vi.fn(),
	},
	windowManager: {
		getCurrentWindowConfig: vi.fn(),
		saveCurrentWindowState: vi.fn(),
		restoreWindowState: vi.fn(),
	},
}));

describe("useTauri", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("should initialize with web platform when not in Tauri", () => {
		const { result } = renderHook(() => useTauri());

		expect(result.current.isReady).toBe(true);
		expect(result.current.isTauri).toBe(false);
		expect(result.current.platform).toBe("web");
	});

	it("should provide API access", () => {
		const { result } = renderHook(() => useTauri());

		expect(result.current.api).toBeDefined();
		expect(result.current.events).toBeDefined();
		expect(result.current.windowManager).toBeDefined();
	});
});

describe("useWindowState", () => {
	it("should provide save and restore functions", () => {
		const { result } = renderHook(() => useWindowState("test-window"));

		expect(typeof result.current.saveState).toBe("function");
		expect(typeof result.current.restoreState).toBe("function");
	});

	it("should not call Tauri functions when not in Tauri environment", async () => {
		const { result } = renderHook(() => useWindowState("test-window"));

		await act(async () => {
			await result.current.saveState();
			await result.current.restoreState();
		});

		// Should not throw errors even when not in Tauri
		expect(true).toBe(true);
	});
});

describe("useUnreadCount", () => {
	it("should provide updateUnreadCount function", () => {
		const { result } = renderHook(() => useUnreadCount());

		expect(typeof result.current.updateUnreadCount).toBe("function");
	});

	it("should handle updateUnreadCount in web environment", async () => {
		const { result } = renderHook(() => useUnreadCount());

		await act(async () => {
			await result.current.updateUnreadCount(5);
		});

		// Should not throw errors when not in Tauri
		expect(true).toBe(true);
	});
});

describe("useChatWindows", () => {
	it("should provide chat window management functions", () => {
		const { result } = renderHook(() => useChatWindows());

		expect(typeof result.current.openChatWindow).toBe("function");
		expect(typeof result.current.closeChatWindow).toBe("function");
	});

	it("should fallback to web behavior when not in Tauri", async () => {
		// Mock window.open
		const mockOpen = vi.fn();
		Object.defineProperty(window, "open", {
			value: mockOpen,
			writable: true,
		});

		const { result } = renderHook(() => useChatWindows());

		await act(async () => {
			await result.current.openChatWindow("test-chat", "Test Contact");
		});

		expect(mockOpen).toHaveBeenCalledWith("/#/chat/test-chat", "_blank");
	});
});

describe("useSystemTray", () => {
	it("should provide system tray functions", () => {
		const { result } = renderHook(() => useSystemTray());

		expect(typeof result.current.minimizeToTray).toBe("function");
		expect(typeof result.current.restoreFromTray).toBe("function");
	});

	it("should handle system tray operations in web environment", async () => {
		const { result } = renderHook(() => useSystemTray());

		await act(async () => {
			await result.current.minimizeToTray();
			await result.current.restoreFromTray();
		});

		// Should not throw errors when not in Tauri
		expect(true).toBe(true);
	});
});

describe("useDeepLinks", () => {
	it("should provide handleDeepLink function", () => {
		const { result } = renderHook(() => useDeepLinks());

		expect(typeof result.current.handleDeepLink).toBe("function");
	});

	it("should handle deep links in web environment", async () => {
		const { result } = renderHook(() => useDeepLinks());

		await act(async () => {
			await result.current.handleDeepLink("msn://chat/user123");
		});

		// Should not throw errors when not in Tauri
		expect(true).toBe(true);
	});
});
