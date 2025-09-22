import { useEffect, useState } from "react";

export type BuildInfo = {
	buildId: string;
	version: string;
	timestamp: number;
	commit: string;
	channel: string;
};

/**
 * Hook to fetch current build info from deployed build.json
 * This ensures client and server use the same build ID source of truth
 */
export function useBuildInfo() {
	const [buildInfo, setBuildInfo] = useState<BuildInfo | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		async function fetchBuildInfo() {
			try {
				setIsLoading(true);
				setError(null);

				const response = await fetch("/build.json", {
					cache: "no-store",
					headers: { "cache-control": "no-store" },
				});

				if (!response.ok) {
					throw new Error(`Failed to fetch build.json: ${response.status}`);
				}

				const data = await response.json();

				// Validate required fields
				if (!data.buildId || !data.version) {
					throw new Error("Invalid build.json: missing buildId or version");
				}

				setBuildInfo({
					buildId: data.buildId,
					version: data.version,
					timestamp: data.timestamp || Date.now(),
					commit: data.commit || "unknown",
					channel: data.channel || "prod",
				});
			} catch (err) {
				const errorMessage =
					err instanceof Error ? err.message : "Unknown error";
				console.warn("Failed to fetch build.json:", errorMessage);
				setError(errorMessage);

				// Fallback to Vite env vars if build.json fails
				setBuildInfo({
					buildId: (import.meta.env.VITE_BUILD_ID as string) || "local.unknown",
					version: (import.meta.env.PACKAGE_VERSION as string) || "0.0.0",
					timestamp: Date.now(),
					commit: "local",
					channel: (import.meta.env.VITE_CHANNEL as string) || "prod",
				});
			} finally {
				setIsLoading(false);
			}
		}

		fetchBuildInfo();
	}, []);

	return { buildInfo, isLoading, error };
}
