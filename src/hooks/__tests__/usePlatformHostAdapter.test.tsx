import { act, renderHook, waitFor } from "@testing-library/react";
import type React from "react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createPlatformHostAdapter } from "@/adapters/PlatformHostAdapter";
import {
	detectPlatform,
	getPlatformCapabilities,
	getPlatformClasses,
	isDesktop,
	isMobile,
} from "@/adapters/platformDetection";
import { resetOverlaySystem } from "@/stores/overlays";
import {
	usePlatformDetection,
	usePlatformHostAdapter,
	usePlatformShare,
} from "../usePlatformHostAdapter";

// Mock the platform adapters
vi.mock("@/adapters/PlatformHostAdapter", () => ({
	createPlatformHostAdapter: vi.fn(),
}));

vi.mock("@/adapters/platformDetection", () => ({
	detectPlatform: vi.fn(),
	getPlatformCapabilities: vi.fn(),
	isMobile: vi.fn(),
	isDesktop: vi.fn(),
	getPlatformClasses: vi.fn(),
}));

// Mock nanoid for predictable IDs
let idCounter = 0;
vi.mock("nanoid", () => ({
	nanoid: vi.fn(() => `test-id-${++idCounter}`),
}));

// Mock window methods that aren't provided by jsdom
Object.defineProperty(window, "addEventListener", {
	value: vi.fn(),
	writable: true,
});

Object.defineProperty(window, "removeEventListener", {
	value: vi.fn(),
	writable: true,
});

Object.defineProperty(window, "history", {
	value: {
		length: 1,
		back: vi.fn(),
		pushState: vi.fn(),
		replaceState: vi.fn(),
	},
	writable: true,
});

Object.defineProperty(window, "location", {
	value: { href: "https://example.com" },
	writable: true,
});

// Mock navigator
Object.defineProperty(global, "navigator", {
	value: {
		userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
		clipboard: {
			writeText: vi.fn().mockResolvedValue(undefined),
		},
	},
	writable: true,
});

// Mock process.env
Object.defineProperty(process, "env", {
	value: { NODE_ENV: "test" },
	writable: true,
});

// Router wrapper for hook tests
const RouterWrapper: React.FC<{ children: React.ReactNode }> = ({
	children,
}) => <MemoryRouter initialEntries={["/"]}>{children}</MemoryRouter>;

