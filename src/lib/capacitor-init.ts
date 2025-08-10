import { App } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";
import { Keyboard } from "@capacitor/keyboard";
import { SplashScreen } from "@capacitor/splash-screen";
import { StatusBar, Style } from "@capacitor/status-bar";

/**
 * Initialize Capacitor plugins for mobile platforms
 */
export async function initializeCapacitor() {
	if (!Capacitor.isNativePlatform()) {
		return;
	}

	try {
		// Configure status bar
		await StatusBar.setStyle({ style: Style.Light });
		await StatusBar.setBackgroundColor({ color: "#0078d4" });
		await StatusBar.setOverlaysWebView({ overlay: false });

		// Hide splash screen after app is ready
		await SplashScreen.hide();

		// Configure keyboard behavior
		Keyboard.addListener("keyboardWillShow", () => {
			document.body.classList.add("keyboard-open");
		});

		Keyboard.addListener("keyboardWillHide", () => {
			document.body.classList.remove("keyboard-open");
		});

		// Handle app state changes
		App.addListener("appStateChange", ({ isActive }) => {
			console.log("App state changed. Is active?", isActive);
			// You can add logic here to handle app becoming active/inactive
		});

		// Handle deep links
		App.addListener("appUrlOpen", (event) => {
			console.log("App opened with URL:", event.url);
			// Handle deep link navigation here
		});

		console.log("Capacitor initialized successfully");
	} catch (error) {
		console.error("Error initializing Capacitor:", error);
	}
}

/**
 * Check if running on a mobile platform
 */
export function isMobile(): boolean {
	return Capacitor.isNativePlatform();
}

/**
 * Get the current platform
 */
export function getPlatform(): string {
	return Capacitor.getPlatform();
}

/**
 * Check if running on iOS
 */
export function isIOS(): boolean {
	return Capacitor.getPlatform() === "ios";
}

/**
 * Check if running on Android
 */
export function isAndroid(): boolean {
	return Capacitor.getPlatform() === "android";
}
