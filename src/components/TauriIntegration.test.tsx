import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { TauriIntegration, TauriStyles } from "./TauriIntegration";

// Mock Tauri hooks
vi.mock("@/hooks/useTauri", () => ({
	useTauri: vi.fn(() => ({
		isTauri: false,
		platform: "web",
		isReady: true,
	})),
	useWindowState: vi.fn(() => ({
		saveState: vi.fn(),
		restoreState: vi.fn(),
	})),
	useUnreadCount: vi.fn(() => ({
		updateUnreadCount: vi.fn(),
	})),
	useDeepLinks: vi.fn(() => ({
		handleDeepLink: vi.fn(),
	})),
}));

describe("TauriIntegration", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("should render children", () => {
		render(
			<TauriIntegration>
				<div data-testid="child-content">Test Content</div>
			</TauriIntegration>,
		);

		expect(screen.getByTestId("child-content")).toBeInTheDocument();
		expect(screen.getByText("Test Content")).toBeInTheDocument();
	});

	it("should not add platform classes when not in Tauri", () => {
		render(
			<TauriIntegration>
				<div>Test</div>
			</TauriIntegration>,
		);

		expect(document.body.classList.contains("tauri-app")).toBe(false);
		expect(document.body.classList.contains("platform-web")).toBe(false);
	});
});

describe("TauriStyles", () => {
	it("should not render styles when not in Tauri", () => {
		const { container } = render(<TauriStyles />);

		expect(container.firstChild).toBeNull();
	});

	it("should render styles when in Tauri environment", () => {
		// Mock Tauri environment
		const mockUseTauri = vi.mocked(require("@/hooks/useTauri").useTauri);
		mockUseTauri.mockReturnValue({
			isTauri: true,
			platform: "windows",
			isReady: true,
		});

		const { container } = render(<TauriStyles />);

		expect(container.querySelector("style")).toBeInTheDocument();
	});
});
