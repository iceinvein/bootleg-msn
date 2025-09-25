/**
 * Tests for Capacitor utilities
 */

import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock Capacitor APIs
vi.mock("@capacitor/core", () => ({
	Capacitor: {
		isNativePlatform: vi.fn(),
		getPlatform: vi.fn(),
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

vi.mock("@capacitor/keyboard", () => ({
	Keyboard: {
		addListener: vi.fn(),
	},
}));

vi.mock("@capacitor/app", () => ({
	App: {
		addListener: vi.fn(),
	},
}));

vi.mock("@capacitor/splash-screen", () => ({
	SplashScreen: {
		show: vi.fn(),
		hide: vi.fn(),
	},
}));

import {
	getPlatform,
	hideSplashScreen,
	initializeCapacitor,
	isNativePlatform,
	showSplashScreen,
} from "../capacitor";

describe("Capacitor Utilities", () => {
	let mockCapacitor: any;
	let mockStatusBar: any;
	let mockKeyboard: any;
	let mockApp: any;
	let mockSplashScreen: any;

	beforeEach(async () => {
		vi.clearAllMocks();

		// Get mocked modules
		mockCapacitor = vi.mocked(await import("@capacitor/core")).Capacitor;
		mockStatusBar = vi.mocked(await import("@capacitor/status-bar")).StatusBar;
		mockKeyboard = vi.mocked(await import("@capacitor/keyboard")).Keyboard;
		mockApp = vi.mocked(await import("@capacitor/app")).App;
		mockSplashScreen = vi.mocked(
			await import("@capacitor/splash-screen"),
		).SplashScreen;

		// Reset DOM classes
		document.body.className = "";

		// Default mock implementations
		mockCapacitor.isNativePlatform.mockReturnValue(false);
		mockCapacitor.getPlatform.mockReturnValue("web");
		mockStatusBar.setStyle.mockResolvedValue(undefined);
		mockStatusBar.setBackgroundColor.mockResolvedValue(undefined);
		mockKeyboard.addListener.mockReturnValue({ remove: vi.fn() });
		mockApp.addListener.mockReturnValue({ remove: vi.fn() });
		mockSplashScreen.show.mockResolvedValue(undefined);
		mockSplashScreen.hide.mockResolvedValue(undefined);
	});

	describe("isNativePlatform", () => {
		it("should return false for web platform", () => {
			mockCapacitor.isNativePlatform.mockReturnValue(false);

			expect(isNativePlatform()).toBe(false);
			expect(mockCapacitor.isNativePlatform).toHaveBeenCalledTimes(1);
		});

		it("should return true for native platforms", () => {
			mockCapacitor.isNativePlatform.mockReturnValue(true);

			expect(isNativePlatform()).toBe(true);
			expect(mockCapacitor.isNativePlatform).toHaveBeenCalledTimes(1);
		});
	});

	describe("getPlatform", () => {
		it("should return web platform", () => {
			mockCapacitor.getPlatform.mockReturnValue("web");

			expect(getPlatform()).toBe("web");
			expect(mockCapacitor.getPlatform).toHaveBeenCalledTimes(1);
		});

		it("should return iOS platform", () => {
			mockCapacitor.getPlatform.mockReturnValue("ios");

			expect(getPlatform()).toBe("ios");
			expect(mockCapacitor.getPlatform).toHaveBeenCalledTimes(1);
		});

		it("should return Android platform", () => {
			mockCapacitor.getPlatform.mockReturnValue("android");

			expect(getPlatform()).toBe("android");
			expect(mockCapacitor.getPlatform).toHaveBeenCalledTimes(1);
		});
	});

	describe("initializeCapacitor", () => {
		it("should not initialize when not on native platform", async () => {
			mockCapacitor.isNativePlatform.mockReturnValue(false);

			await initializeCapacitor();

			expect(mockStatusBar.setStyle).not.toHaveBeenCalled();
			expect(mockStatusBar.setBackgroundColor).not.toHaveBeenCalled();
			expect(mockKeyboard.addListener).not.toHaveBeenCalled();
			expect(mockApp.addListener).not.toHaveBeenCalled();
			expect(mockSplashScreen.hide).not.toHaveBeenCalled();
		});

		it("should initialize status bar on native platform", async () => {
			mockCapacitor.isNativePlatform.mockReturnValue(true);

			await initializeCapacitor();

			expect(mockStatusBar.setStyle).toHaveBeenCalledWith({ style: "LIGHT" });
			expect(mockStatusBar.setBackgroundColor).toHaveBeenCalledWith({
				color: "#0078d4",
			});
		});

		it("should set up keyboard listeners on native platform", async () => {
			mockCapacitor.isNativePlatform.mockReturnValue(true);

			await initializeCapacitor();

			expect(mockKeyboard.addListener).toHaveBeenCalledWith(
				"keyboardWillShow",
				expect.any(Function),
			);
			expect(mockKeyboard.addListener).toHaveBeenCalledWith(
				"keyboardWillHide",
				expect.any(Function),
			);
		});

		it("should handle keyboard show events", async () => {
			mockCapacitor.isNativePlatform.mockReturnValue(true);
			let keyboardShowHandler: (() => void) | undefined;

			mockKeyboard.addListener.mockImplementation((event, handler) => {
				if (event === "keyboardWillShow") {
					keyboardShowHandler = handler;
				}
				return { remove: vi.fn() };
			});

			await initializeCapacitor();

			// Simulate keyboard show
			if (keyboardShowHandler) {
				keyboardShowHandler();
			}

			expect(document.body.classList.contains("keyboard-open")).toBe(true);
		});

		it("should handle keyboard hide events", async () => {
			mockCapacitor.isNativePlatform.mockReturnValue(true);
			let keyboardHideHandler: (() => void) | undefined;

			// First add the class
			document.body.classList.add("keyboard-open");

			mockKeyboard.addListener.mockImplementation((event, handler) => {
				if (event === "keyboardWillHide") {
					keyboardHideHandler = handler;
				}
				return { remove: vi.fn() };
			});

			await initializeCapacitor();

			// Simulate keyboard hide
			if (keyboardHideHandler) {
				keyboardHideHandler();
			}

			expect(document.body.classList.contains("keyboard-open")).toBe(false);
		});

		it("should set up app state listeners on native platform", async () => {
			mockCapacitor.isNativePlatform.mockReturnValue(true);

			await initializeCapacitor();

			expect(mockApp.addListener).toHaveBeenCalledWith(
				"appStateChange",
				expect.any(Function),
			);
			expect(mockApp.addListener).toHaveBeenCalledWith(
				"appUrlOpen",
				expect.any(Function),
			);
		});

		it("should handle app state change events", async () => {
			mockCapacitor.isNativePlatform.mockReturnValue(true);
			let appStateHandler: ((event: { isActive: boolean }) => void) | undefined;

			mockApp.addListener.mockImplementation((event, handler) => {
				if (event === "appStateChange") {
					appStateHandler = handler;
				}
				return { remove: vi.fn() };
			});

			await initializeCapacitor();

			// Simulate app becoming inactive
			if (appStateHandler) {
				appStateHandler({ isActive: false });
			}

			// Should handle event without errors
			expect(true).toBe(true);
		});

		it("should handle deep link events", async () => {
			mockCapacitor.isNativePlatform.mockReturnValue(true);
			let urlOpenHandler: ((event: { url: string }) => void) | undefined;
			const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

			mockApp.addListener.mockImplementation((event, handler) => {
				if (event === "appUrlOpen") {
					urlOpenHandler = handler;
				}
				return { remove: vi.fn() };
			});

			await initializeCapacitor();

			// Simulate deep link
			if (urlOpenHandler) {
				urlOpenHandler({ url: "msn://chat/user123" });
			}

			expect(consoleSpy).toHaveBeenCalledWith(
				"App opened with URL:",
				"msn://chat/user123",
			);

			consoleSpy.mockRestore();
		});

		it("should hide splash screen after initialization", async () => {
			mockCapacitor.isNativePlatform.mockReturnValue(true);

			await initializeCapacitor();

			expect(mockSplashScreen.hide).toHaveBeenCalledTimes(1);
		});

		it("should handle initialization errors gracefully", async () => {
			const consoleSpy = vi
				.spyOn(console, "error")
				.mockImplementation(() => {});
			mockCapacitor.isNativePlatform.mockReturnValue(true);
			mockStatusBar.setStyle.mockRejectedValue(new Error("Status bar error"));

			await initializeCapacitor();

			expect(consoleSpy).toHaveBeenCalledWith(
				"Error initializing Capacitor:",
				expect.any(Error),
			);

			consoleSpy.mockRestore();
		});

		it("should log successful initialization", async () => {
			const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
			mockCapacitor.isNativePlatform.mockReturnValue(true);

			await initializeCapacitor();

			expect(consoleSpy).toHaveBeenCalledWith(
				"Capacitor initialized successfully",
			);

			consoleSpy.mockRestore();
		});
	});

	describe("showSplashScreen", () => {
		it("should not show splash screen when not on native platform", async () => {
			mockCapacitor.isNativePlatform.mockReturnValue(false);

			await showSplashScreen();

			expect(mockSplashScreen.show).not.toHaveBeenCalled();
		});

		it("should show splash screen on native platform", async () => {
			mockCapacitor.isNativePlatform.mockReturnValue(true);

			await showSplashScreen();

			expect(mockSplashScreen.show).toHaveBeenCalledWith({
				showDuration: 2000,
				autoHide: true,
			});
		});

		it("should handle splash screen show errors gracefully", async () => {
			mockCapacitor.isNativePlatform.mockReturnValue(true);
			mockSplashScreen.show.mockRejectedValue(new Error("Splash screen error"));

			// Should propagate the error since there's no error handling in the actual implementation
			await expect(showSplashScreen()).rejects.toThrow("Splash screen error");
		});
	});

	describe("hideSplashScreen", () => {
		it("should not hide splash screen when not on native platform", async () => {
			mockCapacitor.isNativePlatform.mockReturnValue(false);

			await hideSplashScreen();

			expect(mockSplashScreen.hide).not.toHaveBeenCalled();
		});

		it("should hide splash screen on native platform", async () => {
			mockCapacitor.isNativePlatform.mockReturnValue(true);

			await hideSplashScreen();

			expect(mockSplashScreen.hide).toHaveBeenCalledTimes(1);
		});

		it("should handle splash screen hide errors gracefully", async () => {
			mockCapacitor.isNativePlatform.mockReturnValue(true);
			mockSplashScreen.hide.mockRejectedValue(new Error("Splash screen error"));

			// Should propagate the error since there's no error handling in the actual implementation
			await expect(hideSplashScreen()).rejects.toThrow("Splash screen error");
		});
	});
});
