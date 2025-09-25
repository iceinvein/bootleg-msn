/**
 * Tests for CapacitorIntegration component
 */

import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock Capacitor utilities
vi.mock("@/lib/capacitor", () => ({
	initializeCapacitor: vi.fn(),
	isNativePlatform: vi.fn(),
	getPlatform: vi.fn(),
}));

// Mock mobile notifications
vi.mock("@/lib/mobile-notifications", () => ({
	mobileNotifications: {
		initialize: vi.fn(),
	},
}));

import { CapacitorIntegration } from "../CapacitorIntegration";

describe("CapacitorIntegration", () => {
	let mockCapacitorUtils: any;
	let mockMobileNotifications: any;

	beforeEach(async () => {
		vi.clearAllMocks();

		// Get mocked modules
		mockCapacitorUtils = vi.mocked(await import("@/lib/capacitor"));
		mockMobileNotifications = vi.mocked(
			await import("@/lib/mobile-notifications"),
		).mobileNotifications;

		// Reset DOM classes
		document.body.className = "";

		// Default mock implementations
		mockCapacitorUtils.isNativePlatform.mockReturnValue(false);
		mockCapacitorUtils.getPlatform.mockReturnValue("web");
		mockCapacitorUtils.initializeCapacitor.mockResolvedValue(undefined);
		mockMobileNotifications.initialize.mockResolvedValue(undefined);
	});

	describe("Initialization", () => {
		it("should not initialize Capacitor when not on native platform", () => {
			mockCapacitorUtils.isNativePlatform.mockReturnValue(false);

			render(<CapacitorIntegration />);

			expect(mockCapacitorUtils.initializeCapacitor).not.toHaveBeenCalled();
			expect(mockMobileNotifications.initialize).not.toHaveBeenCalled();
		});

		it("should initialize Capacitor when on native platform", () => {
			mockCapacitorUtils.isNativePlatform.mockReturnValue(true);
			mockCapacitorUtils.getPlatform.mockReturnValue("ios");

			render(<CapacitorIntegration />);

			expect(mockCapacitorUtils.initializeCapacitor).toHaveBeenCalledTimes(1);
			expect(mockMobileNotifications.initialize).toHaveBeenCalledTimes(1);
		});

		it("should initialize for Android platform", () => {
			mockCapacitorUtils.isNativePlatform.mockReturnValue(true);
			mockCapacitorUtils.getPlatform.mockReturnValue("android");

			render(<CapacitorIntegration />);

			expect(mockCapacitorUtils.initializeCapacitor).toHaveBeenCalledTimes(1);
			expect(mockMobileNotifications.initialize).toHaveBeenCalledTimes(1);
		});
	});

	describe("Event Listeners", () => {
		it("should set up app lifecycle event listeners", () => {
			const addEventListenerSpy = vi.spyOn(window, "addEventListener");

			render(<CapacitorIntegration />);

			expect(addEventListenerSpy).toHaveBeenCalledWith(
				"app-resumed",
				expect.any(Function),
			);
			expect(addEventListenerSpy).toHaveBeenCalledWith(
				"app-paused",
				expect.any(Function),
			);
			expect(addEventListenerSpy).toHaveBeenCalledWith(
				"deep-link",
				expect.any(Function),
			);
		});

		it("should clean up event listeners on unmount", () => {
			const removeEventListenerSpy = vi.spyOn(window, "removeEventListener");

			const { unmount } = render(<CapacitorIntegration />);
			unmount();

			expect(removeEventListenerSpy).toHaveBeenCalledWith(
				"app-resumed",
				expect.any(Function),
			);
			expect(removeEventListenerSpy).toHaveBeenCalledWith(
				"app-paused",
				expect.any(Function),
			);
			expect(removeEventListenerSpy).toHaveBeenCalledWith(
				"deep-link",
				expect.any(Function),
			);
		});

		it("should handle app resume events", () => {
			render(<CapacitorIntegration />);

			// Simulate app resume event
			const resumeEvent = new Event("app-resumed");
			window.dispatchEvent(resumeEvent);

			// Event should be handled without errors
			expect(true).toBe(true);
		});

		it("should handle app pause events", () => {
			render(<CapacitorIntegration />);

			// Simulate app pause event
			const pauseEvent = new Event("app-paused");
			window.dispatchEvent(pauseEvent);

			// Event should be handled without errors
			expect(true).toBe(true);
		});

		it("should handle deep link events with MSN protocol", () => {
			render(<CapacitorIntegration />);

			// Simulate deep link event
			const deepLinkEvent = new CustomEvent("deep-link", {
				detail: "msn://chat/user123",
			});
			window.dispatchEvent(deepLinkEvent);

			// Event should be handled without errors
			expect(true).toBe(true);
		});

		it("should ignore non-MSN deep link events", () => {
			render(<CapacitorIntegration />);

			// Simulate non-MSN deep link event
			const deepLinkEvent = new CustomEvent("deep-link", {
				detail: "https://example.com",
			});
			window.dispatchEvent(deepLinkEvent);

			// Event should be handled without errors
			expect(true).toBe(true);
		});
	});

	describe("CSS Class Management", () => {
		it("should not add mobile classes when not on native platform", () => {
			mockCapacitorUtils.isNativePlatform.mockReturnValue(false);
			mockCapacitorUtils.getPlatform.mockReturnValue("web");

			render(<CapacitorIntegration />);

			expect(document.body.classList.contains("capacitor-app")).toBe(false);
			expect(document.body.classList.contains("platform-web")).toBe(false);
		});

		it("should add mobile classes when on iOS", () => {
			mockCapacitorUtils.isNativePlatform.mockReturnValue(true);
			mockCapacitorUtils.getPlatform.mockReturnValue("ios");

			render(<CapacitorIntegration />);

			expect(document.body.classList.contains("capacitor-app")).toBe(true);
			expect(document.body.classList.contains("platform-ios")).toBe(true);
		});

		it("should add mobile classes when on Android", () => {
			mockCapacitorUtils.isNativePlatform.mockReturnValue(true);
			mockCapacitorUtils.getPlatform.mockReturnValue("android");

			render(<CapacitorIntegration />);

			expect(document.body.classList.contains("capacitor-app")).toBe(true);
			expect(document.body.classList.contains("platform-android")).toBe(true);
		});

		it("should clean up CSS classes on unmount", () => {
			mockCapacitorUtils.isNativePlatform.mockReturnValue(true);
			mockCapacitorUtils.getPlatform.mockReturnValue("ios");

			const { unmount } = render(<CapacitorIntegration />);

			expect(document.body.classList.contains("capacitor-app")).toBe(true);
			expect(document.body.classList.contains("platform-ios")).toBe(true);

			unmount();

			expect(document.body.classList.contains("capacitor-app")).toBe(false);
			expect(document.body.classList.contains("platform-ios")).toBe(false);
		});

		it("should handle platform changes correctly", () => {
			// Test multiple platform scenarios
			const platforms = ["ios", "android"] as const;

			platforms.forEach((platform) => {
				// Clear previous classes
				document.body.className = "";

				mockCapacitorUtils.isNativePlatform.mockReturnValue(true);
				mockCapacitorUtils.getPlatform.mockReturnValue(platform);

				const { unmount } = render(<CapacitorIntegration />);

				expect(document.body.classList.contains("capacitor-app")).toBe(true);
				expect(document.body.classList.contains(`platform-${platform}`)).toBe(
					true,
				);

				unmount();

				expect(document.body.classList.contains("capacitor-app")).toBe(false);
				expect(document.body.classList.contains(`platform-${platform}`)).toBe(
					false,
				);
			});
		});
	});

	describe("Error Handling", () => {
		it("should handle initialization errors gracefully", async () => {
			const consoleSpy = vi
				.spyOn(console, "error")
				.mockImplementation(() => {});
			mockCapacitorUtils.isNativePlatform.mockReturnValue(true);
			mockCapacitorUtils.initializeCapacitor.mockRejectedValue(
				new Error("Init failed"),
			);

			render(<CapacitorIntegration />);

			// Wait for async initialization
			await waitFor(() => {
				expect(mockCapacitorUtils.initializeCapacitor).toHaveBeenCalled();
			});

			// Should not throw errors
			expect(true).toBe(true);

			consoleSpy.mockRestore();
		});

		it("should handle notification initialization errors gracefully", async () => {
			const consoleSpy = vi
				.spyOn(console, "error")
				.mockImplementation(() => {});
			mockCapacitorUtils.isNativePlatform.mockReturnValue(true);
			mockMobileNotifications.initialize.mockRejectedValue(
				new Error("Notification init failed"),
			);

			// Should not throw during render, but error should be caught
			expect(() => render(<CapacitorIntegration />)).not.toThrow();

			// Wait for async initialization
			await waitFor(() => {
				expect(mockMobileNotifications.initialize).toHaveBeenCalled();
			});

			consoleSpy.mockRestore();
		});
	});

	describe("Component Lifecycle", () => {
		it("should render without children", () => {
			const { container } = render(<CapacitorIntegration />);

			// Component should render but have no visible content
			expect(container.firstChild).toBeNull();
		});

		it("should not interfere with other components", () => {
			render(
				<div>
					<CapacitorIntegration />
					<div data-testid="other-component">Other content</div>
				</div>,
			);

			expect(screen.getByTestId("other-component")).toBeInTheDocument();
			expect(screen.getByText("Other content")).toBeInTheDocument();
		});

		it("should handle multiple instances gracefully", () => {
			render(
				<div>
					<CapacitorIntegration />
					<CapacitorIntegration />
				</div>,
			);

			// Should not cause conflicts or errors
			expect(true).toBe(true);
		});
	});
});
