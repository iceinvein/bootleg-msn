import { api } from "@convex/_generated/api";
import { useQuery } from "convex/react";
import { Button } from "./ui/button";

const APP_VERSION = import.meta.env.PACKAGE_VERSION || "0.0.0";
const APP_TIMESTAMP = import.meta.env.VITE_BUILD_TIMESTAMP
	? parseInt(import.meta.env.VITE_BUILD_TIMESTAMP)
	: Date.now();
const APP_VERSION_WITH_PREFIX = APP_VERSION.startsWith("v")
	? APP_VERSION
	: `v${APP_VERSION}`;

export function UpdateNotificationTest() {
	const currentVersion = useQuery(api.deployment.getCurrentVersion);
	const updateCheck = useQuery(api.deployment.checkForUpdates, {
		clientVersion: APP_VERSION_WITH_PREFIX,
		clientTimestamp: APP_TIMESTAMP,
	});

	if (import.meta.env.PROD) {
		return null; // Only show in development
	}

	return (
		<div className="fixed right-4 bottom-4 z-50 max-w-sm rounded-lg bg-black/80 p-4 text-white text-xs">
			<h3 className="mb-2 font-bold">🔍 Update Debug Info</h3>
			<div className="space-y-1">
				<div className="text-yellow-300">
					<strong>Environment Variables:</strong>
				</div>
				<div className="ml-2">
					PACKAGE_VERSION: {import.meta.env.PACKAGE_VERSION || "undefined"}
				</div>
				<div className="ml-2">
					VITE_BUILD_TIMESTAMP:{" "}
					{import.meta.env.VITE_BUILD_TIMESTAMP || "undefined"}
				</div>
				<div className="mt-2 border-gray-600 border-t pt-2">
					<div>
						<strong>Client Version:</strong> {APP_VERSION_WITH_PREFIX}
					</div>
					<div>
						<strong>Client Timestamp:</strong>{" "}
						{new Date(APP_TIMESTAMP).toLocaleString()}
					</div>
					<div>
						<strong>Server Version:</strong>{" "}
						{currentVersion?.version || "Loading..."}
					</div>
					<div>
						<strong>Server Timestamp:</strong>{" "}
						{currentVersion
							? new Date(currentVersion.timestamp).toLocaleString()
							: "Loading..."}
					</div>
					<div>
						<strong>Has Update:</strong>{" "}
						{updateCheck?.hasUpdate ? "✅ Yes" : "❌ No"}
					</div>
				</div>
				{updateCheck?.hasUpdate && (
					<div className="mt-2 rounded bg-green-900/50 p-2">
						<div>🎉 Update Available!</div>
						<div>
							{APP_VERSION_WITH_PREFIX} → {updateCheck.latestVersion}
						</div>
					</div>
				)}
				<div className="mt-2 rounded bg-blue-900/50 p-2 text-xs">
					<div>
						<strong>Comparison:</strong>
					</div>
					<div>Client TS: {APP_TIMESTAMP}</div>
					<div>Server TS: {currentVersion?.timestamp || "N/A"}</div>
					<div>
						Newer:{" "}
						{currentVersion && currentVersion.timestamp > APP_TIMESTAMP
							? "Server"
							: "Client"}
					</div>
				</div>
				<div className="mt-2 rounded bg-purple-900/50 p-2 text-xs">
					<div>
						<strong>Dev Mode:</strong>
					</div>
					<div>
						Updates Enabled:{" "}
						{localStorage.getItem("enableDevUpdates") ? "✅" : "❌"}
					</div>
					<Button
						className="mt-4"
						variant="secondary"
						onClick={() => {
							if (localStorage.getItem("enableDevUpdates")) {
								localStorage.removeItem("enableDevUpdates");
							} else {
								localStorage.setItem("enableDevUpdates", "true");
							}
							window.location.reload();
						}}
					>
						{localStorage.getItem("enableDevUpdates") ? "Disable" : "Enable"}{" "}
						Dev Updates
					</Button>
				</div>
			</div>
		</div>
	);
}
