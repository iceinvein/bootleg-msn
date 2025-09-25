import { act, renderHook, waitFor } from "@testing-library/react";
import { useEffect } from "react";
import { MemoryRouter, useSearchParams } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useOverlays } from "@/hooks/useOverlays";
import { resetOverlaySystem } from "@/stores/overlays";
import { OVERLAY_URL_PARAMS } from "@/utils/overlayUrl";
import {
	useBidirectionalSync,
	useOverlayBatch,
	useOverlayBroadcast,
	useOverlayPersistence,
} from "../useOverlaySync";

// Mock nanoid for predictable IDs
let idCounter = 0;
vi.mock("nanoid", () => ({
	nanoid: vi.fn(() => `test-id-${++idCounter}`),
}));

// Mock BroadcastChannel
const mockBroadcastChannel = {
	postMessage: vi.fn(),
	addEventListener: vi.fn(),
	removeEventListener: vi.fn(),
	close: vi.fn(),
};

// @ts-expect-error - Mocking global
global.BroadcastChannel = vi.fn(() => mockBroadcastChannel);

// Mock localStorage
const mockLocalStorage = {
	getItem: vi.fn(),
	setItem: vi.fn(),
	removeItem: vi.fn(),
};
Object.defineProperty(window, "localStorage", {
	value: mockLocalStorage,
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

describe("useOverlaySync Hooks", () => {
	beforeEach(() => {
		resetOverlaySystem();
		idCounter = 0;
		vi.clearAllMocks();
		mockLocalStorage.getItem.mockReturnValue(null);
	});

	afterEach(() => {
		vi.clearAllTimers();
	});

	describe("useBidirectionalSync", () => {
		it("should detect synchronization conflicts", async () => {
			const { result } = renderHook(
				() => useBidirectionalSync({ conflictResolution: "ignore" }),
				{
					wrapper: ({ children }) => (
						<RouterWrapper initialEntries={["/?modal=INFO"]}>
							{children}
						</RouterWrapper>
					),
				},
			);

			await waitFor(() => {
				expect(result.current.syncState.hasUrlOverlay).toBe(true);
			});

			// Simulate overlay state change that conflicts with URL
			act(() => {
				result.current.detectConflicts();
			});

			expect(result.current.syncState.inSync).toBe(true); // No conflicts initially
		});

		it("should resolve conflicts with url-wins strategy", async () => {
			const { result } = renderHook(
				() => useBidirectionalSync({ conflictResolution: "url-wins" }),
				{
					wrapper: ({ children }) => (
						<RouterWrapper initialEntries={["/?modal=CONFIRM"]}>
							{children}
						</RouterWrapper>
					),
				},
			);

			await waitFor(() => {
				expect(result.current.syncState.hasUrlOverlay).toBe(true);
			});

			// Should automatically resolve conflicts
			expect(result.current.conflicts.length).toBe(0);
		});

		it("should prevent infinite sync loops", async () => {
			const { result } = renderHook(
				() => useBidirectionalSync({ preventLoops: true }),
				{ wrapper: RouterWrapper },
			);

			// Multiple rapid sync attempts should be prevented
			act(() => {
				result.current.resolvePending();
				result.current.resolvePending();
				result.current.resolvePending();
			});

			expect(result.current.isSyncing).toBe(false);
		});

		it("does not auto-close immediately when opened while URL is empty", async () => {
			// Harness component mounts bidirectional sync and opens an overlay on mount
			function Harness({ persistInUrl = true }: { persistInUrl?: boolean }) {
				useBidirectionalSync({ debounceMs: 50, preventLoops: true });
				const { open, topOverlay } = useOverlays();
				const [search] = useSearchParams();
				useEffect(() => {
					open({ type: "INFO", props: { title: "Test" }, persistInUrl });
				}, [open, persistInUrl]);
				const hasModal = search.has(OVERLAY_URL_PARAMS.MODAL);
				return <div data-open={!!topOverlay} data-has-url={hasModal} />;
			}

			const { container } = require("@testing-library/react").render(
				<RouterWrapper>
					<Harness />
				</RouterWrapper>,
			);

			// Wait for overlay to open
			await waitFor(() => {
				expect(container.querySelector("div[data-open='true']")).toBeTruthy();
			});

			// After debounce, it should still be open (no auto-close due to empty URL)
			await new Promise((r) => setTimeout(r, 120));
			expect(container.querySelector("div[data-open='true']")).toBeTruthy();
		});

		it("respects persistInUrl=false (does not write modal param and does not close)", async () => {
			function Harness() {
				useBidirectionalSync({ debounceMs: 50, preventLoops: true });
				const { open, topOverlay } = useOverlays();
				const [search] = useSearchParams();
				useEffect(() => {
					open({
						type: "INFO",
						props: { title: "Transient" },
						persistInUrl: false,
					});
				}, [open]);
				const hasModal = search.has(OVERLAY_URL_PARAMS.MODAL);
				return <div data-open={!!topOverlay} data-has-url={hasModal} />;
			}

			const { container } = require("@testing-library/react").render(
				<RouterWrapper>
					<Harness />
				</RouterWrapper>,
			);

			// Wait for overlay to open
			await waitFor(() => {
				expect(container.querySelector("div[data-open='true']")).toBeTruthy();
			});

			// After debounce, URL should still not have modal and overlay remains open
			await new Promise((r) => setTimeout(r, 120));
			const el = container.querySelector("div[data-open]") as HTMLElement;
			expect(el?.getAttribute("data-open")).toBe("true");
			expect(el?.getAttribute("data-has-url")).toBe("false");
		});

		it("defaults: INFO does not persist in URL", async () => {
			function Harness() {
				useBidirectionalSync({ debounceMs: 50, preventLoops: true });
				const { open, topOverlay } = useOverlays();
				const [search] = useSearchParams();
				useEffect(() => {
					open({ type: "INFO", props: { title: "Info" } }); // no persistInUrl specified
				}, [open]);
				const hasModal = search.has(OVERLAY_URL_PARAMS.MODAL);
				return <div data-open={!!topOverlay} data-has-url={hasModal} />;
			}

			const { container } = require("@testing-library/react").render(
				<RouterWrapper>
					<Harness />
				</RouterWrapper>,
			);

			await waitFor(() => {
				expect(container.querySelector("div[data-open='true']")).toBeTruthy();
			});

			await new Promise((r) => setTimeout(r, 120));
			const el = container.querySelector("div[data-open]") as HTMLElement;
			expect(el?.getAttribute("data-open")).toBe("true");
			expect(el?.getAttribute("data-has-url")).toBe("false");
		});

		it("defaults: SETTINGS persists in URL", async () => {
			function Harness() {
				useBidirectionalSync({ debounceMs: 50, preventLoops: true });
				const { open, topOverlay } = useOverlays();
				const [search] = useSearchParams();
				useEffect(() => {
					open({ type: "SETTINGS", props: { title: "Settings" } });
				}, [open]);
				const hasModal = search.has(OVERLAY_URL_PARAMS.MODAL);
				return <div data-open={!!topOverlay} data-has-url={hasModal} />;
			}

			const { container } = require("@testing-library/react").render(
				<RouterWrapper>
					<Harness />
				</RouterWrapper>,
			);

			await waitFor(() => {
				expect(container.querySelector("div[data-open='true']")).toBeTruthy();
			});

			await new Promise((r) => setTimeout(r, 120));
			const el = container.querySelector("div[data-open]") as HTMLElement;
			expect(el?.getAttribute("data-open")).toBe("true");
			expect(el?.getAttribute("data-has-url")).toBe("true");
		});
	});

	describe("useOverlayBatch", () => {
		it("should open multiple overlays in sequence", async () => {
			const { result } = renderHook(() => useOverlayBatch(), {
				wrapper: RouterWrapper,
			});

			const overlays = [
				{ type: "INFO" as const, props: { title: "First" } },
				{ type: "CONFIRM" as const, props: { message: "Second" } },
			];

			await act(async () => {
				const opened = await result.current.batchOpen(overlays);
				expect(opened).toHaveLength(2);
				expect(opened).toEqual(
					expect.arrayContaining([
						expect.stringMatching(/^overlay_test-id-\d+$/),
						expect.stringMatching(/^overlay_test-id-\d+$/),
					]),
				);
			});
		});

		it("should close multiple overlays by type", async () => {
			const { result } = renderHook(() => useOverlayBatch(), {
				wrapper: RouterWrapper,
			});

			// First open some overlays
			const overlays = [
				{ type: "INFO" as const, props: { title: "First" } },
				{ type: "CONFIRM" as const, props: { message: "Second" } },
			];

			await act(async () => {
				await result.current.batchOpen(overlays);
			});

			// Then close them by type
			act(() => {
				const closed = result.current.batchCloseByType(["INFO", "CONFIRM"]);
				expect(closed).toHaveLength(2);
			});
		});

		it("should replace all overlays with new ones", async () => {
			const { result } = renderHook(() => useOverlayBatch(), {
				wrapper: RouterWrapper,
			});

			// First open some overlays
			const initialOverlays = [
				{ type: "INFO" as const, props: { title: "Initial" } },
			];

			await act(async () => {
				await result.current.batchOpen(initialOverlays);
			});

			// Then replace with new ones
			const newOverlays = [
				{ type: "CONFIRM" as const, props: { message: "New" } },
				{ type: "INFO" as const, props: { title: "Second" } },
			];

			await act(async () => {
				const replaced = await result.current.batchReplace(newOverlays);
				expect(replaced).toHaveLength(2);
				expect(replaced).toEqual(
					expect.arrayContaining([
						expect.stringMatching(/^overlay_test-id-\d+$/),
						expect.stringMatching(/^overlay_test-id-\d+$/),
					]),
				);
			});
		});
	});

	describe("useOverlayPersistence", () => {
		it("should save overlay state to localStorage", async () => {
			const { result: overlayResult } = renderHook(() => useOverlayBatch(), {
				wrapper: RouterWrapper,
			});

			// First open an overlay
			await act(async () => {
				await overlayResult.current.batchOpen([
					{ type: "INFO", props: { title: "Test" } },
				]);
			});

			const { result: persistenceResult } = renderHook(
				() => useOverlayPersistence({ storageKey: "test-overlay" }),
				{ wrapper: RouterWrapper },
			);

			// Wait for the effect to run
			await waitFor(() => {
				expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
					"test-overlay",
					expect.any(String),
				);
			});

			// Verify the hook is working
			expect(persistenceResult.current.saveState).toBeDefined();
		});

		it("should restore overlay state from localStorage", async () => {
			const savedState = JSON.stringify({
				overlay: { type: "INFO", props: { title: "Restored" } },
				timestamp: Date.now(),
				url: "https://example.com/app",
			});

			mockLocalStorage.getItem.mockReturnValue(savedState);

			const { result } = renderHook(
				() => useOverlayPersistence({ autoRestore: false }),
				{ wrapper: RouterWrapper },
			);

			await act(async () => {
				await result.current.restoreFromUrl();
			});

			expect(mockLocalStorage.getItem).toHaveBeenCalled();
		});

		it("should clear persisted state", () => {
			const { result } = renderHook(
				() => useOverlayPersistence({ storageKey: "test-overlay" }),
				{ wrapper: RouterWrapper },
			);

			act(() => {
				result.current.clearPersistedState();
			});

			expect(mockLocalStorage.removeItem).toHaveBeenCalledWith("test-overlay");
		});

		it("should not restore expired state", async () => {
			const expiredState = JSON.stringify({
				overlay: { type: "INFO", props: { title: "Expired" } },
				timestamp: Date.now() - 2 * 60 * 60 * 1000, // 2 hours ago
				url: "https://example.com/app",
			});

			mockLocalStorage.getItem.mockReturnValue(expiredState);

			const { result } = renderHook(
				() => useOverlayPersistence({ autoRestore: false }),
				{ wrapper: RouterWrapper },
			);

			await act(async () => {
				const restored = await result.current.restoreFromUrl();
				expect(restored).toBeNull();
			});
		});
	});

	describe("useOverlayBroadcast", () => {
		it("should initialize broadcast channel", () => {
			renderHook(() => useOverlayBroadcast({ channelName: "test-channel" }), {
				wrapper: RouterWrapper,
			});

			expect(global.BroadcastChannel).toHaveBeenCalledWith("test-channel");
		});

		it("should broadcast overlay changes", async () => {
			const { result } = renderHook(() => useOverlayBroadcast(), {
				wrapper: RouterWrapper,
			});

			expect(result.current.isConnected).toBe(true);
			expect(mockBroadcastChannel.postMessage).toHaveBeenCalledWith({
				type: "tab-connected",
			});
		});

		it("should handle incoming broadcast messages", () => {
			renderHook(() => useOverlayBroadcast(), {
				wrapper: RouterWrapper,
			});

			expect(mockBroadcastChannel.addEventListener).toHaveBeenCalledWith(
				"message",
				expect.any(Function),
			);
		});

		it("should cleanup on unmount", () => {
			const { unmount } = renderHook(() => useOverlayBroadcast(), {
				wrapper: RouterWrapper,
			});

			unmount();

			expect(mockBroadcastChannel.postMessage).toHaveBeenCalledWith({
				type: "tab-disconnected",
			});
			expect(mockBroadcastChannel.close).toHaveBeenCalled();
		});
	});
});
