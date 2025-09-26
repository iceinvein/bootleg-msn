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
			initializeCapacitor();
			mobileNotifications.initialize();
		}
	}, []);

	useEffect(() => {
		// Handle app resume events
		const handleAppResume = () => {
			// Trigger data refresh or reconnection logic here
		};

		// Handle app pause events
		const handleAppPause = () => {
			// Save current state or pause real-time connections
		};

		// Handle deep links (Capacitor AppUrlOpen -> our URL/chat navigation)
		const handleDeepLink = (event: CustomEvent) => {
			const raw = (event.detail as string) || "";
			if (!raw) return;

			// Try to normalize to a chat string acceptable by useChatUrlSync
			// Prefer ?chat=... if present; otherwise support custom scheme msn://chat/<id> or msn://group/<id>
			let chatParam: string | null = null;
			try {
				const u = new URL(raw);
				const qp = u.searchParams.get("chat");
				if (qp) {
					chatParam = qp; // could be "contact:ID", "group:ID" or legacy ID
				} else if (u.protocol === "msn:") {
					const host = u.host; // e.g. "chat" | "group"
					const id = u.pathname.replace(/^\/+/, "");
					if (host === "group" && id) chatParam = `group:${id}`;
					else if (host === "chat" && id) {
						chatParam = id.includes(":") ? id : `contact:${id}`;
					}
				} else if (/\/chat\//.test(u.pathname)) {
					// Support https://.../chat/<id>
					const id = u.pathname.split("/chat/")[1]?.split("/")[0];
					if (id) chatParam = id.includes(":") ? id : `contact:${id}`;
				}
			} catch {
				// As a last resort, look for chat= in the raw string
				const m = raw.match(/[?&]chat=([^&#]+)/);
				if (m?.[1]) chatParam = decodeURIComponent(m[1]);
			}

			if (!chatParam) return;

			// Unify on navigate-to-chat; useChatUrlSync will set ?chat and open
			window.dispatchEvent(
				new CustomEvent("navigate-to-chat", { detail: { chatId: chatParam } }),
			);
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
