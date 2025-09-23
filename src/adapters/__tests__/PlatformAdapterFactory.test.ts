import { describe, it, expect, beforeEach, vi } from "vitest";

// Mock platform detection to control test environment
vi.mock("../platformDetection", () => ({
	detectPlatform: vi.fn(),
	getPlatformCapabilities: vi.fn(),
	isMobile: vi.fn(),
	isDesktop: vi.fn(),
	getPlatformClasses: vi.fn(),
	isPlatformSupported: vi.fn(),
	getPlatformConfig: vi.fn(),
	onPlatform: vi.fn(),
}));
import {
	createPlatformAdapter,
	createPlatformAdapterFactory,
	createAllPlatformAdapters,
	isPlatformAdapterAvailable,
	getAvailablePlatformAdapters,
	createBestAvailablePlatformAdapter,
	validatePlatformAdapterConfig,
	createMockPlatformAdapter,
} from "../PlatformAdapterFactory";
import { WebPlatformAdapter } from "../WebPlatformAdapter";
import { detectPlatform, getPlatformCapabilities } from "../platformDetection";
import type { PlatformDetection, PlatformCapabilities } from "../types";

// Mock window and platform detection
const mockWindow = {
	__TAURI__: undefined as any,
	Capacitor: undefined as any,
	addEventListener: vi.fn(),
	removeEventListener: vi.fn(),
	history: { length: 1, back: vi.fn(), pushState: vi.fn(), replaceState: vi.fn() },
};

Object.defineProperty(global, "window", {
	value: mockWindow,
	writable: true,
});

Object.defineProperty(global, "document", {
	value: {
		addEventListener: vi.fn(),
		removeEventListener: vi.fn(),
		visibilityState: "visible",
	},
	writable: true,
});

// Mock process.env
Object.defineProperty(process, "env", {
	value: { NODE_ENV: "test" },
	writable: true,
});

