import { App } from "@capacitor/app";
import { Capacitor, type PluginListenerHandle } from "@capacitor/core";
import { Keyboard } from "@capacitor/keyboard";
import { StatusBar, Style } from "@capacitor/status-bar";
import { useEffect, useState } from "react";

export type MobilePlatform = "ios" | "android" | "web";

export function useMobile() {
	const [isNative] = useState(() => Capacitor.isNativePlatform());
	const [platform] = useState<MobilePlatform>(() => {
		const platformName = Capacitor.getPlatform();
		return platformName as MobilePlatform;
	});
	const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
	const [appState, setAppState] = useState<"active" | "inactive">("active");

	useEffect(() => {
		if (!isNative) return;

		let keyboardShowListener: PluginListenerHandle;
		let keyboardHideListener: PluginListenerHandle;
		let appStateListener: PluginListenerHandle;

		const setupListeners = async () => {
			// Keyboard listeners
			keyboardShowListener = await Keyboard.addListener(
				"keyboardWillShow",
				() => {
					setIsKeyboardOpen(true);
				},
			);

			keyboardHideListener = await Keyboard.addListener(
				"keyboardWillHide",
				() => {
					setIsKeyboardOpen(false);
				},
			);

			// App state listeners
			appStateListener = await App.addListener(
				"appStateChange",
				({ isActive }) => {
					setAppState(isActive ? "active" : "inactive");
				},
			);
		};

		setupListeners();

		return () => {
			keyboardShowListener?.remove();
			keyboardHideListener?.remove();
			appStateListener?.remove();
		};
	}, [isNative]);

	const setStatusBarStyle = async (style: "light" | "dark") => {
		if (!isNative) return;

		try {
			await StatusBar.setStyle({
				style: style === "light" ? Style.Light : Style.Dark,
			});
		} catch (error) {
			console.warn("Failed to set status bar style:", error);
		}
	};

	const setStatusBarColor = async (color: string) => {
		if (!isNative || platform !== "android") return;

		try {
			await StatusBar.setBackgroundColor({ color });
		} catch (error) {
			console.warn("Failed to set status bar color:", error);
		}
	};

	const exitApp = async () => {
		if (!isNative) return;

		try {
			await App.exitApp();
		} catch (error) {
			console.warn("Failed to exit app:", error);
		}
	};

	return {
		isNative,
		platform,
		isKeyboardOpen,
		appState,
		isIOS: platform === "ios",
		isAndroid: platform === "android",
		isWeb: platform === "web",
		setStatusBarStyle,
		setStatusBarColor,
		exitApp,
	};
}