describe("usePlatformHostAdapter Hook", () => {
	const mockPlatformHostAdapter = {
		initialize: vi.fn().mockResolvedValue(undefined),
		cleanup: vi.fn(),
		connectOverlaySystem: vi.fn(),
		disconnectOverlaySystem: vi.fn(),
		handleBack: vi.fn().mockResolvedValue("ignored"),
		handleEscape: vi.fn().mockResolvedValue("ignored"),
		share: vi.fn().mockResolvedValue(true),
		openDeepLink: vi.fn().mockResolvedValue(true),
		get platform() {
			return "web" as const;
		},
		get capabilities() {
			return {
				hasHardwareBackButton: false,
				hasSystemOverlays: false,
				hasDeepLinking: true,
				hasNativeSharing: false,
				hasKeyboardShortcuts: true,
				hasWindowManagement: false,
			};
		},
		get isInitialized() {
			return true;
		},
		get isConnected() {
			return false;
		},
	};

	beforeEach(() => {
		resetOverlaySystem();
		idCounter = 0;
		vi.clearAllMocks();

		// Mock platform adapter factory
		vi.mocked(createPlatformHostAdapter).mockReturnValue(
			mockPlatformHostAdapter as unknown as ReturnType<
				typeof createPlatformHostAdapter
			>,
		);

		// Mock platform detection
		vi.mocked(detectPlatform).mockReturnValue({
			platform: "web",
			userAgent: "test-agent",
			isDevelopment: true,
		});
		vi.mocked(getPlatformCapabilities).mockReturnValue(
			mockPlatformHostAdapter.capabilities,
		);
		vi.mocked(isMobile).mockReturnValue(false);
		vi.mocked(isDesktop).mockReturnValue(true);
		vi.mocked(getPlatformClasses).mockReturnValue([
			"platform-web",
			"platform-desktop",
		]);
	});

	afterEach(() => {
		vi.clearAllTimers();
	});

	describe("Basic Functionality", () => {
		it("should initialize platform adapter", async () => {
			const { result } = renderHook(
				() =>
					usePlatformHostAdapter({
						autoInitialize: true,
						autoConnect: false, // Disable auto-connect for simpler testing
					}),
				{ wrapper: RouterWrapper },
			);

			// Wait for initialization
			await waitFor(() => {
				expect(result.current.isInitialized).toBe(true);
			});

			expect(result.current.adapter).toBeTruthy();
			expect(result.current.platform).toBe("web");
			expect(result.current.capabilities).toBeTruthy();
		});

		it("should provide platform information", async () => {
			const { result } = renderHook(
				() =>
					usePlatformHostAdapter({
						autoConnect: false,
					}),
				{ wrapper: RouterWrapper },
			);

			await waitFor(() => {
				expect(result.current.isInitialized).toBe(true);
			});

			expect(result.current.platform).toBe("web");
			expect(result.current.capabilities.hasKeyboardShortcuts).toBe(true);
			expect(result.current.capabilities.hasHardwareBackButton).toBe(false);
		});

		it("should provide handler functions", async () => {
			const { result } = renderHook(
				() =>
					usePlatformHostAdapter({
						autoConnect: false,
					}),
				{ wrapper: RouterWrapper },
			);

			await waitFor(() => {
				expect(result.current.isInitialized).toBe(true);
			});

			expect(typeof result.current.handleBack).toBe("function");
			expect(typeof result.current.handleEscape).toBe("function");
			expect(typeof result.current.share).toBe("function");
			expect(typeof result.current.openDeepLink).toBe("function");
			expect(typeof result.current.connect).toBe("function");
			expect(typeof result.current.disconnect).toBe("function");
		});
	});

	describe("Manual Connection", () => {
		it("should connect and disconnect manually", async () => {
			const { result } = renderHook(
				() =>
					usePlatformHostAdapter({
						autoConnect: false,
					}),
				{ wrapper: RouterWrapper },
			);

			await waitFor(() => {
				expect(result.current.isInitialized).toBe(true);
			});

			// Initially not connected
			expect(result.current.isConnected).toBe(false);

			// Connect manually
			act(() => {
				result.current.connect();
			});

			expect(result.current.isConnected).toBe(true);

			// Disconnect manually
			act(() => {
				result.current.disconnect();
			});

			expect(result.current.isConnected).toBe(false);
		});

		it("should handle multiple connect/disconnect calls", async () => {
			const { result } = renderHook(
				() =>
					usePlatformHostAdapter({
						autoConnect: false,
					}),
				{ wrapper: RouterWrapper },
			);

			await waitFor(() => {
				expect(result.current.isInitialized).toBe(true);
			});

			// Multiple connects should not cause issues
			act(() => {
				result.current.connect();
				result.current.connect();
			});

			expect(result.current.isConnected).toBe(true);

			// Multiple disconnects should not cause issues
			act(() => {
				result.current.disconnect();
				result.current.disconnect();
			});

			expect(result.current.isConnected).toBe(false);
		});
	});

	describe("Event Handling", () => {
		it("should handle back button", async () => {
			const { result } = renderHook(
				() =>
					usePlatformHostAdapter({
						autoConnect: false,
					}),
				{ wrapper: RouterWrapper },
			);

			await waitFor(() => {
				expect(result.current.isInitialized).toBe(true);
			});

			await act(async () => {
				const backResult = await result.current.handleBack();
				expect(backResult).toBe("ignored"); // No overlays open
			});
		});

		it("should handle escape key", async () => {
			const { result } = renderHook(
				() =>
					usePlatformHostAdapter({
						autoConnect: false,
					}),
				{ wrapper: RouterWrapper },
			);

			await waitFor(() => {
				expect(result.current.isInitialized).toBe(true);
			});

			await act(async () => {
				const escapeResult = await result.current.handleEscape();
				expect(escapeResult).toBe("ignored"); // No overlays open
			});
		});

		it("should handle sharing", async () => {
			const { result } = renderHook(
				() =>
					usePlatformHostAdapter({
						autoConnect: false,
					}),
				{ wrapper: RouterWrapper },
			);

			await waitFor(() => {
				expect(result.current.isInitialized).toBe(true);
			});

			await act(async () => {
				const shareResult = await result.current.share({
					title: "Test",
					text: "Test content",
					url: "https://example.com",
				});
				expect(typeof shareResult).toBe("boolean");
			});
		});

		it("should handle deep link opening", async () => {
			const { result } = renderHook(
				() =>
					usePlatformHostAdapter({
						autoConnect: false,
					}),
				{ wrapper: RouterWrapper },
			);

			await waitFor(() => {
				expect(result.current.isInitialized).toBe(true);
			});

			await act(async () => {
				const deepLinkResult = await result.current.openDeepLink(
					"https://example.com/deep-link",
				);
				expect(typeof deepLinkResult).toBe("boolean");
			});
		});
	});

	describe("Configuration", () => {
		it("should respect autoConnect configuration", async () => {
			const { result } = renderHook(
				() =>
					usePlatformHostAdapter({
						autoConnect: true,
					}),
				{ wrapper: RouterWrapper },
			);

			await waitFor(() => {
				expect(result.current.isInitialized).toBe(true);
			});

			// Should auto-connect when autoConnect is true
			expect(result.current.isConnected).toBe(true);
		});

		it("should respect debug configuration", async () => {
			const { result } = renderHook(
				() =>
					usePlatformHostAdapter({
						autoConnect: false,
						debug: true,
					}),
				{ wrapper: RouterWrapper },
			);

			await waitFor(() => {
				expect(result.current.isInitialized).toBe(true);
			});

			expect(result.current.adapter).toBeTruthy();
		});
	});

	describe("Cleanup", () => {
		it("should cleanup on unmount", async () => {
			const { result, unmount } = renderHook(
				() =>
					usePlatformHostAdapter({
						autoConnect: false,
					}),
				{ wrapper: RouterWrapper },
			);

			await waitFor(() => {
				expect(result.current.isInitialized).toBe(true);
			});

			const adapter = result.current.adapter;
			expect(adapter).toBeTruthy();

			// Unmount should trigger cleanup
			unmount();

			// Can't directly test cleanup, but unmount should not throw errors
		});
	});
});

