import { useQuery } from "convex/react";
import { useEffect, useState } from "react";
import { api } from "../../convex/_generated/api";

// Store the app version and timestamp when the app loads
const APP_VERSION = "1.0.0";
const APP_TIMESTAMP = Date.now();

export function UpdateNotification() {
	const [showUpdateAlert, setShowUpdateAlert] = useState(false);
	const [hasCheckedInitially, setHasCheckedInitially] = useState(false);

	// Check for updates
	const updateCheck = useQuery(api.deployment.checkForUpdates, {
		clientVersion: APP_VERSION,
		clientTimestamp: APP_TIMESTAMP,
	});

	useEffect(() => {
		if (updateCheck && !hasCheckedInitially) {
			setHasCheckedInitially(true);
			return; // Don't show alert on initial load
		}

		if (updateCheck?.hasUpdate && hasCheckedInitially) {
			setShowUpdateAlert(true);
		}
	}, [updateCheck, hasCheckedInitially]);

	const handleRefresh = () => {
		window.location.reload();
	};

	const handleDismiss = () => {
		setShowUpdateAlert(false);
		// Show again after 5 minutes if still outdated
		setTimeout(
			() => {
				if (updateCheck?.hasUpdate) {
					setShowUpdateAlert(true);
				}
			},
			5 * 60 * 1000,
		);
	};

	if (!showUpdateAlert) {
		return null;
	}

	return (
		<div className="fixed top-4 right-4 z-50 max-w-sm">
			<div className="rounded-lg border border-blue-700 bg-blue-600 p-4 text-white shadow-lg">
				<div className="flex items-start space-x-3">
					<div className="flex-shrink-0">
						<svg
							className="h-6 w-6 text-blue-200"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
							aria-hidden="true"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
							/>
						</svg>
					</div>
					<div className="min-w-0 flex-1">
						<h3 className="font-semibold text-sm">Update Available</h3>
						<p className="mt-1 text-blue-100 text-sm">
							A new version of the app is available. Please refresh to get the
							latest features and improvements.
						</p>
						<div className="mt-3 flex space-x-2">
							<button
								type="button"
								onClick={handleRefresh}
								className="rounded bg-white px-3 py-1 font-medium text-blue-600 text-sm transition-colors hover:bg-blue-50"
							>
								Refresh Now
							</button>
							<button
								type="button"
								onClick={handleDismiss}
								className="rounded px-3 py-1 text-blue-200 text-sm transition-colors hover:text-white"
							>
								Later
							</button>
						</div>
					</div>
					<button
						type="button"
						onClick={handleDismiss}
						className="flex-shrink-0 text-blue-200 hover:text-white"
						title="Dismiss"
					>
						<svg
							className="h-5 w-5"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
							aria-hidden="true"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M6 18L18 6M6 6l12 12"
							/>
						</svg>
					</button>
				</div>
			</div>
		</div>
	);
}
