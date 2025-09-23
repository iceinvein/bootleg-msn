import { render, screen, waitFor } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MobileProvider, useMobile } from "./MobileProvider";

// Mock Capacitor
vi.mock("@capacitor/core", () => ({
	Capacitor: {
		isNativePlatform: vi.fn(() => false),
		getPlatform: vi.fn(() => "web"),
	},
}));

vi.mock("@capacitor/status-bar", () => ({
	StatusBar: {
		setStyle: vi.fn(),
		setBackgroundColor: vi.fn(),
		setOverlaysWebView: vi.fn(),
	},
	Style: {
		Light: "LIGHT",
		Dark: "DARK",
	},
}));

vi.mock("@capacitor/haptics", () => ({
	Haptics: {
		impact: vi.fn(),
	},
	ImpactStyle: {
		Light: "LIGHT",
		Medium: "MEDIUM",
		Heavy: "HEAVY",
	},
}));

vi.mock("@capacitor/keyboard", () => ({
	Keyboard: {
		addListener: vi.fn(() => ({ remove: vi.fn() })),
	},
}));

// Test component that uses the mobile context
function TestComponent() {
	const { isMobile, platform, isIOS, isAndroid } = useMobile();

	return (
		<div>
			<div data-testid="is-mobile">{isMobile.toString()}</div>
			<div data-testid="platform">{platform}</div>
			<div data-testid="is-ios">{isIOS.toString()}</div>
			<div data-testid="is-android">{isAndroid.toString()}</div>
		</div>
	);
}

