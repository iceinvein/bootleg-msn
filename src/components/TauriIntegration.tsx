import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import {
	useDeepLinks,
	useTauri,
	useUnreadCount,
	useWindowState,
} from "@/hooks/useTauri";

type TauriIntegrationProps = {
	children: React.ReactNode;
};

export function TauriIntegration({ children }: TauriIntegrationProps) {
	const { isTauri, platform, isReady } = useTauri();
	const { saveState, restoreState } = useWindowState("main");
	const { updateUnreadCount } = useUnreadCount();
	const { handleDeepLink } = useDeepLinks();
	const [searchParams] = useSearchParams();

	// For now, we'll use a placeholder unread count
	// TODO: Connect to Convex unread count when available
	const unreadCount = 0;

	// biome-ignore lint/correctness/useExhaustiveDependencies: Update system tray with unread count
	useEffect(() => {
		if (isTauri && isReady) {
			updateUnreadCount(unreadCount);
		}
	}, [isTauri, isReady, unreadCount, updateUnreadCount]);

	// Handle window state persistence
	useEffect(() => {
		if (isTauri && isReady) {
			// Restore window state on mount
			restoreState();

			// Save window state periodically and on beforeunload
			const saveInterval = setInterval(saveState, 30000); // Save every 30 seconds

			const handleBeforeUnload = () => {
				saveState();
			};

			window.addEventListener("beforeunload", handleBeforeUnload);

			return () => {
				clearInterval(saveInterval);
				window.removeEventListener("beforeunload", handleBeforeUnload);
				saveState(); // Final save on cleanup
			};
		}
	}, [isTauri, isReady, saveState, restoreState]);

	// Add platform-specific CSS class to body
	useEffect(() => {
		if (isTauri && isReady) {
			document.body.classList.add("tauri-app", `platform-${platform}`);

			return () => {
				document.body.classList.remove("tauri-app", `platform-${platform}`);
			};
		}
	}, [isTauri, isReady, platform]);

	// Handle deep links on app startup
	useEffect(() => {
		if (isTauri && isReady) {
			// Check for deep link in URL parameters
			const deepLink = searchParams.get("deeplink");

			if (deepLink) {
				handleDeepLink(deepLink);
			}
		}
	}, [isTauri, isReady, handleDeepLink, searchParams]);

	return <>{children}</>;
}

// Platform-specific styles component
export function TauriStyles() {
	const { isTauri } = useTauri();

	if (!isTauri) return null;

	return (
		<style>{`
      /* Tauri-specific styles */
      .tauri-app {
        /* Remove default web margins/padding */
        margin: 0;
        padding: 0;
        
        /* Prevent text selection on UI elements */
        -webkit-user-select: none;
        -moz-user-select: none;
        -ms-user-select: none;
        user-select: none;
      }
      
      .tauri-app input,
      .tauri-app textarea,
      .tauri-app [contenteditable] {
        /* Re-enable text selection for input elements */
        -webkit-user-select: text;
        -moz-user-select: text;
        -ms-user-select: text;
        user-select: text;
      }

      /* Platform-specific styles */
      .platform-macos {
        /* macOS-specific styling */
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }
      
      .platform-windows {
        /* Windows-specific styling */
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      }
      
      .platform-linux {
        /* Linux-specific styling */
        font-family: 'Ubuntu', 'Droid Sans', sans-serif;
      }

      /* Hide scrollbars in Tauri for cleaner native look */
      .tauri-app ::-webkit-scrollbar {
        width: 8px;
        height: 8px;
      }
      
      .tauri-app ::-webkit-scrollbar-track {
        background: transparent;
      }
      
      .tauri-app ::-webkit-scrollbar-thumb {
        background: rgba(0, 0, 0, 0.2);
        border-radius: 4px;
      }
      
      .tauri-app ::-webkit-scrollbar-thumb:hover {
        background: rgba(0, 0, 0, 0.3);
      }

      /* Dark mode scrollbar */
      .dark .tauri-app ::-webkit-scrollbar-thumb {
        background: rgba(255, 255, 255, 0.2);
      }
      
      .dark .tauri-app ::-webkit-scrollbar-thumb:hover {
        background: rgba(255, 255, 255, 0.3);
      }
    `}</style>
	);
}
