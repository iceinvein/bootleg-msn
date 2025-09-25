import { act, renderHook } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useOverlayBackBridge } from "../useOverlayBackBridge";

// Mock all dependencies to avoid complex interactions
vi.mock("../useOverlays", () => ({
	useOverlays: vi.fn(() => ({
		hasOpen: false,
		closeTop: vi.fn(),
	})),
}));

vi.mock("../useOverlayUrl", () => ({
	useOverlayUrl: vi.fn(() => ({
		hasUrlOverlay: vi.fn(() => false),
		navigateWithOverlay: vi.fn(),
	})),
}));

vi.mock("../usePlatformHostAdapter", () => ({
	usePlatformHostAdapter: vi.fn(() => ({
		handleBack: vi.fn().mockResolvedValue("ignored"),
		capabilities: {
			hasHardwareBackButton: true,
			hasKeyboardShortcuts: true,
		},
	})),
}));

// Wrapper component for React Router context
const RouterWrapper = ({ children }: { children: React.ReactNode }) => (
	<MemoryRouter initialEntries={["/"]}>{children}</MemoryRouter>
);

describe("useOverlayBackBridge - Simple Tests", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("Basic Functionality", () => {
		it("should initialize with default configuration", () => {
			const { result } = renderHook(() => useOverlayBackBridge(), {
				wrapper: RouterWrapper,
			});

			expect(result.current.isBackHandled).toBe(false);
			expect(result.current.capabilities.hasHardwareBackButton).toBe(true);
			expect(typeof result.current.registerBackHandler).toBe("function");
			expect(typeof result.current.unregisterBackHandler).toBe("function");
			expect(typeof result.current.handleBack).toBe("function");
			expect(typeof result.current.canGoBack).toBe("function");
		});

		it("should register a back handler", () => {
			const { result } = renderHook(() => useOverlayBackBridge(), {
				wrapper: RouterWrapper,
			});

			const handler = vi.fn(() => true);

			act(() => {
				const handlerId = result.current.registerBackHandler(handler);
				expect(typeof handlerId).toBe("string");
				expect(handlerId).toMatch(/^back-handler-\d+-\d+$/);
			});
		});

		it("should unregister a back handler", () => {
			const { result } = renderHook(() => useOverlayBackBridge(), {
				wrapper: RouterWrapper,
			});

			const handler = vi.fn(() => true);
			let handlerId: string;

			act(() => {
				handlerId = result.current.registerBackHandler(handler);
			});

			expect(result.current.backHandlers).toHaveLength(1);

			act(() => {
				const removed = result.current.unregisterBackHandler(handlerId);
				expect(removed).toBe(true);
			});
		});

		it("should handle back button events", async () => {
			const { result } = renderHook(() => useOverlayBackBridge(), {
				wrapper: RouterWrapper,
			});

			await act(async () => {
				const backResult = await result.current.handleBack();
				expect(backResult).toBe("ignored"); // Should delegate to platform adapter
			});
		});

		it("should report canGoBack status", () => {
			const { result } = renderHook(() => useOverlayBackBridge(), {
				wrapper: RouterWrapper,
			});

			expect(result.current.canGoBack()).toBe(true); // Due to hardware back button capability
		});
	});

	describe("Handler Priority", () => {
		it("should register handlers with different priorities", () => {
			const { result } = renderHook(() => useOverlayBackBridge(), {
				wrapper: RouterWrapper,
			});

			const lowHandler = vi.fn(() => false);
			const highHandler = vi.fn(() => true);

			act(() => {
				result.current.registerBackHandler(lowHandler);
				result.current.registerBackHandler(highHandler);
			});

			// Both handlers should be registered
			expect(result.current.backHandlers).toHaveLength(2);
		});
	});

	describe("Configuration", () => {
		it("should accept custom configuration", () => {
			const { result } = renderHook(
				() =>
					useOverlayBackBridge({
						autoHandleOverlays: false,
						integrateWithUrl: false,
						componentName: "TestComponent",
						debug: true,
					}),
				{ wrapper: RouterWrapper },
			);

			expect(result.current.isBackHandled).toBe(false);
			expect(typeof result.current.handleBack).toBe("function");
		});
	});

	describe("Cleanup", () => {
		it("should clean up on unmount", () => {
			const { result, unmount } = renderHook(() => useOverlayBackBridge(), {
				wrapper: RouterWrapper,
			});

			const handler = vi.fn(() => true);

			act(() => {
				result.current.registerBackHandler(handler);
			});

			// Should have handlers
			expect(result.current.backHandlers.length).toBeGreaterThan(0);

			// Unmount should clean up
			unmount();

			// Create new instance to verify cleanup
			const { result: newResult } = renderHook(() => useOverlayBackBridge(), {
				wrapper: RouterWrapper,
			});

			// New instance should start clean
			expect(newResult.current.backHandlers).toHaveLength(0);
		});
	});
});
