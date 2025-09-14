import { useCallback, useEffect, useState } from "react";

export type ThemePreset = {
	name: string;
	description: string;
	colors: {
		primary: string;
		secondary: string;
		accent: string;
		background?: string;
	};
	glassmorphism: {
		enabled: boolean;
		intensity: "subtle" | "medium" | "strong";
		blur: "sm" | "md" | "lg" | "xl";
	};
};

export type CustomThemeConfig = {
	preset: string;
	colors: {
		primary: string;
		secondary: string;
		accent: string;
		background?: string;
	};
	glassmorphism: {
		enabled: boolean;
		intensity: "subtle" | "medium" | "strong";
		blur: "sm" | "md" | "lg" | "xl";
	};
};

const MSN_PRESETS: Record<string, ThemePreset> = {
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
	modern: {
		name: "Modern MSN",
		description: "Contemporary take on MSN colors with enhanced contrast",
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
	},
	retro: {
		name: "Retro MSN",
		description: "Nostalgic MSN theme with muted tones",
		colors: {
			primary: "#5b9bd5",
			secondary: "#70ad47",
			accent: "#ffc000",
		},
		glassmorphism: {
			enabled: false,
			intensity: "subtle",
			blur: "sm",
		},
	},
	sunset: {
		name: "MSN Sunset",
		description: "Warm gradient inspired by MSN's evening themes",
		colors: {
			primary: "#ff6b6b",
			secondary: "#ffa726",
			accent: "#ab47bc",
		},
		glassmorphism: {
			enabled: true,
			intensity: "medium",
			blur: "md",
		},
	},
	ocean: {
		name: "Ocean Breeze",
		description: "Cool blue tones reminiscent of MSN's aqua theme",
		colors: {
			primary: "#00bcd4",
			secondary: "#0097a7",
			accent: "#26c6da",
		},
		glassmorphism: {
			enabled: true,
			intensity: "strong",
			blur: "lg",
		},
	},
	forest: {
		name: "Forest Green",
		description: "Nature-inspired green theme with MSN styling",
		colors: {
			primary: "#4caf50",
			secondary: "#388e3c",
			accent: "#66bb6a",
		},
		glassmorphism: {
			enabled: true,
			intensity: "medium",
			blur: "md",
		},
	},
};

const DEFAULT_CONFIG: CustomThemeConfig = {
	preset: "classic",
	colors: MSN_PRESETS.classic.colors,
	glassmorphism: MSN_PRESETS.classic.glassmorphism,
};

export function useThemeCustomization() {
	const [config, setConfig] = useState<CustomThemeConfig>(() => {
		const saved = localStorage.getItem("msn-theme-config");
		return saved ? JSON.parse(saved) : DEFAULT_CONFIG;
	});

	const applyTheme = useCallback((newConfig: CustomThemeConfig) => {
		const root = document.documentElement;

		// Apply color variables
		root.style.setProperty("--msn-blue", newConfig.colors.primary);
		root.style.setProperty("--msn-purple", newConfig.colors.accent);
		root.style.setProperty("--primary", newConfig.colors.primary);

		// Apply glassmorphism settings
		if (newConfig.glassmorphism.enabled) {
			const blurValues = {
				sm: "8px",
				md: "12px",
				lg: "16px",
				xl: "24px",
			};

			const intensityValues = {
				subtle: "0.6",
				medium: "0.8",
				strong: "0.9",
			};

			root.style.setProperty(
				"--glass-blur",
				blurValues[newConfig.glassmorphism.blur],
			);

			// Update glass background opacity based on intensity
			const currentBg = getComputedStyle(root).getPropertyValue("--glass-bg");
			const baseColor = currentBg.split("/")[0].trim();
			const newOpacity = intensityValues[newConfig.glassmorphism.intensity];
			root.style.setProperty("--glass-bg", `${baseColor} / ${newOpacity}`);

			root.classList.add("glassmorphism-enabled");
		} else {
			root.classList.remove("glassmorphism-enabled");
		}

		// Update gradient variables
		root.style.setProperty(
			"--msn-gradient",
			`linear-gradient(135deg, ${newConfig.colors.primary} 0%, ${newConfig.colors.accent} 100%)`,
		);
	}, []);

	const updateConfig = useCallback(
		(updates: Partial<CustomThemeConfig>) => {
			const newConfig = { ...config, ...updates };
			setConfig(newConfig);
			applyTheme(newConfig);
			localStorage.setItem("msn-theme-config", JSON.stringify(newConfig));
		},
		[config, applyTheme],
	);

	const applyPreset = useCallback(
		(presetName: string) => {
			const preset = MSN_PRESETS[presetName];
			if (preset) {
				const newConfig: CustomThemeConfig = {
					preset: presetName,
					colors: preset.colors,
					glassmorphism: preset.glassmorphism,
				};
				updateConfig(newConfig);
			}
		},
		[updateConfig],
	);

	const resetToDefault = useCallback(() => {
		updateConfig(DEFAULT_CONFIG);
	}, [updateConfig]);

	// Apply theme on mount and when config changes
	useEffect(() => {
		applyTheme(config);
	}, [config, applyTheme]);

	return {
		config,
		presets: MSN_PRESETS,
		updateConfig,
		applyPreset,
		resetToDefault,
		isGlassmorphismSupported: CSS.supports("backdrop-filter", "blur(1px)"),
	};
}