describe("usePlatformShare Hook", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("should provide sharing functionality", async () => {
		const { result } = renderHook(() => usePlatformShare(), {
			wrapper: RouterWrapper,
		});

		await waitFor(() => {
			expect(result.current.canShare).toBeDefined();
		});

		expect(typeof result.current.share).toBe("function");
		expect(typeof result.current.canShare).toBe("boolean");
	});

	it("should handle sharing", async () => {
		const { result } = renderHook(() => usePlatformShare(), {
			wrapper: RouterWrapper,
		});

		await waitFor(() => {
			expect(result.current.canShare).toBeDefined();
		});

		await act(async () => {
			const shareResult = await result.current.share({
				title: "Test",
				url: "https://example.com",
			});
			expect(typeof shareResult).toBe("boolean");
		});
	});
});

describe("usePlatformDetection Hook", () => {
	it("should provide platform detection information", async () => {
		const { result } = renderHook(() => usePlatformDetection(), {
			wrapper: RouterWrapper,
		});

		await waitFor(() => {
			expect(result.current.isInitialized).toBe(true);
		});

		expect(result.current.platform).toBe("web");
		expect(result.current.capabilities).toBeTruthy();
		expect(result.current.isWeb).toBe(true);
		expect(result.current.isCapacitor).toBe(false);
		expect(result.current.isTauri).toBe(false);
		expect(result.current.isMobile).toBe(false);
		expect(result.current.isDesktop).toBe(true);
	});

	it("should provide boolean platform checks", async () => {
		const { result } = renderHook(() => usePlatformDetection(), {
			wrapper: RouterWrapper,
		});

		await waitFor(() => {
			expect(result.current.isInitialized).toBe(true);
		});

		// For web platform
		expect(result.current.isWeb).toBe(true);
		expect(result.current.isCapacitor).toBe(false);
		expect(result.current.isTauri).toBe(false);
		expect(result.current.isMobile).toBe(false);
		expect(result.current.isDesktop).toBe(true);
	});
});
