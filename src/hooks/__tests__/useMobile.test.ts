/**
 * Tests for useMobile hook
 */

import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock Capacitor APIs
vi.mock("@capacitor/core", () => ({
	Capacitor: {
		isNativePlatform: vi.fn(),
		getPlatform: vi.fn(),
	},
}));

vi.mock("@capacitor/keyboard", () => ({
	Keyboard: {
		addListener: vi.fn(),
	},
}));

vi.mock("@capacitor/app", () => ({
	App: {
		addListener: vi.fn(),
		exitApp: vi.fn(),
	},
}));

vi.mock("@capacitor/status-bar", () => ({
	StatusBar: {
		setStyle: vi.fn(),
		setBackgroundColor: vi.fn(),
	},
	Style: {
		Light: "LIGHT",
		Dark: "DARK",
	},
}));

import { useMobile } from "../useMobile";

describe("useMobile", () => {
	let mockCapacitor: any;
	let mockKeyboard: any;
	let mockApp: any;
	let mockStatusBar: any;

	beforeEach(async () => {
		vi.clearAllMocks();

		// Get mocked modules
		mockCapacitor = vi.mocked(await import("@capacitor/core")).Capacitor;
		mockKeyboard = vi.mocked(await import("@capacitor/keyboard")).Keyboard;
		mockApp = vi.mocked(await import("@capacitor/app")).App;
		mockStatusBar = vi.mocked(await import("@capacitor/status-bar")).StatusBar;

		// Default mock implementations
		mockCapacitor.isNativePlatform.mockReturnValue(false);
		mockCapacitor.getPlatform.mockReturnValue("web");
		mockKeyboard.addListener.mockResolvedValue({ remove: vi.fn() });
		mockApp.addListener.mockResolvedValue({ remove: vi.fn() });
		mockStatusBar.setStyle.mockResolvedValue(undefined);
		mockStatusBar.setBackgroundColor.mockResolvedValue(undefined);
		mockApp.exitApp.mockResolvedValue(undefined);
	});

	describe("Platform Detection", () => {
		it("should detect web platform", () => {
			mockCapacitor.isNativePlatform.mockReturnValue(false);
			mockCapacitor.getPlatform.mockReturnValue("web");

			const { result } = renderHook(() => useMobile());

			expect(result.current.isNative).toBe(false);
			expect(result.current.platform).toBe("web");
			expect(result.current.isWeb).toBe(true);
			expect(result.current.isIOS).toBe(false);
			expect(result.current.isAndroid).toBe(false);
		});

		it("should detect iOS platform", () => {
			mockCapacitor.isNativePlatform.mockReturnValue(true);
			mockCapacitor.getPlatform.mockReturnValue("ios");

			const { result } = renderHook(() => useMobile());

			expect(result.current.isNative).toBe(true);
			expect(result.current.platform).toBe("ios");
			expect(result.current.isWeb).toBe(false);
			expect(result.current.isIOS).toBe(true);
			expect(result.current.isAndroid).toBe(false);
		});

		it("should detect Android platform", () => {
			mockCapacitor.isNativePlatform.mockReturnValue(true);
			mockCapacitor.getPlatform.mockReturnValue("android");

			const { result } = renderHook(() => useMobile());

			expect(result.current.isNative).toBe(true);
			expect(result.current.platform).toBe("android");
			expect(result.current.isWeb).toBe(false);
			expect(result.current.isIOS).toBe(false);
			expect(result.current.isAndroid).toBe(true);
		});
	});

	describe("Keyboard State", () => {
		it("should initialize with keyboard closed", () => {
			const { result } = renderHook(() => useMobile());

			expect(result.current.isKeyboardOpen).toBe(false);
		});

		it("should set up keyboard listeners on native platform", async () => {
			mockCapacitor.isNativePlatform.mockReturnValue(true);

			renderHook(() => useMobile());

			// Wait for async setup
			await vi.waitFor(() => {
				expect(mockKeyboard.addListener).toHaveBeenCalledWith(
					"keyboardWillShow",
					expect.any(Function)
				);
				expect(mockKeyboard.addListener).toHaveBeenCalledWith(
					"keyboardWillHide",
					expect.any(Function)
				);
			});
		});

		it("should update keyboard state when keyboard shows", async () => {
			mockCapacitor.isNativePlatform.mockReturnValue(true);
			let keyboardShowHandler: (() => void) | undefined;

			mockKeyboard.addListener.mockImplementation(async (event, handler) => {
				if (event === "keyboardWillShow") {
					keyboardShowHandler = handler;
				}
				return { remove: vi.fn() };
			});

			const { result } = renderHook(() => useMobile());

			// Wait for setup and trigger keyboard show
			await vi.waitFor(() => {
				expect(keyboardShowHandler).toBeDefined();
			});

			act(() => {
				keyboardShowHandler?.();
			});

			expect(result.current.isKeyboardOpen).toBe(true);
		});

		it("should update keyboard state when keyboard hides", async () => {
			mockCapacitor.isNativePlatform.mockReturnValue(true);
			let keyboardHideHandler: (() => void) | undefined;

			mockKeyboard.addListener.mockImplementation(async (event, handler) => {
				if (event === "keyboardWillHide") {
					keyboardHideHandler = handler;
				}
				return { remove: vi.fn() };
			});

			const { result } = renderHook(() => useMobile());

			// Wait for setup and trigger keyboard hide
			await vi.waitFor(() => {
				expect(keyboardHideHandler).toBeDefined();
			});

			act(() => {
				keyboardHideHandler?.();
			});

			expect(result.current.isKeyboardOpen).toBe(false);
		});

		it("should not set up keyboard listeners on web platform", () => {
			mockCapacitor.isNativePlatform.mockReturnValue(false);

			renderHook(() => useMobile());

			expect(mockKeyboard.addListener).not.toHaveBeenCalled();
		});
	});

	describe("App State", () => {
		it("should initialize with active app state", () => {
			const { result } = renderHook(() => useMobile());

			expect(result.current.appState).toBe("active");
		});

		it("should set up app state listeners on native platform", async () => {
			mockCapacitor.isNativePlatform.mockReturnValue(true);

			renderHook(() => useMobile());

			await vi.waitFor(() => {
				expect(mockApp.addListener).toHaveBeenCalledWith(
					"appStateChange",
					expect.any(Function)
				);
			});
		});

		it("should update app state when app becomes inactive", async () => {
			mockCapacitor.isNativePlatform.mockReturnValue(true);
			let appStateHandler: ((event: { isActive: boolean }) => void) | undefined;

			mockApp.addListener.mockImplementation(async (event, handler) => {
				if (event === "appStateChange") {
					appStateHandler = handler;
				}
				return { remove: vi.fn() };
			});

			const { result } = renderHook(() => useMobile());

			// Wait for setup and trigger app state change
			await vi.waitFor(() => {
				expect(appStateHandler).toBeDefined();
			});

			act(() => {
				appStateHandler?.({ isActive: false });
			});

			expect(result.current.appState).toBe("inactive");
		});

		it("should update app state when app becomes active", async () => {
			mockCapacitor.isNativePlatform.mockReturnValue(true);
			let appStateHandler: ((event: { isActive: boolean }) => void) | undefined;

			mockApp.addListener.mockImplementation(async (event, handler) => {
				if (event === "appStateChange") {
					appStateHandler = handler;
				}
				return { remove: vi.fn() };
			});

			const { result } = renderHook(() => useMobile());

			// Wait for setup and trigger app state change
			await vi.waitFor(() => {
				expect(appStateHandler).toBeDefined();
			});

			act(() => {
				appStateHandler?.({ isActive: true });
			});

			expect(result.current.appState).toBe("active");
		});
	});

	describe("Status Bar Functions", () => {
		it("should set light status bar style on native platform", async () => {
			mockCapacitor.isNativePlatform.mockReturnValue(true);

			const { result } = renderHook(() => useMobile());

			await act(async () => {
				await result.current.setStatusBarStyle("light");
			});

			expect(mockStatusBar.setStyle).toHaveBeenCalledWith({ style: "LIGHT" });
		});

		it("should set dark status bar style on native platform", async () => {
			mockCapacitor.isNativePlatform.mockReturnValue(true);

			const { result } = renderHook(() => useMobile());

			await act(async () => {
				await result.current.setStatusBarStyle("dark");
			});

			expect(mockStatusBar.setStyle).toHaveBeenCalledWith({ style: "DARK" });
		});

		it("should not set status bar style on web platform", async () => {
			mockCapacitor.isNativePlatform.mockReturnValue(false);

			const { result } = renderHook(() => useMobile());

			await act(async () => {
				await result.current.setStatusBarStyle("light");
			});

			expect(mockStatusBar.setStyle).not.toHaveBeenCalled();
		});

		it("should set status bar color on Android", async () => {
			mockCapacitor.isNativePlatform.mockReturnValue(true);
			mockCapacitor.getPlatform.mockReturnValue("android");

			const { result } = renderHook(() => useMobile());

			await act(async () => {
				await result.current.setStatusBarColor("#0078d4");
			});

			expect(mockStatusBar.setBackgroundColor).toHaveBeenCalledWith({ color: "#0078d4" });
		});

		it("should not set status bar color on iOS", async () => {
			mockCapacitor.isNativePlatform.mockReturnValue(true);
			mockCapacitor.getPlatform.mockReturnValue("ios");

			const { result } = renderHook(() => useMobile());

			await act(async () => {
				await result.current.setStatusBarColor("#0078d4");
			});

			expect(mockStatusBar.setBackgroundColor).not.toHaveBeenCalled();
		});

		it("should not set status bar color on web platform", async () => {
			mockCapacitor.isNativePlatform.mockReturnValue(false);

			const { result } = renderHook(() => useMobile());

			await act(async () => {
				await result.current.setStatusBarColor("#0078d4");
			});

			expect(mockStatusBar.setBackgroundColor).not.toHaveBeenCalled();
		});

		it("should handle status bar errors gracefully", async () => {
			const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
			mockCapacitor.isNativePlatform.mockReturnValue(true);
			mockStatusBar.setStyle.mockRejectedValue(new Error("Status bar error"));

			const { result } = renderHook(() => useMobile());

			await act(async () => {
				await result.current.setStatusBarStyle("light");
			});

			expect(consoleSpy).toHaveBeenCalledWith("Failed to set status bar style:", expect.any(Error));

			consoleSpy.mockRestore();
		});
	});

	describe("App Exit", () => {
		it("should exit app on native platform", async () => {
			mockCapacitor.isNativePlatform.mockReturnValue(true);

			const { result } = renderHook(() => useMobile());

			await act(async () => {
				await result.current.exitApp();
			});

			expect(mockApp.exitApp).toHaveBeenCalledTimes(1);
		});

		it("should not exit app on web platform", async () => {
			mockCapacitor.isNativePlatform.mockReturnValue(false);

			const { result } = renderHook(() => useMobile());

			await act(async () => {
				await result.current.exitApp();
			});

			expect(mockApp.exitApp).not.toHaveBeenCalled();
		});

		it("should handle app exit errors gracefully", async () => {
			const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
			mockCapacitor.isNativePlatform.mockReturnValue(true);
			mockApp.exitApp.mockRejectedValue(new Error("Exit failed"));

			const { result } = renderHook(() => useMobile());

			await act(async () => {
				await result.current.exitApp();
			});

			expect(consoleSpy).toHaveBeenCalledWith("Failed to exit app:", expect.any(Error));

			consoleSpy.mockRestore();
		});
	});

	describe("Cleanup", () => {
		it("should clean up listeners on unmount", async () => {
			const mockRemoveKeyboardShow = vi.fn();
			const mockRemoveKeyboardHide = vi.fn();
			const mockRemoveAppState = vi.fn();

			mockCapacitor.isNativePlatform.mockReturnValue(true);

			// Mock each addListener call to return a different remove function
			mockKeyboard.addListener
				.mockResolvedValueOnce({ remove: mockRemoveKeyboardShow })
				.mockResolvedValueOnce({ remove: mockRemoveKeyboardHide });
			mockApp.addListener.mockResolvedValue({ remove: mockRemoveAppState });

			const { unmount } = renderHook(() => useMobile());

			// Wait for setup
			await vi.waitFor(() => {
				expect(mockKeyboard.addListener).toHaveBeenCalledTimes(2);
				expect(mockApp.addListener).toHaveBeenCalledTimes(1);
			});

			unmount();

			// Should clean up all listeners
			expect(mockRemoveKeyboardShow).toHaveBeenCalledTimes(1);
			expect(mockRemoveKeyboardHide).toHaveBeenCalledTimes(1);
			expect(mockRemoveAppState).toHaveBeenCalledTimes(1);
		});
	});
});
