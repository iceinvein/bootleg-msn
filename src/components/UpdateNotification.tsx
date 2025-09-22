import { api } from "@convex/_generated/api";
import { useQuery } from "convex/react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

// Build metadata
const BUILD_ID = import.meta.env.VITE_BUILD_ID as string;
const CHANNEL = (import.meta.env.VITE_CHANNEL as string) || "prod";

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
	fromBuildId: string;
	toBuildId: string;
	debugInfo?: string;
	showDebug: boolean;
}) {
	return (
		<div className="text-sm text-white/80">
			<p className="mt-1 text-white/60 text-xs">
				Update from {props.fromBuildId} to {props.toBuildId}
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

	// Build-based update check via Convex
	const buildUpdate = useQuery(api.deployment.checkForUpdatesByBuild, {
		clientBuildId: BUILD_ID,
		channel: CHANNEL,
	});

	// Debug logging
	debugLog("🔄 Update Check Debug:", {
		buildId: BUILD_ID,
		channel: CHANNEL,
		buildUpdate,
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
				if (buildUpdate?.hasUpdate) {
					setLastNotificationTime(0); // Reset to allow showing again
				}
			},
			10 * 60 * 1000,
		);
	}, [buildUpdate]);

	useEffect(() => {
		// Skip if Convex unavailable yet
		if (!buildUpdate) {
			return;
		}

		// Mark that we've done the initial check
		if (!hasShownInitialCheck) {
			setHasShownInitialCheck(true);
			debugLog("✅ Initial update check completed:", buildUpdate);
			return; // Don't show notification on initial load
		}

		// Check if update is needed
		if (!buildUpdate.hasUpdate) {
			debugLog("✅ No update needed:", buildUpdate.debugInfo);
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
		debugLog("🔔 Showing update notification:", buildUpdate);

		toast.info("New version available!", {
			duration: Infinity,
			description: () => (
				<UpdateToastDetails
					fromBuildId={BUILD_ID}
					toBuildId={buildUpdate.latestBuildId}
					debugInfo={buildUpdate.debugInfo}
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
		buildUpdate,
		hasShownInitialCheck,
		handleRefresh,
		handleDismiss,
		lastNotificationTime,
	]);

	return null;
}
