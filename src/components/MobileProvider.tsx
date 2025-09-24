import type { PluginListenerHandle } from "@capacitor/core";
import { Capacitor } from "@capacitor/core";
import { Haptics, ImpactStyle } from "@capacitor/haptics";
import { Keyboard } from "@capacitor/keyboard";
import { StatusBar, type Style } from "@capacitor/status-bar";
import type React from "react";
import { createContext, useContext, useEffect, useState } from "react";

type MobileContextType = {
	isMobile: boolean;
	platform: string;
	isIOS: boolean;
	isAndroid: boolean;
	keyboardHeight: number;
	isKeyboardOpen: boolean;
	triggerHaptic: (style?: ImpactStyle) => Promise<void>;
	setStatusBarStyle: (style: Style) => Promise<void>;
};

const MobileContext = createContext<MobileContextType | undefined>(undefined);

type MobileProviderProps = {
	children: React.ReactNode;
};

export function MobileProvider({ children }: MobileProviderProps) {
	const [keyboardHeight, setKeyboardHeight] = useState(0);
	const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);

	const isMobile = Capacitor.isNativePlatform();
	const platform = Capacitor.getPlatform();
	const isIOS = platform === "ios";
	const isAndroid = platform === "android";

	useEffect(() => {
		if (!isMobile) return;

		let keyboardWillShowListener: PluginListenerHandle | null = null;
		let keyboardWillHideListener: PluginListenerHandle | null = null;

		// Setup keyboard event listeners
		const setupKeyboardListeners = async () => {
			keyboardWillShowListener = await Keyboard.addListener(
				"keyboardWillShow",
				(info) => {
					setKeyboardHeight(info.keyboardHeight);
					setIsKeyboardOpen(true);
					document.body.classList.add("keyboard-open");
					document.documentElement.style.setProperty(
						"--keyboard-height",
						`${info.keyboardHeight}px`,
					);
				},
			);

			keyboardWillHideListener = await Keyboard.addListener(
				"keyboardWillHide",
				() => {
					setKeyboardHeight(0);
					setIsKeyboardOpen(false);
					document.body.classList.remove("keyboard-open");
					document.documentElement.style.setProperty(
						"--keyboard-height",
						"0px",
					);
				},
			);
		};

		setupKeyboardListeners();

		return () => {
			keyboardWillShowListener?.remove();
			keyboardWillHideListener?.remove();
		};
	}, [isMobile]);

	const triggerHaptic = async (style: ImpactStyle = ImpactStyle.Medium) => {
		if (!isMobile) return;

		try {
			await Haptics.impact({ style });
		} catch (error) {
			console.warn("Haptic feedback not available:", error);
		}
	};

	const setStatusBarStyle = async (style: Style) => {
		if (!isMobile) return;

		try {
			await StatusBar.setStyle({ style });
		} catch (error) {
			console.warn("Status bar style change failed:", error);
		}
	};

	const value: MobileContextType = {
		isMobile,
		platform,
		isIOS,
		isAndroid,
		keyboardHeight,
		isKeyboardOpen,
		triggerHaptic,
		setStatusBarStyle,
	};

	return (
		<MobileContext.Provider value={value}>{children}</MobileContext.Provider>
	);
}

export function useMobile() {
	const context = useContext(MobileContext);
	if (context === undefined) {
		throw new Error("useMobile must be used within a MobileProvider");
	}
	return context;
}

// Hook for haptic feedback
export function useHaptics() {
	const { triggerHaptic, isMobile } = useMobile();

	return {
		light: () => triggerHaptic(ImpactStyle.Light),
		medium: () => triggerHaptic(ImpactStyle.Medium),
		heavy: () => triggerHaptic(ImpactStyle.Heavy),
		isAvailable: isMobile,
	};
}

// Hook for keyboard handling
export function useKeyboard() {
	const { keyboardHeight, isKeyboardOpen, isMobile } = useMobile();

	return {
		height: keyboardHeight,
		isOpen: isKeyboardOpen,
		isAvailable: isMobile,
	};
}
