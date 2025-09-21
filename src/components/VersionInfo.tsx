import { api } from "@convex/_generated/api";
import { useQuery } from "convex/react";

function formatTimeAgo(timestamp: number): string {
	const now = Date.now();
	const diff = now - timestamp;
	const minutes = Math.floor(diff / 60000);
	const hours = Math.floor(diff / 3600000);
	const days = Math.floor(diff / 86400000);

	if (days > 0) return `${days}d ago`;
	if (hours > 0) return `${hours}h ago`;
	if (minutes > 0) return `${minutes}m ago`;
	return "just now";
}

export function VersionInfo() {
	const currentVersion = useQuery(api.deployment.getCurrentVersion);
	const rawPackageVersion = import.meta.env.PACKAGE_VERSION || "0.0.0";
	const appVersion = rawPackageVersion.startsWith("v")
		? rawPackageVersion
		: `v${rawPackageVersion}`;

	const timeAgo = currentVersion
		? formatTimeAgo(currentVersion.timestamp)
		: undefined;

	return (
		<div className="text-gray-500 text-xs">
			<div>
				App: {appVersion}
				{currentVersion?.version && currentVersion.version !== appVersion && (
					<span className="ml-2 opacity-75">
						(latest: {currentVersion.version})
					</span>
				)}
			</div>
			{currentVersion && (
				<div className="text-xs opacity-75">Latest deployed {timeAgo}</div>
			)}
		</div>
	);
}

// Compact version for status bar
export function VersionBadge() {
	const rawPackageVersion = import.meta.env.PACKAGE_VERSION || "0.0.0";
	const appVersion = rawPackageVersion.startsWith("v")
		? rawPackageVersion
		: `v${rawPackageVersion}`;

	return (
		<span className="rounded bg-muted px-2 py-1 text-muted-foreground text-xs">
			{appVersion}
		</span>
	);
}
