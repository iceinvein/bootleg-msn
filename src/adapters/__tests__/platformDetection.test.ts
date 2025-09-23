import { describe, it, expect, beforeEach, vi } from "vitest";
import {
	detectPlatform,
	getPlatformCapabilities,
	isAndroidCapacitor,
	isIOSCapacitor,
	isMobile,
	isDesktop,
	getPlatformClasses,
	platformSupports,
	getPlatformConfig,
	platformSwitch,
} from "../platformDetection";

// Mock window and navigator
const mockWindow: any = {};

const mockNavigator = {
	userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
};

// Delete existing properties to ensure clean state
delete (global as any).window;
delete (global as any).navigator;

Object.defineProperty(global, "window", {
	value: mockWindow,
	writable: true,
	configurable: true,
});

Object.defineProperty(global, "navigator", {
	value: mockNavigator,
	writable: true,
	configurable: true,
});

describe("Platform Detection", () => {
	beforeEach(() => {
		// Reset mocks - completely clear the window object
		Object.keys(mockWindow).forEach(key => {
			delete mockWindow[key];
		});
		mockNavigator.userAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36";
		vi.clearAllMocks();
	});

	describe("detectPlatform", () => {
		it("should detect web platform by default", () => {
			const detection = detectPlatform();
			
			expect(detection.platform).toBe("web");
			expect(detection.userAgent).toBe(mockNavigator.userAgent);
			expect(detection.isDevelopment).toBe(false); // NODE_ENV is test, not development
			expect(detection.metadata?.isBrowser).toBe(true);
		});

		it("should detect Tauri platform", () => {
			mockWindow.__TAURI__ = { app: { getVersion: () => "1.0.0" } };
			
			const detection = detectPlatform();
			
			expect(detection.platform).toBe("tauri");
			expect(detection.metadata?.tauri).toBeDefined();
		});

		it("should detect Capacitor platform", () => {
			mockWindow.Capacitor = {
				getPlatform: () => "android",
				isNativePlatform: () => true,
			};
			
			const detection = detectPlatform();
			
			expect(detection.platform).toBe("capacitor");
			expect(detection.version).toBe("android");
			expect(detection.metadata?.capacitor).toBeDefined();
			expect(detection.metadata?.isNative).toBe(true);
		});
	});

	describe("getPlatformCapabilities", () => {
		it("should return web capabilities", () => {
			const capabilities = getPlatformCapabilities("web");
			
			expect(capabilities.hasHardwareBackButton).toBe(false);
			expect(capabilities.hasSystemOverlays).toBe(false);
			expect(capabilities.hasDeepLinking).toBe(true);
			expect(capabilities.hasKeyboardShortcuts).toBe(true);
			expect(capabilities.hasWindowManagement).toBe(false);
		});

		it("should return Capacitor capabilities", () => {
			const capabilities = getPlatformCapabilities("capacitor");
			
			expect(capabilities.hasHardwareBackButton).toBe(false); // Depends on isAndroidCapacitor
			expect(capabilities.hasSystemOverlays).toBe(true);
			expect(capabilities.hasDeepLinking).toBe(true);
			expect(capabilities.hasNativeSharing).toBe(true);
			expect(capabilities.hasKeyboardShortcuts).toBe(false);
		});

		it("should return Tauri capabilities", () => {
			const capabilities = getPlatformCapabilities("tauri");
			
			expect(capabilities.hasHardwareBackButton).toBe(false);
			expect(capabilities.hasSystemOverlays).toBe(true);
			expect(capabilities.hasDeepLinking).toBe(true);
			expect(capabilities.hasNativeSharing).toBe(false);
			expect(capabilities.hasKeyboardShortcuts).toBe(true);
			expect(capabilities.hasWindowManagement).toBe(true);
		});
	});

	describe("Mobile Detection", () => {
		it("should detect mobile from Capacitor", () => {
			mockWindow.Capacitor = { getPlatform: () => "android" };
			
			expect(isMobile()).toBe(true);
		});

		it("should detect mobile from user agent", () => {
			mockNavigator.userAgent = "Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)";
			
			expect(isMobile()).toBe(true);
		});

		it("should not detect mobile for desktop user agent", () => {
			mockNavigator.userAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36";
			
			expect(isMobile()).toBe(false);
		});
	});

	describe("Desktop Detection", () => {
		it("should detect desktop from Tauri", () => {
			mockWindow.__TAURI__ = {};
			
			expect(isDesktop()).toBe(true);
		});

		it("should detect desktop from web on desktop", () => {
			mockNavigator.userAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36";
			
			expect(isDesktop()).toBe(true);
		});

		it("should not detect desktop for mobile", () => {
			mockWindow.Capacitor = { getPlatform: () => "android" };
			
			expect(isDesktop()).toBe(false);
		});
	});

	describe("Platform Classes", () => {
		it("should return web platform classes", () => {
			const classes = getPlatformClasses("web");
			
			expect(classes).toContain("platform-web");
			expect(classes).toContain("platform-desktop");
		});

		it("should return Capacitor platform classes", () => {
			mockWindow.Capacitor = { getPlatform: () => "android" };
			const classes = getPlatformClasses("capacitor");
			
			expect(classes).toContain("platform-capacitor");
			expect(classes).toContain("platform-mobile");
			expect(classes).toContain("platform-android");
		});

		it("should return Tauri platform classes", () => {
			const classes = getPlatformClasses("tauri");
			
			expect(classes).toContain("platform-tauri");
			expect(classes).toContain("platform-desktop");
		});
	});

	describe("Platform Support", () => {
		it("should check platform support correctly", () => {
			expect(platformSupports("hasKeyboardShortcuts", "web")).toBe(true);
			expect(platformSupports("hasHardwareBackButton", "web")).toBe(false);
			expect(platformSupports("hasNativeSharing", "capacitor")).toBe(true);
			expect(platformSupports("hasWindowManagement", "tauri")).toBe(true);
		});
	});

	describe("Platform Config", () => {
		it("should get platform-specific config", () => {
			const configs = {
				web: { theme: "light" },
				capacitor: { theme: "dark" },
				tauri: { theme: "system" },
			};
			
			expect(getPlatformConfig(configs, "web")).toEqual({ theme: "light" });
			expect(getPlatformConfig(configs, "capacitor")).toEqual({ theme: "dark" });
			expect(getPlatformConfig(configs, "tauri")).toEqual({ theme: "system" });
		});
	});

	describe("Platform Switch", () => {
		it("should execute platform-specific code", () => {
			const webHandler = vi.fn(() => "web-result");
			const capacitorHandler = vi.fn(() => "capacitor-result");
			const defaultHandler = vi.fn(() => "default-result");
			
			// Mock web platform
			const result = platformSwitch({
				web: webHandler,
				capacitor: capacitorHandler,
			}, defaultHandler);
			
			expect(result).toBe("web-result");
			expect(webHandler).toHaveBeenCalled();
			expect(capacitorHandler).not.toHaveBeenCalled();
			expect(defaultHandler).not.toHaveBeenCalled();
		});

		it("should use default handler when platform not found", () => {
			const capacitorHandler = vi.fn(() => "capacitor-result");
			const defaultHandler = vi.fn(() => "default-result");
			
			// Mock web platform, but only provide capacitor handler
			const result = platformSwitch({
				capacitor: capacitorHandler,
			}, defaultHandler);
			
			expect(result).toBe("default-result");
			expect(capacitorHandler).not.toHaveBeenCalled();
			expect(defaultHandler).toHaveBeenCalled();
		});
	});
});
