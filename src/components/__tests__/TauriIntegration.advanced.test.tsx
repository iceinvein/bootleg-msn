/**
 * Advanced tests for TauriIntegration component functionality
 */

import { render, screen, act, waitFor } from "@testing-library/react";
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
			render(
				<TauriIntegration>
					<div>Test Content</div>
				</TauriIntegration>
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

			render(
				<TauriIntegration>
					<div>Test Content</div>
				</TauriIntegration>
			);

			// Should render successfully even when not in Tauri
			expect(screen.getByText("Test Content")).toBeInTheDocument();
		});
	});

	describe("Hook Integration", () => {
		it("should integrate all required hooks", () => {
			render(
				<TauriIntegration>
					<div>Test Content</div>
				</TauriIntegration>
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

			render(
				<TauriIntegration>
					<div>Test Content</div>
				</TauriIntegration>
			);

			// Should still render but not add platform classes when not ready
			expect(document.body.classList.contains("tauri-app")).toBe(false);
		});
	});

	describe("Deep Link Integration", () => {
		it("should integrate deep link handling", () => {
			render(
				<TauriIntegration>
					<div>Test Content</div>
				</TauriIntegration>
			);

			// Deep link hook should be used
			expect(mockUseDeepLinks).toHaveBeenCalled();
		});
	});

	describe("Unread Count Integration", () => {
		it("should integrate unread count functionality", () => {
			render(
				<TauriIntegration>
					<div>Test Content</div>
				</TauriIntegration>
			);

			// Unread count hook should be used
			expect(mockUseUnreadCount).toHaveBeenCalled();
		});
	});

	describe("URL Parameter Handling", () => {
		it("should handle deep link URL parameters", () => {
			// Mock URL with deep link parameter
			const originalLocation = window.location;
			delete (window as any).location;
			window.location = {
				...originalLocation,
				search: "?deeplink=msn://chat/user123",
			};

			render(
				<TauriIntegration>
					<div>Test Content</div>
				</TauriIntegration>
			);

			// Should handle deep link
			expect(mockHandleDeepLink).toHaveBeenCalledWith("msn://chat/user123");

			// Restore original location
			window.location = originalLocation;
		});

		it("should not handle deep links when no parameter present", () => {
			// Mock URL without deep link parameter
			const originalLocation = window.location;
			delete (window as any).location;
			window.location = {
				...originalLocation,
				search: "",
			};

			render(
				<TauriIntegration>
					<div>Test Content</div>
				</TauriIntegration>
			);

			// Should not call handleDeepLink
			expect(mockHandleDeepLink).not.toHaveBeenCalled();

			// Restore original location
			window.location = originalLocation;
		});
	});

	describe("Platform-Specific Behavior", () => {
		it("should handle different platforms correctly", () => {
			const platforms = ["windows", "macos", "linux"] as const;

			platforms.forEach(platform => {
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

				const { unmount } = render(
					<TauriIntegration>
						<div>Test Content</div>
					</TauriIntegration>
				);

				expect(document.body.classList.contains(`platform-${platform}`)).toBe(true);

				unmount();
			});
		});
	});
});
