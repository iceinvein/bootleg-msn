import { api } from "@convex/_generated/api";
import { useQuery } from "convex/react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

// Store the app version and timestamp when the app loads
const APP_VERSION = import.meta.env.PACKAGE_VERSION || "0.1.0"; // Default to package.json version

// In development, use a fixed timestamp to avoid constant update notifications
// In production, use the actual build timestamp
const APP_TIMESTAMP = import.meta.env.DEV
	? 1754544000000 // Fixed timestamp for development (prevents constant updates)
	: import.meta.env.VITE_BUILD_TIMESTAMP
		? parseInt(import.meta.env.VITE_BUILD_TIMESTAMP)
		: Date.now();

// Add 'v' prefix to match database format
const APP_VERSION_WITH_PREFIX = APP_VERSION.startsWith("v")
	? APP_VERSION
	: `v${APP_VERSION}`;

// Debug logging (only in development)
if (import.meta.env.DEV) {
	console.log("🔧 UpdateNotification Environment:", {
		mode: import.meta.env.DEV ? "development" : "production",
		PACKAGE_VERSION: import.meta.env.PACKAGE_VERSION,
		VITE_BUILD_TIMESTAMP: import.meta.env.VITE_BUILD_TIMESTAMP,
		APP_VERSION,
		APP_VERSION_WITH_PREFIX,
		APP_TIMESTAMP: new Date(APP_TIMESTAMP).toISOString(),
		note: import.meta.env.DEV
			? "Using fixed timestamp for dev"
			: "Using build timestamp",
	});
}

export function UpdateNotification() {
	const [hasCheckedInitially, setHasCheckedInitially] = useState(false);

	// Check for updates
	const updateCheck = useQuery(api.deployment.checkForUpdates, {
		clientVersion: APP_VERSION_WITH_PREFIX,
		clientTimestamp: APP_TIMESTAMP,
	});

	const handleRefresh = useCallback(() => {
		window.location.reload();
	}, []);

	const handleDismiss = useCallback(() => {
		// Show again after 5 minutes if still outdated
		setTimeout(
			() => {
				if (updateCheck?.hasUpdate) {
					toast.info("A new version of the app is available.", {
						duration: Infinity,
						description: () => (
							<p className="text-[8px] text-white/80">
								Please refresh to get the latest features and improvements.
							</p>
						),
					});
				}
			},
			5 * 60 * 1000,
		);
	}, [updateCheck]);

	useEffect(() => {
		if (updateCheck && !hasCheckedInitially) {
			setHasCheckedInitially(true);
			// Log version info for debugging
			console.log("🔍 Update Check:", {
				clientVersion: APP_VERSION_WITH_PREFIX,
				clientTimestamp: APP_TIMESTAMP,
				serverVersion: updateCheck.latestVersion,
				serverTimestamp: updateCheck.latestTimestamp,
				hasUpdate: updateCheck.hasUpdate,
			});
			return; // Don't show alert on initial load
		}

		// In development, only show update notifications if explicitly enabled
		// You can enable by setting localStorage.enableDevUpdates = 'true'
		if (import.meta.env.DEV && !localStorage.getItem("enableDevUpdates")) {
			return;
		}

		if (updateCheck?.hasUpdate && hasCheckedInitially) {
			const currentVersion = APP_VERSION_WITH_PREFIX;
			const latestVersion = updateCheck.latestVersion;

			toast.info("🎉 New version available!", {
				duration: Infinity,
				description: () => (
					<div className="text-sm text-white/80">
						<p>
							Update from {currentVersion} to {latestVersion}
						</p>
						<p className="text-xs mt-1 text-white/60">
							Get the latest features and improvements
						</p>
					</div>
				),
				action: {
					label: "Refresh Now",
					onClick: handleRefresh,
				},
				cancel: {
					label: "Later",
					onClick: handleDismiss,
				},
			});
		}
	}, [updateCheck, hasCheckedInitially, handleRefresh, handleDismiss]);

	return null;
}
