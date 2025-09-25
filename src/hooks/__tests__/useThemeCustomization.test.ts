/**
 * Tests for useThemeCustomization hook
 *
 * Tests cover:
 * - Theme configuration management
 * - Preset application and switching
 * - Color customization
 * - Glassmorphism settings
 * - Local storage persistence
 * - CSS variable application
 * - Error handling and validation
 */

import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useThemeCustomization } from "../useThemeCustomization";

// Mock localStorage
const mockLocalStorage = {
	getItem: vi.fn(),
	setItem: vi.fn(),
	removeItem: vi.fn(),
	clear: vi.fn(),
};

Object.defineProperty(window, "localStorage", {
	value: mockLocalStorage,
});

// Mock CSS.supports
Object.defineProperty(window, "CSS", {
	value: {
		supports: vi.fn(),
	},
});

// Mock document.documentElement
const mockDocumentElement = {
	style: {
		setProperty: vi.fn(),
		removeProperty: vi.fn(),
	},
	classList: {
		add: vi.fn(),
		remove: vi.fn(),
		contains: vi.fn(),
	},
};

Object.defineProperty(document, "documentElement", {
	value: mockDocumentElement,
	writable: true,
});

// Mock getComputedStyle
const mockGetComputedStyle = vi.fn();
Object.defineProperty(window, "getComputedStyle", {
	value: mockGetComputedStyle,
});

