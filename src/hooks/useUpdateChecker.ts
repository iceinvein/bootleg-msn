import { useQuery } from "convex/react";
import { useEffect, useRef } from "react";
import { api } from "../../convex/_generated/api";

// Store the app timestamp when the hook is first used
const APP_TIMESTAMP = Date.now();

export function useUpdateChecker() {
	const intervalRef = useRef<NodeJS.Timeout | null>(null);
	const lastCheckRef = useRef<number>(0);

	// Check for updates periodically
	const updateCheck = useQuery(api.deployment.checkForUpdates, {
		clientVersion: "1.0.0",
		clientTimestamp: APP_TIMESTAMP,
	});

	useEffect(() => {
		// Set up periodic checking every 2 minutes
		intervalRef.current = setInterval(
			() => {
				lastCheckRef.current = Date.now();
			},
			2 * 60 * 1000,
		);

		return () => {
			if (intervalRef.current) {
				clearInterval(intervalRef.current);
			}
		};
	}, []);

	return {
		hasUpdate: updateCheck?.hasUpdate || false,
		latestVersion: updateCheck?.latestVersion,
		isChecking: updateCheck === undefined,
	};
}
