/**
 * Advanced tests for TauriIntegration component functionality
 */

import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { TauriIntegration } from "../TauriIntegration";

// Mock Tauri hooks
const mockSaveCurrentWindowState = vi.fn();
const mockUpdateUnreadCount = vi.fn();
const mockHandleDeepLink = vi.fn();
const mockOnWindowClose = vi.fn();
const mockOnWindowFocus = vi.fn();
const mockOnWindowBlur = vi.fn();
const mockOnDeepLink = vi.fn();

const mockUseTauri = vi.fn();
const mockUseWindowState = vi.fn();
const mockUseUnreadCount = vi.fn();
const mockUseDeepLinks = vi.fn();

vi.mock("@/hooks/useTauri", () => ({
	useTauri: () => mockUseTauri(),
	useWindowState: vi.fn(() => mockUseWindowState()),
	useUnreadCount: () => mockUseUnreadCount(),
	useDeepLinks: () => mockUseDeepLinks(),
}));

// Helper function to render components with router context
const renderWithRouter = (
	component: React.ReactElement,
	initialEntries: string[] = ["/"],
) => {
	return render(
		<MemoryRouter initialEntries={initialEntries}>{component}</MemoryRouter>,
	);
};

describe("TauriIntegration - Advanced Functionality", () => {
	beforeEach(() => {
		vi.clearAllMocks();

		// Default mock implementations
		mockUseTauri.mockReturnValue({
			isTauri: true,
			platform: "windows",
			isReady: true,
			api: {
				createChatWindow: vi.fn(),
				closeChatWindow: vi.fn(),
				updateUnreadCount: mockUpdateUnreadCount,
				minimizeToTray: vi.fn(),
				restoreFromTray: vi.fn(),
				saveWindowState: vi.fn(),
				loadWindowState: vi.fn(),
				handleDeepLinks: vi.fn(),
			},
			events: {
				onWindowClose: mockOnWindowClose,
				onWindowFocus: mockOnWindowFocus,
				onWindowBlur: mockOnWindowBlur,
				onDeepLink: mockOnDeepLink,
			},
			windowManager: {
				getCurrentWindowConfig: vi.fn(),
				saveCurrentWindowState: mockSaveCurrentWindowState,
				restoreWindowState: vi.fn(),
			},
		});

		mockUseWindowState.mockReturnValue({
			saveState: vi.fn(),
			restoreState: vi.fn(),
		});

		mockUseUnreadCount.mockReturnValue({
			updateUnreadCount: mockUpdateUnreadCount,
		});

		mockUseDeepLinks.mockReturnValue({
			handleDeepLink: mockHandleDeepLink,
		});
	});

	describe("Window State Management", () => {
		it("should render with window state integration", () => {
			renderWithRouter(
				<TauriIntegration>
					<div>Test Content</div>
				</TauriIntegration>,
			);

			// Should render successfully with window state integration
			expect(screen.getByText("Test Content")).toBeInTheDocument();
		});

		it("should render when not in Tauri", () => {
			mockUseTauri.mockReturnValue({
				isTauri: false,
				platform: "web",
				isReady: true,
				api: {},
				events: {},
				windowManager: {},
			});

			renderWithRouter(
				<TauriIntegration>
					<div>Test Content</div>
				</TauriIntegration>,
			);

			// Should render successfully even when not in Tauri
			expect(screen.getByText("Test Content")).toBeInTheDocument();
		});
	});

	describe("Hook Integration", () => {
		it("should integrate all required hooks", () => {
			renderWithRouter(
				<TauriIntegration>
					<div>Test Content</div>
				</TauriIntegration>,
			);

			// Should use all the required hooks
			expect(mockUseTauri).toHaveBeenCalled();
			expect(mockUseWindowState).toHaveBeenCalled();
			expect(mockUseUnreadCount).toHaveBeenCalled();
			expect(mockUseDeepLinks).toHaveBeenCalled();
		});

		it("should handle different Tauri states", () => {
			// Test with Tauri not ready
			mockUseTauri.mockReturnValue({
				isTauri: true,
				platform: "windows",
				isReady: false,
				api: {
					createChatWindow: vi.fn(),
					closeChatWindow: vi.fn(),
					updateUnreadCount: mockUpdateUnreadCount,
					minimizeToTray: vi.fn(),
					restoreFromTray: vi.fn(),
					saveWindowState: vi.fn(),
					loadWindowState: vi.fn(),
					handleDeepLinks: vi.fn(),
				},
				events: {
					onWindowClose: mockOnWindowClose,
					onWindowFocus: mockOnWindowFocus,
					onWindowBlur: mockOnWindowBlur,
					onDeepLink: mockOnDeepLink,
				},
				windowManager: {
					getCurrentWindowConfig: vi.fn(),
					saveCurrentWindowState: mockSaveCurrentWindowState,
					restoreWindowState: vi.fn(),
				},
			});

			renderWithRouter(
				<TauriIntegration>
					<div>Test Content</div>
				</TauriIntegration>,
			);

			// Should still render but not add platform classes when not ready
			expect(document.body.classList.contains("tauri-app")).toBe(false);
		});
	});

	describe("Deep Link Integration", () => {
		it("should integrate deep link handling", () => {
			renderWithRouter(
				<TauriIntegration>
					<div>Test Content</div>
				</TauriIntegration>,
			);

			// Deep link hook should be used
			expect(mockUseDeepLinks).toHaveBeenCalled();
		});
	});

	describe("Unread Count Integration", () => {
		it("should integrate unread count functionality", () => {
			renderWithRouter(
				<TauriIntegration>
					<div>Test Content</div>
				</TauriIntegration>,
			);

			// Unread count hook should be used
			expect(mockUseUnreadCount).toHaveBeenCalled();
		});
	});

	describe("URL Parameter Handling", () => {
		it("should handle deep link URL parameters", () => {
			// Use MemoryRouter with initial entries to simulate URL parameters
			renderWithRouter(
				<TauriIntegration>
					<div>Test Content</div>
				</TauriIntegration>,
				["/?deeplink=msn://chat/user123"],
			);

			// Should handle deep link
			expect(mockHandleDeepLink).toHaveBeenCalledWith("msn://chat/user123");
		});

		it("should not handle deep links when no parameter present", () => {
			// Use MemoryRouter without deep link parameter
			renderWithRouter(
				<TauriIntegration>
					<div>Test Content</div>
				</TauriIntegration>,
				["/"],
			);

			// Should not call handleDeepLink
			expect(mockHandleDeepLink).not.toHaveBeenCalled();
		});
	});

	describe("Platform-Specific Behavior", () => {
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
						onWindowClose: mockOnWindowClose,
						onWindowFocus: mockOnWindowFocus,
						onWindowBlur: mockOnWindowBlur,
						onDeepLink: mockOnDeepLink,
					},
					windowManager: {
						getCurrentWindowConfig: vi.fn(),
						saveCurrentWindowState: mockSaveCurrentWindowState,
						restoreWindowState: vi.fn(),
					},
				});

				const { unmount } = renderWithRouter(
					<TauriIntegration>
						<div>Test Content</div>
					</TauriIntegration>,
				);

				expect(document.body.classList.contains(`platform-${platform}`)).toBe(
					true,
				);

				unmount();
			});
		});
	});
});
