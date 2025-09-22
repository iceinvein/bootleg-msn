import { api } from "@convex/_generated/api";
import { useQuery } from "convex/react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { useBuildInfo, useServerBuildInfo } from "../hooks";

// Build metadata
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
	forceDeployment?: boolean;
}) {
	return (
		<div className="text-sm text-white/80">
			<p className="mt-1 text-white/60 text-xs">
				Update from {props.fromBuildId} to {props.toBuildId}
				{props.forceDeployment && (
					<span className="ml-1 text-orange-300">⚡</span>
				)}
			</p>
			{props.forceDeployment && (
				<p className="mt-1 text-orange-300 text-xs">
					Force deployment available
				</p>
			)}
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

	// Get current app's embedded build info (actual running version)
	const { buildInfo } = useBuildInfo();

	// Get server's latest build info for comparison
	const { serverBuildInfo, fetchServerBuildInfo } = useServerBuildInfo();

	// Check for updates by comparing client vs server build info
	const hasUpdate =
		buildInfo &&
		serverBuildInfo &&
		buildInfo.buildId !== serverBuildInfo.buildId;

	// Query for additional metadata from Convex (like force deployment flag)
	const buildUpdate = useQuery(
		api.deployment.checkForUpdatesByBuild,
		buildInfo
			? {
					clientBuildId: buildInfo.buildId,
					channel: CHANNEL,
				}
			: "skip",
	);

	// Periodically check for server updates
	useEffect(() => {
		if (!buildInfo) return;

		// Initial check
		fetchServerBuildInfo();

		// Check every 30 seconds
		const interval = setInterval(fetchServerBuildInfo, 30000);
		return () => clearInterval(interval);
	}, [buildInfo, fetchServerBuildInfo]);

	// Debug logging
	debugLog("🔄 Update Check Debug:", {
		buildId: buildInfo?.buildId,
		channel: CHANNEL,
		buildUpdate,
		isDev: import.meta.env.DEV,
	});

	const handleRefresh = useCallback(async () => {
		debugLog("🔄 Refreshing page for update");

		try {
			// Force service worker update
			if ("serviceWorker" in navigator) {
				const registration = await navigator.serviceWorker.getRegistration();
				if (registration) {
					debugLog("🔄 Updating service worker...");
					await registration.update();

					// If there's a waiting service worker, activate it
					if (registration.waiting) {
						debugLog("🔄 Activating waiting service worker...");
						registration.waiting.postMessage({ type: "SKIP_WAITING" });

						// Wait for the new service worker to take control
						await new Promise((resolve) => {
							const handleControllerChange = () => {
								navigator.serviceWorker.removeEventListener(
									"controllerchange",
									handleControllerChange,
								);
								resolve(undefined);
							};
							navigator.serviceWorker.addEventListener(
								"controllerchange",
								handleControllerChange,
							);
						});
					}
				}
			}
		} catch (error) {
			debugLog("⚠️ Service worker update failed:", error);
		}

		// Force reload with cache bypass
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
		// Skip if build info not available yet
		if (!buildInfo || !serverBuildInfo) {
			return;
		}

		// Mark that we've done the initial check
		if (!hasShownInitialCheck) {
			setHasShownInitialCheck(true);
			debugLog("✅ Initial update check completed:", {
				clientBuildId: buildInfo.buildId,
				serverBuildId: serverBuildInfo.buildId,
				hasUpdate,
			});
			return; // Don't show notification on initial load
		}

		// Check if update is needed (client vs server build ID comparison)
		if (!hasUpdate) {
			debugLog("✅ No update needed - build IDs match:", {
				clientBuildId: buildInfo.buildId,
				serverBuildId: serverBuildInfo.buildId,
			});
			return;
		}

		// Skip toast for force deployments - ForceUpdateOverlay will handle it
		if (buildUpdate?.forceDeployment) {
			debugLog(
				"⚡ Force deployment detected - skipping toast, overlay will handle",
			);
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
		debugLog("🔔 Showing update notification:", {
			clientBuildId: buildInfo.buildId,
			serverBuildId: serverBuildInfo.buildId,
			forceDeployment: buildUpdate?.forceDeployment,
		});

		toast.info("New version available!", {
			duration: Infinity,
			description: () => (
				<UpdateToastDetails
					fromBuildId={buildInfo.buildId}
					toBuildId={serverBuildInfo.buildId}
					debugInfo={`client=${buildInfo.buildId} server=${serverBuildInfo.buildId}`}
					showDebug={DEBUG_UPDATES}
					forceDeployment={buildUpdate?.forceDeployment}
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
		buildInfo,
		serverBuildInfo,
		buildUpdate,
		hasUpdate,
		hasShownInitialCheck,
		handleRefresh,
		handleDismiss,
		lastNotificationTime,
	]);

	return null;
}
