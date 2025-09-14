import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
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
		expect(screen.getByText("Original MSN Messenger blue and purple theme")).toBeInTheDocument();
	});

	it("shows color customization options", () => {
		render(<ThemeCustomizer />);
		
		const button = screen.getByRole("button", { name: /customize theme/i });
		fireEvent.click(button);
		
		// Click on Colors tab
		const colorsTab = screen.getByRole("tab", { name: /colors/i });
		fireEvent.click(colorsTab);
		
		expect(screen.getByLabelText("Primary Color")).toBeInTheDocument();
		expect(screen.getByLabelText("Secondary Color")).toBeInTheDocument();
		expect(screen.getByLabelText("Accent Color")).toBeInTheDocument();
	});

	it("shows glassmorphism effects options", () => {
		render(<ThemeCustomizer />);
		
		const button = screen.getByRole("button", { name: /customize theme/i });
		fireEvent.click(button);
		
		// Click on Effects tab
		const effectsTab = screen.getByRole("tab", { name: /effects/i });
		fireEvent.click(effectsTab);
		
		expect(screen.getByText("Enable Glassmorphism")).toBeInTheDocument();
		expect(screen.getByText("Add modern glass effects to UI elements")).toBeInTheDocument();
	});

	it("displays live preview", () => {
		render(<ThemeCustomizer />);
		
		const button = screen.getByRole("button", { name: /customize theme/i });
		fireEvent.click(button);
		
		expect(screen.getByText("Live Preview")).toBeInTheDocument();
	});
});
