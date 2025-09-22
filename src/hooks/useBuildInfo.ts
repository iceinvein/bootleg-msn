import { useCallback, useEffect, useRef, useState } from "react";

export type BuildInfo = {
	buildId: string;
	version: string;
	timestamp: number;
	commit: string;
	channel: string;
};

/**
 * Hook to get current app's embedded build info
 * Uses build-time environment variables, not CDN fetch
 * This ensures we get the actual running app version, not the latest deployed version
 */
export function useBuildInfo() {
	const [buildInfo, setBuildInfo] = useState<BuildInfo | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		// Use embedded build info from Vite (app's actual version)
		// Don't fetch from CDN as that would give us the latest deployed version,
		// not the version the user is currently running
		try {
			setIsLoading(true);
			setError(null);

			const embeddedBuildInfo: BuildInfo = {
				buildId: (import.meta.env.VITE_BUILD_ID as string) || "unknown",
				version: (import.meta.env.PACKAGE_VERSION as string) || "unknown",
				timestamp:
					parseInt(import.meta.env.VITE_BUILD_TIMESTAMP as string, 10) ||
					Date.now(),
				commit: (import.meta.env.VITE_COMMIT as string) || "unknown",
				channel: (import.meta.env.VITE_CHANNEL as string) || "unknown",
			};

			// Validate required fields
			if (
				!embeddedBuildInfo.buildId ||
				embeddedBuildInfo.buildId === "unknown"
			) {
				throw new Error("Missing embedded build ID");
			}

			setBuildInfo(embeddedBuildInfo);
		} catch (err) {
			const errorMessage = err instanceof Error ? err.message : "Unknown error";
			console.error("Failed to get embedded build info:", errorMessage);
			setError(errorMessage);

			// Ultimate fallback for development
			setBuildInfo({
				buildId: `local.${Date.now()}`,
				version: (import.meta.env.PACKAGE_VERSION as string) || "0.0.0",
				timestamp: Date.now(),
				commit: "local",
				channel: (import.meta.env.VITE_CHANNEL as string) || "prod",
			});
		} finally {
			setIsLoading(false);
		}
	}, []);

	return { buildInfo, isLoading, error };
}

/**
 * Hook to fetch the latest deployed build info from CDN with automatic periodic updates
 * Used for comparison to detect if updates are available
 */
export function useServerBuildInfo() {
	const [serverBuildInfo, setServerBuildInfo] = useState<BuildInfo | null>(
		null,
	);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const intervalRef = useRef<number | null>(null);
	const isActiveRef = useRef(true);

	const fetchServerBuildInfo = useCallback(async () => {
		// Don't fetch if component is unmounted
		if (!isActiveRef.current) return;

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

			// Only update state if component is still mounted
			if (isActiveRef.current) {
				setServerBuildInfo({
					buildId: data.buildId,
					version: data.version,
					timestamp: data.timestamp || Date.now(),
					commit: data.commit || "unknown",
					channel: data.channel || "prod",
				});
			}
		} catch (err) {
			const errorMessage = err instanceof Error ? err.message : "Unknown error";
			console.warn("Failed to fetch server build.json:", errorMessage);

			// Only update error state if component is still mounted
			if (isActiveRef.current) {
				setError(errorMessage);
			}
		} finally {
			// Only update loading state if component is still mounted
			if (isActiveRef.current) {
				setIsLoading(false);
			}
		}
	}, []);

	// Set up automatic periodic fetching
	useEffect(() => {
		// Initial fetch
		fetchServerBuildInfo();

		// Set up periodic fetching every 30 seconds
		intervalRef.current = window.setInterval(fetchServerBuildInfo, 30000);

		// Cleanup function
		return () => {
			isActiveRef.current = false;
			if (intervalRef.current) {
				clearInterval(intervalRef.current);
				intervalRef.current = null;
			}
		};
	}, [fetchServerBuildInfo]);

	// Manual fetch function for external use (optional)
	const refetch = useCallback(() => {
		fetchServerBuildInfo();
	}, [fetchServerBuildInfo]);

	return {
		serverBuildInfo,
		isLoading,
		error,
		refetch,
		// Keep the old name for backward compatibility
		fetchServerBuildInfo: refetch,
	};
}
