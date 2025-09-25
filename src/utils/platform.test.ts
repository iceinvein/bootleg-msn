/**
 * Unit tests for platform detection utilities
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mock functions for Capacitor
const mockIsNativePlatform = vi.fn();
const mockGetPlatform = vi.fn();

import { __mockCapacitor, __resetPlatformCache, Platform } from "./platform";

describe("Platform", () => {
	const originalWindow = global.window;

	beforeEach(() => {
		// Reset window object
		global.window = { ...originalWindow } as any;

		// Clear all mocks
		vi.clearAllMocks();

		// Reset platform cache
		__resetPlatformCache();

		// Set default mock return values
		mockIsNativePlatform.mockReturnValue(false);
		mockGetPlatform.mockReturnValue("web");

		// Mock Capacitor with default values
		__mockCapacitor({
			Capacitor: {
				isNativePlatform: mockIsNativePlatform,
				getPlatform: mockGetPlatform,
			},
		});

		// Ensure clean window state
		delete (global.window as any).__TAURI__;
		delete (global.window as any).__TAURI_INTERNALS__;
		delete (global.window as any).__TAURI_INVOKE__;
	});

	afterEach(() => {
		// Restore original window
		global.window = originalWindow;
	});

	describe("isDesktop", () => {
		it("should return true when __TAURI__ is present", () => {
			(global.window as any).__TAURI__ = {};

			expect(Platform.isDesktop()).toBe(true);
		});

		it("should return false when __TAURI__ is not present", () => {
			delete (global.window as any).__TAURI__;
			delete (global.window as any).__TAURI_INTERNALS__;
			delete (global.window as any).__TAURI_INVOKE__;

			expect(Platform.isDesktop()).toBe(false);
		});

		it("should return false when window is undefined", () => {
			// @ts-expect-error - Testing edge case
			global.window = undefined;

			expect(Platform.isDesktop()).toBe(false);
		});
	});

	describe("isMobile", () => {
		it("should return true when Capacitor.isNativePlatform returns true", () => {
			mockIsNativePlatform.mockReturnValue(true);

			expect(Platform.isMobile()).toBe(true);
		});

		it("should return false when Capacitor.isNativePlatform returns false", () => {
			mockIsNativePlatform.mockReturnValue(false);

			expect(Platform.isMobile()).toBe(false);
		});

		it("should return false when Capacitor is not available", () => {
			// Mock Capacitor to return null (not available)
			__mockCapacitor(null);

			expect(Platform.isMobile()).toBe(false);
		});
	});

	describe("isWeb", () => {
		it("should return true when neither desktop nor mobile", () => {
			delete (global.window as any).__TAURI__;
			delete (global.window as any).__TAURI_INTERNALS__;
			delete (global.window as any).__TAURI_INVOKE__;

			mockIsNativePlatform.mockReturnValue(false);

			expect(Platform.isWeb()).toBe(true);
		});

		it("should return false when desktop", () => {
			(global.window as any).__TAURI__ = {};

			expect(Platform.isWeb()).toBe(false);
		});

		it("should return false when mobile", () => {
			delete (global.window as any).__TAURI__;
			delete (global.window as any).__TAURI_INTERNALS__;
			delete (global.window as any).__TAURI_INVOKE__;

			mockIsNativePlatform.mockReturnValue(true);

			expect(Platform.isWeb()).toBe(false);
		});
	});

	describe("getPlatform", () => {
		it('should return "desktop" for Tauri apps', () => {
			(global.window as any).__TAURI__ = {};

			expect(Platform.getPlatform()).toBe("desktop");
		});

		it('should return "ios" for iOS Capacitor apps', () => {
			delete (global.window as any).__TAURI__;
			delete (global.window as any).__TAURI_INTERNALS__;
			delete (global.window as any).__TAURI_INVOKE__;

			mockIsNativePlatform.mockReturnValue(true);
			mockGetPlatform.mockReturnValue("ios");

			expect(Platform.getPlatform()).toBe("ios");
		});

		it('should return "android" for Android Capacitor apps', () => {
			delete (global.window as any).__TAURI__;
			delete (global.window as any).__TAURI_INTERNALS__;
			delete (global.window as any).__TAURI_INVOKE__;

			mockIsNativePlatform.mockReturnValue(true);
			mockGetPlatform.mockReturnValue("android");

			expect(Platform.getPlatform()).toBe("android");
		});

		it('should return "mobile" when Capacitor platform detection fails', () => {
			delete (global.window as any).__TAURI__;
			delete (global.window as any).__TAURI_INTERNALS__;
			delete (global.window as any).__TAURI_INVOKE__;

			// Set up mocks for this specific test
			mockIsNativePlatform.mockReturnValue(true);
			mockGetPlatform.mockImplementation(() => {
				throw new Error("Platform detection failed");
			});

			expect(Platform.getPlatform()).toBe("mobile");
		});

		it('should return "web" for web browsers', () => {
			delete (global.window as any).__TAURI__;
			delete (global.window as any).__TAURI_INTERNALS__;
			delete (global.window as any).__TAURI_INVOKE__;

			mockIsNativePlatform.mockReturnValue(false);

			expect(Platform.getPlatform()).toBe("web");
		});
	});

	describe("supportsSystemBrowser", () => {
		it("should return true for desktop platforms", () => {
			(global.window as any).__TAURI__ = {};

			expect(Platform.supportsSystemBrowser()).toBe(true);
		});

		it("should return true for mobile platforms", () => {
			delete (global.window as any).__TAURI__;
			delete (global.window as any).__TAURI_INTERNALS__;
			delete (global.window as any).__TAURI_INVOKE__;

			mockIsNativePlatform.mockReturnValue(true);

			expect(Platform.supportsSystemBrowser()).toBe(true);
		});

		it("should return false for web platforms", () => {
			delete (global.window as any).__TAURI__;
			delete (global.window as any).__TAURI_INTERNALS__;
			delete (global.window as any).__TAURI_INVOKE__;

			mockIsNativePlatform.mockReturnValue(false);

			expect(Platform.supportsSystemBrowser()).toBe(false);
		});
	});

	describe("shouldUseInAppOAuth", () => {
		it("should return true for web platforms", () => {
			delete (global.window as any).__TAURI__;
			delete (global.window as any).__TAURI_INTERNALS__;
			delete (global.window as any).__TAURI_INVOKE__;

			mockIsNativePlatform.mockReturnValue(false);

			expect(Platform.shouldUseInAppOAuth()).toBe(true);
		});

		it("should return false for desktop platforms", () => {
			(global.window as any).__TAURI__ = {};

			expect(Platform.shouldUseInAppOAuth()).toBe(false);
		});

		it("should return false for mobile platforms", () => {
			delete (global.window as any).__TAURI__;
			delete (global.window as any).__TAURI_INTERNALS__;
			delete (global.window as any).__TAURI_INVOKE__;

			mockIsNativePlatform.mockReturnValue(true);

			expect(Platform.shouldUseInAppOAuth()).toBe(false);
		});
	});

	describe("edge cases", () => {
		it("should handle missing window object gracefully", () => {
			// @ts-expect-error - Testing edge case
			global.window = undefined;

			expect(Platform.isDesktop()).toBe(false);
			expect(Platform.isWeb()).toBe(true); // Should default to web when detection fails
			expect(Platform.getPlatform()).toBe("web");
		});

		it("should handle Capacitor import errors gracefully", () => {
			delete (global.window as any).__TAURI__;
			delete (global.window as any).__TAURI_INTERNALS__;
			delete (global.window as any).__TAURI_INVOKE__;

			// Mock Capacitor to return null (module not found)
			__mockCapacitor(null);

			expect(Platform.isMobile()).toBe(false);
			expect(Platform.isWeb()).toBe(true);
			expect(Platform.getPlatform()).toBe("web");
		});
	});
});
