import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	$hasOpenOverlays,
	$overlayCount,
	$overlayStack,
	$overlayState,
	$topOverlay,
	overlayActions,
	resetOverlaySystem,
	updateOverlayConfig,
} from "../overlays";

// Mock nanoid to have predictable but unique IDs in tests
let idCounter = 0;
vi.mock("nanoid", () => ({
	nanoid: vi.fn(() => `test-id-${++idCounter}`),
}));

describe("Overlay Store", () => {
	beforeEach(() => {
		// Reset the overlay system before each test
		resetOverlaySystem();
		// Reset the ID counter
		idCounter = 0;
		vi.clearAllMocks();
	});

	describe("Initial State", () => {
		it("should have empty stack initially", () => {
			const state = $overlayState.get();
			expect(state.stack).toEqual([]);
		});

		it("should have default configuration", () => {
			const state = $overlayState.get();
			expect(state.config).toEqual({
				maxStack: 5,
				defaultAnimation: "scale",
				defaultGlass: false,
				defaultClosable: true,
			});
		});

		it("should have correct computed values for empty state", () => {
			expect($overlayStack.get()).toEqual([]);
			expect($hasOpenOverlays.get()).toBe(false);
			expect($topOverlay.get()).toBe(null);
			expect($overlayCount.get()).toBe(0);
		});
	});

	describe("Opening Overlays", () => {
		it("should open a new overlay", () => {
			const id = overlayActions.open({
				type: "CONFIRM",
				props: { message: "Test message" },
			});

			expect(id).toBe("overlay_test-id-1");

			const stack = $overlayStack.get();
			expect(stack).toHaveLength(1);
			expect(stack[0]).toMatchObject({
				id: "overlay_test-id-1",
				type: "CONFIRM",
				props: { message: "Test message" },
				persistInUrl: false,
			});
			expect(stack[0].createdAt).toBeTypeOf("number");
		});

		it("should update computed values when opening overlay", () => {
			overlayActions.open({ type: "INFO" });

			expect($hasOpenOverlays.get()).toBe(true);
			expect($overlayCount.get()).toBe(1);
			expect($topOverlay.get()?.type).toBe("INFO");
		});

		it("should handle multiple overlays", () => {
			overlayActions.open({ type: "CONFIRM" });
			overlayActions.open({ type: "INFO" });
			overlayActions.open({ type: "SHEET" });

			const stack = $overlayStack.get();
			expect(stack).toHaveLength(3);
			expect(stack.map((o) => o.type)).toEqual(["CONFIRM", "INFO", "SHEET"]);
			expect($topOverlay.get()?.type).toBe("SHEET");
		});

		it("should respect max stack size", () => {
			// Set max stack to 2
			updateOverlayConfig({ maxStack: 2 });

			overlayActions.open({ type: "CONFIRM" });
			overlayActions.open({ type: "INFO" });
			overlayActions.open({ type: "SHEET" }); // Should remove first overlay

			const stack = $overlayStack.get();
			expect(stack).toHaveLength(2);
			expect(stack.map((o) => o.type)).toEqual(["INFO", "SHEET"]);
		});

		it("should set persistInUrl to false when specified", () => {
			overlayActions.open({
				type: "CONFIRM",
				persistInUrl: false,
			});

			const stack = $overlayStack.get();
			expect(stack[0].persistInUrl).toBe(false);
		});
	});

	describe("Closing Overlays", () => {
		beforeEach(() => {
			// Set up some overlays for closing tests
			overlayActions.open({ type: "CONFIRM" });
			overlayActions.open({ type: "INFO" });
			overlayActions.open({ type: "SHEET" });
		});

		it("should close overlay by ID", () => {
			const stack = $overlayStack.get();
			const middleId = stack[1].id;

			overlayActions.close(middleId);

			const newStack = $overlayStack.get();
			expect(newStack).toHaveLength(2);
			expect(newStack.map((o) => o.type)).toEqual(["CONFIRM", "SHEET"]);
		});

		it("should close top overlay", () => {
			overlayActions.closeTop();

			const stack = $overlayStack.get();
			expect(stack).toHaveLength(2);
			expect(stack.map((o) => o.type)).toEqual(["CONFIRM", "INFO"]);
			expect($topOverlay.get()?.type).toBe("INFO");
		});

		it("should handle closeTop when no overlays exist", () => {
			overlayActions.closeAll();
			overlayActions.closeTop(); // Should not throw

			expect($overlayStack.get()).toHaveLength(0);
		});

		it("should close all overlays", () => {
			overlayActions.closeAll();

			expect($overlayStack.get()).toHaveLength(0);
			expect($hasOpenOverlays.get()).toBe(false);
			expect($topOverlay.get()).toBe(null);
			expect($overlayCount.get()).toBe(0);
		});

		it("should handle closing non-existent overlay", () => {
			const initialCount = $overlayCount.get();
			overlayActions.close("non-existent-id");

			expect($overlayCount.get()).toBe(initialCount);
		});
	});

	describe("Replacing Overlays", () => {
		it("should replace top overlay", () => {
			overlayActions.open({ type: "CONFIRM" });
			overlayActions.open({ type: "INFO" });

			const newId = overlayActions.replaceTop({ type: "SHEET" });

			const stack = $overlayStack.get();
			expect(stack).toHaveLength(2);
			expect(stack.map((o) => o.type)).toEqual(["CONFIRM", "SHEET"]);
			expect($topOverlay.get()?.id).toBe(newId);
		});

		it("should add overlay when replacing empty stack", () => {
			const id = overlayActions.replaceTop({ type: "INFO" });

			const stack = $overlayStack.get();
			expect(stack).toHaveLength(1);
			expect(stack[0].type).toBe("INFO");
			expect(stack[0].id).toBe(id);
		});
	});

	describe("Updating Props", () => {
		it("should update overlay props", () => {
			const id = overlayActions.open({
				type: "CONFIRM",
				props: { message: "Original message" },
			});

			overlayActions.updateProps(id, {
				message: "Updated message",
				title: "New title",
			});

			const overlay = overlayActions.getById(id);
			expect(overlay?.props).toMatchObject({
				message: "Updated message",
				title: "New title",
			});
		});

		it("should handle updating non-existent overlay", () => {
			overlayActions.updateProps("non-existent", { title: "Test" });
			// Should not throw or affect existing overlays
			expect($overlayCount.get()).toBe(0);
		});
	});

	describe("Utility Methods", () => {
		it("should check if overlay exists", () => {
			const id = overlayActions.open({ type: "INFO" });

			expect(overlayActions.exists(id)).toBe(true);
			expect(overlayActions.exists("non-existent")).toBe(false);
		});

		it("should get overlay by ID", () => {
			const id = overlayActions.open({
				type: "CONFIRM",
				props: { message: "Test" },
			});

			const overlay = overlayActions.getById(id);
			expect(overlay).toBeDefined();
			expect(overlay?.type).toBe("CONFIRM");
			expect(overlay?.props).toMatchObject({ message: "Test" });

			expect(overlayActions.getById("non-existent")).toBeUndefined();
		});
	});

	describe("Configuration", () => {
		it("should update configuration", () => {
			updateOverlayConfig({
				maxStack: 10,
				defaultAnimation: "fade",
				defaultGlass: true,
			});

			const config = $overlayState.get().config;
			expect(config).toMatchObject({
				maxStack: 10,
				defaultAnimation: "fade",
				defaultGlass: true,
				defaultClosable: true, // Should preserve existing values
			});
		});
	});

	describe("Reset System", () => {
		it("should reset to initial state", () => {
			// Add some overlays and change config
			overlayActions.open({ type: "CONFIRM" });
			overlayActions.open({ type: "INFO" });
			updateOverlayConfig({ maxStack: 10 });

			resetOverlaySystem();

			const state = $overlayState.get();
			expect(state.stack).toEqual([]);
			expect(state.config).toEqual({
				maxStack: 5,
				defaultAnimation: "scale",
				defaultGlass: false,
				defaultClosable: true,
			});
		});
	});
});
