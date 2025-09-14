import { renderHook } from "@testing-library/react";
import { vi } from "vitest";
import { useMediaQuery } from "./useMediaQuery";

// Mock window.matchMedia
const mockMatchMedia = vi.fn();

beforeAll(() => {
	Object.defineProperty(window, "matchMedia", {
		writable: true,
		value: mockMatchMedia,
	});
});

describe("useMediaQuery", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("returns false when media query does not match", () => {
		const mockMediaQueryList = {
			matches: false,
			addEventListener: vi.fn(),
			removeEventListener: vi.fn(),
		};

		mockMatchMedia.mockReturnValue(mockMediaQueryList);

		const { result } = renderHook(() => useMediaQuery("(max-width: 768px)"));

		expect(result.current).toBe(false);
		expect(mockMatchMedia).toHaveBeenCalledWith("(max-width: 768px)");
	});

	it("returns true when media query matches", () => {
		const mockMediaQueryList = {
			matches: true,
			addEventListener: vi.fn(),
			removeEventListener: vi.fn(),
		};

		mockMatchMedia.mockReturnValue(mockMediaQueryList);

		const { result } = renderHook(() => useMediaQuery("(max-width: 768px)"));

		expect(result.current).toBe(true);
		expect(mockMatchMedia).toHaveBeenCalledWith("(max-width: 768px)");
	});

	it("updates when media query match changes", () => {
		const mockMediaQueryList = {
			matches: false,
			addEventListener: vi.fn(),
			removeEventListener: vi.fn(),
		};

		mockMatchMedia.mockReturnValue(mockMediaQueryList);

		const { result, rerender } = renderHook(() =>
			useMediaQuery("(max-width: 768px)")
		);

		expect(result.current).toBe(false);

		// Simulate media query change
		const changeHandler = mockMediaQueryList.addEventListener.mock.calls[0][1];
		changeHandler({ matches: true });

		rerender();

		expect(result.current).toBe(true);
	});

	it("cleans up event listener on unmount", () => {
		const mockMediaQueryList = {
			matches: false,
			addEventListener: vi.fn(),
			removeEventListener: vi.fn(),
		};

		mockMatchMedia.mockReturnValue(mockMediaQueryList);

		const { unmount } = renderHook(() => useMediaQuery("(max-width: 768px)"));

		expect(mockMediaQueryList.addEventListener).toHaveBeenCalledWith(
			"change",
			expect.any(Function)
		);

		unmount();

		expect(mockMediaQueryList.removeEventListener).toHaveBeenCalledWith(
			"change",
			expect.any(Function)
		);
	});

	it("handles server-side rendering gracefully", () => {
		// Temporarily remove window
		const originalWindow = global.window;
		// @ts-expect-error - Testing SSR behavior
		delete global.window;

		const { result } = renderHook(() => useMediaQuery("(max-width: 768px)"));

		expect(result.current).toBe(false);

		// Restore window
		global.window = originalWindow;
	});
});