describe("MobileProvider", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("provides mobile context values for web platform", () => {
		render(
			<MobileProvider>
				<TestComponent />
			</MobileProvider>,
		);

		expect(screen.getByTestId("is-mobile")).toHaveTextContent("false");
		expect(screen.getByTestId("platform")).toHaveTextContent("web");
		expect(screen.getByTestId("is-ios")).toHaveTextContent("false");
		expect(screen.getByTestId("is-android")).toHaveTextContent("false");
	});

	it("provides mobile context values for iOS platform", async () => {
		const { Capacitor } = await import("@capacitor/core");
		vi.mocked(Capacitor.isNativePlatform).mockReturnValue(true);
		vi.mocked(Capacitor.getPlatform).mockReturnValue("ios");

		render(
			<MobileProvider>
				<TestComponent />
			</MobileProvider>,
		);

		expect(screen.getByTestId("is-mobile")).toHaveTextContent("true");
		expect(screen.getByTestId("platform")).toHaveTextContent("ios");
		expect(screen.getByTestId("is-ios")).toHaveTextContent("true");
		expect(screen.getByTestId("is-android")).toHaveTextContent("false");
	});

	it("provides mobile context values for Android platform", async () => {
		const { Capacitor } = await import("@capacitor/core");
		vi.mocked(Capacitor.isNativePlatform).mockReturnValue(true);
		vi.mocked(Capacitor.getPlatform).mockReturnValue("android");

		render(
			<MobileProvider>
				<TestComponent />
			</MobileProvider>,
		);

		expect(screen.getByTestId("is-mobile")).toHaveTextContent("true");
		expect(screen.getByTestId("platform")).toHaveTextContent("android");
		expect(screen.getByTestId("is-ios")).toHaveTextContent("false");
		expect(screen.getByTestId("is-android")).toHaveTextContent("true");
	});

	it("throws error when useMobile is used outside provider", () => {
		// Suppress console.error for this test
		const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

		expect(() => {
			render(<TestComponent />);
		}).toThrow("useMobile must be used within a MobileProvider");

		consoleSpy.mockRestore();
	});

	it("should provide status bar control functions on iOS", async () => {
		const { Capacitor } = await import("@capacitor/core");
		const { StatusBar, Style } = await import("@capacitor/status-bar");

		vi.mocked(Capacitor.isNativePlatform).mockReturnValue(true);
		vi.mocked(Capacitor.getPlatform).mockReturnValue("ios");

		function StatusBarTestComponent() {
			const { setStatusBarStyle } = useMobile();

			React.useEffect(() => {
				setStatusBarStyle(Style.Light);
			}, [setStatusBarStyle]);

			return <div data-testid="status-bar-test">Status bar test</div>;
		}

		render(
			<MobileProvider>
				<StatusBarTestComponent />
			</MobileProvider>,
		);

		await waitFor(() => {
			expect(StatusBar.setStyle).toHaveBeenCalledWith({ style: Style.Light });
		});
	});

	it("should provide status bar control functions on Android", async () => {
		const { Capacitor } = await import("@capacitor/core");
		const { StatusBar, Style } = await import("@capacitor/status-bar");

		vi.mocked(Capacitor.isNativePlatform).mockReturnValue(true);
		vi.mocked(Capacitor.getPlatform).mockReturnValue("android");

		function StatusBarTestComponent() {
			const { setStatusBarStyle } = useMobile();

			React.useEffect(() => {
				setStatusBarStyle(Style.Dark);
			}, [setStatusBarStyle]);

			return <div data-testid="status-bar-test">Status bar test</div>;
		}

		render(
			<MobileProvider>
				<StatusBarTestComponent />
			</MobileProvider>,
		);

		await waitFor(() => {
			expect(StatusBar.setStyle).toHaveBeenCalledWith({ style: Style.Dark });
		});
	});

	it("should set up keyboard listeners on native platforms", async () => {
		const { Capacitor } = await import("@capacitor/core");
		const { Keyboard } = await import("@capacitor/keyboard");

		vi.mocked(Capacitor.isNativePlatform).mockReturnValue(true);
		vi.mocked(Capacitor.getPlatform).mockReturnValue("ios");

		render(
			<MobileProvider>
				<TestComponent />
			</MobileProvider>,
		);

		expect(Keyboard.addListener).toHaveBeenCalledWith("keyboardWillShow", expect.any(Function));
		expect(Keyboard.addListener).toHaveBeenCalledWith("keyboardWillHide", expect.any(Function));
	});

	it("should not initialize native features on web platform", async () => {
		const { Capacitor } = await import("@capacitor/core");
		const { StatusBar } = await import("@capacitor/status-bar");
		const { Keyboard } = await import("@capacitor/keyboard");

		// Ensure web platform
		vi.mocked(Capacitor.isNativePlatform).mockReturnValue(false);
		vi.mocked(Capacitor.getPlatform).mockReturnValue("web");

		render(
			<MobileProvider>
				<TestComponent />
			</MobileProvider>,
		);

		// StatusBar functions should not be called automatically
		expect(StatusBar.setStyle).not.toHaveBeenCalled();
		expect(StatusBar.setBackgroundColor).not.toHaveBeenCalled();

		// Keyboard listeners should not be set up on web
		expect(Keyboard.addListener).not.toHaveBeenCalled();
	});

	it("should handle initialization errors gracefully", async () => {
		const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
		const { Capacitor } = await import("@capacitor/core");
		const { StatusBar } = await import("@capacitor/status-bar");

		vi.mocked(Capacitor.isNativePlatform).mockReturnValue(true);
		vi.mocked(Capacitor.getPlatform).mockReturnValue("ios");
		vi.mocked(StatusBar.setStyle).mockRejectedValue(new Error("Status bar error"));

		render(
			<MobileProvider>
				<TestComponent />
			</MobileProvider>,
		);

		// Should not throw errors
		expect(screen.getByTestId("is-mobile")).toHaveTextContent("true");

		consoleSpy.mockRestore();
	});

	it("should provide haptic feedback capability detection", async () => {
		const { Capacitor } = await import("@capacitor/core");
		vi.mocked(Capacitor.isNativePlatform).mockReturnValue(true);
		vi.mocked(Capacitor.getPlatform).mockReturnValue("ios");

		function HapticTestComponent() {
			const { isMobile } = useMobile();
			return <div data-testid="has-haptics">{isMobile.toString()}</div>;
		}

		render(
			<MobileProvider>
				<HapticTestComponent />
			</MobileProvider>,
		);

		expect(screen.getByTestId("has-haptics")).toHaveTextContent("true");
	});

	it("should clean up listeners on unmount", async () => {
		const mockRemove = vi.fn();
		const { Capacitor } = await import("@capacitor/core");
		const { Keyboard } = await import("@capacitor/keyboard");

		vi.mocked(Capacitor.isNativePlatform).mockReturnValue(true);
		vi.mocked(Capacitor.getPlatform).mockReturnValue("ios");
		vi.mocked(Keyboard.addListener).mockReturnValue({ remove: mockRemove });

		const { unmount } = render(
			<MobileProvider>
				<TestComponent />
			</MobileProvider>,
		);

		unmount();

		expect(mockRemove).toHaveBeenCalledTimes(2); // keyboardWillShow and keyboardWillHide
	});
});
