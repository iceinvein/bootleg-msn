import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
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

// Helper function to render components with router context
const renderWithRouter = (
	component: React.ReactElement,
	initialEntries: string[] = ["/"],
) => {
	return render(
		<MemoryRouter initialEntries={initialEntries}>{component}</MemoryRouter>,
	);
};

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
		renderWithRouter(
			<TauriIntegration>
				<div data-testid="child-content">Test Content</div>
			</TauriIntegration>,
		);

		expect(screen.getByTestId("child-content")).toBeInTheDocument();
		expect(screen.getByText("Test Content")).toBeInTheDocument();
	});

	it("should not add platform classes when not in Tauri", () => {
		renderWithRouter(
			<TauriIntegration>
				<div>Test</div>
			</TauriIntegration>,
		);

		expect(document.body.classList.contains("tauri-app")).toBe(false);
		expect(document.body.classList.contains("platform-web")).toBe(false);
	});

	it("should add platform classes when in Tauri", () => {
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

		renderWithRouter(
			<TauriIntegration>
				<div>Test</div>
			</TauriIntegration>,
		);

		expect(document.body.classList.contains("tauri-app")).toBe(true);
		expect(document.body.classList.contains("platform-windows")).toBe(true);
	});

	it("should handle different platforms correctly", () => {
		const platforms = ["windows", "macos", "linux"] as const;

		platforms.forEach((platform) => {
			// Clear previous classes
			document.body.className = "";

			mockUseTauri.mockReturnValue({
				isTauri: true,
				platform,
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

			const { unmount } = renderWithRouter(
				<TauriIntegration>
					<div>Test</div>
				</TauriIntegration>,
			);

			expect(document.body.classList.contains("tauri-app")).toBe(true);
			expect(document.body.classList.contains(`platform-${platform}`)).toBe(
				true,
			);

			unmount();
		});
	});

	it("should clean up classes on unmount", () => {
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

		const { unmount } = renderWithRouter(
			<TauriIntegration>
				<div>Test</div>
			</TauriIntegration>,
		);

		expect(document.body.classList.contains("tauri-app")).toBe(true);
		expect(document.body.classList.contains("platform-windows")).toBe(true);

		unmount();

		expect(document.body.classList.contains("tauri-app")).toBe(false);
		expect(document.body.classList.contains("platform-windows")).toBe(false);
	});
});

describe("TauriStyles", () => {
	it("should not render styles when not in Tauri", () => {
		// Reset mock to web environment
		mockUseTauri.mockReturnValue({
			isTauri: false,
			platform: "web",
			isReady: true,
			api: {},
			events: {},
			windowManager: {},
		});

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

	it("should render different styles for different platforms", () => {
		const platforms = ["windows", "macos", "linux"] as const;

		platforms.forEach((platform) => {
			mockUseTauri.mockReturnValue({
				isTauri: true,
				platform,
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

			const { container, unmount } = render(<TauriStyles />);
			const styleElement = container.querySelector("style");

			expect(styleElement).toBeInTheDocument();
			expect(styleElement?.textContent).toContain("tauri-app");

			unmount();
		});
	});

	it("should include platform-specific styles", () => {
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
		const styleElement = container.querySelector("style");

		expect(styleElement?.textContent).toContain("platform-windows");
	});
});
