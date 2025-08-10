import { render, screen } from "@testing-library/react";
import { vi } from "vitest";
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
});
