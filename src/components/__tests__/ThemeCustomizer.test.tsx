import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ThemeCustomizer } from "../ThemeCustomizer";

// Mock the useThemeCustomization hook
vi.mock("@/hooks/useThemeCustomization", () => ({
	useThemeCustomization: () => ({
		config: {
			preset: "classic",
			colors: {
				primary: "#0078d4",
				secondary: "#106ebe",
				accent: "#8b5cf6",
			},
			glassmorphism: {
				enabled: true,
				intensity: "medium",
				blur: "md",
			},
		},
		presets: {
			classic: {
				name: "Classic MSN",
				description: "Original MSN Messenger blue and purple theme",
				colors: {
					primary: "#0078d4",
					secondary: "#106ebe",
					accent: "#8b5cf6",
				},
				glassmorphism: {
					enabled: true,
					intensity: "medium",
					blur: "md",
				},
			},
		},
		updateConfig: vi.fn(),
		applyPreset: vi.fn(),
		resetToDefault: vi.fn(),
		isGlassmorphismSupported: true,
	}),
}));

describe("ThemeCustomizer", () => {
	it("renders the theme customizer button", () => {
		render(<ThemeCustomizer />);

		const button = screen.getByRole("button", { name: /customize theme/i });
		expect(button).toBeInTheDocument();
	});

	it("opens the customizer dialog when clicked", () => {
		render(<ThemeCustomizer />);

		const button = screen.getByRole("button", { name: /customize theme/i });
		fireEvent.click(button);

		expect(screen.getByText("MSN Theme Customizer")).toBeInTheDocument();
	});

	it("displays preset themes", () => {
		render(<ThemeCustomizer />);

		const button = screen.getByRole("button", { name: /customize theme/i });
		fireEvent.click(button);

		expect(screen.getByText("Classic MSN")).toBeInTheDocument();
		expect(
			screen.getByText("Original MSN Messenger blue and purple theme"),
		).toBeInTheDocument();
	});



	it("displays live preview", () => {
		render(<ThemeCustomizer />);

		const button = screen.getByRole("button", { name: /customize theme/i });
		fireEvent.click(button);

		expect(screen.getByText("Live Preview")).toBeInTheDocument();
	});
});
