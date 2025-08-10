import { useEffect } from "react";
import {
	getPlatform,
	initializeCapacitor,
	isNativePlatform,
} from "@/lib/capacitor";
import { mobileNotifications } from "@/lib/mobile-notifications";

export function CapacitorIntegration() {
	useEffect(() => {
		if (isNativePlatform()) {
			console.log("Running on native platform:", getPlatform());
			initializeCapacitor();
			mobileNotifications.initialize();
		}
	}, []);

	useEffect(() => {
		// Handle app resume events
		const handleAppResume = () => {
			console.log("App resumed - refreshing data");
			// Trigger data refresh or reconnection logic here
		};

		// Handle app pause events
		const handleAppPause = () => {
			console.log("App paused - saving state");
			// Save current state or pause real-time connections
		};

		// Handle deep links
		const handleDeepLink = (event: CustomEvent) => {
			console.log("Deep link received:", event.detail);
			// Handle navigation based on deep link
			const url = event.detail as string;

			// Example: msn://chat/user123 or msn://group/group456
			if (url.startsWith("msn://")) {
				const path = url.replace("msn://", "");
				// Navigate to appropriate screen based on path
				console.log("Navigating to:", path);
			}
		};

		// Add event listeners
		window.addEventListener("app-resumed", handleAppResume);
		window.addEventListener("app-paused", handleAppPause);
		window.addEventListener("deep-link", handleDeepLink as EventListener);

		// Cleanup
		return () => {
			window.removeEventListener("app-resumed", handleAppResume);
			window.removeEventListener("app-paused", handleAppPause);
			window.removeEventListener("deep-link", handleDeepLink as EventListener);
		};
	}, []);

	// Add mobile-specific CSS classes
	useEffect(() => {
		if (isNativePlatform()) {
			document.body.classList.add("capacitor-app");
			document.body.classList.add(`platform-${getPlatform()}`);
		}

		return () => {
			document.body.classList.remove("capacitor-app");
			document.body.classList.remove(`platform-${getPlatform()}`);
		};
	}, []);

	// This component doesn't render anything visible
	return null;
}
