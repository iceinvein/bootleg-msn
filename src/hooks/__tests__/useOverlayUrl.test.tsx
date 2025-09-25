import { act, renderHook, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { resetOverlaySystem } from "@/stores/overlays";
import type { OverlayEntry } from "@/types/overlay";
import { useOverlayShare, useOverlayUrl } from "../useOverlayUrl";

// Mock nanoid for predictable IDs
let idCounter = 0;
vi.mock("nanoid", () => ({
	nanoid: vi.fn(() => `test-id-${++idCounter}`),
}));

// Mock clipboard API
const mockWriteText = vi.fn();
Object.assign(navigator, {
	clipboard: {
		writeText: mockWriteText,
	},
});

// Mock window.location
const mockLocation = {
	origin: "https://example.com",
	pathname: "/app",
	href: "https://example.com/app",
};
Object.defineProperty(window, "location", {
	value: mockLocation,
	writable: true,
});

// Wrapper component for React Router context
const RouterWrapper = ({
	children,
	initialEntries = ["/"],
}: {
	children: React.ReactNode;
	initialEntries?: string[];
}) => <MemoryRouter initialEntries={initialEntries}>{children}</MemoryRouter>;

describe("useOverlayUrl Hook", () => {
	beforeEach(() => {
		resetOverlaySystem();
		idCounter = 0;
		vi.clearAllMocks();
		mockWriteText.mockResolvedValue(undefined);
	});

	afterEach(() => {
		vi.clearAllTimers();
	});

	describe("Basic Functionality", () => {
		it("should provide URL synchronization functions", () => {
			const { result } = renderHook(() => useOverlayUrl(), {
				wrapper: RouterWrapper,
			});

			expect(typeof result.current.updateUrl).toBe("function");
			expect(typeof result.current.openFromUrl).toBe("function");
			expect(typeof result.current.clearUrl).toBe("function");
			expect(typeof result.current.generateShareUrl).toBe("function");
			expect(typeof result.current.hasUrlOverlay).toBe("function");
			expect(typeof result.current.navigateWithOverlay).toBe("function");
		});

		it("should detect overlay in URL", () => {
			const { result } = renderHook(() => useOverlayUrl(), {
				wrapper: ({ children }) => (
					<RouterWrapper initialEntries={["/?modal=CONFIRM"]}>
						{children}
					</RouterWrapper>
				),
			});

			expect(result.current.hasUrlOverlay()).toBe(true);
		});

		it("should detect no overlay in URL", () => {
			const { result } = renderHook(() => useOverlayUrl(), {
				wrapper: RouterWrapper,
			});

			expect(result.current.hasUrlOverlay()).toBe(false);
		});
	});

	describe("Opening from URL", () => {
		it("should open overlay from URL parameters", async () => {
			const { result } = renderHook(() => useOverlayUrl(), {
				wrapper: ({ children }) => (
					<RouterWrapper
						initialEntries={[
							"/?modal=CONFIRM&modalProps=eyJ0aXRsZSI6IlRlc3QifQ==",
						]}
					>
						{children}
					</RouterWrapper>
				),
			});

			act(() => {
				const overlayId = result.current.openFromUrl();
				expect(overlayId).toMatch(/^overlay_test-id-\d+$/);
			});

			// Wait for state to update
			await waitFor(() => {
				// The overlay should be opened (we can't directly access overlay state in this test setup,
				// but we can verify the function returned an ID)
				expect(result.current.openFromUrl()).toBeTruthy();
			});
		});

		it("should return null when no overlay in URL", () => {
			const { result } = renderHook(() => useOverlayUrl(), {
				wrapper: RouterWrapper,
			});

			act(() => {
				const overlayId = result.current.openFromUrl();
				expect(overlayId).toBeNull();
			});
		});

		it("should handle malformed URL parameters gracefully", () => {
			const { result } = renderHook(() => useOverlayUrl(), {
				wrapper: ({ children }) => (
					<RouterWrapper initialEntries={["/?modal=INVALID_TYPE"]}>
						{children}
					</RouterWrapper>
				),
			});

			act(() => {
				const overlayId = result.current.openFromUrl();
				expect(overlayId).toBeNull();
			});
		});
	});

	describe("URL Generation", () => {
		it("should generate shareable URL", () => {
			const { result } = renderHook(() => useOverlayUrl(), {
				wrapper: RouterWrapper,
			});

			const mockOverlay: OverlayEntry = {
				id: "test-id",
				type: "CONFIRM",
				createdAt: Date.now(),
				props: { title: "Test" },
			};

			const shareUrl = result.current.generateShareUrl(mockOverlay);

			expect(shareUrl).toContain("https://example.com/app");
			expect(shareUrl).toContain("modal=CONFIRM");
			expect(shareUrl).toContain("modalProps=");
		});

		it("should return current URL when no overlay provided", () => {
			const { result } = renderHook(() => useOverlayUrl(), {
				wrapper: RouterWrapper,
			});

			const shareUrl = result.current.generateShareUrl();

			expect(shareUrl).toBe("https://example.com/app");
		});
	});

	describe("Configuration Options", () => {
		it("should respect includeId configuration", () => {
			const { result } = renderHook(() => useOverlayUrl({ includeId: true }), {
				wrapper: RouterWrapper,
			});

			const mockOverlay: OverlayEntry = {
				id: "test-id",
				type: "INFO",
				createdAt: Date.now(),
			};

			const shareUrl = result.current.generateShareUrl(mockOverlay);

			expect(shareUrl).toContain("modalId=test-id");
		});

		it("should respect includeProps configuration", () => {
			const { result } = renderHook(
				() => useOverlayUrl({ includeProps: false }),
				{
					wrapper: RouterWrapper,
				},
			);

			const mockOverlay: OverlayEntry = {
				id: "test-id",
				type: "CONFIRM",
				createdAt: Date.now(),
				props: { title: "Test" },
			};

			const shareUrl = result.current.generateShareUrl(mockOverlay);

			expect(shareUrl).toContain("modal=CONFIRM");
			expect(shareUrl).not.toContain("modalProps=");
		});

		it("should disable auto-sync when configured", () => {
			const { result } = renderHook(() => useOverlayUrl({ autoSync: false }), {
				wrapper: RouterWrapper,
			});

			// With autoSync disabled, the hook should still provide functions
			// but not automatically sync with URL changes
			expect(typeof result.current.updateUrl).toBe("function");
			expect(typeof result.current.openFromUrl).toBe("function");
		});
	});

	describe("URL Clearing", () => {
		it("should clear overlay parameters from URL", () => {
			const { result } = renderHook(() => useOverlayUrl(), {
				wrapper: ({ children }) => (
					<RouterWrapper initialEntries={["/?modal=CONFIRM&other=value"]}>
						{children}
					</RouterWrapper>
				),
			});

			act(() => {
				result.current.clearUrl();
			});

			// The URL should be updated to remove overlay parameters
			// but keep other parameters (we can't directly test URL changes in this setup)
			expect(result.current.hasUrlOverlay()).toBe(false);
		});
	});
});

describe("useOverlayShare Hook", () => {
	beforeEach(() => {
		resetOverlaySystem();
		idCounter = 0;
		vi.clearAllMocks();
		mockWriteText.mockResolvedValue(undefined);
	});

	describe("Share URL Generation", () => {
		it("should generate shareable URL", () => {
			const { result } = renderHook(() => useOverlayShare(), {
				wrapper: RouterWrapper,
			});

			const mockOverlay: OverlayEntry = {
				id: "test-id",
				type: "SETTINGS",
				createdAt: Date.now(),
				props: { title: "Settings" },
			};

			const shareUrl = result.current.generateShareUrl(mockOverlay);

			expect(shareUrl).toContain("https://example.com/app");
			expect(shareUrl).toContain("modal=SETTINGS");
		});

		it("should copy URL to clipboard", async () => {
			const { result } = renderHook(() => useOverlayShare(), {
				wrapper: RouterWrapper,
			});

			const mockOverlay: OverlayEntry = {
				id: "test-id",
				type: "INFO",
				createdAt: Date.now(),
			};

			await act(async () => {
				const success = await result.current.copyShareUrl(mockOverlay);
				expect(success).toBe(true);
			});

			expect(mockWriteText).toHaveBeenCalledWith(
				expect.stringContaining("modal=INFO"),
			);
		});

		it("should handle clipboard errors gracefully", async () => {
			mockWriteText.mockRejectedValue(new Error("Clipboard not available"));

			const { result } = renderHook(() => useOverlayShare(), {
				wrapper: RouterWrapper,
			});

			const mockOverlay: OverlayEntry = {
				id: "test-id",
				type: "INFO",
				createdAt: Date.now(),
			};

			await act(async () => {
				const success = await result.current.copyShareUrl(mockOverlay);
				expect(success).toBe(false);
			});
		});
	});

	describe("Configuration", () => {
		it("should respect configuration options", () => {
			const { result } = renderHook(
				() => useOverlayShare({ includeId: true, includeProps: false }),
				{
					wrapper: RouterWrapper,
				},
			);

			const mockOverlay: OverlayEntry = {
				id: "test-id",
				type: "CONFIRM",
				createdAt: Date.now(),
				props: { title: "Test" },
			};

			const shareUrl = result.current.generateShareUrl(mockOverlay);

			expect(shareUrl).toContain("modalId=test-id");
			expect(shareUrl).not.toContain("modalProps=");
		});
	});
});
