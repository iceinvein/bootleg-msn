import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { TauriIntegration, TauriStyles } from "./TauriIntegration";

// Mock Tauri hooks
vi.mock("@/hooks/useTauri", () => ({
	useTauri: vi.fn(() => ({
		isTauri: false,
		platform: "web",
		isReady: true,
		api: {
			createChatWindow: vi.fn(),
			closeChatWindow: vi.fn(),
			updateUnreadCount: vi.fn(),
			minimizeToTray: vi.fn(),
			restoreFromTray: vi.fn(),
			saveWindowState: vi.fn(),
			loadWindowState: vi.fn(),
			handleDeepLinks: vi.fn(),
		},
		events: {
			onWindowClose: vi.fn(),
			onWindowFocus: vi.fn(),
			onWindowBlur: vi.fn(),
			onDeepLink: vi.fn(),
		},
		windowManager: {
			getCurrentWindowConfig: vi.fn(),
			saveCurrentWindowState: vi.fn(),
			restoreWindowState: vi.fn(),
		},
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

// Import the mocked module to get access to the mock functions
import { useTauri } from "@/hooks/useTauri";

const mockUseTauri = vi.mocked(useTauri);

describe("TauriIntegration", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		// Reset mock to default state
		mockUseTauri.mockReturnValue({
			isTauri: false,
			platform: "web",
			isReady: true,
			api: {
				createChatWindow: vi.fn(),
				closeChatWindow: vi.fn(),
				updateUnreadCount: vi.fn(),
				minimizeToTray: vi.fn(),
				restoreFromTray: vi.fn(),
				saveWindowState: vi.fn(),
				loadWindowState: vi.fn(),
				handleDeepLinks: vi.fn(),
			},
			events: {
				onWindowClose: vi.fn(),
				onWindowFocus: vi.fn(),
				onWindowBlur: vi.fn(),
				onDeepLink: vi.fn(),
			},
			windowManager: {
				getCurrentWindowConfig: vi.fn(),
				saveCurrentWindowState: vi.fn(),
				restoreWindowState: vi.fn(),
			},
		});
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
		mockUseTauri.mockReturnValue({
			isTauri: true,
			platform: "windows",
			isReady: true,
			api: {
				createChatWindow: vi.fn(),
				closeChatWindow: vi.fn(),
				updateUnreadCount: vi.fn(),
				minimizeToTray: vi.fn(),
				restoreFromTray: vi.fn(),
				saveWindowState: vi.fn(),
				loadWindowState: vi.fn(),
				handleDeepLinks: vi.fn(),
			},
			events: {
				onWindowClose: vi.fn(),
				onWindowFocus: vi.fn(),
				onWindowBlur: vi.fn(),
				onDeepLink: vi.fn(),
			},
			windowManager: {
				getCurrentWindowConfig: vi.fn(),
				saveCurrentWindowState: vi.fn(),
				restoreWindowState: vi.fn(),
			},
		});

		const { container } = render(<TauriStyles />);

		expect(container.querySelector("style")).toBeInTheDocument();
	});
});
