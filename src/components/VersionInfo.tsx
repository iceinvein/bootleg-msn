import { api } from "@convex/_generated/api";
import { useQuery } from "convex/react";
import { useBuildInfo } from "../hooks";

// Build metadata
const CHANNEL = (import.meta.env.VITE_CHANNEL as string) || "prod";

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
	// Get current build info from deployed build.json
	const { buildInfo } = useBuildInfo();

	// Get latest live release (server-side filtered)
	const liveReleases = useQuery(api.deployment.listReleases, {
		channel: CHANNEL,
		limit: 1,
		status: ["live"],
	});

	// Get latest release of any status to show publishing info
	const allReleases = useQuery(api.deployment.listReleases, {
		channel: CHANNEL,
		limit: 1,
	});

	const appVersion = buildInfo?.version
		? buildInfo.version.startsWith("v")
			? buildInfo.version
			: `v${buildInfo.version}`
		: "v0.0.0";

	const latestLive = liveReleases?.[0];
	const newestRelease = allReleases?.[0];

	const timeAgo = latestLive ? formatTimeAgo(latestLive.timestamp) : undefined;

	return (
		<div className="text-gray-500 text-xs">
			<div>
				App: {appVersion}
				{latestLive?.version && latestLive.version !== appVersion && (
					<span className="ml-2 opacity-75">
						(latest: {latestLive.version})
					</span>
				)}
			</div>
			<div className="text-xs opacity-75">
				Build: {buildInfo?.buildId || "unknown"}
				{latestLive &&
					buildInfo &&
					latestLive.buildId !== buildInfo.buildId && (
						<span className="ml-2 text-orange-400">(update available)</span>
					)}
			</div>
			{latestLive && (
				<div className="text-xs opacity-75">Latest deployed {timeAgo}</div>
			)}
			{newestRelease?.status === "publishing" && (
				<div className="text-blue-400 text-xs opacity-75">
					New version publishing: {newestRelease.version}
				</div>
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
