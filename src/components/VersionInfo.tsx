import { api } from "@convex/_generated/api";
import { useQuery } from "convex/react";

function formatTimeAgo(timestamp: number): string {
	const now = Date.now();
	const diff = now - timestamp * 1000;
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
	const packageVersion = import.meta.env.PACKAGE_VERSION || "v0.0.0";

	if (!currentVersion) {
		return <div className="text-gray-500 text-xs">v{packageVersion}</div>;
	}

	const timeAgo = formatTimeAgo(currentVersion.timestamp);

	return (
		<div className="text-gray-500 text-xs">
			<div>v{currentVersion.version}</div>
			<div className="text-xs opacity-75">Deployed {timeAgo}</div>
		</div>
	);
}

// Compact version for status bar
export function VersionBadge() {
	const currentVersion = useQuery(api.deployment.getCurrentVersion);
	const packageVersion = import.meta.env.PACKAGE_VERSION || "v0.0.0";

	const version = currentVersion?.version || packageVersion;

	return (
		<span className="rounded bg-gray-100 px-2 py-1 text-gray-600 text-xs dark:bg-gray-800 dark:text-gray-400">
			{version}
		</span>
	);
}
