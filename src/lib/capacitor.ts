import { App } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";
import { Keyboard } from "@capacitor/keyboard";
import { SplashScreen } from "@capacitor/splash-screen";
import { StatusBar, Style } from "@capacitor/status-bar";

export const isNativePlatform = () => Capacitor.isNativePlatform();
export const getPlatform = () => Capacitor.getPlatform();

export const initializeCapacitor = async () => {
	if (!isNativePlatform()) {
		return;
	}

	try {
		// Configure status bar
		await StatusBar.setStyle({ style: Style.Light });
		await StatusBar.setBackgroundColor({ color: "#0078d4" });

		// Configure keyboard
		Keyboard.addListener("keyboardWillShow", () => {
			document.body.classList.add("keyboard-open");
		});

		Keyboard.addListener("keyboardWillHide", () => {
			document.body.classList.remove("keyboard-open");
		});

		// Handle app state changes
		App.addListener("appStateChange", ({ isActive }) => {
			console.log("App state changed. Is active?", isActive);
			// Handle app becoming active/inactive
			if (isActive) {
				// App became active - refresh data if needed
				window.dispatchEvent(new CustomEvent("app-resumed"));
			} else {
				// App became inactive - save state if needed
				window.dispatchEvent(new CustomEvent("app-paused"));
			}
		});

		// Handle deep links
		App.addListener("appUrlOpen", (event) => {
			console.log("App opened with URL:", event.url);
			// Handle deep link navigation
			window.dispatchEvent(new CustomEvent("deep-link", { detail: event.url }));
		});

		// Hide splash screen after app is ready
		await SplashScreen.hide();

		console.log("Capacitor initialized successfully");
	} catch (error) {
		console.error("Error initializing Capacitor:", error);
	}
};

export const showSplashScreen = async () => {
	if (isNativePlatform()) {
		await SplashScreen.show({
			showDuration: 2000,
			autoHide: true,
		});
	}
};

export const hideSplashScreen = async () => {
	if (isNativePlatform()) {
		await SplashScreen.hide();
	}
};