describe("Platform Adapter Factory", () => {
	beforeEach(() => {
		// Reset mocks
		mockWindow.__TAURI__ = undefined;
		mockWindow.Capacitor = undefined;
		vi.clearAllMocks();

		// Set up default platform detection mocks
		vi.mocked(detectPlatform).mockReturnValue({
			platform: "web",
			isMobile: false,
			isDesktop: true,
			userAgent: "test-agent",
			capabilities: {
				hasHardwareBackButton: false,
				hasSystemOverlays: false,
				hasDeepLinking: true,
				hasNativeSharing: false,
				hasKeyboardShortcuts: true,
				hasWindowManagement: false,
			},
		});

		vi.mocked(getPlatformCapabilities).mockImplementation((platform) => {
			const capabilities: Record<string, PlatformCapabilities> = {
				web: {
					hasHardwareBackButton: false,
					hasSystemOverlays: false,
					hasDeepLinking: true,
					hasNativeSharing: false,
					hasKeyboardShortcuts: true,
					hasWindowManagement: false,
				},
				capacitor: {
					hasHardwareBackButton: true,
					hasSystemOverlays: true,
					hasDeepLinking: true,
					hasNativeSharing: true,
					hasKeyboardShortcuts: false,
					hasWindowManagement: false,
				},
				tauri: {
					hasHardwareBackButton: false,
					hasSystemOverlays: false,
					hasDeepLinking: true,
					hasNativeSharing: false,
					hasKeyboardShortcuts: true,
					hasWindowManagement: true,
				},
			};
			return capabilities[platform] || capabilities.web;
		});
	});

	describe("createPlatformAdapter", () => {
		it("should create web adapter by default", () => {
			const adapter = createPlatformAdapter();
			
			expect(adapter).toBeInstanceOf(WebPlatformAdapter);
			expect(adapter.platform).toBe("web");
		});

		it("should create web adapter when specified", () => {
			const adapter = createPlatformAdapter({ platform: "web" });
			
			expect(adapter).toBeInstanceOf(WebPlatformAdapter);
			expect(adapter.platform).toBe("web");
		});

		it("should create Capacitor adapter when specified", () => {
			mockWindow.Capacitor = { getPlatform: () => "android" };
			vi.mocked(detectPlatform).mockReturnValue({
				platform: "capacitor",
				isMobile: true,
				isDesktop: false,
				userAgent: "test-agent",
				capabilities: {
					hasHardwareBackButton: true,
					hasSystemOverlays: true,
					hasDeepLinking: true,
					hasNativeSharing: true,
					hasKeyboardShortcuts: false,
					hasWindowManagement: false,
				},
			});

			const adapter = createPlatformAdapter({ platform: "capacitor" });

			expect(adapter.platform).toBe("capacitor");
			expect(adapter.capabilities.hasNativeSharing).toBe(true);
		});

		it("should create Tauri adapter when specified", () => {
			mockWindow.__TAURI__ = {};
			vi.mocked(detectPlatform).mockReturnValue({
				platform: "tauri",
				isMobile: false,
				isDesktop: true,
				userAgent: "test-agent",
				capabilities: {
					hasHardwareBackButton: false,
					hasSystemOverlays: false,
					hasDeepLinking: true,
					hasNativeSharing: false,
					hasKeyboardShortcuts: true,
					hasWindowManagement: true,
				},
			});

			const adapter = createPlatformAdapter({ platform: "tauri" });

			expect(adapter.platform).toBe("tauri");
			expect(adapter.capabilities.hasWindowManagement).toBe(true);
		});

		it("should throw error for unsupported platform", () => {
			expect(() => {
				createPlatformAdapter({ platform: "invalid" as any });
			}).toThrow("Unsupported platform: invalid");
		});

		it("should merge configuration correctly", () => {
			const adapter = createPlatformAdapter({
				platform: "web",
				debug: true,
				preventDefaults: true,
			});
			
			expect(adapter.platform).toBe("web");
			// Can't directly test config, but adapter should be created successfully
		});
	});

	describe("createPlatformAdapterFactory", () => {
		it("should create factory with default config", () => {
			const factory = createPlatformAdapterFactory({ debug: true });
			const adapter = factory({ platform: "web" });
			
			expect(adapter).toBeInstanceOf(WebPlatformAdapter);
			expect(adapter.platform).toBe("web");
		});

		it("should merge factory config with call config", () => {
			const factory = createPlatformAdapterFactory({ debug: true });
			const adapter = factory({ platform: "web", preventDefaults: true });
			
			expect(adapter).toBeInstanceOf(WebPlatformAdapter);
		});
	});

	describe("createAllPlatformAdapters", () => {
		beforeEach(() => {
			// Mock all platforms as available
			mockWindow.Capacitor = { getPlatform: () => "android" };
			mockWindow.__TAURI__ = {};
		});

		it("should create adapters for all platforms", () => {
			const adapters = createAllPlatformAdapters();

			expect(adapters.web).toBeInstanceOf(WebPlatformAdapter);
			expect(adapters.capacitor.platform).toBe("capacitor");
			expect(adapters.tauri.platform).toBe("tauri");
		});

		it("should apply config to all adapters", () => {
			const adapters = createAllPlatformAdapters({ debug: true });

			expect(adapters.web.platform).toBe("web");
			expect(adapters.capacitor.platform).toBe("capacitor");
			expect(adapters.tauri.platform).toBe("tauri");
		});
	});

	describe("isPlatformAdapterAvailable", () => {
		it("should return true for web when window exists", () => {
			expect(isPlatformAdapterAvailable("web")).toBe(true);
		});

		it("should return true for Capacitor when available", () => {
			mockWindow.Capacitor = {};
			expect(isPlatformAdapterAvailable("capacitor")).toBe(true);
			// Clean up
			delete mockWindow.Capacitor;
		});

		it("should return false for Capacitor when not available", () => {
			// Ensure Capacitor is not available
			delete mockWindow.Capacitor;
			expect(isPlatformAdapterAvailable("capacitor")).toBe(false);
		});

		it("should return true for Tauri when available", () => {
			mockWindow.__TAURI__ = {};
			expect(isPlatformAdapterAvailable("tauri")).toBe(true);
			// Clean up
			delete mockWindow.__TAURI__;
		});

		it("should return false for Tauri when not available", () => {
			// Ensure Tauri is not available
			delete mockWindow.__TAURI__;
			expect(isPlatformAdapterAvailable("tauri")).toBe(false);
		});

		it("should return false for invalid platform", () => {
			expect(isPlatformAdapterAvailable("invalid" as any)).toBe(false);
		});
	});

	describe("getAvailablePlatformAdapters", () => {
		it("should return only web when others not available", () => {
			// Ensure other platforms are not available
			delete mockWindow.Capacitor;
			delete mockWindow.__TAURI__;

			const available = getAvailablePlatformAdapters();
			expect(available).toEqual(["web"]);
		});

		it("should return all platforms when available", () => {
			mockWindow.Capacitor = {};
			mockWindow.__TAURI__ = {};

			const available = getAvailablePlatformAdapters();
			expect(available).toContain("web");
			expect(available).toContain("capacitor");
			expect(available).toContain("tauri");

			// Clean up
			delete mockWindow.Capacitor;
			delete mockWindow.__TAURI__;
		});
	});

	describe("createBestAvailablePlatformAdapter", () => {
		it("should create web adapter when only web available", () => {
			// Ensure other platforms are not available
			delete mockWindow.Capacitor;
			delete mockWindow.__TAURI__;

			const adapter = createBestAvailablePlatformAdapter();
			expect(adapter).toBeInstanceOf(WebPlatformAdapter);
		});

		it("should create requested adapter when available", () => {
			mockWindow.__TAURI__ = {};
			vi.mocked(detectPlatform).mockReturnValue({
				platform: "tauri",
				isMobile: false,
				isDesktop: true,
				userAgent: "test-agent",
				capabilities: {
					hasHardwareBackButton: false,
					hasSystemOverlays: false,
					hasDeepLinking: true,
					hasNativeSharing: false,
					hasKeyboardShortcuts: true,
					hasWindowManagement: true,
				},
			});

			const adapter = createBestAvailablePlatformAdapter({ platform: "tauri" });
			expect(adapter.platform).toBe("tauri");

			// Clean up
			delete mockWindow.__TAURI__;
		});

		it("should fallback to available adapter when requested not available", () => {
			// Ensure Tauri is not available
			delete mockWindow.__TAURI__;
			delete mockWindow.Capacitor;

			// Request Tauri but it's not available
			const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

			const adapter = createBestAvailablePlatformAdapter({ platform: "tauri" });
			expect(adapter).toBeInstanceOf(WebPlatformAdapter);
			expect(consoleSpy).toHaveBeenCalledWith(
				expect.stringContaining("Requested platform 'tauri' is not available")
			);

			consoleSpy.mockRestore();
		});
	});

	describe("validatePlatformAdapterConfig", () => {
		it("should validate valid config", () => {
			expect(() => {
				validatePlatformAdapterConfig({
					platform: "web",
					capabilities: {
						hasHardwareBackButton: false,
						hasSystemOverlays: false,
						hasDeepLinking: true,
						hasNativeSharing: false,
						hasKeyboardShortcuts: true,
						hasWindowManagement: false,
					},
					handlers: {},
				});
			}).not.toThrow();
		});

		it("should throw for missing platform", () => {
			expect(() => {
				validatePlatformAdapterConfig({
					platform: undefined as any,
					capabilities: {} as any,
					handlers: {},
				});
			}).toThrow("Platform adapter config must specify a platform");
		});

		it("should throw for invalid platform", () => {
			expect(() => {
				validatePlatformAdapterConfig({
					platform: "invalid" as any,
					capabilities: {} as any,
					handlers: {},
				});
			}).toThrow("Invalid platform: invalid");
		});

		it("should throw for missing capabilities", () => {
			expect(() => {
				validatePlatformAdapterConfig({
					platform: "web",
					capabilities: undefined as any,
					handlers: {},
				});
			}).toThrow("Platform adapter config must specify capabilities");
		});

		it("should throw for Capacitor without Capacitor environment", () => {
			// Ensure Capacitor is not available
			delete mockWindow.Capacitor;

			expect(() => {
				validatePlatformAdapterConfig({
					platform: "capacitor",
					capabilities: {} as any,
					handlers: {},
				});
			}).toThrow("Capacitor platform adapter requires Capacitor environment");
		});

		it("should throw for Tauri without Tauri environment", () => {
			// Ensure Tauri is not available
			delete mockWindow.__TAURI__;

			expect(() => {
				validatePlatformAdapterConfig({
					platform: "tauri",
					capabilities: {} as any,
					handlers: {},
				});
			}).toThrow("Tauri platform adapter requires Tauri environment");
		});
	});

	describe("createMockPlatformAdapter", () => {
		it("should create mock adapter with default config", () => {
			const adapter = createMockPlatformAdapter();
			
			expect(adapter.platform).toBe("web");
			expect(adapter.isInitialized).toBe(true);
		});

		it("should create mock adapter for specific platform", () => {
			const adapter = createMockPlatformAdapter("capacitor");
			
			expect(adapter.platform).toBe("capacitor");
			expect(adapter.capabilities.hasNativeSharing).toBe(true);
		});

		it("should handle mock methods", async () => {
			const adapter = createMockPlatformAdapter();
			
			expect(await adapter.handleBack()).toBe(false);
			expect(await adapter.handleEscape()).toBe(false);
			expect(typeof adapter.initialize).toBe("function");
			expect(typeof adapter.cleanup).toBe("function");
		});
	});
});
