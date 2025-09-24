/**
 * @vitest-environment jsdom
 */

import { render, screen, waitFor } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { OverlayHost, useOverlayHost } from "../OverlayHost";
import { useOverlays } from "@/hooks/useOverlays";

// Mock the overlay store
vi.mock("@nanostores/react", () => ({
	useStore: vi.fn(),
}));

// Mock the overlay hooks
vi.mock("@/hooks/useOverlays", () => ({
	useOverlays: vi.fn(),
}));

// Mock framer-motion
vi.mock("framer-motion", () => ({
	AnimatePresence: ({ children }: { children: React.ReactNode }) => <div data-testid="animate-presence">{children}</div>,
	motion: {
		div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
	},
}));

// Mock the OverlayRenderer component
vi.mock("../OverlayRenderer", () => ({
	OverlayRenderer: ({ entry, zIndex, isTopmost }: any) => (
		<div
			data-testid={`overlay-${entry.id}`}
			data-overlay-type={entry.type}
			data-z-index={zIndex}
			data-topmost={isTopmost}
		>
			{entry.type} Overlay - {entry.id}
		</div>
	),
}));

const mockUseStore = vi.mocked(vi.fn());
const mockUseOverlays = vi.mocked(useOverlays);

// Import useStore after mocking
const { useStore } = await import("@nanostores/react");
vi.mocked(useStore).mockImplementation(mockUseStore);

describe("OverlayHost", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockUseStore.mockReturnValue([]);
		mockUseOverlays.mockReturnValue({
			open: vi.fn(),
			close: vi.fn(),
			closeAll: vi.fn(),
			closeTop: vi.fn(),
			replaceTop: vi.fn(),
			hasOpen: false,
			count: 0,
			topOverlay: null,
			state: { stack: [], config: {} },
		});
	});

	it("renders without overlays", () => {
		render(<OverlayHost />);

		const host = screen.getByTestId("animate-presence");
		expect(host).toBeInTheDocument();
		expect(host).toBeEmptyDOMElement();
	});

	it("renders single overlay", () => {
		const mockOverlay = {
			id: "test-overlay-1",
			type: "CONFIRM" as const,
			props: { message: "Test message" },
			createdAt: Date.now(),
		};

		mockUseStore.mockReturnValue([mockOverlay]);

		render(<OverlayHost />);

		expect(screen.getByTestId("overlay-test-overlay-1")).toBeInTheDocument();
		expect(screen.getByTestId("overlay-test-overlay-1")).toHaveAttribute("data-overlay-type", "CONFIRM");
		expect(screen.getByTestId("overlay-test-overlay-1")).toHaveAttribute("data-z-index", "1000");
		expect(screen.getByTestId("overlay-test-overlay-1")).toHaveAttribute("data-topmost", "true");
	});

	it("renders multiple overlays with correct z-index stacking", () => {
		const mockOverlays = [
			{
				id: "overlay-1",
				type: "CONFIRM" as const,
				props: { message: "First overlay" },
				createdAt: Date.now() - 1000,
			},
			{
				id: "overlay-2",
				type: "INFO" as const,
				props: { content: "Second overlay" },
				createdAt: Date.now(),
			},
		];

		mockUseStore.mockReturnValue(mockOverlays);

		render(<OverlayHost />);

		const firstOverlay = screen.getByTestId("overlay-overlay-1");
		const secondOverlay = screen.getByTestId("overlay-overlay-2");

		expect(firstOverlay).toBeInTheDocument();
		expect(secondOverlay).toBeInTheDocument();

		// Check z-index stacking
		expect(firstOverlay).toHaveAttribute("data-z-index", "1000");
		expect(secondOverlay).toHaveAttribute("data-z-index", "1001");

		// Check topmost status
		expect(firstOverlay).toHaveAttribute("data-topmost", "false");
		expect(secondOverlay).toHaveAttribute("data-topmost", "true");
	});

	it("applies custom configuration", () => {
		const mockOverlay = {
			id: "test-overlay",
			type: "CONFIRM" as const,
			props: { message: "Test" },
			createdAt: Date.now(),
		};

		mockUseStore.mockReturnValue([mockOverlay]);

		render(
			<OverlayHost
				config={{
					debug: true,
					zIndexBase: 2000,
					usePortal: false,
				}}
				className="custom-overlay-host"
			/>
		);

		const overlay = screen.getByTestId("overlay-test-overlay");
		expect(overlay).toHaveAttribute("data-z-index", "2000");

		// Check if host has custom class
		const host = document.querySelector(".custom-overlay-host");
		expect(host).toBeInTheDocument();
	});

	it("updates overlay count data attribute", () => {
		const mockOverlays = [
			{
				id: "overlay-1",
				type: "CONFIRM" as const,
				props: {},
				createdAt: Date.now(),
			},
			{
				id: "overlay-2",
				type: "INFO" as const,
				props: {},
				createdAt: Date.now(),
			},
		];

		mockUseStore.mockReturnValue(mockOverlays);

		render(<OverlayHost />);

		const host = document.querySelector('[data-overlay-host="true"]');
		expect(host).toHaveAttribute("data-overlay-count", "2");
	});
});

describe("useOverlayHost", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("returns correct overlay information", () => {
		const mockOverlays = [
			{
				id: "overlay-1",
				type: "CONFIRM" as const,
				props: {},
				createdAt: Date.now() - 1000,
			},
			{
				id: "overlay-2",
				type: "INFO" as const,
				props: {},
				createdAt: Date.now(),
			},
		];

		mockUseStore.mockReturnValue(mockOverlays);

		function TestComponent() {
			const { overlayCount, hasOverlays, topOverlay, overlayStack } = useOverlayHost();

			return (
				<div>
					<div data-testid="overlay-count">{overlayCount}</div>
					<div data-testid="has-overlays">{hasOverlays.toString()}</div>
					<div data-testid="top-overlay">{topOverlay?.id || "none"}</div>
					<div data-testid="stack-length">{overlayStack.length}</div>
				</div>
			);
		}

		render(<TestComponent />);

		expect(screen.getByTestId("overlay-count")).toHaveTextContent("2");
		expect(screen.getByTestId("has-overlays")).toHaveTextContent("true");
		expect(screen.getByTestId("top-overlay")).toHaveTextContent("overlay-2");
		expect(screen.getByTestId("stack-length")).toHaveTextContent("2");
	});

	it("handles empty overlay stack", () => {
		mockUseStore.mockReturnValue([]);

		function TestComponent() {
			const { overlayCount, hasOverlays, topOverlay } = useOverlayHost();

			return (
				<div>
					<div data-testid="overlay-count">{overlayCount}</div>
					<div data-testid="has-overlays">{hasOverlays.toString()}</div>
					<div data-testid="top-overlay">{topOverlay?.id || "none"}</div>
				</div>
			);
		}

		render(<TestComponent />);

		expect(screen.getByTestId("overlay-count")).toHaveTextContent("0");
		expect(screen.getByTestId("has-overlays")).toHaveTextContent("false");
		expect(screen.getByTestId("top-overlay")).toHaveTextContent("none");
	});
});