describe("useThemeCustomization", () => {
	beforeEach(() => {
		vi.clearAllMocks();

		// Default localStorage mock
		mockLocalStorage.getItem.mockReturnValue(null);

		// Default CSS.supports mock
		(window.CSS.supports as any).mockReturnValue(true);

		// Default getComputedStyle mock
		mockGetComputedStyle.mockReturnValue({
			getPropertyValue: vi.fn().mockReturnValue("rgb(255, 255, 255)"),
		});
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe("Initialization", () => {
		it("should initialize with default config when no saved config exists", () => {
			const { result } = renderHook(() => useThemeCustomization());

			expect(result.current.config).toEqual({
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
			});
		});

		it("should load saved config from localStorage", () => {
			const savedConfig = {
				preset: "modern",
				colors: {
					primary: "#0066cc",
					secondary: "#4f46e5",
					accent: "#7c3aed",
				},
				glassmorphism: {
					enabled: true,
					intensity: "strong",
					blur: "lg",
				},
			};

			mockLocalStorage.getItem.mockReturnValue(JSON.stringify(savedConfig));

			const { result } = renderHook(() => useThemeCustomization());

			expect(result.current.config).toEqual(savedConfig);
			expect(mockLocalStorage.getItem).toHaveBeenCalledWith("msn-theme-config");
		});

		it("should handle invalid JSON in localStorage gracefully", () => {
			mockLocalStorage.getItem.mockReturnValue("invalid-json");

			// Mock console.error to avoid test output noise
			const consoleSpy = vi
				.spyOn(console, "error")
				.mockImplementation(() => {});

			const { result } = renderHook(() => useThemeCustomization());

			// Should fall back to default config
			expect(result.current.config.preset).toBe("classic");

			consoleSpy.mockRestore();
		});
	});

	describe("Preset Management", () => {
		it("should provide all available presets", () => {
			const { result } = renderHook(() => useThemeCustomization());

			expect(result.current.presets).toHaveProperty("classic");
			expect(result.current.presets).toHaveProperty("modern");
			expect(result.current.presets).toHaveProperty("retro");
			expect(result.current.presets).toHaveProperty("sunset");
			expect(result.current.presets).toHaveProperty("ocean");
			expect(result.current.presets).toHaveProperty("forest");
		});

		it("should apply preset correctly", () => {
			const { result } = renderHook(() => useThemeCustomization());

			act(() => {
				result.current.applyPreset("modern");
			});

			expect(result.current.config.preset).toBe("modern");
			expect(result.current.config.colors.primary).toBe("#0066cc");
			expect(result.current.config.colors.secondary).toBe("#4f46e5");
			expect(result.current.config.colors.accent).toBe("#7c3aed");
			expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
				"msn-theme-config",
				expect.stringContaining('"preset":"modern"'),
			);
		});

		it("should ignore invalid preset names", () => {
			const { result } = renderHook(() => useThemeCustomization());
			const originalConfig = result.current.config;

			act(() => {
				result.current.applyPreset("invalid-preset");
			});

			// Config should remain unchanged
			expect(result.current.config).toEqual(originalConfig);
		});
	});

	describe("Configuration Updates", () => {
		it("should update colors correctly", () => {
			const { result } = renderHook(() => useThemeCustomization());

			act(() => {
				result.current.updateConfig({
					colors: {
						primary: "#ff0000",
						secondary: "#00ff00",
						accent: "#0000ff",
					},
				});
			});

			expect(result.current.config.colors.primary).toBe("#ff0000");
			expect(result.current.config.colors.secondary).toBe("#00ff00");
			expect(result.current.config.colors.accent).toBe("#0000ff");
		});

		it("should update glassmorphism settings correctly", () => {
			const { result } = renderHook(() => useThemeCustomization());

			act(() => {
				result.current.updateConfig({
					glassmorphism: {
						enabled: false,
						intensity: "subtle",
						blur: "sm",
					},
				});
			});

			expect(result.current.config.glassmorphism.enabled).toBe(false);
			expect(result.current.config.glassmorphism.intensity).toBe("subtle");
			expect(result.current.config.glassmorphism.blur).toBe("sm");
		});

		it("should merge partial updates with existing config", () => {
			const { result } = renderHook(() => useThemeCustomization());
			const originalColors = result.current.config.colors;

			act(() => {
				result.current.updateConfig({
					colors: {
						...originalColors,
						primary: "#ff0000",
					},
				});
			});

			expect(result.current.config.colors.primary).toBe("#ff0000");
			expect(result.current.config.colors.secondary).toBe(
				originalColors.secondary,
			);
			expect(result.current.config.colors.accent).toBe(originalColors.accent);
		});

		it("should persist updates to localStorage", () => {
			const { result } = renderHook(() => useThemeCustomization());

			act(() => {
				result.current.updateConfig({
					colors: {
						primary: "#ff0000",
						secondary: "#00ff00",
						accent: "#0000ff",
					},
				});
			});

			expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
				"msn-theme-config",
				expect.stringContaining('"primary":"#ff0000"'),
			);
		});
	});

	describe("CSS Variable Application", () => {
		it("should apply color variables to document root", () => {
			const { result } = renderHook(() => useThemeCustomization());

			act(() => {
				result.current.updateConfig({
					colors: {
						primary: "#ff0000",
						secondary: "#00ff00",
						accent: "#0000ff",
					},
				});
			});

			expect(mockDocumentElement.style.setProperty).toHaveBeenCalledWith(
				"--msn-blue",
				"#ff0000",
			);
			expect(mockDocumentElement.style.setProperty).toHaveBeenCalledWith(
				"--msn-purple",
				"#0000ff",
			);
			expect(mockDocumentElement.style.setProperty).toHaveBeenCalledWith(
				"--primary",
				"#ff0000",
			);
		});

		it("should apply glassmorphism variables", () => {
			const { result } = renderHook(() => useThemeCustomization());

			act(() => {
				result.current.updateConfig({
					glassmorphism: {
						enabled: true,
						intensity: "strong",
						blur: "xl",
					},
				});
			});

			expect(mockDocumentElement.style.setProperty).toHaveBeenCalledWith(
				"--glass-blur",
				"24px",
			);
			expect(mockDocumentElement.style.setProperty).toHaveBeenCalledWith(
				"--glass-bg",
				"rgb(255, 255, 255) / 0.9",
			);
			expect(mockDocumentElement.classList.add).toHaveBeenCalledWith(
				"glassmorphism-enabled",
			);
		});

		it("should apply gradient variables", () => {
			const { result } = renderHook(() => useThemeCustomization());

			act(() => {
				result.current.updateConfig({
					colors: {
						primary: "#ff0000",
						secondary: "#00ff00",
						accent: "#0000ff",
					},
				});
			});

			expect(mockDocumentElement.style.setProperty).toHaveBeenCalledWith(
				"--msn-gradient",
				"linear-gradient(135deg, #ff0000 0%, #0000ff 100%)",
			);
		});
	});

	describe("Reset Functionality", () => {
		it("should reset to default configuration", () => {
			const { result } = renderHook(() => useThemeCustomization());

			// First, change the config
			act(() => {
				result.current.updateConfig({
					colors: {
						primary: "#ff0000",
						secondary: "#00ff00",
						accent: "#0000ff",
					},
				});
			});

			// Then reset
			act(() => {
				result.current.resetToDefault();
			});

			expect(result.current.config.preset).toBe("classic");
			expect(result.current.config.colors.primary).toBe("#0078d4");
			expect(result.current.config.colors.secondary).toBe("#106ebe");
			expect(result.current.config.colors.accent).toBe("#8b5cf6");
		});
	});

	describe("Glassmorphism Support Detection", () => {
		it("should detect glassmorphism support when CSS.supports returns true", () => {
			(window.CSS.supports as any).mockReturnValue(true);

			const { result } = renderHook(() => useThemeCustomization());

			expect(result.current.isGlassmorphismSupported).toBe(true);
			expect(window.CSS.supports).toHaveBeenCalledWith(
				"backdrop-filter",
				"blur(1px)",
			);
		});

		it("should detect no glassmorphism support when CSS.supports returns false", () => {
			(window.CSS.supports as any).mockReturnValue(false);

			const { result } = renderHook(() => useThemeCustomization());

			expect(result.current.isGlassmorphismSupported).toBe(false);
		});
	});

	describe("Theme Application on Mount", () => {
		it("should apply theme on initial mount", () => {
			renderHook(() => useThemeCustomization());

			// Should apply default theme variables
			expect(mockDocumentElement.style.setProperty).toHaveBeenCalledWith(
				"--msn-blue",
				"#0078d4",
			);
			expect(mockDocumentElement.style.setProperty).toHaveBeenCalledWith(
				"--msn-purple",
				"#8b5cf6",
			);
		});

		it("should apply saved theme on mount", () => {
			const savedConfig = {
				preset: "modern",
				colors: {
					primary: "#0066cc",
					secondary: "#4f46e5",
					accent: "#7c3aed",
				},
				glassmorphism: {
					enabled: true,
					intensity: "strong",
					blur: "lg",
				},
			};

			mockLocalStorage.getItem.mockReturnValue(JSON.stringify(savedConfig));

			renderHook(() => useThemeCustomization());

			expect(mockDocumentElement.style.setProperty).toHaveBeenCalledWith(
				"--msn-blue",
				"#0066cc",
			);
			expect(mockDocumentElement.style.setProperty).toHaveBeenCalledWith(
				"--msn-purple",
				"#7c3aed",
			);
		});
	});
});
