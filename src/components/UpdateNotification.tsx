import { api } from "@convex/_generated/api";
import { useQuery } from "convex/react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

// Get the app version from package.json at build time
const APP_VERSION = import.meta.env.PACKAGE_VERSION || "0.1.0";

// Ensure version has 'v' prefix to match database format
const APP_VERSION_WITH_PREFIX = APP_VERSION.startsWith("v")
	? APP_VERSION
	: `v${APP_VERSION}`;

// Constants for config
const LS_DEBUG = "debugUpdates";
const LS_DEV_UPDATES = "enableDevUpdates";
const MIN_NOTIFY_MS = 5 * 60 * 1000; // 5 minutes

// Debug mode - set localStorage.debugUpdates = 'true' to enable logging
const DEBUG_UPDATES = localStorage.getItem(LS_DEBUG) === "true";

// Helper function for debug logging
const debugLog = (message: string, data?: unknown) => {
	if (DEBUG_UPDATES) {
		if (data) {
			console.log(message, data);
		} else {
			console.log(message);
		}
	}
};

// Small subcomponent for toast details
function UpdateToastDetails(props: {
	fromVersion: string;
	toVersion: string;
	debugInfo?: string;
	showDebug: boolean;
}) {
	return (
		<div className="text-sm text-white/80">
			<p className="mt-1 text-white/60 text-xs">
				Update from {props.fromVersion} to {props.toVersion}
			</p>
			{props.showDebug && props.debugInfo && (
				<p className="mt-1 font-mono text-white/40 text-xs">
					{props.debugInfo}
				</p>
			)}
		</div>
	);
}

export function UpdateNotification() {
	const [hasShownInitialCheck, setHasShownInitialCheck] = useState(false);
	const [lastNotificationTime, setLastNotificationTime] = useState(0);

	// Check for updates - simplified API, only needs client version
	const updateCheck = useQuery(api.deployment.checkForUpdates, {
		clientVersion: APP_VERSION_WITH_PREFIX,
	});

	// Debug logging
	debugLog("🔄 Update Check Debug:", {
		appVersion: APP_VERSION_WITH_PREFIX,
		updateCheck,
		isDev: import.meta.env.DEV,
	});

	const handleRefresh = useCallback(() => {
		debugLog("🔄 Refreshing page for update");

		window.location.reload();
	}, []);

	const handleDismiss = useCallback(() => {
		const now = Date.now();
		setLastNotificationTime(now);

		debugLog("⏰ Update notification dismissed, will show again in 10 minutes");

		// Show again after 10 minutes if still outdated
		setTimeout(
			() => {
				if (updateCheck?.hasUpdate) {
					setLastNotificationTime(0); // Reset to allow showing again
				}
			},
			10 * 60 * 1000,
		);
	}, [updateCheck]);

	useEffect(() => {
		// Skip if no update check result yet
		if (!updateCheck) {
			return;
		}

		// Mark that we've done the initial check
		if (!hasShownInitialCheck) {
			setHasShownInitialCheck(true);
			debugLog("✅ Initial update check completed:", updateCheck);
			return; // Don't show notification on initial load
		}

		// Skip if no update available
		if (!updateCheck.hasUpdate) {
			debugLog("✅ No update needed:", updateCheck.debugInfo);
			return;
		}

		// In development, only show if explicitly enabled
		if (import.meta.env.DEV && !localStorage.getItem(LS_DEV_UPDATES)) {
			debugLog("🚫 Dev updates disabled, skipping notification");
			return;
		}

		// Rate limiting - don't show notification too frequently
		const now = Date.now();
		const timeSinceLastNotification = now - lastNotificationTime;
		const minTimeBetweenNotifications = MIN_NOTIFY_MS;

		if (timeSinceLastNotification < minTimeBetweenNotifications) {
			debugLog("⏰ Rate limited, skipping notification");
			return;
		}

		// Show the update notification
		debugLog("🔔 Showing update notification:", updateCheck);

		toast.info("New version available!", {
			duration: Infinity,
			description: () => (
				<UpdateToastDetails
					fromVersion={APP_VERSION_WITH_PREFIX}
					toVersion={updateCheck.latestVersion}
					debugInfo={updateCheck.debugInfo}
					showDebug={DEBUG_UPDATES}
				/>
			),
			action: {
				label: "Update",
				onClick: handleRefresh,
			},
			cancel: {
				label: "Later",
				onClick: handleDismiss,
			},
			icon: null,
		});

		setLastNotificationTime(now);
	}, [
		updateCheck,
		hasShownInitialCheck,
		handleRefresh,
		handleDismiss,
		lastNotificationTime,
	]);

	return null;
}
