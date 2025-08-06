import { api } from "@convex/_generated/api";
import { useQuery } from "convex/react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

// Store the app version and timestamp when the app loads
// Use build time timestamp if available, otherwise use current time
const APP_VERSION = import.meta.env.PACKAGE_VERSION || "0.0.0";
const APP_TIMESTAMP = import.meta.env.VITE_BUILD_TIMESTAMP
	? parseInt(import.meta.env.VITE_BUILD_TIMESTAMP)
	: Date.now();

export function UpdateNotification() {
	const [hasCheckedInitially, setHasCheckedInitially] = useState(false);

	// Check for updates
	const updateCheck = useQuery(api.deployment.checkForUpdates, {
		clientVersion: APP_VERSION,
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
			return; // Don't show alert on initial load
		}

		if (updateCheck?.hasUpdate && hasCheckedInitially) {
			toast.info("A new version of the app is available.", {
				duration: Infinity,
				description: () => (
					<p className="text-[12px] text-white/70">
						Please refresh to get the latest features and improvements.
					</p>
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
