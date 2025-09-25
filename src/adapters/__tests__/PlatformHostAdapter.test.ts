import { beforeEach, describe, expect, it, vi } from "vitest";
import type { OverlaySystemCallbacks } from "../PlatformHostAdapter";
import {
	createPlatformHostAdapter,
	PlatformHostAdapter,
} from "../PlatformHostAdapter";

// Mock window
const mockWindow = {
	addEventListener: vi.fn(),
	removeEventListener: vi.fn(),
	history: {
		length: 1,
		back: vi.fn(),
		pushState: vi.fn(),
		replaceState: vi.fn(),
	},
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

describe("PlatformHostAdapter", () => {
	let adapter: PlatformHostAdapter;
	let mockOverlayCallbacks: OverlaySystemCallbacks;

	beforeEach(async () => {
		vi.clearAllMocks();

		// Create mock overlay callbacks
		mockOverlayCallbacks = {
			hasOpenOverlays: vi.fn(() => false),
			getOverlayCount: vi.fn(() => 0),
			closeTopOverlay: vi.fn(() => true),
			closeAllOverlays: vi.fn(),
			handleUrlOverlay: vi.fn(),
		};

		// Create adapter with auto-initialization disabled for testing
		adapter = new PlatformHostAdapter({
			autoInitialize: false,
			debug: true,
		});

		await adapter.initialize();
	});

	afterEach(() => {
		if (adapter) {
			adapter.cleanup();
		}
	});

	describe("Initialization", () => {
		it("should initialize successfully", () => {
			expect(adapter.initialized).toBe(true);
			expect(adapter.platform).toBe("web");
			expect(adapter.capabilities).toBeDefined();
		});

		it("should have correct platform capabilities", () => {
			expect(adapter.capabilities.hasKeyboardShortcuts).toBe(true);
			expect(adapter.capabilities.hasHardwareBackButton).toBe(false);
			expect(adapter.capabilities.hasDeepLinking).toBe(true);
		});
	});

	describe("Overlay System Connection", () => {
		it("should connect to overlay system", () => {
			adapter.connectOverlaySystem(mockOverlayCallbacks);

			// Connection should be established (no direct way to test, but no errors should occur)
			expect(() =>
				adapter.connectOverlaySystem(mockOverlayCallbacks),
			).not.toThrow();
		});

		it("should disconnect from overlay system", () => {
			adapter.connectOverlaySystem(mockOverlayCallbacks);
			adapter.disconnectOverlaySystem();

			// Disconnection should be successful (no direct way to test, but no errors should occur)
			expect(() => adapter.disconnectOverlaySystem()).not.toThrow();
		});
	});

	describe("Back Button Handling", () => {
		beforeEach(() => {
			adapter.connectOverlaySystem(mockOverlayCallbacks);
		});

		it("should ignore back button when no overlays open", async () => {
			mockOverlayCallbacks.hasOpenOverlays = vi.fn(() => false);

			const result = await adapter.handleBack();

			expect(result).toBe("ignored");
			expect(mockOverlayCallbacks.hasOpenOverlays).toHaveBeenCalled();
			expect(mockOverlayCallbacks.closeTopOverlay).not.toHaveBeenCalled();
		});

		it("should handle back button when overlays are open", async () => {
			mockOverlayCallbacks.hasOpenOverlays = vi.fn(() => true);
			mockOverlayCallbacks.closeTopOverlay = vi.fn(() => true);

			const result = await adapter.handleBack();

			expect(result).toBe("handled");
			expect(mockOverlayCallbacks.hasOpenOverlays).toHaveBeenCalled();
			expect(mockOverlayCallbacks.closeTopOverlay).toHaveBeenCalled();
		});

		it("should ignore back button when not connected to overlay system", async () => {
			adapter.disconnectOverlaySystem();

			const result = await adapter.handleBack();

			expect(result).toBe("ignored");
		});
	});

	describe("Escape Key Handling", () => {
		beforeEach(() => {
			adapter.connectOverlaySystem(mockOverlayCallbacks);
		});

		it("should ignore escape key when no overlays open", async () => {
			mockOverlayCallbacks.hasOpenOverlays = vi.fn(() => false);

			const result = await adapter.handleEscape();

			expect(result).toBe("ignored");
			expect(mockOverlayCallbacks.hasOpenOverlays).toHaveBeenCalled();
			expect(mockOverlayCallbacks.closeTopOverlay).not.toHaveBeenCalled();
		});

		it("should handle escape key when overlays are open", async () => {
			mockOverlayCallbacks.hasOpenOverlays = vi.fn(() => true);
			mockOverlayCallbacks.closeTopOverlay = vi.fn(() => true);

			const result = await adapter.handleEscape();

			expect(result).toBe("prevented"); // Web platform prevents default for escape
			expect(mockOverlayCallbacks.hasOpenOverlays).toHaveBeenCalled();
			expect(mockOverlayCallbacks.closeTopOverlay).toHaveBeenCalled();
		});
	});

	describe("Deep Link Handling", () => {
		beforeEach(() => {
			adapter.connectOverlaySystem(mockOverlayCallbacks);
		});

		it("should handle deep link with URL overlay handler", () => {
			const testUrl = "https://example.com/app?modal=CONFIRM";

			adapter.handleDeepLink(testUrl);

			expect(mockOverlayCallbacks.handleUrlOverlay).toHaveBeenCalledWith(
				testUrl,
			);
		});

		it("should handle deep link without URL overlay handler", () => {
			mockOverlayCallbacks.handleUrlOverlay = undefined;
			const testUrl = "https://example.com/app?modal=CONFIRM";

			// Should not throw error
			expect(() => adapter.handleDeepLink(testUrl)).not.toThrow();
		});
	});

	describe("App State Changes", () => {
		beforeEach(() => {
			adapter.connectOverlaySystem(mockOverlayCallbacks);
		});

		it("should close overlays when app goes to background", () => {
			mockOverlayCallbacks.getOverlayCount = vi.fn(() => 2);

			adapter.handleAppStateChange("background");

			expect(mockOverlayCallbacks.getOverlayCount).toHaveBeenCalled();
			expect(mockOverlayCallbacks.closeAllOverlays).toHaveBeenCalled();
		});

		it("should not close overlays when no overlays open", () => {
			mockOverlayCallbacks.getOverlayCount = vi.fn(() => 0);

			adapter.handleAppStateChange("background");

			expect(mockOverlayCallbacks.getOverlayCount).toHaveBeenCalled();
			expect(mockOverlayCallbacks.closeAllOverlays).not.toHaveBeenCalled();
		});

		it("should handle active state without closing overlays", () => {
			adapter.handleAppStateChange("active");

			expect(mockOverlayCallbacks.closeAllOverlays).not.toHaveBeenCalled();
		});
	});

	describe("Window Focus Handling", () => {
		it("should handle window focus changes", () => {
			// Should not throw error
			expect(() => adapter.handleWindowFocus(true)).not.toThrow();
			expect(() => adapter.handleWindowFocus(false)).not.toThrow();
		});
	});

	describe("Sharing", () => {
		it("should attempt to share content", async () => {
			const content = {
				title: "Test",
				text: "Test content",
				url: "https://example.com",
			};

			// Web platform may or may not support sharing
			const result = await adapter.share(content);

			expect(typeof result).toBe("boolean");
		});
	});

	describe("Deep Link Opening", () => {
		it("should attempt to open deep link", async () => {
			const url = "https://example.com/deep-link";

			const result = await adapter.openDeepLink(url);

			expect(typeof result).toBe("boolean");
		});
	});

	describe("Cleanup", () => {
		it("should cleanup successfully", () => {
			expect(() => adapter.cleanup()).not.toThrow();
			expect(adapter.initialized).toBe(false);
		});

		it("should handle multiple cleanup calls", () => {
			adapter.cleanup();
			expect(() => adapter.cleanup()).not.toThrow();
		});
	});
});

describe("createPlatformHostAdapter", () => {
	it("should create adapter with default config", async () => {
		const adapter = createPlatformHostAdapter({
			autoInitialize: false,
		});

		expect(adapter).toBeInstanceOf(PlatformHostAdapter);
		expect(adapter.platform).toBe("web");

		await adapter.initialize();
		expect(adapter.initialized).toBe(true);

		adapter.cleanup();
	});

	it("should create adapter with custom config", async () => {
		const adapter = createPlatformHostAdapter({
			autoInitialize: false,
			debug: true,
			adapterConfig: {
				preventDefaults: true,
			},
		});

		expect(adapter).toBeInstanceOf(PlatformHostAdapter);

		await adapter.initialize();
		expect(adapter.initialized).toBe(true);

		adapter.cleanup();
	});
});
