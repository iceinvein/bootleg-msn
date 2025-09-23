import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useOverlays, useOverlayState, useOverlayActions } from "../useOverlays";
import { resetOverlaySystem } from "@/stores/overlays";

// Mock nanoid to have predictable but unique IDs in tests
let idCounter = 0;
vi.mock("nanoid", () => ({
	nanoid: vi.fn(() => `test-id-${++idCounter}`),
}));

describe("useOverlays Hook", () => {
	beforeEach(() => {
		resetOverlaySystem();
		// Reset the ID counter
		idCounter = 0;
		vi.clearAllMocks();
	});

	describe("useOverlays", () => {
		it("should return initial state", () => {
			const { result } = renderHook(() => useOverlays());

			expect(result.current.hasOpen).toBe(false);
			expect(result.current.topOverlay).toBe(null);
			expect(result.current.count).toBe(0);
			expect(result.current.state.stack).toEqual([]);
		});

		it("should provide all overlay actions", () => {
			const { result } = renderHook(() => useOverlays());

			expect(typeof result.current.open).toBe("function");
			expect(typeof result.current.close).toBe("function");
			expect(typeof result.current.closeTop).toBe("function");
			expect(typeof result.current.closeAll).toBe("function");
			expect(typeof result.current.replaceTop).toBe("function");
			expect(typeof result.current.updateProps).toBe("function");
			expect(typeof result.current.exists).toBe("function");
			expect(typeof result.current.getById).toBe("function");
		});

		it("should update state when opening overlay", () => {
			const { result } = renderHook(() => useOverlays());

			act(() => {
				result.current.open({
					type: "CONFIRM",
					props: { message: "Test message" },
				});
			});

			expect(result.current.hasOpen).toBe(true);
			expect(result.current.count).toBe(1);
			expect(result.current.topOverlay?.type).toBe("CONFIRM");
			expect(result.current.topOverlay?.props).toMatchObject({
				message: "Test message",
			});
		});

		it("should update state when closing overlay", () => {
			const { result } = renderHook(() => useOverlays());

			let overlayId: string;
			act(() => {
				overlayId = result.current.open({ type: "INFO" });
			});

			expect(result.current.hasOpen).toBe(true);

			act(() => {
				result.current.close(overlayId);
			});

			expect(result.current.hasOpen).toBe(false);
			expect(result.current.count).toBe(0);
			expect(result.current.topOverlay).toBe(null);
		});

		it("should handle multiple overlays", () => {
			const { result } = renderHook(() => useOverlays());

			act(() => {
				result.current.open({ type: "CONFIRM" });
				result.current.open({ type: "INFO" });
				result.current.open({ type: "SHEET" });
			});

			expect(result.current.count).toBe(3);
			expect(result.current.topOverlay?.type).toBe("SHEET");
		});

		it("should close top overlay", () => {
			const { result } = renderHook(() => useOverlays());

			act(() => {
				result.current.open({ type: "CONFIRM" });
				result.current.open({ type: "INFO" });
			});

			expect(result.current.topOverlay?.type).toBe("INFO");

			act(() => {
				result.current.closeTop();
			});

			expect(result.current.count).toBe(1);
			expect(result.current.topOverlay?.type).toBe("CONFIRM");
		});

		it("should close all overlays", () => {
			const { result } = renderHook(() => useOverlays());

			act(() => {
				result.current.open({ type: "CONFIRM" });
				result.current.open({ type: "INFO" });
				result.current.open({ type: "SHEET" });
			});

			expect(result.current.count).toBe(3);

			act(() => {
				result.current.closeAll();
			});

			expect(result.current.count).toBe(0);
			expect(result.current.hasOpen).toBe(false);
		});

		it("should replace top overlay", () => {
			const { result } = renderHook(() => useOverlays());

			act(() => {
				result.current.open({ type: "CONFIRM" });
				result.current.open({ type: "INFO" });
			});

			expect(result.current.count).toBe(2);
			expect(result.current.topOverlay?.type).toBe("INFO");

			act(() => {
				result.current.replaceTop({ type: "SHEET" });
			});

			expect(result.current.count).toBe(2);
			expect(result.current.topOverlay?.type).toBe("SHEET");
		});

		it("should update overlay props", () => {
			const { result } = renderHook(() => useOverlays());

			let overlayId: string;
			act(() => {
				overlayId = result.current.open({
					type: "CONFIRM",
					props: { message: "Original" },
				});
			});

			act(() => {
				result.current.updateProps(overlayId, { message: "Updated" });
			});

			const overlay = result.current.getById(overlayId);
			expect(overlay?.props).toMatchObject({ message: "Updated" });
		});

		it("should check if overlay exists", () => {
			const { result } = renderHook(() => useOverlays());

			let overlayId: string;
			act(() => {
				overlayId = result.current.open({ type: "INFO" });
			});

			expect(result.current.exists(overlayId)).toBe(true);
			expect(result.current.exists("non-existent")).toBe(false);
		});
	});

	describe("useOverlayState", () => {
		it("should return only state values", () => {
			const { result } = renderHook(() => useOverlayState());

			expect(result.current.hasOpen).toBe(false);
			expect(result.current.topOverlay).toBe(null);
			expect(result.current.count).toBe(0);
			expect(result.current.state).toBeDefined();

			// Should not have action methods
			expect("open" in result.current).toBe(false);
			expect("close" in result.current).toBe(false);
		});

		it("should update when state changes", () => {
			const { result: stateResult } = renderHook(() => useOverlayState());
			const { result: actionsResult } = renderHook(() => useOverlayActions());

			expect(stateResult.current.hasOpen).toBe(false);

			act(() => {
				actionsResult.current.open({ type: "INFO" });
			});

			expect(stateResult.current.hasOpen).toBe(true);
			expect(stateResult.current.count).toBe(1);
		});
	});

	describe("useOverlayActions", () => {
		it("should return only action methods", () => {
			const { result } = renderHook(() => useOverlayActions());

			expect(typeof result.current.open).toBe("function");
			expect(typeof result.current.close).toBe("function");
			expect(typeof result.current.closeTop).toBe("function");
			expect(typeof result.current.closeAll).toBe("function");
			expect(typeof result.current.replaceTop).toBe("function");
			expect(typeof result.current.updateProps).toBe("function");
			expect(typeof result.current.exists).toBe("function");
			expect(typeof result.current.getById).toBe("function");

			// Should not have state properties
			expect("hasOpen" in result.current).toBe(false);
			expect("state" in result.current).toBe(false);
		});

		it("should provide stable action references", () => {
			const { result, rerender } = renderHook(() => useOverlayActions());

			const firstOpen = result.current.open;
			const firstClose = result.current.close;

			rerender();

			expect(result.current.open).toBe(firstOpen);
			expect(result.current.close).toBe(firstClose);
		});
	});
});
